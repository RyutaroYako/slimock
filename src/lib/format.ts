import prettier from 'prettier';
import { getLogger } from '../logger';

const logger = getLogger();

export async function formatWithPrettier(content: string, parser: 'html' | 'css'): Promise<string> {
  try {
    const options: prettier.Options = {
      parser,
      htmlWhitespaceSensitivity: 'strict',
      printWidth: 120,
      tabWidth: 2,
      useTabs: false,
    };

    return await prettier.format(content, options);
  } catch (error) {
    logger.warn({ err: error, parser }, 'Prettier formatting failed');
    return content;
  }
}
