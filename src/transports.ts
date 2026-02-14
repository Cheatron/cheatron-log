import winston from 'winston';
import 'winston-daily-rotate-file';
import { prettyConsole, jsonLine } from './formats.js';

/**
 * Colored console transport
 */
export function createConsoleTransport() {
    return new winston.transports.Console({
        format: winston.format.combine(
            winston.format.colorize(),
            prettyConsole,
        ),
    });
}

/**
 * Single JSON Lines file transport
 * @param filename - Full path to the log file
 * @param maxsize - Max file size in bytes (default: 10MB)
 * @param maxFiles - Max number of files to keep (default: 5)
 */
export function createFileTransport(
    filename: string,
    maxsize: number = 10 * 1024 * 1024,
    maxFiles: number = 5,
) {
    return new winston.transports.File({
        filename,
        format: jsonLine,
        maxsize,
        maxFiles,
        tailable: true,
    });
}

export interface DailyRotateOptions {
    /** Directory to store log files */
    dirname: string;
    /** Filename pattern (default: 'cheatron-%DATE%.log') */
    filename?: string;
    /** Date pattern for rotation (default: 'YYYY-MM-DD') */
    datePattern?: string;
    /** Max size per file before rotation (default: '20m') */
    maxSize?: string;
    /** Max age of log files (default: '30d') */
    maxFiles?: string;
    /** Compress rotated files (default: true) */
    zippedArchive?: boolean;
}

/**
 * Daily rotating file transport
 * Creates a new log file each day with automatic cleanup
 */
export function createDailyRotateTransport(opts: DailyRotateOptions) {
    return new winston.transports.DailyRotateFile({
        dirname: opts.dirname,
        filename: opts.filename ?? 'cheatron-%DATE%.log',
        datePattern: opts.datePattern ?? 'YYYY-MM-DD',
        maxSize: opts.maxSize ?? '20m',
        maxFiles: opts.maxFiles ?? '30d',
        zippedArchive: opts.zippedArchive ?? true,
        format: jsonLine,
    });
}
