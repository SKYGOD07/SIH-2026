export class TrackingService {
  async getLiveTracking(orderId: string) {
    return {
      orderId,
      latitude: 28.6139,
      longitude: 77.209,
      speed: 48.5,
      heading: 120.0,
      updatedAt: new Date(),
      status: 'IN_TRANSIT',
      estimatedArrival: new Date(Date.now() + 45 * 60 * 1000).toISOString(),
    };
  }

  async recordTelemetry(data: {
    orderId: string;
    latitude: number;
    longitude: number;
    speed?: number;
    heading?: number;
  }) {
    return {
      id: `trk-${Date.now()}`,
      ...data,
      recordedAt: new Date(),
    };
  }
}

export const trackingService = new TrackingService();
