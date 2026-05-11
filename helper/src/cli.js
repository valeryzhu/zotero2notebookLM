#!/usr/bin/env node

import { prepareImportPackage } from "./prepare.js";
import { importDirectoryToNotebookLM } from "./notebooklm.js";

function printUsage() {
  console.log(`Usage:
  node helper/src/cli.js prepare --input <dir> --output <dir> [--dry-run]
  node helper/src/cli.js notebooklm-import --input <dir> [--name <title>] [--notebook-id <id>] [--cli nlm] [--dialect tmc|mcp|auto] [--dry-run]

Commands:
  prepare             Scan PDFs and create a NotebookLM-friendly import package.
  notebooklm-import   Create a NotebookLM notebook and add all supported files using an installed nlm CLI.
`);
}

function parseArgs(argv) {
  const [command, ...rest] = argv;
  const options = {
    command,
    dryRun: false
  };

  for (let i = 0; i < rest.length; i += 1) {
    const arg = rest[i];
    if (arg === "--dry-run") {
      options.dryRun = true;
      continue;
    }
    if (arg === "--input" || arg === "-i") {
      options.input = rest[++i];
      continue;
    }
    if (arg === "--output" || arg === "-o") {
      options.output = rest[++i];
      continue;
    }
    if (arg === "--name" || arg === "-n") {
      options.name = rest[++i];
      continue;
    }
    if (arg === "--notebook-id") {
      options.notebookId = rest[++i];
      continue;
    }
    if (arg === "--cli") {
      options.cli = rest[++i];
      continue;
    }
    if (arg === "--dialect") {
      options.dialect = rest[++i];
      continue;
    }
    if (arg === "--help" || arg === "-h") {
      options.help = true;
      continue;
    }
    throw new Error(`Unknown argument: ${arg}`);
  }

  return options;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));

  if (!options.command || options.help) {
    printUsage();
    return;
  }

  if (!["prepare", "notebooklm-import"].includes(options.command)) {
    throw new Error(`Unknown command: ${options.command}`);
  }

  if (options.command === "prepare") {
    if (!options.input || !options.output) {
      throw new Error("Both --input and --output are required.");
    }

    const result = await prepareImportPackage(options);
    console.log(`Found ${result.totalSourceCount} source file(s).`);
    console.log(`PDF files: ${result.totalPdfCount}`);
    console.log(`Note files: ${result.totalNoteCount}`);
    console.log(`Prepared ${result.preparedCount} file(s).`);
    console.log(`Output: ${result.outputDir}`);
    return;
  }

  if (!options.input) {
    throw new Error("--input is required.");
  }

  const result = await importDirectoryToNotebookLM(options);
  console.log(`Notebook: ${result.notebookTitle}`);
  console.log(`Notebook ID: ${result.notebookId}`);
  console.log(`Source files: ${result.sourceCount}`);
  if (options.dryRun) {
    for (const step of result.steps) {
      console.log(`${step.command} ${step.args.map(quoteArg).join(" ")}`);
    }
  }
}

function quoteArg(arg) {
  const text = String(arg);
  return /\s/.test(text) ? `"${text.replace(/"/g, '\\"')}"` : text;
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
