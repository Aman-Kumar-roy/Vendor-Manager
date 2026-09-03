import { Request, Response, NextFunction } from 'express';
import { env } from '../config/env';

export function errorHandler(err: any, req: Request, res: Response, next: NextFunction): void {
  if (env.APP_DEBUG) {
    console.error('💥 [DEBUG ERROR]:', err);
  }

  const statusCode = err.status || err.statusCode || 500;
  const responsePayload: Record<string, any> = {
    success: false,
    error: env.APP_DEBUG
      ? (err.message || 'Internal Server Error')
      : (statusCode >= 500 ? 'An unexpected server error occurred.' : err.message),
  };

  if (env.APP_DEBUG && err.stack) {
    responsePayload.stack = err.stack;
  }

  res.status(statusCode).json(responsePayload);
}
