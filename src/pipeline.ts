import { readFile, writeFile } from 'node:fs/promises';
import { getLogger } from './logger';
import {
  addTailwindCDN,
  normalizeHTML,
  removeInlineStyleDataUrls,
  removeUnnecessaryElements,
  replacePlaceholderImages,
} from './lib/html';
import { formatWithPrettier } from './lib/format';
import { purgeCSSInHTML } from './lib/purgecss-runner';
import { initializeTailwindUtils, removeTailwindClasses } from './lib/tailwind';

const logger = getLogger();

export async function purgeHTML(inputFile: string, outputFile: string) {
  logger.info({ inputFile, outputFile }, 'Starting purge');

  let html = await readFile(inputFile, 'utf-8');
  html = normalizeHTML(html);

  await initializeTailwindUtils();

  logger.info('Removing Tailwind classes for PurgeCSS');
  const htmlWithoutTailwind = removeTailwindClasses(html);

  html = await purgeCSSInHTML(html, htmlWithoutTailwind);

  html = removeInlineStyleDataUrls(html);
  html = replacePlaceholderImages(html);
  html = removeUnnecessaryElements(html);
  html = addTailwindCDN(html);
  html = await formatWithPrettier(html, 'html');

  await writeFile(outputFile, html, 'utf-8');
  logger.info({ sizeKB: Math.round(Buffer.byteLength(html, 'utf-8') / 1024) }, 'Wrote optimized HTML');
}
