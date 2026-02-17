# @cheatron/log

Advanced Winston-based logging library for the Cheatron ecosystem. Featuring a shared static logger system that allows multiple packages to share the same configuration and log output.

## Features

- **Shared Static Logger** — Configure once in your main app, use everywhere via `createLogHelper`.
- **Scoped Logging** — Automatically prefix log categories with a title (e.g. `Native/Process`).
- **6 Log Levels** — `fatal`, `error`, `warn`, `info`, `debug`, `trace`.
- **Colored Console** — Pretty formatted output with colors per level.
- **JSONL File Logging** — Structured JSON Lines format, one object per line.
- **Daily Rotation** — Auto-rotating log files with configurable retention.
- **Child Loggers** — Scoped category loggers for modules.

## Installation

```bash
bun add @cheatron/log
```

## Usage

### 1. Configure once (Main App)

```typescript
import { configureLogger } from '@cheatron/log';

configureLogger({
  level: 'debug',
  logsDir: './logs',
  dailyRotation: true,
});
```

### 2. Create Scoped Helpers (Packages/Modules)

Use `createLogHelper` to create a logger instance that automatically prefixes all categories with a title. All helpers share the same underlying global logger instance.

```typescript
// in @cheatron/cheatron-native
import { createLogHelper } from '@cheatron/log';

const log = createLogHelper('Native');

log.info('App', 'Module started'); // category: Native/App
```

### Basic Logger (Manual Instance)

If you need a standalone logger instance that doesn't share the global state:

```typescript
import { createLogger } from '@cheatron/log';

const { helpers: log } = createLogger({ level: 'info' });
log.info('App', 'Standalone log');
```

### Log Levels

| Level   | Color     | Use Case                       |
| ------- | --------- | ------------------------------ |
| `fatal` | 🔴 Red BG | Unrecoverable system failures  |
| `error` | 🔴 Red    | Errors requiring attention     |
| `warn`  | 🟡 Yellow | Warnings, degraded performance |
| `info`  | 🔵 Cyan   | General information            |
| `debug` | ⚪ Gray   | Development details            |
| `trace` | 🪨 Dim    | Low-level internal tracing     |

## API Reference

### Global Singleton API

- `configureLogger(opts)`: Reconfigures the global shared logger instance.
- `createLogHelper(title)`: Returns a `LoggerHelpers` instance that prefixes categories with `title/`.
- `getLogger()`: Returns the global `LoggerHelpers`.
- `getWinstonLogger()`: Returns the underlying Winston instance.
- `getLogFilePath()`: Returns current log file path (if enabled).

### `createLogger(opts?)` Options

| Option          | Type       | Default   | Description                |
| --------------- | ---------- | --------- | -------------------------- |
| `level`         | `LogLevel` | `'debug'` | Minimum log level          |
| `logsDir`       | `string`   | —         | Directory for log files    |
| `logFileName`   | `string`   | auto      | Log file name              |
| `dailyRotation` | `boolean`  | `false`   | Enable daily file rotation |
| `maxFiles`      | `string`   | `'30d'`   | Retention period           |

### `LoggerHelpers`

```typescript
log.fatal(category, message, data?)
log.error(category, message, data?)
log.warn(category, message, data?)
log.info(category, message, data?)
log.debug(category, message, data?)
log.trace(category, message, data?)
log.child(category) // Returns ChildLogger
```

## License

MIT
