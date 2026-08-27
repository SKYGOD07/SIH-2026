export class AdminService {
  async getDashboardMetrics() {
    return {
      activeDeliveries: 42,
      totalDrivers: 18,
      availableVehicles: 12,
      onTimeDeliveryRate: '98.4%',
      revenueToday: 12450.0,
      systemHealth: 'OPERATIONAL',
    };
  }

  async getAuditLogs() {
    return [
      {
        id: 'log-1',
        action: 'ORDER_DISPATCHED',
        targetId: 'ord-101',
        performedBy: 'usr-admin-1',
        timestamp: new Date(),
      },
    ];
  }
}

export const adminService = new AdminService();
