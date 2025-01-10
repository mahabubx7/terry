import pino from 'pino';
import env from './env';

const logger = pino({
  level: env.LOG_LEVEL,
  transport: env.PRETTY_LOGGING
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          levelFirst: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname',
        },
      }
    : undefined,
});

export default logger; 