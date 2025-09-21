const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');
const { createServer } = require('http');
const { Server } = require('socket.io');
const winston = require('winston');
const mongoose = require('mongoose');
const client = require('prom-client');

const monitoringRoutes = require('./routes/monitoring');
const feedbackRoutes = require('./routes/feedback');
const analyticsRoutes = require('./routes/analytics');
const alertsRoutes = require('./routes/alerts');
const { errorHandler } = require('./middleware/errorHandler');
const { setupLogger } = require('./config/logger');
const { setupMetrics } = require('./config/metrics');
const { setupDatabase } = require('./config/database');
const { setupRedis } = require('./config/redis');

dotenv.config();

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.MONITORING_PORT || 3005;

// Setup logging
const logger = setupLogger();

// Setup Prometheus metrics
const { register, metricsMiddleware } = setupMetrics();

// Middleware
app.use(helmet());
app.use(cors());
app.use(metricsMiddleware);
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    service: 'monitoring', 
    timestamp: new Date().toISOString(),
    metrics: register.metrics()
  });
});

// Metrics endpoint
app.get('/metrics', async (req, res) => {
  try {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (error) {
    logger.error('Error generating metrics:', error);
    res.status(500).end();
  }
});

// Routes
app.use('/api/monitoring', monitoringRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/alerts', alertsRoutes);

// Error handling
app.use(errorHandler);

// Socket.IO for real-time monitoring updates
io.on('connection', (socket) => {
  logger.info(`Client connected: ${socket.id}`);

  socket.on('subscribe-monitoring', (serviceId) => {
    socket.join(`monitoring-${serviceId}`);
    logger.info(`Client ${socket.id} subscribed to monitoring ${serviceId}`);
  });

  socket.on('subscribe-alerts', (alertType) => {
    socket.join(`alerts-${alertType}`);
    logger.info(`Client ${socket.id} subscribed to alerts ${alertType}`);
  });

  socket.on('disconnect', () => {
    logger.info(`Client disconnected: ${socket.id}`);
  });
});

// Start server
async function startServer() {
  try {
    // Setup database connections
    await setupDatabase();
    logger.info('Database connections established');

    // Setup Redis connection
    await setupRedis();
    logger.info('Redis connection established');

    // Start monitoring services
    await startMonitoringServices();

    server.listen(PORT, () => {
      logger.info(`Monitoring service running on port ${PORT}`);
    });
  } catch (error) {
    logger.error('Failed to start monitoring service:', error);
    process.exit(1);
  }
}

// Start monitoring services
async function startMonitoringServices() {
  try {
    const ApplicationMonitor = require('./services/applicationMonitor');
    const InfrastructureMonitor = require('./services/infrastructureMonitor');
    const FeedbackProcessor = require('./services/feedbackProcessor');
    const AlertManager = require('./services/alertManager');

    // Initialize monitoring services
    const appMonitor = new ApplicationMonitor(io);
    const infraMonitor = new InfrastructureMonitor(io);
    const feedbackProcessor = new FeedbackProcessor(io);
    const alertManager = new AlertManager(io);

    // Start monitoring
    await appMonitor.start();
    await infraMonitor.start();
    await feedbackProcessor.start();
    await alertManager.start();

    logger.info('All monitoring services started successfully');
  } catch (error) {
    logger.error('Failed to start monitoring services:', error);
    throw error;
  }
}

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    logger.info('Process terminated');
    process.exit(0);
  });
});

module.exports = { app, io, register };