import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service';
import { sendSuccess } from '../utils/response';

export class AuthController {
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.register(req.body);
      return sendSuccess(res, result, 'User registered successfully', 201);
    } catch (err) {
      return next(err);
    }
  }

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.login(req.body);
      return sendSuccess(res, result, 'Logged in successfully');
    } catch (err) {
      return next(err);
    }
  }

  async getSession(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id || 'mock-user-id';
      const result = await authService.getSession(userId);
      return sendSuccess(res, result, 'Session retrieved successfully');
    } catch (err) {
      return next(err);
    }
  }
}

export const authController = new AuthController();
