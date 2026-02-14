import { describe, test, expect, beforeEach, afterEach, spyOn } from "bun:test";
import fs from "node:fs";
import path from "node:path";
import { createLogger } from "../src/index.js";

import { Logger } from "winston";

const TEST_LOGS_DIR = path.join(process.cwd(), "test-logs");

describe("createLogger", () => {
  const loggers: Logger[] = [];

  beforeEach(() => {
    // Clean up test logs directory before each test
    if (fs.existsSync(TEST_LOGS_DIR)) {
      fs.rmSync(TEST_LOGS_DIR, { recursive: true, force: true });
    }
  });

  afterEach(() => {
    // Close all loggers created in the test
    loggers.forEach((logger) => {
      logger.close();
      logger.transports.forEach((t) => {
        if (typeof (t as any).close === 'function') {
           (t as any).close();
        }
      });
    });
    loggers.length = 0;

    // Small delay to ensure file handles are released
    // This is sometimes needed with winston file transports
    // But let's try just closing first. 
    // If that fails, we might need a small sleep.
    
    // Clean up test logs directory after each test
    if (fs.existsSync(TEST_LOGS_DIR)) {
      try {
        fs.rmSync(TEST_LOGS_DIR, { recursive: true, force: true });
      } catch (error) {
        // Ignore errors if file is busy, consistent with force: true but stricter
      }
    }
  });

  test("should create a logger with default options", () => {
    const { logger, helpers, logFilePath } = createLogger();
    loggers.push(logger);

    expect(logger).toBeDefined();
    expect(helpers).toBeDefined();
    expect(logFilePath).toBeNull();
    expect(logger.level).toBe("debug");
    expect(logger.transports.length).toBeGreaterThan(0); // Should have console transport
  });

  test("should respect the level option", () => {
    const { logger } = createLogger({ level: "error" });
    loggers.push(logger);
    expect(logger.level).toBe("error");
  });

  test("should create log file when logsDir and logFileName are provided", () => {
    const logFileName = "test.log";
    const { logger, logFilePath } = createLogger({
      logsDir: TEST_LOGS_DIR,
      logFileName,
    });
    loggers.push(logger);

    expect(logFilePath).toBe(path.join(TEST_LOGS_DIR, logFileName));
    
    // We expect the directory to be created
    expect(fs.existsSync(TEST_LOGS_DIR)).toBe(true);
    // The file might not be created until a log is written, but the transport is set up.
    // Let's write a log to ensure file creation works if we want to test that,
    // but strict unit test of createLogger just checks return values and side effects like dir creation.
  });

  test("should use daily rotation transport when configured", () => {
    const { logger, logFilePath } = createLogger({
      logsDir: TEST_LOGS_DIR,
      dailyRotation: true,
    });
    loggers.push(logger);

    expect(logFilePath).toBe(TEST_LOGS_DIR);
    // Check if one of the transports is DailyRotateFile
    // winston-daily-rotate-file usually exposes itself as a transport with name 'dailyRotateFile' or similar,
    // but winston transports array contains instances.
    // We can check if the transport is present.
    const hasRotateTransport = logger.transports.some((t: any) => t.constructor.name === 'DailyRotateFile');
    expect(hasRotateTransport).toBe(true);
  });

  test("helpers should call logger methods with correct categories", () => {
    const { logger, helpers } = createLogger();
    loggers.push(logger);
    // Spy on the underlying logger.log method
    // Note: winston logger.log can take multiple signatures.
    // Our helpers call: logger.log({ level: lvl, category, message, data });
    const logSpy = spyOn(logger, "log");
    
    helpers.info("UserAuth", "Login successful", { userId: 123 });
    
    expect(logSpy).toHaveBeenCalled();
    const calledArg = logSpy.mock.calls[0][0] as any;
    expect(calledArg).toMatchObject({
      level: "info",
      category: "UserAuth",
      message: "Login successful",
      data: { userId: 123 }
    });
  });

  test("child logger should pre-fill category", () => {
    const { logger, helpers } = createLogger();
    loggers.push(logger);
    const logSpy = spyOn(logger, "log");

    const userLogger = helpers.child("UserService");
    userLogger.error("Database connection failed");

    expect(logSpy).toHaveBeenCalled();
    const calledArg = logSpy.mock.calls[0][0] as any;
    expect(calledArg).toMatchObject({
      level: "error",
      category: "UserService",
      message: "Database connection failed",
    });
  });
});
