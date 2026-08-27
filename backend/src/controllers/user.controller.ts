import { Request, Response, NextFunction } from 'express';
import { userService } from '../services/user.service';
import { sendSuccess } from '../utils/response';

export class UserController {
  async getAllUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const users = await userService.getAllUsers();
      return sendSuccess(res, users, 'Users fetched successfully');
    } catch (err) {
      return next(err);
    }
  }

  async getUserById(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await userService.getUserById(req.params.id);
      return sendSuccess(res, user, 'User details fetched successfully');
    } catch (err) {
      return next(err);
    }
  }
}

export const userController = new UserController();
