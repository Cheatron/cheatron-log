import winston from 'winston';

/**
 * Pretty console format
 * Output: `HH:mm:ss.SSS LEVEL [Category]: message`
 * Includes stack traces and JSON data when present
 */
export const prettyConsole = winston.format.printf(({ level, message, category, data, stack, timestamp }) => {
    const cat = category ? ` [${category}]` : '';
    let extra = '';

    if (stack) {
        extra += `\n${stack}`;
    }

    if (data) {
        const d = data as Record<string, unknown>;
        if (typeof d === 'object' && d !== null && d.stack && typeof d.stack === 'string') {
            extra += `\n${d.stack}`;
            const { stack: _, ...rest } = d;
            if (Object.keys(rest).length > 0) {
                extra += `\n${JSON.stringify(rest, null, 2)}`;
            }
        } else {
            extra += `\n${JSON.stringify(data, null, 2)}`;
        }
    }

    return `${timestamp} ${level}${cat}: ${message}${extra}`;
});

/**
 * JSONL (JSON Lines) format for file logging
 * One JSON object per line — easy to parse and tail
 */
export const jsonLine = winston.format.printf(info => {
    const { timestamp, level, category, message, data, stack } = info;
    const logObj: Record<string, unknown> = { timestamp, level, category, message };
    if (data) logObj.data = data;
    if (stack) logObj.stack = stack;
    return JSON.stringify(logObj);
});
