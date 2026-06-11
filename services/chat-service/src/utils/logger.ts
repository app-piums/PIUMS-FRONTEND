const isDev = process.env.NODE_ENV !== 'production';

function emit(level: string, message: string, context?: string, data?: any) {
  if (isDev) {
    console.log(`[${level}] ${context ? `[${context}] ` : ''}${message}`, data ?? '');
  } else {
    process.stdout.write(
      JSON.stringify({ level, context, message, data, timestamp: new Date().toISOString() }) + '\n'
    );
  }
}

export const logger = {
  info:  (message: string, context?: string, data?: any) => emit('INFO',  message, context, data),
  error: (message: string, context?: string, data?: any) => emit('ERROR', message, context, data),
  warn:  (message: string, context?: string, data?: any) => emit('WARN',  message, context, data),
  debug: (message: string, context?: string, data?: any) => {
    if (isDev) emit('DEBUG', message, context, data);
  },
};
