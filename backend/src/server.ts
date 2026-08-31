import http from 'http';
import { createApp } from './app';
import { env } from './config/env';

const app = createApp();
const server = http.createServer(app);

const PORT = env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`==========================================`);
  console.log(`Sarthi API server running on port ${PORT}`);
  console.log(`Environment: ${env.NODE_ENV}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
  console.log(`==========================================`);
});

// Handle graceful shutdown
const gracefulShutdown = () => {
  console.log('\nReceived shutdown signal. Closing HTTP server...');
  server.close(() => {
    console.log('HTTP server closed cleanly.');
    process.exit(0);
  });
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);
