import pino from 'pino';

const DEFAULT_LEVEL = process.env.LOG_LEVEL ?? 'info';

const logger = pino({
  level: DEFAULT_LEVEL,
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      ignore: 'pid,hostname,time',
    },
  },
});

export function getLogger() {
  return logger;
}
