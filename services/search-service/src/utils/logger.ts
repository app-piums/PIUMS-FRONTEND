export const logger = {
  info: (message: string, data?: any) => {
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'INFO',
      service: 'search-service',
      message,
      ...(data && { data })
    }));
  },

  // `_data` accepted for call-site compatibility with other services' loggers
  // (logger.error(message, context, data)); it is intentionally not logged here
  // to keep runtime output unchanged.
  error: (message: string, error?: any, _data?: any) => {
    console.error(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'ERROR',
      service: 'search-service',
      message,
      ...(error && {
        error: {
          message: error.message,
          stack: error.stack,
          ...error
        }
      })
    }));
  },

  warn: (message: string, data?: any) => {
    console.warn(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'WARN',
      service: 'search-service',
      message,
      ...(data && { data })
    }));
  },

  debug: (message: string, data?: any) => {
    if (process.env.LOG_LEVEL === 'debug' || process.env.NODE_ENV === 'development') {
      console.log(JSON.stringify({
        timestamp: new Date().toISOString(),
        level: 'DEBUG',
        service: 'search-service',
        message,
        ...(data && { data })
      }));
    }
  }
};
