/**
 * Custom log levels for Cheatron
 * Lower number = higher severity
 */
export const levels = {
  fatal: 0,
  error: 1,
  warn: 2,
  info: 3,
  debug: 4,
  trace: 5,
} as const;

export const colors = {
  fatal: 'bold redBG white',
  error: 'red',
  warn: 'yellow',
  info: 'cyan',
  debug: 'gray',
  trace: 'dim grey',
} as const;

export type LogLevel = keyof typeof levels;
