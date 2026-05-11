import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import assert from "node:assert/strict";

import { findNotebookLMSources, importDirectoryToNotebookLM } from "../src/notebooklm.js";

test("findNotebookLMSources recursively returns supported files", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "zotero-nlm-cli-"));
  await mkdir(path.join(root, "nested"));
  await writeFile(path.join(root, "paper.pdf"), "pdf");
  await writeFile(path.join(root, "note.md"), "# Note");
  await writeFile(path.join(root, "nested", "web.html"), "<p>Web</p>");
  await writeFile(path.join(root, "image.png"), "png");

  const files = await findNotebookLMSources(root);
  assert.deepEqual(files.map((file) => path.basename(file)).sort(), ["note.md", "paper.pdf", "web.html"]);
});

test("importDirectoryToNotebookLM dry-run builds create and add commands", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "zotero-nlm-cli-"));
  await writeFile(path.join(root, "paper.pdf"), "pdf");
  await writeFile(path.join(root, "note.txt"), "note");

  const result = await importDirectoryToNotebookLM({
    input: root,
    name: "CRISPRa",
    dryRun: true
  });

  assert.equal(result.notebookTitle, "CRISPRa");
  assert.equal(result.notebookId, "<created-notebook-id>");
  assert.equal(result.sourceCount, 2);
  assert.equal(result.steps[0].kind, "create");
  assert.deepEqual(result.steps[0].args, ["create", "CRISPRa"]);
  assert.equal(result.steps.filter((step) => step.kind === "add").length, 2);
});

test("importDirectoryToNotebookLM dry-run supports existing notebook id", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "zotero-nlm-cli-"));
  await writeFile(path.join(root, "paper.pdf"), "pdf");

  const result = await importDirectoryToNotebookLM({
    input: root,
    notebookId: "existing-id",
    dialect: "mcp",
    dryRun: true
  });

  assert.equal(result.steps[0].kind, "add");
  assert.deepEqual(result.steps[0].args, ["source", "add", "existing-id", "--file", path.join(root, "paper.pdf")]);
});
