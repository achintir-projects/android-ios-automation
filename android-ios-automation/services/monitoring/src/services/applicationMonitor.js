const mongoose = require('mongoose');
const { createChildLogger } = require('../config/logger');
const { cacheOperations, pubSubOperations } = require('../config/redis');
const { incrementCounter, setGauge } = require('../config/metrics');

const logger = createChildLogger('application-monitor');

// Application Performance Monitoring Schema
const AppPerformanceSchema = new mongoose.Schema({
  appId: { type: String, required: true, index: true },
  platform: { type: String, required: true, enum: ['android', 'ios', 'web'] },
  version: { type: String, required: true },
  buildNumber: { type: String, required: true },
  
  // Performance metrics
  loadTime: { type: Number, required: true }, // in milliseconds
  memoryUsage: { type: Number, required: true }, // in bytes
  cpuUsage: { type: Number, required: true }, // percentage
  networkRequests: { type: Number, default: 0 },
  crashes: { type: Number, default: 0 },
  anrs: { type: Number, default: 0 }, // Application Not Responding
  
  // User experience metrics
  sessionDuration: { type: Number, default: 0 }, // in seconds
  screenViews: { type: Number, default: 0 },
  userActions: { type: Number, default: 0 },
  
  // Error tracking
  errors: [{
    type: { type: String, required: true },
    message: { type: String, required: true },
    stack: { type: String },
    timestamp: { type: Date, default: Date.now },
    userId: { type: String },
    deviceInfo: { type: Object }
  }],
  
  // Device information
  deviceInfo: {
    model: { type: String },
    manufacturer: { type: String },
    osVersion: { type: String },
    screenResolution: { type: String },
    carrier: { type: String },
    connectionType: { type: String }
  },
  
  // Location data
  location: {
    country: { type: String },
    city: { type: String },
    timezone: { type: String }
  },
  
  // Metadata
  timestamp: { type: Date, default: Date.now, index: true },
  userId: { type: String, index: true },
  sessionId: { type: String, index: true }
});

// Create indexes
AppPerformanceSchema.index({ appId: 1, timestamp: -1 });
AppPerformanceSchema.index({ platform: 1, timestamp: -1 });
AppPerformanceSchema.index({ userId: 1, timestamp: -1 });

const AppPerformance = mongoose.model('AppPerformance', AppPerformanceSchema);

class ApplicationMonitor {
  constructor(io) {
    this.io = io;
    this.isRunning = false;
    this.monitoringInterval = null;
    this.performanceCache = new Map();
  }

  async start() {
    try {
      logger.info('Starting Application Monitor...');
      
      // Start periodic monitoring
      this.startPeriodicMonitoring();
      
      // Start real-time monitoring
      this.startRealTimeMonitoring();
      
      // Start performance aggregation
      this.startPerformanceAggregation();
      
      this.isRunning = true;
      logger.info('Application Monitor started successfully');
    } catch (error) {
      logger.error('Failed to start Application Monitor:', error);
      throw error;
    }
  }

  async stop() {
    try {
      logger.info('Stopping Application Monitor...');
      
      if (this.monitoringInterval) {
        clearInterval(this.monitoringInterval);
      }
      
      this.isRunning = false;
      logger.info('Application Monitor stopped successfully');
    } catch (error) {
      logger.error('Failed to stop Application Monitor:', error);
      throw error;
    }
  }

  // Start periodic monitoring
  startPeriodicMonitoring() {
    this.monitoringInterval = setInterval(async () => {
      try {
        await this.collectPerformanceMetrics();
        await this.checkPerformanceThresholds();
        await this.cleanupOldData();
      } catch (error) {
        logger.error('Error in periodic monitoring:', error);
      }
    }, 30000); // Every 30 seconds
  }

  // Start real-time monitoring
  startRealTimeMonitoring() {
    // Subscribe to performance updates from Redis
    pubSubOperations.subscribe('app-performance', (data) => {
      this.handleRealTimePerformance(data);
    });
    
    // Subscribe to error reports
    pubSubOperations.subscribe('app-errors', (data) => {
      this.handleRealTimeError(data);
    });
  }

  // Start performance aggregation
  startPerformanceAggregation() {
    setInterval(async () => {
      try {
        await this.aggregatePerformanceMetrics();
        await this.generatePerformanceReports();
      } catch (error) {
        logger.error('Error in performance aggregation:', error);
      }
    }, 300000); // Every 5 minutes
  }

