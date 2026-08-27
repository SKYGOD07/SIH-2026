export type Role = 'ADMIN' | 'DISPATCHER' | 'DRIVER' | 'CUSTOMER';

export type OrderStatus =
  | 'PENDING'
  | 'ACCEPTED'
  | 'PICKED_UP'
  | 'IN_TRANSIT'
  | 'DELIVERED'
  | 'CANCELLED';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
}

export interface Order {
  id: string;
  trackingNumber: string;
  status: OrderStatus;
  pickupAddress: string;
  deliveryAddress: string;
  price: number;
  itemDescription?: string;
  createdAt: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}
