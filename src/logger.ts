// Polyfill for BigInt serialization
declare global {
  interface BigInt {
    toJSON(): string;
  }
}

BigInt.prototype.toJSON = function () {
  return this.toString();
};

import winston from 'winston';
import path from 'node:path';
import fs from 'node:fs';
import { levels, colors, type LogLevel } from './levels.js';
import {
  createConsoleTransport,
  createFileTransport,
  createDailyRotateTransport,
} from './transports.js';

// Register custom colors
winston.addColors(colors);

/**
 * Logger configuration options
 */
export interface LoggerOptions {
  /** Minimum log level (default: 'debug') */
  level?: LogLevel;
  /** Directory for log files. If not set, file logging is disabled */
  logsDir?: string;
  /** Log file name (used with logsDir for single file transport) */
  logFileName?: string;
  /** Enable daily rotation (requires logsDir) (default: false) */
  dailyRotation?: boolean;
  /** Max age for rotated files (default: '30d') */
  maxFiles?: string;
}

/**
 * Logger helper interface — category-first API
 * Backwards compatible with existing Cheatron logger
 */
export interface LoggerHelpers {
  fatal: (category: string, message: string, data?: unknown) => void;
  error: (category: string, message: string, data?: unknown) => void;
  warn: (category: string, message: string, data?: unknown) => void;
  info: (category: string, message: string, data?: unknown) => void;
  debug: (category: string, message: string, data?: unknown) => void;
  trace: (category: string, message: string, data?: unknown) => void;
  child: (category: string) => ChildLogger;
}

/**
 * Child logger — scoped to a fixed category
 */
export interface ChildLogger {
  fatal: (message: string, data?: unknown) => void;
  error: (message: string, data?: unknown) => void;
  warn: (message: string, data?: unknown) => void;
  info: (message: string, data?: unknown) => void;
  debug: (message: string, data?: unknown) => void;
  trace: (message: string, data?: unknown) => void;
}

/**
 * Create a logger instance
 */
export function createLogger(opts: LoggerOptions = {}): {
  logger: winston.Logger;
  helpers: LoggerHelpers;
  logFilePath: string | null;
} {
  const level = opts.level ?? 'debug';
  let logFilePath: string | null = null;

  // Build transports
  const transports: winston.transport[] = [createConsoleTransport()];

  if (opts.logsDir) {
    // Ensure logs directory exists
    if (!fs.existsSync(opts.logsDir)) {
      fs.mkdirSync(opts.logsDir, { recursive: true });
    }

    if (opts.dailyRotation) {
      transports.push(
        createDailyRotateTransport({
          dirname: opts.logsDir,
          maxFiles: opts.maxFiles ?? '30d',
        }),
      );
      logFilePath = opts.logsDir;
    } else {
      const fileName =
        opts.logFileName ??
        `cheatron-${new Date().toISOString().split('T')[0]}.log`;
      logFilePath = path.join(opts.logsDir, fileName);
      transports.push(createFileTransport(logFilePath));
    }
  }

  // Create winston logger
  const logger = winston.createLogger({
    levels,
    level,
    format: winston.format.combine(
      winston.format.timestamp({ format: 'HH:mm:ss.SSS' }),
      winston.format.errors({ stack: true }),
    ),
    transports,
  });

  // Build helper functions
  function logAt(
    lvl: LogLevel,
    category: string,
    message: string,
    data?: unknown,
  ) {
    logger.log({ level: lvl, category, message, data });
  }

  function createChild(category: string): ChildLogger {
    return {
      fatal: (msg, data?) => logAt('fatal', category, msg, data),
      error: (msg, data?) => logAt('error', category, msg, data),
      warn: (msg, data?) => logAt('warn', category, msg, data),
      info: (msg, data?) => logAt('info', category, msg, data),
      debug: (msg, data?) => logAt('debug', category, msg, data),
      trace: (msg, data?) => logAt('trace', category, msg, data),
    };
  }

  const helpers: LoggerHelpers = {
    fatal: (cat, msg, data?) => logAt('fatal', cat, msg, data),
    error: (cat, msg, data?) => logAt('error', cat, msg, data),
    warn: (cat, msg, data?) => logAt('warn', cat, msg, data),
    info: (cat, msg, data?) => logAt('info', cat, msg, data),
    debug: (cat, msg, data?) => logAt('debug', cat, msg, data),
    trace: (cat, msg, data?) => logAt('trace', cat, msg, data),
    child: createChild,
  };

  return { logger, helpers, logFilePath };
}

// ─── Static singleton logger ─────────────────────────────────────────

let _instance = createLogger({ level: 'info' });

/**
 * Get the current shared logger helpers
 */
export function getLogger(): LoggerHelpers {
  return _instance.helpers;
}

/**
 * Get the current shared winston logger (for advanced usage)
 */
export function getWinstonLogger(): winston.Logger {
  return _instance.logger;
}

/**
 * Get the current log file path (null if file logging is disabled)
 */
export function getLogFilePath(): string | null {
  return _instance.logFilePath;
}

/**
 * Reconfigure the global shared logger.
 * All existing LogHelper instances will automatically use the new configuration
 * since they read from the singleton on each log call.
 */
export function configureLogger(options: LoggerOptions): void {
  _instance = createLogger(options);
}

/**
 * Create a scoped log helper with a fixed title prefix.
 * Uses the module-level singleton logger — all helpers share the
 * same underlying winston logger and transports.
 *
 * @param title Top-level namespace (e.g. 'Native', 'NativeMock')
 *
 * Usage:
 *   const log = createLogHelper('Native');
 *   log.info('Init', 'Starting');        // category: Native/Init
 *   log.child('Memory').info('4KB');      // category: Native/Memory
 */
export function createLogHelper(title: string): LoggerHelpers {
  const fmt = (cat: string) => (title ? `${title}/${cat}` : cat);

  return {
    fatal: (cat, msg, data?) => _instance.helpers.fatal(fmt(cat), msg, data),
    error: (cat, msg, data?) => _instance.helpers.error(fmt(cat), msg, data),
    warn: (cat, msg, data?) => _instance.helpers.warn(fmt(cat), msg, data),
    info: (cat, msg, data?) => _instance.helpers.info(fmt(cat), msg, data),
    debug: (cat, msg, data?) => _instance.helpers.debug(fmt(cat), msg, data),
    trace: (cat, msg, data?) => _instance.helpers.trace(fmt(cat), msg, data),
    child: (cat) => _instance.helpers.child(fmt(cat)),
  };
}

export default createLogger;
