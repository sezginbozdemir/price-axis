import type { Logger, LogLevel, LogEntry } from "./logger.interface";

export class ConsoleLogger implements Logger {
  private context?: string;
  private minLevel: LogLevel;

  private readonly levelPriority = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
  };

  private readonly colors = {
    debug: "\x1b[36m", // cyan
    info: "\x1b[34m", // blue
    warn: "\x1b[33m", // yellow
    error: "\x1b[31m", // red
    reset: "\x1b[0m",
  };

  constructor(minLevel: LogLevel = "info", context?: string) {
    this.minLevel = minLevel;
    this.context = context;
  }

  debug(message: string, metadata?: Record<string, any>): void {
    this.log("debug", message, metadata);
  }

  info(message: string, metadata?: Record<string, any>): void {
    this.log("info", message, metadata);
  }

  warn(message: string, metadata?: Record<string, any>): void {
    this.log("warn", message, metadata);
  }

  error(message: string, metadata?: Record<string, any>): void {
    this.log("error", message, metadata);
  }

  log(level: LogLevel, message: string, metadata?: Record<string, any>): void {
    if (this.levelPriority[level] < this.levelPriority[this.minLevel]) {
      return;
    }

    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date(),
      context: this.context,
      metadata,
    };

    this.writeToConsole(entry);
  }

  private writeToConsole(entry: LogEntry): void {
    const timestamp = entry.timestamp.toISOString();
    const level = entry.level.toUpperCase().padEnd(5);
    const context = entry.context ? `[${entry.context}]` : "";
    const color = this.colors[entry.level];
    const reset = this.colors.reset;

    let logMessage = `${color}${timestamp} ${level}${reset} ${context} ${entry.message}`;

    if (entry.metadata && Object.keys(entry.metadata).length > 0) {
      logMessage += `\n${color}Metadata:${reset} ${JSON.stringify(entry.metadata, null, 2)}`;
    }

    // Use appropriate console method
    switch (entry.level) {
      case "error":
        console.error(logMessage);
        break;
      case "warn":
        console.warn(logMessage);
        break;
      case "debug":
        console.debug(logMessage);
        break;
      default:
        console.log(logMessage);
    }
  }

  setContext(context: string): void {
    this.context = context;
  }

  setMinLevel(level: LogLevel): void {
    this.minLevel = level;
  }
}
