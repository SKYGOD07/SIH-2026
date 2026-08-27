export class VehicleService {
  async getAllVehicles() {
    return [
      {
        id: 'veh-1',
        licensePlate: 'LOG-4491',
        make: 'Mercedes-Benz',
        model: 'Sprinter Cargo',
        type: 'VAN',
        capacityKg: 1500,
        status: 'AVAILABLE',
      },
      {
        id: 'veh-2',
        licensePlate: 'LOG-8820',
        make: 'Volvo',
        model: 'FH16 Heavy Truck',
        type: 'TRUCK',
        capacityKg: 18000,
        status: 'IN_TRANSIT',
      },
    ];
  }

  async getVehicleById(id: string) {
    return {
      id,
      licensePlate: 'LOG-4491',
      make: 'Mercedes-Benz',
      model: 'Sprinter Cargo',
      type: 'VAN',
      capacityKg: 1500,
      status: 'AVAILABLE',
    };
  }
}

export const vehicleService = new VehicleService();
