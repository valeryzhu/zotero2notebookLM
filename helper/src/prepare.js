import { copyFile, mkdir, readFile, readdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";

const SOURCE_EXTENSIONS = new Map([
  [".pdf", { type: "pdf", outputDir: "pdf", outputExtension: ".pdf" }],
  [".txt", { type: "note", outputDir: "notes", outputExtension: ".txt" }],
  [".md", { type: "note", outputDir: "notes", outputExtension: ".md" }],
  [".markdown", { type: "note", outputDir: "notes", outputExtension: ".md" }],
  [".html", { type: "note", outputDir: "notes", outputExtension: ".txt", transform: htmlToText }],
  [".htm", { type: "note", outputDir: "notes", outputExtension: ".txt", transform: htmlToText }]
]);

export async function prepareImportPackage({ input, output, dryRun = false }) {
  const inputDir = path.resolve(input);
  const outputDir = path.resolve(output);

  const inputStats = await stat(inputDir);
  if (!inputStats.isDirectory()) {
    throw new Error(`Input is not a directory: ${inputDir}`);
  }

  const sourceFiles = await findImportSources(inputDir);
  const entries = sourceFiles.map((source, index) => {
    const fileName = makeNotebookLMFileName(source.filePath, index + 1, source);
    const outputRelativePath = path.join(source.outputDir, fileName);

    return {
      index: index + 1,
      type: source.type,
      sourcePath: source.filePath,
      fileName,
      outputRelativePath,
      relativeSourcePath: path.relative(inputDir, source.filePath),
      titleGuess: guessTitleFromFileName(source.filePath)
    };
  });

  if (!dryRun) {
    await mkdir(outputDir, { recursive: true });
    await mkdir(path.join(outputDir, "pdf"), { recursive: true });
    await mkdir(path.join(outputDir, "notes"), { recursive: true });

    for (const entry of entries) {
      const source = sourceFiles[entry.index - 1];
      const outputPath = path.join(outputDir, entry.outputRelativePath);

      if (source.transform) {
        const text = await readFile(source.filePath, "utf8");
        await writeFile(outputPath, source.transform(text), "utf8");
      }
      else {
        await copyFile(entry.sourcePath, outputPath);
      }
    }

    await writeFile(path.join(outputDir, "manifest.json"), `${JSON.stringify(makeManifest(inputDir, entries), null, 2)}\n`, "utf8");
    await writeFile(path.join(outputDir, "manifest.csv"), toCsv(entries), "utf8");
    await writeFile(path.join(outputDir, "README.md"), makeReadme(entries), "utf8");
  }

  const counts = countByType(entries);

  return {
    inputDir,
    outputDir,
    totalSourceCount: sourceFiles.length,
    totalPdfCount: counts.pdf ?? 0,
    totalNoteCount: counts.note ?? 0,
    preparedCount: entries.length,
    counts,
    entries
  };
}

export async function findPdfFiles(dir) {
  const sources = await findImportSources(dir);
  return sources
    .filter((source) => source.type === "pdf")
    .map((source) => source.filePath);
}

export async function findImportSources(dir) {
  const results = [];
  const items = await readdir(dir, { withFileTypes: true });

  for (const item of items) {
    const itemPath = path.join(dir, item.name);
    if (item.isDirectory()) {
      results.push(...await findImportSources(itemPath));
      continue;
    }

    if (!item.isFile()) {
      continue;
    }

    const extension = path.extname(item.name).toLowerCase();
    const sourceConfig = SOURCE_EXTENSIONS.get(extension);
    if (sourceConfig) {
      results.push({
        filePath: itemPath,
        extension,
        ...sourceConfig
      });
    }
  }

  return results.sort((a, b) => a.filePath.localeCompare(b.filePath));
}

export function makeNotebookLMFileName(filePath, index, source = null) {
  const parsed = path.parse(filePath);
  const cleanedBase = parsed.name
    .normalize("NFKD")
    .replace(/[^\w\s.-]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 120) || `paper-${index}`;

  const extension = source?.outputExtension ?? parsed.ext.toLowerCase() ?? ".pdf";
  return `${String(index).padStart(4, "0")} - ${cleanedBase}${extension}`;
}

export function guessTitleFromFileName(filePath) {
  return path.parse(filePath).name
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function toCsv(entries) {
  const rows = [
    ["index", "type", "fileName", "outputRelativePath", "titleGuess", "relativeSourcePath"],
    ...entries.map((entry) => [
      entry.index,
      entry.type,
      entry.fileName,
      entry.outputRelativePath,
      entry.titleGuess,
      entry.relativeSourcePath
    ])
  ];

  return `${rows.map((row) => row.map(csvCell).join(",")).join("\n")}\n`;
}

function csvCell(value) {
  const text = String(value ?? "");
  return `"${text.replace(/"/g, '""')}"`;
}

function makeManifest(inputDir, entries) {
  const counts = countByType(entries);

  return {
    generatedAt: new Date().toISOString(),
    inputDir,
    counts,
    entries
  };
}

function countByType(entries) {
  return entries.reduce((counts, entry) => {
    counts[entry.type] = (counts[entry.type] ?? 0) + 1;
    return counts;
  }, {});
}

function makeReadme(entries) {
  const counts = countByType(entries);

  return `# NotebookLM Import Package

Generated by Zotero NotebookLM Bridge.

## Contents

- PDF files: ${counts.pdf ?? 0}
- Note files: ${counts.note ?? 0}
- PDF directory: \`pdf/\`
- Notes directory: \`notes/\`
- Machine-readable manifest: \`manifest.json\`
- Spreadsheet-friendly manifest: \`manifest.csv\`

## Next step

Upload the files in \`pdf/\` and \`notes/\` to NotebookLM manually, or use the future browser automation helper.
`;
}

function htmlToText(html) {
  return `${html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|h[1-6]|li|tr)>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, "\n\n")
    .trim()}\n`;
}
