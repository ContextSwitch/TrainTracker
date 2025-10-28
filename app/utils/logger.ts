/**
 * Centralized logging utility for the TrainTracker application
 * Provides structured logging with environment-based log levels
 */

export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3
}

interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  context?: string;
  data?: any;
}

class Logger {
  private logLevel: LogLevel;
  private isDevelopment: boolean;

  constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development';
    this.logLevel = this.isDevelopment ? LogLevel.DEBUG : LogLevel.ERROR;
  }

  private formatMessage(level: LogLevel, message: string, context?: string, data?: any): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level: LogLevel[level],
      message,
      context,
      data
    };
  }

  private shouldLog(level: LogLevel): boolean {
    return level <= this.logLevel;
  }

  private output(logEntry: LogEntry): void {
    if (this.isDevelopment) {
      // In development, use console for immediate feedback
      const contextStr = logEntry.context ? `[${logEntry.context}] ` : '';
      const dataStr = logEntry.data ? ` ${JSON.stringify(logEntry.data)}` : '';
      
      switch (logEntry.level) {
        case 'ERROR':
          console.error(`${logEntry.timestamp} ERROR: ${contextStr}${logEntry.message}${dataStr}`);
          break;
        case 'WARN':
          console.warn(`${logEntry.timestamp} WARN: ${contextStr}${logEntry.message}${dataStr}`);
          break;
        case 'INFO':
          console.info(`${logEntry.timestamp} INFO: ${contextStr}${logEntry.message}${dataStr}`);
          break;
        case 'DEBUG':
          console.log(`${logEntry.timestamp} DEBUG: ${contextStr}${logEntry.message}${dataStr}`);
          break;
      }
    } else {
      // In production, only log errors to console, others could go to external service
      if (logEntry.level === 'ERROR') {
        console.error(JSON.stringify(logEntry));
      }
      // TODO: In future, send to external logging service (CloudWatch, etc.)
    }
  }

  error(message: string, context?: string, data?: any): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      this.output(this.formatMessage(LogLevel.ERROR, message, context, data));
    }
  }

  warn(message: string, context?: string, data?: any): void {
    if (this.shouldLog(LogLevel.WARN)) {
      this.output(this.formatMessage(LogLevel.WARN, message, context, data));
    }
  }

  info(message: string, context?: string, data?: any): void {
    if (this.shouldLog(LogLevel.INFO)) {
      this.output(this.formatMessage(LogLevel.INFO, message, context, data));
    }
  }

  debug(message: string, context?: string, data?: any): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      this.output(this.formatMessage(LogLevel.DEBUG, message, context, data));
    }
  }

  // Convenience methods for common use cases
  apiRequest(method: string, path: string, data?: any): void {
    this.info(`${method} ${path}`, 'API', data);
  }

  apiError(method: string, path: string, error: any): void {
    this.error(`${method} ${path} failed`, 'API', error);
  }

  scrapeStart(trainId: string, source: string): void {
    this.info(`Starting scrape for train #${trainId}`, 'SCRAPER', { source });
  }

  scrapeSuccess(trainId: string, count: number): void {
    this.info(`Successfully scraped train #${trainId}`, 'SCRAPER', { statusCount: count });
  }

  scrapeError(trainId: string, error: any): void {
    this.error(`Failed to scrape train #${trainId}`, 'SCRAPER', error);
  }

  authAttempt(username: string): void {
    this.info(`Authentication attempt`, 'AUTH', { username });
  }

  authSuccess(username: string): void {
    this.info(`Authentication successful`, 'AUTH', { username });
  }

  authFailure(username: string, reason: string): void {
    this.warn(`Authentication failed`, 'AUTH', { username, reason });
  }
}

// Export singleton instance
export const logger = new Logger();

// Export convenience functions for easier migration
export const logError = (message: string, context?: string, data?: any) => logger.error(message, context, data);
export const logWarn = (message: string, context?: string, data?: any) => logger.warn(message, context, data);
export const logInfo = (message: string, context?: string, data?: any) => logger.info(message, context, data);
export const logDebug = (message: string, context?: string, data?: any) => logger.debug(message, context, data);
