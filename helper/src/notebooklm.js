import { access, readdir, stat } from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";

const SOURCE_EXTENSIONS = new Set([".pdf", ".txt", ".md", ".markdown", ".html", ".htm"]);
const UUID_RE = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

export async function importDirectoryToNotebookLM({
  input,
  name,
  notebookId,
  cli = "nlm",
  dialect = "auto",
  dryRun = false
}) {
  const inputDir = path.resolve(input);
  const inputStats = await stat(inputDir);
  if (!inputStats.isDirectory()) {
    throw new Error(`Input is not a directory: ${inputDir}`);
  }

  const notebookTitle = name || path.basename(inputDir);
  const files = await findNotebookLMSources(inputDir);
  if (!files.length) {
    throw new Error(`No supported NotebookLM source files found in: ${inputDir}`);
  }

  const selectedDialect = dialect === "auto" ? "tmc" : dialect;
  const steps = [];
  let resolvedNotebookId = notebookId || null;

  if (!resolvedNotebookId) {
    const createArgs = makeCreateArgs(selectedDialect, notebookTitle);
    steps.push({ kind: "create", command: cli, args: createArgs });
    if (!dryRun) {
      const create = await runCommand(cli, createArgs);
      resolvedNotebookId = parseNotebookId(create.stdout) || parseNotebookId(create.stderr);
      if (!resolvedNotebookId) {
        throw new Error(`Could not parse notebook id from ${cli} output:\n${create.stdout || create.stderr}`);
      }
    }
    else {
      resolvedNotebookId = "<created-notebook-id>";
    }
  }

  for (const file of files) {
    const addArgs = makeAddArgs(selectedDialect, resolvedNotebookId, file);
    steps.push({ kind: "add", command: cli, args: addArgs, file });
    if (!dryRun) {
      await runCommand(cli, addArgs);
    }
  }

  return {
    inputDir,
    notebookTitle,
    notebookId: resolvedNotebookId,
    dialect: selectedDialect,
    sourceCount: files.length,
    files,
    steps
  };
}

export async function findNotebookLMSources(dir) {
  const results = [];
  await walk(dir, results);
  return results.sort((a, b) => a.localeCompare(b));
}

async function walk(dir, results) {
  const items = await readdir(dir, { withFileTypes: true });
  for (const item of items) {
    const itemPath = path.join(dir, item.name);
    if (item.isDirectory()) {
      await walk(itemPath, results);
      continue;
    }
    if (!item.isFile()) {
      continue;
    }
    if (SOURCE_EXTENSIONS.has(path.extname(item.name).toLowerCase())) {
      results.push(itemPath);
    }
  }
}

function makeCreateArgs(dialect, title) {
  if (dialect === "mcp") {
    return ["notebook", "create", title];
  }
  return ["create", title];
}

function makeAddArgs(dialect, notebookId, file) {
  if (dialect === "mcp") {
    return ["source", "add", notebookId, "--file", file];
  }
  return ["add", notebookId, file];
}

function parseNotebookId(text) {
  const match = String(text || "").match(UUID_RE);
  return match ? match[0] : null;
}

async function runCommand(command, args) {
  await assertCommandExists(command);
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      shell: process.platform === "win32",
      windowsHide: true
    });
    let stdout = "";
    let stderr = "";
    child.stdout?.on("data", (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr?.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    child.on("error", (error) => {
      if (error.code === "ENOENT") {
        reject(new Error(`NotebookLM CLI not found: ${command}. Install and sign in to an nlm-compatible CLI, then retry with --cli <path-or-command>.`));
        return;
      }
      reject(error);
    });
    child.on("close", (code) => {
      if (code === 0) {
        resolve({ stdout, stderr });
        return;
      }
      reject(new Error(`${command} ${args.join(" ")} failed with exit code ${code}\n${stderr || stdout}`));
    });
  });
}

async function assertCommandExists(command) {
  if (path.isAbsolute(command) || command.includes(path.sep)) {
    await access(command);
  }
}
