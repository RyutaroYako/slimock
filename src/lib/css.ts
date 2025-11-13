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

/**
 * Remove unused CSS custom properties by traversing dependency graph.
 * This is currently unused but kept for manual cleanups.
 */
export function removeUnusedCSSVariables(css: string): string {
  const variableDefinitions = new Map<string, string>();
  const variableDefinitionRegex = /--([\w-]+)\s*:\s*([^;]+);/g;
  let match;

  while ((match = variableDefinitionRegex.exec(css)) !== null) {
    variableDefinitions.set(match[1], match[2]);
  }

  logger.debug({ count: variableDefinitions.size }, 'Found CSS variable definitions');

  const dependencies = new Map<string, Set<string>>();

  for (const [varName, value] of variableDefinitions.entries()) {
    const deps = new Set<string>();
    const usageRegex = /var\(\s*--([\w-]+)/g;
    let usageMatch;

    while ((usageMatch = usageRegex.exec(value)) !== null) {
      deps.add(usageMatch[1]);
    }

    if (deps.size > 0) {
      dependencies.set(varName, deps);
    }
  }

  const directlyUsedVariables = new Set<string>();
  const allUsages = new Set<string>();
  const variableUsageRegex = /var\(\s*--([\w-]+)/g;
  while ((match = variableUsageRegex.exec(css)) !== null) {
    allUsages.add(match[1]);
  }

  for (const varName of allUsages) {
    let isOnlyInDefinitions = true;
    const lines = css.split('\n');
    for (const line of lines) {
      if (!line.match(/^\s*--[\w-]+\s*:/) && line.includes(`var(--${varName}`)) {
        isOnlyInDefinitions = false;
        break;
      }
    }

    if (!isOnlyInDefinitions) {
      directlyUsedVariables.add(varName);
    }
  }

  logger.debug({ count: directlyUsedVariables.size }, 'Found directly used CSS variables');

  const usedVariables = new Set<string>(directlyUsedVariables);
  const queue = Array.from(directlyUsedVariables);

  while (queue.length > 0) {
    const current = queue.shift()!;
    const deps = dependencies.get(current);

    if (deps) {
      for (const dep of deps) {
        if (!usedVariables.has(dep)) {
          usedVariables.add(dep);
          queue.push(dep);
        }
      }
    }
  }

  logger.debug({ count: usedVariables.size }, 'Total used CSS variables');

  const unusedVariables = Array.from(variableDefinitions.keys()).filter(
    varName => !usedVariables.has(varName),
  );

  if (unusedVariables.length === 0) {
    logger.debug('No unused CSS variables found');
    return css;
  }

  logger.debug({ count: unusedVariables.length }, 'Removing unused CSS variables');

  const lines = css.split('\n');
  const filteredLines: string[] = [];

  for (const line of lines) {
    let shouldKeepLine = true;

    for (const varName of unusedVariables) {
      const pattern = new RegExp(`^\\s*--${varName.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&')}\\s*:[^;]+;\\s*$`);
      if (pattern.test(line)) {
        shouldKeepLine = false;
        break;
      }
    }

    if (shouldKeepLine) {
      filteredLines.push(line);
    }
  }

  return filteredLines.join('\n');
}
