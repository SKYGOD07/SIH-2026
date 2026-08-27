export class DriverService {
  async getAllDrivers() {
    return [
      {
        id: 'drv-1',
        licenseNumber: 'DL-987654321',
        isAvailable: true,
        vehicleId: 'veh-1',
        user: {
          firstName: 'Robert',
          lastName: 'Smith',
          phone: '+1-555-0199',
        },
      },
    ];
  }

  async getDriverById(id: string) {
    return {
      id,
      licenseNumber: 'DL-987654321',
      isAvailable: true,
      vehicleId: 'veh-1',
    };
  }

  async updateAvailability(id: string, isAvailable: boolean) {
    return {
      id,
      isAvailable,
      updatedAt: new Date(),
    };
  }
}

export const driverService = new DriverService();
