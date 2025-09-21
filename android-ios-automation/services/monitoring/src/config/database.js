const mongoose = require('mongoose');
const logger = require('./logger').setupLogger();

// Database connection
let dbConnection = null;

const setupDatabase = async () => {
  try {
    // MongoDB connection for logs and analytics
    const mongoUrl = process.env.MONGODB_URL || 'mongodb://localhost:27017/monitoring';
    
    await mongoose.connect(mongoUrl, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    logger.info('MongoDB connected successfully');
    
    // Create indexes for better performance
    await createIndexes();
    
    return mongoose.connection;
  } catch (error) {
    logger.error('Failed to connect to MongoDB:', error);
    throw error;
  }
};

// Create database indexes
const createIndexes = async () => {
  try {
    // Service Health Indexes
    await mongoose.connection.collection('servicehealth').createIndex({ service: 1, timestamp: -1 });
    await mongoose.connection.collection('servicehealth').createIndex({ timestamp: -1 });
    
    // Metrics Indexes
    await mongoose.connection.collection('metrics').createIndex({ service: 1, metric: 1, timestamp: -1 });
    await mongoose.connection.collection('metrics').createIndex({ timestamp: -1 });
    
    // Alerts Indexes
    await mongoose.connection.collection('alerts').createIndex({ severity: 1, timestamp: -1 });
    await mongoose.connection.collection('alerts').createIndex({ status: 1, timestamp: -1 });
    await mongoose.connection.collection('alerts').createIndex({ service: 1, timestamp: -1 });
    
    // Feedback Indexes
    await mongoose.connection.collection('feedback').createIndex({ source: 1, timestamp: -1 });
    await mongoose.connection.collection('feedback').createIndex({ status: 1, timestamp: -1 });
    await mongoose.connection.collection('feedback').createIndex({ timestamp: -1 });
    
    // Deployment Metrics Indexes
    await mongoose.connection.collection('deploymentmetrics').createIndex({ deploymentId: 1, timestamp: -1 });
    await mongoose.connection.collection('deploymentmetrics').createIndex({ platform: 1, channel: 1, timestamp: -1 });
    
    // System Metrics Indexes
    await mongoose.connection.collection('systemmetrics').createIndex({ timestamp: -1 });
    await mongoose.connection.collection('systemmetrics').createIndex({ metric: 1, timestamp: -1 });
    
    logger.info('Database indexes created successfully');
  } catch (error) {
    logger.error('Failed to create database indexes:', error);
    throw error;
  }
};

// Get database connection
const getDatabaseConnection = () => {
  if (!dbConnection) {
    throw new Error('Database connection not initialized');
  }
  return dbConnection;
};

// Health check for database
const checkDatabaseHealth = async () => {
  try {
    const db = mongoose.connection;
    await db.db.admin().ping();
    return { status: 'healthy', latency: Date.now() };
  } catch (error) {
    logger.error('Database health check failed:', error);
    return { status: 'unhealthy', error: error.message };
  }
};

// Close database connection
const closeDatabaseConnection = async () => {
  try {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
      logger.info('Database connection closed');
    }
  } catch (error) {
    logger.error('Failed to close database connection:', error);
    throw error;
  }
};

module.exports = {
  setupDatabase,
  getDatabaseConnection,
  checkDatabaseHealth,
  closeDatabaseConnection
};