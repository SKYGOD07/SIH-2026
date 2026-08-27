import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { GeolocationPayload } from '../types';
import { trackingService } from '../services/tracking.service';

export function initializeSocket(httpServer: HttpServer, clientUrl: string): Server {
  const io = new Server(httpServer, {
    cors: {
      origin: clientUrl || '*',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  io.on('connection', (socket: Socket) => {
    console.log(`[Socket.IO] Client connected: ${socket.id}`);

    // Join room for a specific order to receive tracking updates
    socket.on('join:order', (orderId: string) => {
      socket.join(`order:${orderId}`);
      console.log(`[Socket.IO] Socket ${socket.id} joined order:${orderId}`);
      socket.emit('joined', { orderId, success: true });
    });

    // Leave room
    socket.on('leave:order', (orderId: string) => {
      socket.leave(`order:${orderId}`);
      console.log(`[Socket.IO] Socket ${socket.id} left order:${orderId}`);
    });

    // Driver location update stream
    socket.on('update:location', async (data: GeolocationPayload) => {
      const { orderId, latitude, longitude, speed, heading } = data;

      try {
        // Record telemetry point
        await trackingService.recordTelemetry({
          orderId,
          latitude,
          longitude,
          speed,
          heading,
        });

        // Broadcast to all clients watching this order
        io.to(`order:${orderId}`).emit('order:location_updated', {
          orderId,
          latitude,
          longitude,
          speed,
          heading,
          timestamp: new Date().toISOString(),
        });
      } catch (err) {
        console.error('[Socket.IO] Failed to process telemetry update:', err);
      }
    });

    socket.on('disconnect', () => {
      console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
    });
  });

  return io;
}
