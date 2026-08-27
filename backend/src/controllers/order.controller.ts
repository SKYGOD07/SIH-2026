import { Request, Response, NextFunction } from 'express';
import { orderService } from '../services/order.service';
import { sendSuccess } from '../utils/response';

export class OrderController {
  async getAllOrders(req: Request, res: Response, next: NextFunction) {
    try {
      const orders = await orderService.getAllOrders();
      return sendSuccess(res, orders, 'Orders fetched successfully');
    } catch (err) {
      return next(err);
    }
  }

  async getOrderById(req: Request, res: Response, next: NextFunction) {
    try {
      const order = await orderService.getOrderById(req.params.id);
      return sendSuccess(res, order, 'Order fetched successfully');
    } catch (err) {
      return next(err);
    }
  }

  async createOrder(req: Request, res: Response, next: NextFunction) {
    try {
      const newOrder = await orderService.createOrder(req.body);
      return sendSuccess(res, newOrder, 'Order created successfully', 201);
    } catch (err) {
      return next(err);
    }
  }
}

export const orderController = new OrderController();
