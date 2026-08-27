import { fetchApi } from '../lib/api';
import { ApiResponse, Order } from '../types';

export const orderService = {
  async getOrders(): Promise<ApiResponse<Order[]>> {
    return fetchApi<ApiResponse<Order[]>>('/api/orders');
  },

  async getOrderById(id: string): Promise<ApiResponse<Order>> {
    return fetchApi<ApiResponse<Order>>(`/api/orders/${id}`);
  },

  async createOrder(data: Partial<Order>): Promise<ApiResponse<Order>> {
    return fetchApi<ApiResponse<Order>>('/api/orders', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async getHealth(): Promise<{ success: boolean; message: string }> {
    return fetchApi<{ success: boolean; message: string }>('/api/health');
  },
};
