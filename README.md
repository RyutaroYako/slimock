# Slimock

A CLI utility that normalizes HTML snapshots, removes unused styles via PurgeCSS, and prepares the output for CDN-hosted Tailwind CSS.

## Usage

```bash
npx slimock input.html output.html
# or locally during development
npm run purge input.html output.html
```

## Logging

- `LOG_LEVEL` (default: `info`) - Set to `debug` for verbose output

Logs are emitted through pino-pretty with colorized, human-readable output.

## Development

```bash
npm test        # run Vitest suites once
npm run test:watch
npm run typecheck
```

Vitest covers the pure CSS/HTML helpers and logger factory so you can iterate with confidence before exercising the CLI end-to-end.
