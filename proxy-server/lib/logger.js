import { env } from './env.js';

const isProd = env.NODE_ENV === 'production';

function formatLog(level, message, meta = {}) {
  const timestamp = new Date().toISOString();
  if (isProd) {
    return JSON.stringify({ timestamp, level, message, ...meta });
  }
  const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
  const emoji = level === 'error' ? '❌' : level === 'warn' ? '⚠️' : level === 'info' ? 'ℹ️' : '🔍';
  return `[${timestamp.slice(11, 19)}] ${emoji} ${level.toUpperCase()}: ${message}${metaStr}`;
}

export const logger = {
  info: (msg, meta) => console.log(formatLog('info', msg, meta)),
  warn: (msg, meta) => console.warn(formatLog('warn', msg, meta)),
  error: (msg, meta) => console.error(formatLog('error', msg, meta)),
  debug: (msg, meta) => {
    if (!isProd || process.env.LOG_LEVEL === 'debug') {
      console.log(formatLog('debug', msg, meta));
    }
  },
};
