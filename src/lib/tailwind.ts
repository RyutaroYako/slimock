import { TailwindUtils } from 'tailwind-api-utils';
import { parseHTML } from 'linkedom';
import { getLogger } from '../logger';

let tailwindUtils: TailwindUtils | null = null;
let isInitialized = false;

const logger = getLogger();

export async function initializeTailwindUtils(): Promise<void> {
  if (isInitialized) {
    return;
  }

  try {
    tailwindUtils = new TailwindUtils();

    logger.info({ version: tailwindUtils.isV4 ? '4' : '3' }, 'Initializing TailwindUtils');

    if (tailwindUtils.isV4) {
      const defaultConfig = {
        content: ['./**/*.html'],
        theme: {},
        plugins: [],
      };

      await (tailwindUtils as any).loadConfig(defaultConfig);
      logger.info('TailwindUtils initialized (Tailwind v4, default config)');
    } else {
      const projectRoot = process.cwd();
      tailwindUtils.loadConfigV3(projectRoot);
      logger.info('TailwindUtils initialized (Tailwind v3)');
    }

    isInitialized = true;
  } catch (error) {
    logger.error({ err: error }, 'TailwindUtils initialization failed');
    throw error;
  }
}

export function removeTailwindClasses(html: string): string {
  try {
    const { document } = parseHTML(html);
    const allElements = document.querySelectorAll('[class]');

    for (const element of allElements) {
      const classAttr = element.getAttribute('class');
      if (!classAttr) continue;

      const classes = classAttr.split(/\s+/).filter((cls: string) => cls.trim());
      const nonTailwindClasses = classes.filter((cls: string) => !isTailwindClass(cls));

      if (nonTailwindClasses.length === 0) {
        element.removeAttribute('class');
      } else {
        element.setAttribute('class', nonTailwindClasses.join(' '));
      }
    }

    return document.documentElement?.outerHTML || html;
  } catch (error) {
    logger.warn({ err: error }, 'Failed to remove Tailwind classes');
    return html;
  }
}

function isTailwindClass(className: string): boolean {
  if (!tailwindUtils) {
    logger.warn('TailwindUtils not initialized');
    return false;
  }

  try {
    return tailwindUtils.isValidClassName(className);
  } catch (error) {
    if (process.env.DEBUG) {
      logger.warn({ err: error, className }, 'Validation failed for class');
    }
    return false;
  }
}
