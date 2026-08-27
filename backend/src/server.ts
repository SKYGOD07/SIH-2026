import http from 'http';
import { createApp } from './app';
import { env } from './config/env';
import { initializeSocket } from './socket';

const app = createApp();
const server = http.createServer(app);

// Attach Socket.IO
const io = initializeSocket(server, env.CLIENT_URL);

const PORT = env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`==========================================`);
  console.log(`🚀 Logistics API Server running on port ${PORT}`);
  console.log(`🌐 Environment: ${env.NODE_ENV}`);
  console.log(`📡 Health Check: http://localhost:${PORT}/api/health`);
  console.log(`⚡ Socket.IO Ready`);
  console.log(`==========================================`);
});

// Handle graceful shutdown
const gracefulShutdown = () => {
  console.log('\nReceived shutdown signal. Closing HTTP server & socket connections...');
  io.close(() => {
    server.close(() => {
      console.log('HTTP Server closed cleanly.');
      process.exit(0);
    });
  });
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);
