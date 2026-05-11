import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import assert from "node:assert/strict";

import { findPdfFiles, makeNotebookLMFileName, prepareImportPackage } from "../src/prepare.js";

test("findPdfFiles recursively returns sorted PDFs", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "zotero-nlm-"));
  await writeFile(path.join(root, "b.pdf"), "b");
  await writeFile(path.join(root, "a.txt"), "a");
  await writeFile(path.join(root, "A.PDF"), "a");

  const files = await findPdfFiles(root);
  assert.deepEqual(files.map((file) => path.basename(file)), ["A.PDF", "b.pdf"]);
});

test("makeNotebookLMFileName cleans unsafe characters", () => {
  const fileName = makeNotebookLMFileName(path.join("C:/papers", "A study - CRISPR off?.pdf"), 7);
  assert.equal(fileName, "0007 - A study - CRISPR off.pdf");
});

test("prepareImportPackage creates entries in dry-run mode", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "zotero-nlm-"));
  await writeFile(path.join(root, "paper one.pdf"), "pdf");

  const output = path.join(root, "out");
  const result = await prepareImportPackage({ input: root, output, dryRun: true });

  assert.equal(result.totalPdfCount, 1);
  assert.equal(result.entries[0].fileName, "0001 - paper one.pdf");
});
