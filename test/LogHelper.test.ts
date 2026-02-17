import { describe, test, expect, spyOn, beforeEach, afterEach } from "bun:test";
import { createLogHelper, configureLogger, getWinstonLogger } from "../src/index.js";

describe("createLogHelper", () => {
    beforeEach(() => {
        configureLogger({ level: 'debug' });
    });

    afterEach(() => {
        const logger = getWinstonLogger();
        logger.close();
        logger.transports.forEach((t) => {
            if (typeof (t as any).close === 'function') {
                (t as any).close();
            }
        });
    });

    test("should prefix category with title", () => {
        const log = createLogHelper("Native");
        const logSpy = spyOn(getWinstonLogger(), "log");

        log.info("Init", "Starting native module");

        expect(logSpy).toHaveBeenCalled();
        const calledArg = logSpy.mock.calls[0][0] as any;
        expect(calledArg).toMatchObject({
            level: "info",
            category: "Native/Init",
            message: "Starting native module",
        });
    });

    test("should handle empty title", () => {
        const log = createLogHelper("");
        const logSpy = spyOn(getWinstonLogger(), "log");

        log.info("Init", "Starting module");

        expect(logSpy).toHaveBeenCalled();
        const calledArg = logSpy.mock.calls[0][0] as any;
        expect(calledArg).toMatchObject({
            level: "info",
            category: "Init",
            message: "Starting module",
        });
    });

    test("should prefix child logger category", () => {
        const log = createLogHelper("Native");
        const logSpy = spyOn(getWinstonLogger(), "log");

        const child = log.child("Memory");
        child.warn("Something happened");

        expect(logSpy).toHaveBeenCalled();
        const calledArg = logSpy.mock.calls[0][0] as any;
        expect(calledArg).toMatchObject({
            level: "warn",
            category: "Native/Memory",
            message: "Something happened",
        });
    });

    test("should work with multiple levels", () => {
        const log = createLogHelper("API");
        const logSpy = spyOn(getWinstonLogger(), "log");

        log.error("DB", "Connection failed");
        log.debug("Query", "SELECT * FROM users");
        log.trace("Row", "User 1");

        expect(logSpy).toHaveBeenCalledTimes(3);

        expect(logSpy.mock.calls[0][0]).toMatchObject({
            level: "error",
            category: "API/DB",
            message: "Connection failed"
        });

        expect(logSpy.mock.calls[1][0]).toMatchObject({
            level: "debug",
            category: "API/Query",
            message: "SELECT * FROM users"
        });

        expect(logSpy.mock.calls[2][0]).toMatchObject({
            level: "trace",
            category: "API/Row",
            message: "User 1"
        });
    });

    test("multiple helpers should share the same logger", () => {
        const native = createLogHelper("Native");
        const mock = createLogHelper("NativeMock");
        const logSpy = spyOn(getWinstonLogger(), "log");

        native.info("Init", "Native starting");
        mock.info("Init", "Mock starting");

        expect(logSpy).toHaveBeenCalledTimes(2);

        expect(logSpy.mock.calls[0][0]).toMatchObject({
            category: "Native/Init",
        });
        expect(logSpy.mock.calls[1][0]).toMatchObject({
            category: "NativeMock/Init",
        });
    });

    test("configureLogger should affect all helpers", () => {
        const log = createLogHelper("Native");

        configureLogger({ level: 'error' });

        const logSpy = spyOn(getWinstonLogger(), "log");
        log.error("Init", "Error occurred");

        expect(logSpy).toHaveBeenCalled();
        const calledArg = logSpy.mock.calls[0][0] as any;
        expect(calledArg).toMatchObject({
            level: "error",
            category: "Native/Init",
            message: "Error occurred",
        });
    });
});
