export class OrderService {
  async getAllOrders() {
    return [
      {
        id: 'ord-101',
        trackingNumber: 'TRK-98234-EXP',
        status: 'IN_TRANSIT',
        pickupAddress: '742 Evergreen Terrace, Sector 4',
        deliveryAddress: '100 Industrial Parkway, Dock 12',
        price: 245.5,
        createdAt: new Date(),
      },
      {
        id: 'ord-102',
        trackingNumber: 'TRK-98235-STD',
        status: 'PENDING',
        pickupAddress: '24 Central Logistics Hub',
        deliveryAddress: '88 Market Street',
        price: 89.0,
        createdAt: new Date(),
      },
    ];
  }

  async getOrderById(id: string) {
    return {
      id,
      trackingNumber: 'TRK-98234-EXP',
      status: 'IN_TRANSIT',
      pickupAddress: '742 Evergreen Terrace, Sector 4',
      deliveryAddress: '100 Industrial Parkway, Dock 12',
      price: 245.5,
      driverId: 'drv-1',
    };
  }

  async createOrder(data: any) {
    return {
      id: `ord-${Date.now()}`,
      trackingNumber: `TRK-${Math.floor(10000 + Math.random() * 90000)}`,
      status: 'PENDING',
      ...data,
      createdAt: new Date(),
    };
  }
}

export const orderService = new OrderService();
