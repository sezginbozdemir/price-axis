export type LogLevel = "debug" | "info" | "warn" | "error";
export interface LogContext {
  [key: string]: any;
}

export interface LogEntry {
  source: string;
  message: string;
  timestamp: string;
  context?: LogContext;
}

export interface LoggerConfig {
  minLevel: LogLevel;
  context?: LogContext;
  enableConsole?: boolean;
  enableFile?: boolean;
  logDir: string;
  maxFiles: number;
  maxSizeMB: number;
}
export interface TimerData {
  start: number;
  label: string;
}

export const LOG_LEVELS: { [key in LogLevel]: number } = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
} as const;
