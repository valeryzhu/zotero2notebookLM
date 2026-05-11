import { mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import assert from "node:assert/strict";

import { findImportSources, findPdfFiles, makeNotebookLMFileName, prepareImportPackage } from "../src/prepare.js";

test("findPdfFiles recursively returns sorted PDFs", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "zotero-nlm-"));
  await mkdir(path.join(root, "nested"));
  await writeFile(path.join(root, "b.pdf"), "b");
  await writeFile(path.join(root, "a.txt"), "a");
  await writeFile(path.join(root, "nested", "A.PDF"), "a");

  const files = await findPdfFiles(root);
  assert.deepEqual(files.map((file) => path.basename(file)), ["b.pdf", "A.PDF"]);
});

test("findImportSources returns PDFs and note-like text files", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "zotero-nlm-"));
  await writeFile(path.join(root, "paper.pdf"), "pdf");
  await writeFile(path.join(root, "note.md"), "# Note");
  await writeFile(path.join(root, "web.html"), "<p>HTML note</p>");
  await writeFile(path.join(root, "ignore.png"), "png");

  const sources = await findImportSources(root);
  assert.deepEqual(sources.map((source) => source.type), ["note", "pdf", "note"]);
  assert.deepEqual(sources.map((source) => path.basename(source.filePath)), ["note.md", "paper.pdf", "web.html"]);
});

test("makeNotebookLMFileName cleans unsafe characters", () => {
  const fileName = makeNotebookLMFileName(path.join("C:/papers", "A study - CRISPR off?.pdf"), 7);
  assert.equal(fileName, "0007 - A study - CRISPR off.pdf");
});

test("prepareImportPackage creates entries in dry-run mode", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "zotero-nlm-"));
  await writeFile(path.join(root, "paper one.pdf"), "pdf");
  await writeFile(path.join(root, "reading note.md"), "# Note");

  const output = path.join(root, "out");
  const result = await prepareImportPackage({ input: root, output, dryRun: true });

  assert.equal(result.totalPdfCount, 1);
  assert.equal(result.totalNoteCount, 1);
  assert.equal(result.preparedCount, 2);
});

test("prepareImportPackage writes manifest, PDFs, and notes", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "zotero-nlm-"));
  await writeFile(path.join(root, "paper.pdf"), "pdf");
  await writeFile(path.join(root, "note.html"), "<h1>Title</h1><p>Body</p>");

  const output = path.join(root, "out");
  const result = await prepareImportPackage({ input: root, output });
  const manifest = JSON.parse(await readFile(path.join(output, "manifest.json"), "utf8"));
  const noteText = await readFile(path.join(output, "notes", "0001 - note.txt"), "utf8");

  assert.equal(result.preparedCount, 2);
  assert.equal(manifest.counts.pdf, 1);
  assert.equal(manifest.counts.note, 1);
  assert.equal(noteText, "Title\nBody\n");
});
