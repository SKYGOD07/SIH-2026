import { Request, Response, NextFunction } from 'express';
import { AppError } from './errorHandler';
import { AuthenticatedUser } from '../types';

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export const authenticate = (req: Request, _res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new AppError('Authorization header missing or invalid', 401));
  }

  // Placeholder token validation for hackathon starter
  const token = authHeader.split(' ')[1];
  if (!token) {
    return next(new AppError('Authentication token required', 401));
  }

  // Mock authenticated user object until real JWT decoding logic is added
  req.user = {
    id: 'mock-user-id',
    email: 'user@example.com',
    role: 'ADMIN',
  };

  return next();
};

export const requireRole = (roles: Array<'ADMIN' | 'DISPATCHER' | 'DRIVER' | 'CUSTOMER'>) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new AppError('Access denied: insufficient permissions', 403));
    }
    return next();
  };
};
