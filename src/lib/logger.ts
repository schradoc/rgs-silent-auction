type LogLevel = 'info' | 'warn' | 'error'

interface LogContext {
  [key: string]: unknown
}

function formatLog(level: LogLevel, message: string, context?: LogContext, error?: Error) {
  const entry: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    level,
    message,
  }

  if (context) {
    entry.context = context
  }

  if (error) {
    entry.error = {
      name: error.name,
      message: error.message,
      stack: error.stack?.split('\n').slice(0, 5).join('\n'),
    }
  }

  return JSON.stringify(entry)
}

export const logger = {
  info(message: string, context?: LogContext) {
    console.log(formatLog('info', message, context))
  },

  warn(message: string, context?: LogContext) {
    console.warn(formatLog('warn', message, context))
  },

  error(message: string, error?: Error | unknown, context?: LogContext) {
    const err = error instanceof Error ? error : error ? new Error(String(error)) : undefined
    console.error(formatLog('error', message, context, err))
  },
}
