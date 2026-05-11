#!/usr/bin/env node

import { prepareImportPackage } from "./prepare.js";

function printUsage() {
  console.log(`Usage:
  node helper/src/cli.js prepare --input <dir> --output <dir> [--dry-run]

Commands:
  prepare    Scan PDFs and create a NotebookLM-friendly import package.
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

  if (options.command !== "prepare") {
    throw new Error(`Unknown command: ${options.command}`);
  }

  if (!options.input || !options.output) {
    throw new Error("Both --input and --output are required.");
  }

  const result = await prepareImportPackage(options);
  console.log(`Found ${result.totalPdfCount} PDF file(s).`);
  console.log(`Prepared ${result.preparedCount} file(s).`);
  console.log(`Output: ${result.outputDir}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
