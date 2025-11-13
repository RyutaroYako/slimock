import { describe, expect, it } from 'vitest';
import { getLogger } from '../src/logger';

describe('logger', () => {
  it('returns a logger instance', () => {
    const logger = getLogger();
    expect(logger).toBeDefined();
    expect(logger.info).toBeDefined();
    expect(logger.error).toBeDefined();
    expect(logger.warn).toBeDefined();
    expect(logger.debug).toBeDefined();
  });

  it('logger has a level property', () => {
    const logger = getLogger();
    expect(logger.level).toBeDefined();
  });
});
