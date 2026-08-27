import { Router } from 'express';
import { z } from 'zod';
import { orderController } from '../controllers/order.controller';
import { validateRequest } from '../middleware/validate';

const router = Router();

const createOrderSchema = z.object({
  body: z.object({
    pickupAddress: z.string().min(1, 'Pickup address is required'),
    deliveryAddress: z.string().min(1, 'Delivery address is required'),
    itemDescription: z.string().optional(),
    weightKg: z.number().positive().optional(),
    price: z.number().positive().optional(),
  }),
});

router.get('/', orderController.getAllOrders);
router.get('/:id', orderController.getOrderById);
router.post('/', validateRequest(createOrderSchema), orderController.createOrder);

export default router;
