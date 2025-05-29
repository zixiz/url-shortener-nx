// apps/url-service/src/config/logger.ts
import winston from 'winston';

const { combine, timestamp, printf, colorize, align } = winston.format;

const logFormat = printf(({ level, message, timestamp: ts, ...metadata }) => {
  let msg = `${ts} [${level}]: ${message} `;
  if (metadata && Object.keys(metadata).length) {
    const metaString = JSON.stringify(metadata);
    if (metaString !== '{}') {
      msg += metaString;
    }
  }
  return msg;
});

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: combine(
    colorize(),
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    align(),
    logFormat
  ),
  transports: [
    new winston.transports.Console(),
  ],
  defaultMeta: { service: 'url-service' }, 
});