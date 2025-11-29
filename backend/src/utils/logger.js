const logLevels = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
};

const currentLogLevel = logLevels[process.env.LOG_LEVEL || 'info'] || logLevels.info;

const logger = {
  error: (...args) => {
    if (currentLogLevel >= logLevels.error) {
      console.error('[ERROR]', new Date().toISOString(), ...args);
    }
  },
  warn: (...args) => {
    if (currentLogLevel >= logLevels.warn) {
      console.warn('[WARN]', new Date().toISOString(), ...args);
    }
  },
  info: (...args) => {
    if (currentLogLevel >= logLevels.info) {
      console.log('[INFO]', new Date().toISOString(), ...args);
    }
  },
  debug: (...args) => {
    if (currentLogLevel >= logLevels.debug) {
      console.log('[DEBUG]', new Date().toISOString(), ...args);
    }
  },
};

export default logger;

