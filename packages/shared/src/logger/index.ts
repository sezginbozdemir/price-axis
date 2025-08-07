import { ConsoleLogger } from "./console-logger";
import { FileLogger } from "./file-logger";

export * from "./console-logger";
export * from "./file-logger";
export * from "./logger.interface";

export const consoleLogger = new ConsoleLogger();
export const fileLogger = new FileLogger();
