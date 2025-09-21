const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');
const { createServer } = require('http');
const { Server } = require('socket.io');
const winston = require('winston');

const deploymentRoutes = require('./routes/deployment');
const { errorHandler } = require('./middleware/errorHandler');
const { setupRedis } = require('./config/redis');
const { setupLogger } = require('./config/logger');

dotenv.config();

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.DEPLOYMENT_PORT || 3004;

// Setup logging
const logger = setupLogger();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'deployment', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/deployment', deploymentRoutes);

// Error handling
app.use(errorHandler);

// Socket.IO for real-time deployment updates
io.on('connection', (socket) => {
  logger.info(`Client connected: ${socket.id}`);

  socket.on('subscribe-deployment', (deploymentId) => {
    socket.join(`deployment-${deploymentId}`);
    logger.info(`Client ${socket.id} subscribed to deployment ${deploymentId}`);
  });

  socket.on('unsubscribe-deployment', (deploymentId) => {
    socket.leave(`deployment-${deploymentId}`);
    logger.info(`Client ${socket.id} unsubscribed from deployment ${deploymentId}`);
  });

  socket.on('disconnect', () => {
    logger.info(`Client disconnected: ${socket.id}`);
  });
});

// Start server
async function startServer() {
  try {
    // Setup Redis connection
    await setupRedis();
    logger.info('Redis connection established');

    server.listen(PORT, () => {
      logger.info(`Deployment service running on port ${PORT}`);
    });
  } catch (error) {
    logger.error('Failed to start deployment service:', error);
    process.exit(1);
  }
}

startServer();

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    logger.info('Process terminated');
    process.exit(0);
  });
});

module.exports = { app, io };