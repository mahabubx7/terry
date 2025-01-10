import { Request, Response, NextFunction } from 'express';
import logger from '../config/logger';

export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  const { method, originalUrl } = req;
  let logged = false;

  // Log request
  logger.info(`📥 ${method} ${originalUrl}`);

  // Intercept response to log its details
  const oldJson = res.json;
  const oldSend = res.send;

  res.json = function(body) {
    const result = oldJson.call(this, body);
    if (!logged) {
      const duration = Date.now() - start;
      logger.info(`📤 ${method} ${originalUrl} ${res.statusCode} ${duration}ms`);
      logged = true;
    }
    return result;
  };

  res.send = function(body) {
    const result = oldSend.call(this, body);
    if (!logged) {
      const duration = Date.now() - start;
      const contentLength = body ? body.length : 0;
      logger.info(`📤 ${method} ${originalUrl} ${res.statusCode} ${duration}ms ${contentLength}b`);
      logged = true;
    }
    return result;
  };

  next();
};

export const errorLogger = (err: any, req: Request, res: Response, next: NextFunction) => {
  logger.error(`❌ ${req.method} ${req.originalUrl} ${err.status || 500} - ${err.message}`);
  logger.error(err.stack);
  next(err);
}; 