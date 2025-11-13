import { PurgeCSS } from 'purgecss';
import { getLogger } from '../logger';
import { removeDataUrls, removeFontFaces, removeUnusedPropertyRules } from './css';
import { extractStyles, removeStyles } from './html';
import { formatWithPrettier } from './format';

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

function extractVueScopedAttributes(html: string): string[] {
  const matches = html.matchAll(/data-v-[a-f0-9]+/g);
  return Array.from(new Set(Array.from(matches, m => m[0])));
}

async function runPurgeCSS(html: string, css: string): Promise<string> {
  const vueScopedAttrs = extractVueScopedAttributes(html);

  logger.debug({ scopedAttributes: vueScopedAttrs.length }, 'Vue scoped attributes detected');

  const results = await new PurgeCSS().purge({
    content: [{ raw: html, extension: 'html' }],
    css: [{ raw: css }],
    safelist: {
      standard: [],
      deep: [
        /data-v-/,
        /\[data-v-[a-f0-9]+\]/,
      ],
      greedy: [
        /data-v-/,
      ],
      variables: [],
      keyframes: [],
    },
    variables: true,
    defaultExtractor: (content: string) => {
      const broadMatches = content.match(/[^<>'"`\s]*[^<>'"`\s:]/g) || [];
      const innerMatches = content.match(/[^<>'"`\s.()]*[^<>'"`\s.():]/g) || [];
      const bracketMatches = content.match(/[\w-]+\[[^\]]+\]/g) || [];
      const vueScopedMatches = content.match(/data-v-[a-f0-9]+/g) || [];
      return [...broadMatches, ...innerMatches, ...bracketMatches, ...vueScopedMatches];
    },
  });

  return results[0].css;
}