  // Collect performance metrics
  async collectPerformanceMetrics() {
    try {
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
      
      // Get recent performance data
      const recentPerformance = await AppPerformance.find({
        timestamp: { $gte: oneHourAgo }
      }).sort({ timestamp: -1 });
      
      // Calculate aggregates
      const aggregates = this.calculatePerformanceAggregates(recentPerformance);
      
      // Update metrics
      setGauge('systemMemoryUsage', aggregates.avgMemoryUsage);
      setGauge('systemCpuUsage', aggregates.avgCpuUsage);
      
      // Cache aggregates
      await cacheOperations.set('performance-aggregates', aggregates, 300); // 5 minutes
      
      // Emit real-time updates
      this.io.emit('performance-update', {
        timestamp: now.toISOString(),
        aggregates
      });
      
      logger.debug('Performance metrics collected successfully');
    } catch (error) {
      logger.error('Error collecting performance metrics:', error);
    }
  }

  // Calculate performance aggregates
  calculatePerformanceAggregates(performanceData) {
    if (!performanceData || performanceData.length === 0) {
      return {
        totalApps: 0,
        avgLoadTime: 0,
        avgMemoryUsage: 0,
        avgCpuUsage: 0,
        totalCrashes: 0,
        totalErrors: 0,
        crashRate: 0,
        errorRate: 0
      };
    }
    
    const totalApps = new Set(performanceData.map(p => p.appId)).size;
    const avgLoadTime = performanceData.reduce((sum, p) => sum + p.loadTime, 0) / performanceData.length;
    const avgMemoryUsage = performanceData.reduce((sum, p) => sum + p.memoryUsage, 0) / performanceData.length;
    const avgCpuUsage = performanceData.reduce((sum, p) => sum + p.cpuUsage, 0) / performanceData.length;
    const totalCrashes = performanceData.reduce((sum, p) => sum + p.crashes, 0);
    const totalErrors = performanceData.reduce((sum, p) => sum + p.errors.length, 0);
    
    return {
      totalApps,
      avgLoadTime: Math.round(avgLoadTime),
      avgMemoryUsage: Math.round(avgMemoryUsage),
      avgCpuUsage: Math.round(avgCpuUsage * 100) / 100,
      totalCrashes,
      totalErrors,
      crashRate: totalCrashes / performanceData.length * 100,
      errorRate: totalErrors / performanceData.length * 100
    };
  }

  // Check performance thresholds
  async checkPerformanceThresholds() {
    try {
      const thresholds = {
        loadTime: 5000, // 5 seconds
        memoryUsage: 100 * 1024 * 1024, // 100MB
        cpuUsage: 80, // 80%
        crashRate: 5, // 5%
        errorRate: 10 // 10%
      };
      
      const aggregates = await cacheOperations.get('performance-aggregates');
      
      if (!aggregates) return;
      
      const alerts = [];
      
      if (aggregates.avgLoadTime > thresholds.loadTime) {
        alerts.push({
          type: 'performance',
          severity: 'warning',
          message: `High average load time: ${aggregates.avgLoadTime}ms`,
          metric: 'loadTime',
          value: aggregates.avgLoadTime,
          threshold: thresholds.loadTime
        });
      }
      
      if (aggregates.avgMemoryUsage > thresholds.memoryUsage) {
        alerts.push({
          type: 'performance',
          severity: 'warning',
          message: `High average memory usage: ${Math.round(aggregates.avgMemoryUsage / 1024 / 1024)}MB`,
          metric: 'memoryUsage',
          value: aggregates.avgMemoryUsage,
          threshold: thresholds.memoryUsage
        });
      }
      
      if (aggregates.avgCpuUsage > thresholds.cpuUsage) {
        alerts.push({
          type: 'performance',
          severity: 'warning',
          message: `High average CPU usage: ${aggregates.avgCpuUsage}%`,
          metric: 'cpuUsage',
          value: aggregates.avgCpuUsage,
          threshold: thresholds.cpuUsage
        });
      }
      
      if (aggregates.crashRate > thresholds.crashRate) {
        alerts.push({
          type: 'performance',
          severity: 'critical',
          message: `High crash rate: ${aggregates.crashRate.toFixed(2)}%`,
          metric: 'crashRate',
          value: aggregates.crashRate,
          threshold: thresholds.crashRate
        });
      }
      
      if (aggregates.errorRate > thresholds.errorRate) {
        alerts.push({
          type: 'performance',
          severity: 'warning',
          message: `High error rate: ${aggregates.errorRate.toFixed(2)}%`,
          metric: 'errorRate',
          value: aggregates.errorRate,
          threshold: thresholds.errorRate
        });
      }
      
      // Emit alerts
      if (alerts.length > 0) {
        this.io.emit('performance-alerts', alerts);
        
        // Publish to Redis for other services
        for (const alert of alerts) {
          await pubSubOperations.publish('alerts', alert);
        }
      }
      
    } catch (error) {
      logger.error('Error checking performance thresholds:', error);
    }
  }

