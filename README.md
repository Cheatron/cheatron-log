# cheatron-log

Advanced Winston-based logging library for the Cheatron ecosystem.

## Features

- **6 Log Levels** — `fatal`, `error`, `warn`, `info`, `debug`, `trace`
- **Colored Console** — Pretty formatted output with colors per level
- **JSONL File Logging** — Structured JSON Lines format, one object per line
- **Daily Rotation** — Auto-rotating log files with configurable retention
- **Child Loggers** — Scoped category loggers for modules
- **Backwards Compatible** — Same category-first API as Cheatron core

## Installation

```bash
bun install cheatron-log
```

## Usage

### Basic

```typescript
import { createLogger } from "cheatron-log";

const { helpers: log } = createLogger();

log.info("App", "Application started");
log.error("Network", "Connection failed", { host: "localhost", port: 8080 });
log.debug("Thread", "Context loaded", { tid: 1234 });
```

### With File Logging

```typescript
const { helpers: log } = createLogger({
  level: "debug",
  logsDir: "./logs",
  logFileName: "app.log",
});
```

### With Daily Rotation

```typescript
const { helpers: log } = createLogger({
  level: "debug",
  logsDir: "./logs",
  dailyRotation: true,
  maxFiles: "30d",
});
```

### Child Loggers

```typescript
const { helpers: log } = createLogger();

const threadLog = log.child("Thread");
threadLog.info("Opened handle");
threadLog.debug("Context retrieved", { rip: "0x7FF12345" });
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

### Console Output

```
13:35:58.386 fatal [System]: System crash detected
13:35:58.394 error [Network]: Connection refused
13:35:58.394 warn  [Memory]: High memory usage
13:35:58.394 info  [App]: Application started
13:35:58.394 debug [Thread]: Thread context loaded
13:35:58.394 trace [Internal]: GC cycle completed
```

### JSONL File Output

```json
{"timestamp":"13:35:58.386","level":"fatal","category":"System","message":"System crash detected","data":{"code":"FATAL_001"}}
{"timestamp":"13:35:58.394","level":"info","category":"App","message":"Application started"}
```

## API

### `createLogger(opts?)`

Returns `{ logger, helpers, logFilePath }`.

| Option          | Type       | Default   | Description                |
| --------------- | ---------- | --------- | -------------------------- |
| `level`         | `LogLevel` | `'debug'` | Minimum log level          |
| `logsDir`       | `string`   | —         | Directory for log files    |
| `logFileName`   | `string`   | auto      | Log file name              |
| `dailyRotation` | `boolean`  | `false`   | Enable daily file rotation |
| `maxFiles`      | `string`   | `'30d'`   | Retention period           |

### `helpers` (LoggerHelpers)

```typescript
helpers.fatal(category, message, data?)
helpers.error(category, message, data?)
helpers.warn(category, message, data?)
helpers.info(category, message, data?)
helpers.debug(category, message, data?)
helpers.trace(category, message, data?)
helpers.child(category) // Returns ChildLogger
```

### `ChildLogger`

Same as helpers but without the category parameter — it's fixed at creation.

## License

MIT
