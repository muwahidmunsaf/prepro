// Debug utility for conditional logging based on environment variables

const isDebugMode = import.meta.env.VITE_DEBUG_MODE === 'true';
const enableConsoleLogs = import.meta.env.VITE_ENABLE_CONSOLE_LOGS === 'true';
const enablePerformanceLogs = import.meta.env.VITE_ENABLE_PERFORMANCE_LOGS === 'true';
const isProduction = import.meta.env.VITE_APP_ENVIRONMENT === 'production';

export const debug = {
  // General debug logging
  log: (...args: any[]) => {
    if (isDebugMode && enableConsoleLogs && !isProduction) {
      console.log(...args);
    }
  },

  // Error logging (always enabled)
  error: (...args: any[]) => {
    console.error(...args);
  },

  // Warning logging (always enabled)
  warn: (...args: any[]) => {
    console.warn(...args);
  },

  // Performance logging
  performance: (...args: any[]) => {
    if (enablePerformanceLogs && !isProduction) {
      console.log('[PERFORMANCE]', ...args);
    }
  },

  // Question-related debug logging
  questions: (...args: any[]) => {
    if (isDebugMode && enableConsoleLogs && !isProduction) {
      console.log('[QUESTIONS]', ...args);
    }
  },

  // Test-related debug logging
  test: (...args: any[]) => {
    if (isDebugMode && enableConsoleLogs && !isProduction) {
      console.log('[TEST]', ...args);
    }
  },

  // Database-related debug logging
  database: (...args: any[]) => {
    if (isDebugMode && enableConsoleLogs && !isProduction) {
      console.log('[DATABASE]', ...args);
    }
  },

  // Group logging for better organization
  group: (label: string, fn: () => void) => {
    if (isDebugMode && enableConsoleLogs && !isProduction) {
      console.group(label);
      fn();
      console.groupEnd();
    } else {
      fn();
    }
  },

  // Time measurement
  time: (label: string) => {
    if (enablePerformanceLogs && !isProduction) {
      console.time(label);
    }
  },

  timeEnd: (label: string) => {
    if (enablePerformanceLogs && !isProduction) {
      console.timeEnd(label);
    }
  }
};

// Export environment info for debugging
export const envInfo = {
  isDebugMode,
  enableConsoleLogs,
  enablePerformanceLogs,
  isProduction,
  environment: import.meta.env.VITE_APP_ENVIRONMENT || 'development'
};

// Log environment info on app start (only in development)
if (isDebugMode && !isProduction) {
  debug.log('🔧 Debug mode enabled', envInfo);
}
