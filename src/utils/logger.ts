/**
 * Logger utility for consistent logging across the application
 * Provides different log levels and formatting
 */

type LogLevel = "debug" | "info" | "warn" | "error";

interface LogContext {
  component?: string;
  action?: string;
  userId?: string;
  [key: string]: unknown;
}

class Logger {
  private isDevelopment = import.meta.env.DEV;

  /**
   * Format log message with timestamp and context
   */
  private formatMessage(
    level: LogLevel,
    message: string,
    context?: LogContext,
  ): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` | ${JSON.stringify(context)}` : "";
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${contextStr}`;
  }

  /**
   * Log debug messages (only in development)
   */
  debug(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      console.debug(this.formatMessage("debug", message, context));
    }
  }

  /**
   * Log informational messages
   */
  info(message: string, context?: LogContext): void {
    const formatted = this.formatMessage("info", message, context);
    console.info(formatted);
  }

  /**
   * Log warning messages
   */
  warn(message: string, context?: LogContext): void {
    const formatted = this.formatMessage("warn", message, context);
    console.warn(formatted);
  }

  /**
   * Log error messages
   */
  error(message: string, error?: Error | unknown, context?: LogContext): void {
    const errorDetails =
      error instanceof Error
        ? { message: error.message, stack: error.stack, name: error.name }
        : { error };

    const fullContext = { ...context, ...errorDetails };
    const formatted = this.formatMessage("error", message, fullContext);

    console.error(formatted, error);
  }

  /**
   * Log API requests
   */
  apiRequest(method: string, url: string, context?: LogContext): void {
    this.info(`API Request: ${method} ${url}`, {
      ...context,
      type: "api-request",
      method,
      url,
    });
  }

  /**
   * Log API responses
   */
  apiResponse(
    method: string,
    url: string,
    status: number,
    duration?: number,
    context?: LogContext,
  ): void {
    const logMethod = status >= 400 ? "error" : "info";
    this[logMethod](`API Response: ${method} ${url} - ${status}`, {
      ...context,
      type: "api-response",
      method,
      url,
      status,
      duration,
    });
  }

  /**
   * Log user actions
   */
  userAction(action: string, context?: LogContext): void {
    this.info(`User Action: ${action}`, {
      ...context,
      type: "user-action",
      action,
    });
  }

  /**
   * Log navigation events
   */
  navigation(from: string, to: string, context?: LogContext): void {
    this.info(`Navigation: ${from} → ${to}`, {
      ...context,
      type: "navigation",
      from,
      to,
    });
  }

  /**
   * Log performance metrics
   */
  performance(
    metric: string,
    value: number,
    unit: string = "ms",
    context?: LogContext,
  ): void {
    this.info(`Performance: ${metric} = ${value}${unit}`, {
      ...context,
      type: "performance",
      metric,
      value,
      unit,
    });
  }

  /**
   * Create a scoped logger for a specific component
   */
  createScopedLogger(componentName: string): ScopedLogger {
    return new ScopedLogger(this, componentName);
  }
}

/**
 * Scoped logger that automatically includes component name in context
 */
class ScopedLogger {
  constructor(
    private logger: Logger,
    private componentName: string,
  ) {}

  private addComponentContext(context?: LogContext): LogContext {
    return { ...context, component: this.componentName };
  }

  debug(message: string, context?: LogContext): void {
    this.logger.debug(message, this.addComponentContext(context));
  }

  info(message: string, context?: LogContext): void {
    this.logger.info(message, this.addComponentContext(context));
  }

  warn(message: string, context?: LogContext): void {
    this.logger.warn(message, this.addComponentContext(context));
  }

  error(message: string, error?: Error | unknown, context?: LogContext): void {
    this.logger.error(message, error, this.addComponentContext(context));
  }

  userAction(action: string, context?: LogContext): void {
    this.logger.userAction(action, this.addComponentContext(context));
  }

  apiRequest(method: string, url: string, context?: LogContext): void {
    this.logger.apiRequest(method, url, this.addComponentContext(context));
  }

  apiResponse(
    method: string,
    url: string,
    status: number,
    duration?: number,
    context?: LogContext,
  ): void {
    this.logger.apiResponse(
      method,
      url,
      status,
      duration,
      this.addComponentContext(context),
    );
  }

  performance(
    metric: string,
    value: number,
    unit?: string,
    context?: LogContext,
  ): void {
    this.logger.performance(
      metric,
      value,
      unit,
      this.addComponentContext(context),
    );
  }
}

// Export singleton instance
export const logger = new Logger();

// Export class for creating scoped loggers
export { Logger, ScopedLogger };
export type { LogLevel, LogContext };
