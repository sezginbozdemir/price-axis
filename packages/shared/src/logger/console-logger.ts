import {
  appendFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  statSync,
  unlinkSync,
} from "fs";
import { join } from "path";

import {
  LogContext,
  LogLevel,
  LOG_LEVELS,
  LogEntry,
  LoggerConfig,
  TimerData,
} from "./logger.interface.js";
import { env } from "@repo/env";

class ConsoleLogger {
  private source: string;
  private config: LoggerConfig;
  private timers: Map<string, TimerData>;

  private readonly colors = {
    debug: "\x1b[36m", // cyan
    info: "\x1b[34m", // blue
    warn: "\x1b[33m", // yellow
    error: "\x1b[31m", // red
    reset: "\x1b[0m",
  };

  constructor(source: string, config?: Partial<LoggerConfig>) {
    this.source = source;
    this.timers = new Map();

    // Default Config

    this.config = {
      minLevel: env.NODE_ENV === "production" ? "warn" : "debug",
      enableConsole: true,
      enableFile: false,
      logDir: "logs",
      maxSizeMB: 10,
      maxFiles: 30,
      ...config,
    };
    this.ensureLogDir();
  }

  private log(level: LogLevel, message: string, context?: LogContext): void {
    if (LOG_LEVELS[level] < LOG_LEVELS[this.config.minLevel]) {
      return;
    }

    const timestamp = new Date().toISOString();

    const entry: LogEntry = {
      timestamp,
      source: this.source,
      message,
      context,
    };

    if (this.config.enableConsole) {
      this.writeToConsole(level, entry);
    }

    if (this.config.enableFile) {
      this.writeToFile(entry);
    }
  }

  private writeToConsole(level: LogLevel, entry: LogEntry): void {
    const { timestamp, source, message, context } = entry;
    const color = this.colors[level];
    const reset = this.colors.reset;

    let prefix = `${color} [${timestamp.split("T")[1]!.replace("Z", "")}] [${source.toUpperCase()}] [${level.toUpperCase()}]${reset}`;

    let consoleMethod: (...data: any[]) => void;

    switch (level) {
      case "debug":
        consoleMethod = console.debug;
        break;
      case "info":
        consoleMethod = console.info;
        break;
      case "warn":
        consoleMethod = console.warn;
        break;
      case "error":
        consoleMethod = console.error;
        break;
      default:
        consoleMethod = console.log;
    }

    if (context && Object.keys(context).length > 0) {
      consoleMethod(`${prefix} ${message}`, context);
    } else {
      consoleMethod(`${prefix} ${message}`);
    }
  }

  private ensureLogDir(): void {
    if (!existsSync(this.config.logDir)) {
      mkdirSync(this.config.logDir, { recursive: true });
    }
  }

  private getLogFileName(): string {
    const dateStr = new Date().toISOString().split("T")[0];
    const sanitizedSource = this.source.replace(/\s+/g, "-").toLowerCase();
    return join(this.config.logDir!, `${sanitizedSource}-${dateStr}.log`);
  }

  private writeToFile(entry: LogEntry): void {
    const logFile = this.getLogFileName();
    const time = entry.timestamp.split("T")[1]!.replace("Z", "");
    const contextStr =
      entry.context && Object.keys(entry.context).length > 0
        ? ` | ${Object.entries(entry.context)
            .map(([k, v]) => `${k}=${v}`)
            .join(", ")}`
        : "";
    const logLine = `[${time}] [${entry.source.toUpperCase()}] ${entry.message}${contextStr}\n`;

    try {
      // Check if we need to rotate
      if (existsSync(logFile)) {
        const stats = statSync(logFile);
        const fileSizeMB = stats.size / (1024 * 1024);

        if (fileSizeMB >= this.config.maxSizeMB) {
          this.rotateLogFile(logFile);
        }
      }

      appendFileSync(logFile, logLine, "utf8");
    } catch (error) {
      console.error("Failed to write log file:", error);
    }
  }

  private rotateLogFile(currentLogFile: string): void {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const rotatedFile = currentLogFile.replace(".log", `-${timestamp}.log`);

    try {
      require("fs").renameSync(currentLogFile, rotatedFile);
      this.cleanupOldLogs();
    } catch (error) {
      console.error("Failed to rotate log file:", error);
    }
  }
  private cleanupOldLogs(): void {
    try {
      const logFiles = readdirSync(this.config.logDir)
        .filter((file) => file.startsWith(this.source) && file.endsWith(".log"))
        .map((file) => ({
          name: file,
          path: join(this.config.logDir, file),
          mtime: statSync(join(this.config.logDir, file)).mtime,
        }))
        .sort((a, b) => b.mtime.getTime() - a.mtime.getTime());

      if (logFiles.length > this.config.maxFiles) {
        const filesToDelete = logFiles.slice(this.config.maxFiles);
        filesToDelete.forEach((file) => {
          try {
            unlinkSync(file.path);
          } catch (error) {
            console.error(`Failed to delete log file ${file.name}:`, error);
          }
        });
      }
    } catch (error) {
      console.error("Failed to cleanup old logs:", error);
    }
  }

  public setContext(context: LogContext): void {
    this.config.context = { ...this.config.context, ...context };
  }
  public clearContext(): void {
    this.config.context = undefined;
  }

  // Log messages depending on level

  public debug(message: string, context?: LogContext): void {
    this.log("debug", message, context);
  }
  public info(message: string, context?: LogContext): void {
    this.log("info", message, context);
  }
  public warn(message: string, context?: LogContext): void {
    this.log("warn", message, context);
  }
  public error(message: string, context?: LogContext): void {
    this.log("error", message, context);
  }

  // Start a timer for performance tracking

  public startTimer(label: string): void {
    this.timers.set(label, {
      start: performance.now(),
      label,
    });
    this.debug(`Timer started: ${label}`);
  }

  // End a timer and log the duration

  public endTimer(label: string): number | null {
    const timer = this.timers.get(label);
    if (!timer) {
      this.warn(`Timer not found: ${label}`);
      return null;
    }

    const end = performance.now();
    const duration = end - timer.start;

    this.timers.delete(label);
    this.debug(`Timer ended: ${label} (${duration.toFixed(2)}ms)`);

    return duration;
  }
}

export function createLogger(
  source: string,
  config?: Partial<LoggerConfig>,
): ConsoleLogger {
  return new ConsoleLogger(source, config);
}