  // Handle real-time performance data
  async handleRealTimePerformance(data) {
    try {
      // Save to database
      const performance = new AppPerformance(data);
      await performance.save();
      
      // Update metrics
      incrementCounter('feedbackProcessed', { 
        status: 'success', 
        source: 'app-performance' 
      });
      
      // Cache recent performance
      const cacheKey = `app-performance:${data.appId}:${data.sessionId}`;
      await cacheOperations.set(cacheKey, data, 3600); // 1 hour
      
      // Emit real-time update
      this.io.emit('app-performance-update', data);
      
      logger.debug(`Real-time performance data received for app ${data.appId}`);
    } catch (error) {
      logger.error('Error handling real-time performance data:', error);
    }
  }

  // Handle real-time error data
  async handleRealTimeError(data) {
    try {
      // Find and update existing performance record
      const performance = await AppPerformance.findOne({
        appId: data.appId,
        sessionId: data.sessionId,
        timestamp: { $gte: new Date(Date.now() - 3600000) } // Last hour
      });
      
      if (performance) {
        performance.errors.push({
          type: data.type,
          message: data.message,
          stack: data.stack,
          timestamp: new Date(),
          userId: data.userId,
          deviceInfo: data.deviceInfo
        });
        
        if (data.type === 'crash') {
          performance.crashes += 1;
        } else if (data.type === 'anr') {
          performance.anrs += 1;
        }
        
        await performance.save();
      } else {
        // Create new performance record
        const newPerformance = new AppPerformance({
          appId: data.appId,
          platform: data.platform,
          version: data.version,
          buildNumber: data.buildNumber,
          loadTime: 0,
          memoryUsage: 0,
          cpuUsage: 0,
          errors: [{
            type: data.type,
            message: data.message,
            stack: data.stack,
            timestamp: new Date(),
            userId: data.userId,
            deviceInfo: data.deviceInfo
          }],
          crashes: data.type === 'crash' ? 1 : 0,
          anrs: data.type === 'anr' ? 1 : 0,
          deviceInfo: data.deviceInfo,
          userId: data.userId,
          sessionId: data.sessionId
        });
        
        await newPerformance.save();
      }
      
      // Update metrics
      incrementCounter('alertsTriggered', { 
        severity: data.type === 'crash' ? 'critical' : 'warning', 
        type: 'app-error' 
      });
      
      // Emit real-time update
      this.io.emit('app-error-update', data);
      
      // Publish alert
      await pubSubOperations.publish('alerts', {
        type: 'app-error',
        severity: data.type === 'crash' ? 'critical' : 'warning',
        message: `${data.type} in app ${data.appId}: ${data.message}`,
        appId: data.appId,
        errorData: data
      });
      
      logger.warn(`Real-time error received for app ${data.appId}: ${data.type}`);
    } catch (error) {
      logger.error('Error handling real-time error data:', error);
    }
  }

  // Aggregate performance metrics
  async aggregatePerformanceMetrics() {
    try {
      const now = new Date();
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      
      // Group by app and platform
      const pipeline = [
        {
          $match: {
            timestamp: { $gte: oneDayAgo }
          }
        },
        {
          $group: {
            _id: {
              appId: '$appId',
              platform: '$platform'
            },
            avgLoadTime: { $avg: '$loadTime' },
            avgMemoryUsage: { $avg: '$memoryUsage' },
            avgCpuUsage: { $avg: '$cpuUsage' },
            totalCrashes: { $sum: '$crashes' },
            totalErrors: { $sum: { $size: '$errors' } },
            totalSessions: { $sum: 1 },
            avgSessionDuration: { $avg: '$sessionDuration' },
            totalScreenViews: { $sum: '$screenViews' }
          }
        },
        {
          $project: {
            _id: 0,
            appId: '$_id.appId',
            platform: '$_id.platform',
            avgLoadTime: { $round: ['$avgLoadTime', 2] },
            avgMemoryUsage: { $round: ['$avgMemoryUsage', 2] },
            avgCpuUsage: { $round: ['$avgCpuUsage', 2] },
            totalCrashes: 1,
            totalErrors: 1,
            totalSessions: 1,
            avgSessionDuration: { $round: ['$avgSessionDuration', 2] },
            totalScreenViews: 1,
            crashRate: {
              $multiply: [
                { $divide: ['$totalCrashes', '$totalSessions'] },
                100
              ]
            },
            errorRate: {
              $multiply: [
                { $divide: ['$totalErrors', '$totalSessions'] },
                100
              ]
            }
          }
        }
      ];
      
      const aggregatedData = await AppPerformance.aggregate(pipeline);
      
      // Cache aggregated data
      await cacheOperations.set('performance-aggregated-daily', aggregatedData, 1800); // 30 minutes
      
      logger.debug(`Performance metrics aggregated for ${aggregatedData.length} apps`);
    } catch (error) {
      logger.error('Error aggregating performance metrics:', error);
    }
  }

