import { getLogger } from '../logger';

const logger = getLogger();

/**
 * Remove data URLs from CSS declarations to reduce output size.
 */
export function removeDataUrls(css: string): string {
  let result = css.replace(/url\s*\(\s*["']?data:[^;,]+;base64,[A-Za-z0-9+/=]+["']?\s*\)/gs, 'none');
  result = result.replace(/(background(?:-image)?)\s*:\s*none\s*;/gi, '');
  return result;
}

/**
 * Drop @font-face declarations which typically reference external assets that
 * cannot be preserved inside the inlined HTML snapshot.
 */
export function removeFontFaces(css: string): string {
  return css.replace(/@font-face\s*\{[^}]*\}/gs, '');
}

/**
 * Remove @property rules if the corresponding CSS custom property is never
 * referenced anywhere else in the stylesheet.
 */
export function removeUnusedPropertyRules(css: string): string {
  const propertyRules = new Map<string, string>();
  const propertyRegex = /@property\s+(--[\w-]+)\s*\{[^}]*\}/gs;
  let match;

  while ((match = propertyRegex.exec(css)) !== null) {
    propertyRules.set(match[1], match[0]);
  }

  if (propertyRules.size === 0) {
    return css;
  }

  logger.debug({ count: propertyRules.size }, 'Found @property rules');

  const usedVariables = new Set<string>();
  const variableUsageRegex = /var\(\s*--([\w-]+)/g;
  const variableDefinitionRegex = /--([\w-]+)\s*:/g;

  while ((match = variableUsageRegex.exec(css)) !== null) {
    usedVariables.add(`--${match[1]}`);
  }

  const cssWithoutProperty = css.replace(/@property\s+--[\w-]+\s*\{[^}]*\}/gs, '');
  while ((match = variableDefinitionRegex.exec(cssWithoutProperty)) !== null) {
    usedVariables.add(`--${match[1]}`);
  }

  logger.debug({ count: usedVariables.size }, 'Found CSS variable usages');

  let result = css;
  let removedCount = 0;

  for (const [varName, propertyRule] of propertyRules.entries()) {
    if (!usedVariables.has(varName)) {
      result = result.replace(propertyRule, '');
      removedCount++;
    }
  }

  if (removedCount > 0) {
    logger.debug({ count: removedCount }, 'Removed unused @property rules');
  } else {
    logger.debug('All @property rules are in use');
  }

  return result;
}
