import { PurgeCSS } from 'purgecss';
import purgecssFromHtml from 'purgecss-from-html';
import postcss from 'postcss';
import removePrefixes from 'postcss-remove-prefixes';
import { getLogger } from '../logger';
import { removeDataUrls, removeFontFaces, removeUnusedPropertyRules } from './css';
import { extractStyles, removeStyles } from './html';
import { formatWithPrettier } from './format';
import { removeVendorSelectors } from './postcss-remove-vendor-selectors';

const logger = getLogger();

export async function purgeCSSInHTML(html: string, htmlForPurge: string): Promise<string> {
  const styles = extractStyles(html);

  if (styles.length === 0) {
    const error = new Error('No <style> tags found');
    logger.error(error.message);
    throw error;
  }

  let css = styles.join('\n');
  css = removeDataUrls(css);
  css = removeFontFaces(css);
  logger.info({ sizeKB: Math.round(css.length / 1024) }, 'CSS cleanup complete');

  const htmlWithoutStyles = removeStyles(htmlForPurge);
  css = await runPurgeCSS(htmlWithoutStyles, css);
  logger.info({ sizeKB: Math.round(css.length / 1024) }, 'PurgeCSS (including CSS variables) complete');

  css = removeUnusedPropertyRules(css);

  // Remove vendor prefixes (properties and selectors)
  const result = await postcss([removePrefixes(), removeVendorSelectors()]).process(css, { from: undefined });
  css = result.css;
  logger.info('Vendor prefixes removed');

  css = await formatWithPrettier(css, 'css');

  const styleRegex = /<style[^>]*>([\s\S]*?)<\/style>/gi;
  let isFirstStyle = true;

  return html.replace(styleRegex, () => {
    if (isFirstStyle) {
      isFirstStyle = false;
      return `<style>\n${css}</style>`;
    }
    return '';
  });
}

async function runPurgeCSS(html: string, css: string): Promise<string> {
  const results = await new PurgeCSS().purge({
    content: [{ raw: html, extension: 'html' }],
    css: [{ raw: css }],
    variables: true,
    defaultExtractor: (content: string) => {
      const result = purgecssFromHtml(content);
      return [
        ...result.attributes.names,
        ...result.attributes.values,
        ...result.classes,
        ...result.ids,
        ...result.tags,
        ...result.undetermined,
      ];
    },
  });

  return results[0].css;
}
