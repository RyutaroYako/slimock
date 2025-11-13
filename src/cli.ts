#!/usr/bin/env node
import { purgeHTML } from './pipeline';
import { getLogger } from './logger';

const logger = getLogger();

function formatUsage(): string {
  return `
PurgeCSS for HTML Files

Usage:
  slimock <input.html> <output.html>

Examples:
  slimock input.html output.html
`;
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  if (args.length !== 2) {
    console.log(formatUsage());
    process.exit(1);
  }

  const [inputFile, outputFile] = args;

  try {
    await purgeHTML(inputFile, outputFile);
  } catch (error) {
    logger.error({ err: error }, 'Purge command failed');
    process.exit(1);
  }
}

void main();