  // Generate performance reports
  async generatePerformanceReports() {
    try {
      const aggregatedData = await cacheOperations.get('performance-aggregated-daily');
      
      if (!aggregatedData) return;
      
      // Generate daily report
      const dailyReport = {
        date: new Date().toISOString().split('T')[0],
        totalApps: aggregatedData.length,
        avgLoadTime: aggregatedData.reduce((sum, app) => sum + app.avgLoadTime, 0) / aggregatedData.length,
        avgMemoryUsage: aggregatedData.reduce((sum, app) => sum + app.avgMemoryUsage, 0) / aggregatedData.length,
        avgCpuUsage: aggregatedData.reduce((sum, app) => sum + app.avgCpuUsage, 0) / aggregatedData.length,
        totalCrashes: aggregatedData.reduce((sum, app) => sum + app.totalCrashes, 0),
        totalErrors: aggregatedData.reduce((sum, app) => sum + app.totalErrors, 0),
        topPerformingApps: aggregatedData
          .sort((a, b) => a.avgLoadTime - b.avgLoadTime)
          .slice(0, 5),
        appsNeedingAttention: aggregatedData
          .filter(app => app.crashRate > 5 || app.errorRate > 10)
          .sort((a, b) => (b.crashRate + b.errorRate) - (a.crashRate + a.errorRate))
          .slice(0, 5)
      };
      
      // Cache report
      await cacheOperations.set('performance-daily-report', dailyReport, 86400); // 24 hours
      
      // Emit report
      this.io.emit('performance-report', dailyReport);
      
      logger.info('Daily performance report generated');
    } catch (error) {
      logger.error('Error generating performance reports:', error);
    }
  }

  // Cleanup old data
  async cleanupOldData() {
    try {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      
      const result = await AppPerformance.deleteMany({
        timestamp: { $lt: thirtyDaysAgo }
      });
      
      if (result.deletedCount > 0) {
        logger.info(`Cleaned up ${result.deletedCount} old performance records`);
      }
    } catch (error) {
      logger.error('Error cleaning up old data:', error);
    }
  }

  // Get performance data for an app
  async getAppPerformance(appId, timeRange = '24h') {
    try {
      const now = new Date();
      let startTime;
      
      switch (timeRange) {
        case '1h':
          startTime = new Date(now.getTime() - 60 * 60 * 1000);
          break;
        case '24h':
          startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          break;
        case '7d':
          startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          startTime = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        default:
          startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      }
      
      const performanceData = await AppPerformance.find({
        appId,
        timestamp: { $gte: startTime }
      }).sort({ timestamp: -1 });
      
      return performanceData;
    } catch (error) {
      logger.error(`Error getting performance data for app ${appId}:`, error);
      throw error;
    }
  }

  // Get performance aggregates
  async getPerformanceAggregates(timeRange = '24h') {
    try {
      const aggregates = await cacheOperations.get('performance-aggregates');
      
      if (aggregates) {
        return aggregates;
      }
      
      // If not in cache, calculate fresh aggregates
      const now = new Date();
      let startTime;
      
      switch (timeRange) {
        case '1h':
          startTime = new Date(now.getTime() - 60 * 60 * 1000);
          break;
        case '24h':
          startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          break;
        case '7d':
          startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          startTime = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        default:
          startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      }
      
      const recentPerformance = await AppPerformance.find({
        timestamp: { $gte: startTime }
      }).sort({ timestamp: -1 });
      
      const aggregates = this.calculatePerformanceAggregates(recentPerformance);
      
      // Cache the result
      await cacheOperations.set('performance-aggregates', aggregates, 300); // 5 minutes
      
      return aggregates;
    } catch (error) {
      logger.error('Error getting performance aggregates:', error);
      throw error;
    }
  }
}

module.exports = ApplicationMonitor;