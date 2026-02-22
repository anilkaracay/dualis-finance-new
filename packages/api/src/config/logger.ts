import pino from 'pino';
import { env } from './env.js';

export const logger = pino({
  level: env.LOG_LEVEL,
  ...(env.NODE_ENV === 'development'
    ? {
        transport: {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'HH:MM:ss',
            ignore: 'pid,hostname',
          },
        },
      }
    : {}),
  serializers: {
    req(req) {
      return {
        method: req.method,
        url: req.url,
        remoteAddress: req.remoteAddress,
      };
    },
    res(res) {
      return {
        statusCode: res.statusCode,
      };
    },
  },
  redact: {
    paths: ['req.headers.authorization', 'req.headers["x-api-key"]'],
    censor: '[REDACTED]',
  },
});

export function createChildLogger(name: string) {
  return logger.child({ module: name });
}
