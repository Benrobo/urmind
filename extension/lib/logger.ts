/**
 * @description Logger for UrMind Extension
 * Provides methods for logging with options for global logging and labels.
 * By default, logs are shown only in development mode.
 * Can be configured to log globally or with specific labels.
 */

type LogLevel = "log" | "warn" | "error" | "info";

interface LoggerOptions {
  global?: boolean;
  label?: string;
}

const isDev =
  import.meta.env?.MODE === "development" ||
  process.env?.NODE_ENV === "development";

function baseLogger(
  level: LogLevel,
  options: LoggerOptions,
  ...args: unknown[]
) {
  const { global = false, label } = options;
  if (isDev || global) {
    const prefix = label ? `[${label}]` : "[UrMind]";

    // Capture stack trace
    const err = new Error();
    let location = "";

    if (err.stack) {
      const stackLines = err.stack.split("\n");
      // The 3rd stack line is usually the caller
      // stackLines[0] = "Error"
      // stackLines[1] = "at baseLogger ..."
      // stackLines[2] = "at Object.loggerFn ..."
      // stackLines[3] = "at <CALLER> ..."
      const callerLine = stackLines[3] || stackLines[2];
      if (callerLine) {
        // Extract file:line:col
        const match = callerLine.match(/\((.*)\)/);
        if (match && match[1]) {
          location = match[1];
        } else {
          // fallback: try to extract from "at file:line:col"
          const altMatch = callerLine.match(/at (.*)/);
          if (altMatch && altMatch[1]) {
            location = altMatch[1];
          }
        }
      }
    }

    const filename = location.split("/").pop();

    // eslint-disable-next-line no-console
    console[level](`${prefix}${location ? ` [/${filename}]` : ""}`, ...args);
  }
}

function createLoggerMethod(level: LogLevel) {
  let methodOptions: LoggerOptions = {};

  const loggerFn = (...args: unknown[]) => {
    baseLogger(level, methodOptions, ...args);
  };

  loggerFn.setConfig = (options: LoggerOptions) => {
    methodOptions = { ...methodOptions, ...options };
    return loggerFn;
  };

  loggerFn.setLabel = (label: string) => {
    methodOptions.label = label;
    return loggerFn;
  };

  return loggerFn as typeof loggerFn & {
    setConfig: (options: LoggerOptions) => typeof loggerFn;
    setLabel: (label: string) => typeof loggerFn;
  };
}

const logger = {
  log: createLoggerMethod("log"),
  warn: createLoggerMethod("warn"),
  error: createLoggerMethod("error"),
  info: createLoggerMethod("info"),
};

// CORRECT: Configure first, then call
// logger.log.setConfig({ override: true }).setLabel("Logger Initialized")(
//   "Context Keeper Logger is ready"
// );

// Alternative approaches:
// Option 1: Chain configuration then call
// logger.log.setConfig({ override: true }).setLabel("Logger Initialized")(
//   "Context Keeper Logger is ready"
// );

// Option 2: Configure once and reuse
// const configuredLogger = logger.log.setConfig({ override: true });
// configuredLogger("Context Keeper Logger is ready");

// Option 3: Create a specialized logger
// const initLogger = logger.log.setLabel("Init");
// initLogger("Context Keeper Logger is ready");

export default logger;
