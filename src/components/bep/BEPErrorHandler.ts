/**
 * Centralized error handling and logging for BEP operations
 */

export interface BEPError {
  code: string
  message: string
  context?: Record<string, unknown>
  timestamp: string
  severity: 'low' | 'medium' | 'high' | 'critical'
}

export interface BEPLogEntry {
  level: 'debug' | 'info' | 'warn' | 'error'
  action: string
  message: string
  context: Record<string, unknown>
  timestamp: string
  projectId?: string
  userId?: string
}

class BEPErrorHandler {
  private logs: BEPLogEntry[] = []
  private maxLogs = 1000

  /**
   * Log an action with context
   */
  log(level: BEPLogEntry['level'], action: string, message: string, context: Record<string, unknown> = {}) {
    const entry: BEPLogEntry = {
      level,
      action,
      message,
      context,
      timestamp: new Date().toISOString(),
      projectId: context.projectId,
      userId: context.userId
    }

    this.logs.push(entry)
    
    // Keep only recent logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs)
    }

    // Console output for development
    const logMethod = level === 'error' ? 'error' : level === 'warn' ? 'warn' : 'log'
    console[logMethod](`[BEP-${action}]`, entry)

    return entry
  }

  /**
   * Handle and log errors with proper categorization
   */
  handleError(error: Error | string, action: string, context: Record<string, unknown> = {}): BEPError {
    const errorMessage = error instanceof Error ? error.message : error
    const errorStack = error instanceof Error ? error.stack : undefined

    let severity: BEPError['severity'] = 'medium'
    let code = 'UNKNOWN_ERROR'

    // Categorize errors
    if (errorMessage.includes('access') || errorMessage.includes('permission')) {
      severity = 'high'
      code = 'ACCESS_DENIED'
    } else if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
      severity = 'medium'
      code = 'NETWORK_ERROR'
    } else if (errorMessage.includes('validation')) {
      severity = 'low'
      code = 'VALIDATION_ERROR'
    } else if (errorMessage.includes('database') || errorMessage.includes('supabase')) {
      severity = 'high'
      code = 'DATABASE_ERROR'
    } else if (errorMessage.includes('pdf') || errorMessage.includes('export')) {
      severity = 'medium'
      code = 'EXPORT_ERROR'
    }

    const bepError: BEPError = {
      code,
      message: errorMessage,
      context: {
        ...context,
        stack: errorStack,
        userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined
      },
      timestamp: new Date().toISOString(),
      severity
    }

    this.log('error', action, errorMessage, bepError.context)

    return bepError
  }

  /**
   * Get recent logs for debugging
   */
  getRecentLogs(count = 50): BEPLogEntry[] {
    return this.logs.slice(-count)
  }

  /**
   * Get logs for a specific project
   */
  getProjectLogs(projectId: string, count = 50): BEPLogEntry[] {
    return this.logs
      .filter(log => log.projectId === projectId)
      .slice(-count)
  }

  /**
   * Clear logs (for memory management)
   */
  clearLogs() {
    this.logs = []
  }

  /**
   * Export logs for debugging
   */
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2)
  }

  /**
   * Get error summary for diagnostics
   */
  getErrorSummary(timeWindowMs = 60000): {
    totalErrors: number
    errorsByCode: Record<string, number>
    recentErrors: BEPError[]
  } {
    const cutoff = new Date(Date.now() - timeWindowMs).toISOString()
    const recentErrorLogs = this.logs.filter(
      log => log.level === 'error' && log.timestamp > cutoff
    )

    const errorsByCode: Record<string, number> = {}
    const recentErrors: BEPError[] = []

    recentErrorLogs.forEach(log => {
      const code = log.context.code || 'UNKNOWN'
      errorsByCode[code] = (errorsByCode[code] || 0) + 1
      
      if (log.context.code) {
        recentErrors.push({
          code: log.context.code,
          message: log.message,
          context: log.context,
          timestamp: log.timestamp,
          severity: log.context.severity || 'medium'
        })
      }
    })

    return {
      totalErrors: recentErrorLogs.length,
      errorsByCode,
      recentErrors: recentErrors.slice(-10) // Last 10 errors
    }
  }
}

// Singleton instance
export const bepErrorHandler = new BEPErrorHandler()

/**
 * Utility function for consistent error handling in BEP components
 */
export function withBEPErrorHandling<T extends unknown[], R>(
  fn: (...args: T) => R | Promise<R>,
  action: string,
  context: Record<string, unknown> = {}
) {
  return async (...args: T): Promise<R> => {
    try {
      bepErrorHandler.log('debug', action, 'Starting operation', context)
      const result = await fn(...args)
      bepErrorHandler.log('info', action, 'Operation completed successfully', context)
      return result
    } catch (error) {
      const bepError = bepErrorHandler.handleError(error as Error, action, context)
      throw new Error(bepError.message)
    }
  }
}

/**
 * Retry mechanism with exponential backoff
 */
export async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 1000,
  action = 'RETRY_OPERATION'
): Promise<T> {
  let lastError: Error

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      bepErrorHandler.log('debug', action, `Attempt ${attempt}/${maxRetries}`, { attempt })
      return await operation()
    } catch (error) {
      lastError = error as Error
      
      if (attempt === maxRetries) {
        bepErrorHandler.handleError(lastError, action, { 
          finalAttempt: true, 
          totalAttempts: attempt 
        })
        throw lastError
      }

      const delay = baseDelay * Math.pow(2, attempt - 1)
      bepErrorHandler.log('warn', action, `Attempt ${attempt} failed, retrying in ${delay}ms`, {
        attempt,
        error: lastError.message,
        nextDelay: delay
      })

      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }

  throw lastError!
}
