import {
  appendFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  statSync,
  unlinkSync,
} from "fs";
import { join } from "path";
import type { Logger, LogLevel, LogEntry } from "./logger.interface";

export class FileLogger implements Logger {
  private context?: string;
  private logDir: string;
  private maxFiles: number;
  private maxSizeMB: number;
  private minLevel: LogLevel;

  private readonly levelPriority = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
  };

  constructor(
    logDir = "logs",
    minLevel: LogLevel = "info",
    context?: string,
    maxFiles = 30,
    maxSizeMB = 10,
  ) {
    this.logDir = logDir;
    this.minLevel = minLevel;
    this.context = context;
    this.maxFiles = maxFiles;
    this.maxSizeMB = maxSizeMB;
    this.ensureLogDirectory();
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

    this.writeToFile(entry);
  }

  private ensureLogDirectory(): void {
    if (!existsSync(this.logDir)) {
      mkdirSync(this.logDir, { recursive: true });
    }
  }

  private getLogFileName(date = new Date()): string {
    const dateStr = date.toISOString().split("T")[0]; // YYYY-MM-DD
    const context = this.context ? `-${this.context.toLowerCase()}` : "";
    return join(this.logDir, `app${context}-${dateStr}.log`);
  }

  private writeToFile(entry: LogEntry): void {
    const logFile = this.getLogFileName();
    const logLine = JSON.stringify(entry) + "\n";

    try {
      // Check if we need to rotate
      if (existsSync(logFile)) {
        const stats = statSync(logFile);
        const fileSizeMB = stats.size / (1024 * 1024);

        if (fileSizeMB >= this.maxSizeMB) {
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
      const context = this.context ? `-${this.context.toLowerCase()}` : "";
      const pattern = `app${context}-`;

      const logFiles = readdirSync(this.logDir)
        .filter((file) => file.startsWith(pattern) && file.endsWith(".log"))
        .map((file) => ({
          name: file,
          path: join(this.logDir, file),
          mtime: statSync(join(this.logDir, file)).mtime,
        }))
        .sort((a, b) => b.mtime.getTime() - a.mtime.getTime());

      if (logFiles.length > this.maxFiles) {
        const filesToDelete = logFiles.slice(this.maxFiles);
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

  setContext(context: string): void {
    this.context = context;
  }

  setMinLevel(level: LogLevel): void {
    this.minLevel = level;
  }
}
