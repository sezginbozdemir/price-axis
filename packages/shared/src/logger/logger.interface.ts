export type LogLevel = "debug" | "info" | "warn" | "error";

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: Date;
  context?: string;
  metadata?: Record<string, any>;
}

export interface Logger {
  debug(message: string, metadata?: Record<string, any>): void;
  info(message: string, metadata?: Record<string, any>): void;
  warn(message: string, metadata?: Record<string, any>): void;
  error(message: string, metadata?: Record<string, any>): void;
  log(level: LogLevel, message: string, metadata?: Record<string, any>): void;
}

export interface LoggerConfig {
  level: LogLevel;
  context?: string;
  enableConsole?: boolean;
  enableFile?: boolean;
  logDir?: string;
  maxFiles?: number;
  maxSizeMB?: number;
}
