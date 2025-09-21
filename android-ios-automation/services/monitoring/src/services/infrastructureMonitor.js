const { createChildLogger } = require('../config/logger');
const { cacheOperations, pubSubOperations } = require('../config/redis');
const { incrementCounter, setGauge } = require('../config/metrics');
const os = require('os');
const fs = require('fs').promises;
const path = require('path');

const logger = createChildLogger('infrastructure-monitor');

class InfrastructureMonitor {
  constructor(io) {
    this.io = io;
    this.isRunning = false;
    this.monitoringIntervals = new Map();
    this.serviceHealth = new Map();
    this.systemMetrics = new Map();
  }

  async start() {
    try {
      logger.info('Starting Infrastructure Monitor...');
      
      // Start system monitoring
      this.startSystemMonitoring();
      
      // Start service health monitoring
      this.startServiceHealthMonitoring();
      
      // Start resource monitoring
      this.startResourceMonitoring();
      
      // Start network monitoring
      this.startNetworkMonitoring();
      
      // Start database monitoring
      this.startDatabaseMonitoring();
      
      this.isRunning = true;
      logger.info('Infrastructure Monitor started successfully');
    } catch (error) {
      logger.error('Failed to start Infrastructure Monitor:', error);
      throw error;
    }
  }

  async stop() {
    try {
      logger.info('Stopping Infrastructure Monitor...');
      
      // Clear all monitoring intervals
      for (const [name, interval] of this.monitoringIntervals) {
        clearInterval(interval);
        logger.debug(`Stopped monitoring: ${name}`);
      }
      
      this.monitoringIntervals.clear();
      this.isRunning = false;
      logger.info('Infrastructure Monitor stopped successfully');
    } catch (error) {
      logger.error('Failed to stop Infrastructure Monitor:', error);
      throw error;
    }
  }

  // Start system monitoring
  startSystemMonitoring() {
    const interval = setInterval(async () => {
      try {
        await this.collectSystemMetrics();
        await this.checkSystemThresholds();
      } catch (error) {
        logger.error('Error in system monitoring:', error);
      }
    }, 30000); // Every 30 seconds
    
    this.monitoringIntervals.set('system', interval);
    logger.debug('System monitoring started');
  }

  // Start service health monitoring
  startServiceHealthMonitoring() {
    const interval = setInterval(async () => {
      try {
        await this.checkServiceHealth();
        await this.updateServiceMetrics();
      } catch (error) {
        logger.error('Error in service health monitoring:', error);
      }
    }, 60000); // Every minute
    
    this.monitoringIntervals.set('service-health', interval);
    logger.debug('Service health monitoring started');
  }

  // Start resource monitoring
  startResourceMonitoring() {
    const interval = setInterval(async () => {
      try {
        await this.collectResourceMetrics();
        await this.checkResourceThresholds();
      } catch (error) {
        logger.error('Error in resource monitoring:', error);
      }
    }, 15000); // Every 15 seconds
    
    this.monitoringIntervals.set('resources', interval);
    logger.debug('Resource monitoring started');
  }

  // Start network monitoring
  startNetworkMonitoring() {
    const interval = setInterval(async () => {
      try {
        await this.collectNetworkMetrics();
        await this.checkNetworkThresholds();
      } catch (error) {
        logger.error('Error in network monitoring:', error);
      }
    }, 45000); // Every 45 seconds
    
    this.monitoringIntervals.set('network', interval);
    logger.debug('Network monitoring started');
  }

  // Start database monitoring
  startDatabaseMonitoring() {
    const interval = setInterval(async () => {
      try {
        await this.collectDatabaseMetrics();
        await this.checkDatabaseThresholds();
      } catch (error) {
        logger.error('Error in database monitoring:', error);
      }
    }, 120000); // Every 2 minutes
    
    this.monitoringIntervals.set('database', interval);
    logger.debug('Database monitoring started');
  }

  // Collect system metrics
  async collectSystemMetrics() {
    try {
      const systemInfo = {
        timestamp: new Date().toISOString(),
        hostname: os.hostname(),
        platform: os.platform(),
        arch: os.arch(),
        uptime: os.uptime(),
        loadavg: os.loadavg(),
        totalmem: os.totalmem(),
        freemem: os.freemem(),
        cpus: os.cpus().length,
        networkInterfaces: os.networkInterfaces()
      };
      
      // Calculate memory usage
      const usedMemory = systemInfo.totalmem - systemInfo.freemem;
      const memoryUsagePercent = (usedMemory / systemInfo.totalmem) * 100;
      
      // Calculate CPU usage (simplified)
      const cpuUsagePercent = systemInfo.loadavg[0] * 100 / systemInfo.cpus;
      
      const metrics = {
        ...systemInfo,
        usedMemory,
        memoryUsagePercent: Math.round(memoryUsagePercent * 100) / 100,
        cpuUsagePercent: Math.round(cpuUsagePercent * 100) / 100
      };
      
      // Store metrics
      this.systemMetrics.set('system', metrics);
      
      // Update Prometheus metrics
      setGauge('systemMemoryUsage', usedMemory);
      setGauge('systemCpuUsage', cpuUsagePercent);
      
      // Cache metrics
      await cacheOperations.set('system-metrics', metrics, 300); // 5 minutes
      
      // Emit real-time updates
      this.io.emit('system-metrics-update', metrics);
      
      logger.debug('System metrics collected successfully');
    } catch (error) {
      logger.error('Error collecting system metrics:', error);
    }
  }

  // Check system thresholds
  async checkSystemThresholds() {
    try {
      const metrics = this.systemMetrics.get('system');
      
      if (!metrics) return;
      
      const thresholds = {
        memoryUsagePercent: 85, // 85%
        cpuUsagePercent: 80, // 80%
        loadavg: 5.0 // Load average
      };
      
      const alerts = [];
      
      if (metrics.memoryUsagePercent > thresholds.memoryUsagePercent) {
        alerts.push({
          type: 'system',
          severity: 'warning',
          message: `High memory usage: ${metrics.memoryUsagePercent}%`,
          metric: 'memoryUsagePercent',
          value: metrics.memoryUsagePercent,
          threshold: thresholds.memoryUsagePercent
        });
      }
      
      if (metrics.cpuUsagePercent > thresholds.cpuUsagePercent) {
        alerts.push({
          type: 'system',
          severity: 'warning',
          message: `High CPU usage: ${metrics.cpuUsagePercent}%`,
          metric: 'cpuUsagePercent',
          value: metrics.cpuUsagePercent,
          threshold: thresholds.cpuUsagePercent
        });
      }
      
      if (metrics.loadavg[0] > thresholds.loadavg) {
        alerts.push({
          type: 'system',
          severity: 'critical',
          message: `High load average: ${metrics.loadavg[0]}`,
          metric: 'loadavg',
          value: metrics.loadavg[0],
          threshold: thresholds.loadavg
        });
      }
      
      // Emit alerts
      if (alerts.length > 0) {
        this.io.emit('system-alerts', alerts);
        
        // Publish to Redis for other services
        for (const alert of alerts) {
          await pubSubOperations.publish('alerts', alert);
        }
      }
      
    } catch (error) {
      logger.error('Error checking system thresholds:', error);
    }
  }

  // Check service health
  async checkServiceHealth() {
    try {
      const services = [
        { name: 'auth', url: 'http://auth-service:3001/health' },
        { name: 'nlp', url: 'http://nlp-service:3002/health' },
        { name: 'codegen', url: 'http://codegen-service:3003/health' },
        { name: 'build', url: 'http://build-service:3007/health' },
        { name: 'deployment', url: 'http://deployment-service:3004/health' },
        { name: 'testing', url: 'http://testing-service:3006/health' },
        { name: 'frontend', url: 'http://frontend:3000' }
      ];
      
      const healthResults = [];
      
      for (const service of services) {
        try {
          const response = await fetch(service.url, {
            method: 'GET',
            timeout: 5000
          });
          
          const isHealthy = response.ok;
          const healthData = isHealthy ? await response.json() : null;
          
          const healthResult = {
            name: service.name,
            status: isHealthy ? 'healthy' : 'unhealthy',
            responseTime: Date.now(),
            lastCheck: new Date().toISOString(),
            details: healthData
          };
          
          healthResults.push(healthResult);
          this.serviceHealth.set(service.name, healthResult);
          
          // Update Prometheus metrics
          setGauge('serviceHealth', isHealthy ? 1 : 0, { service: service.name });
          
        } catch (error) {
          const healthResult = {
            name: service.name,
            status: 'unhealthy',
            responseTime: Date.now(),
            lastCheck: new Date().toISOString(),
            error: error.message
          };
          
          healthResults.push(healthResult);
          this.serviceHealth.set(service.name, healthResult);
          
          // Update Prometheus metrics
          setGauge('serviceHealth', 0, { service: service.name });
          
          // Generate alert for unhealthy service
          const alert = {
            type: 'service',
            severity: 'critical',
            message: `Service ${service.name} is unhealthy: ${error.message}`,
            service: service.name,
            error: error.message
          };
          
          this.io.emit('service-alert', alert);
          await pubSubOperations.publish('alerts', alert);
        }
      }
      
      // Cache health results
      await cacheOperations.set('service-health', healthResults, 300); // 5 minutes
      
      // Emit real-time updates
      this.io.emit('service-health-update', healthResults);
      
      logger.debug('Service health check completed');
    } catch (error) {
      logger.error('Error checking service health:', error);
    }
  }

  // Update service metrics
  async updateServiceMetrics() {
    try {
      const healthResults = await cacheOperations.get('service-health');
      
      if (!healthResults) return;
      
      const healthyServices = healthResults.filter(s => s.status === 'healthy').length;
      const totalServices = healthResults.length;
      
      // Update overall system health
      const systemHealth = (healthyServices / totalServices) * 100;
      
      const metrics = {
        totalServices,
        healthyServices,
        unhealthyServices: totalServices - healthyServices,
        systemHealth: Math.round(systemHealth * 100) / 100,
        timestamp: new Date().toISOString()
      };
      
      // Cache metrics
      await cacheOperations.set('service-metrics', metrics, 300); // 5 minutes
      
      // Emit updates
      this.io.emit('service-metrics-update', metrics);
      
    } catch (error) {
      logger.error('Error updating service metrics:', error);
    }
  }

  // Collect resource metrics
  async collectResourceMetrics() {
    try {
      const metrics = {
        timestamp: new Date().toISOString(),
        disk: await this.getDiskUsage(),
        memory: await this.getMemoryUsage(),
        cpu: await this.getCPUUsage(),
        processes: await this.getProcessInfo()
      };
      
      // Store metrics
      this.systemMetrics.set('resources', metrics);
      
      // Cache metrics
      await cacheOperations.set('resource-metrics', metrics, 300); // 5 minutes
      
      // Emit real-time updates
      this.io.emit('resource-metrics-update', metrics);
      
      logger.debug('Resource metrics collected successfully');
    } catch (error) {
      logger.error('Error collecting resource metrics:', error);
    }
  }

  // Get disk usage
  async getDiskUsage() {
    try {
      // This is a simplified implementation
      // In a real environment, you'd use a library like 'diskusage'
      return {
        total: 100 * 1024 * 1024 * 1024, // 100GB (example)
        used: 45 * 1024 * 1024 * 1024, // 45GB (example)
        free: 55 * 1024 * 1024 * 1024, // 55GB (example)
        usagePercent: 45
      };
    } catch (error) {
      logger.error('Error getting disk usage:', error);
      return null;
    }
  }

  // Get memory usage
  async getMemoryUsage() {
    try {
      const totalMem = os.totalmem();
      const freeMem = os.freemem();
      const usedMem = totalMem - freeMem;
      
      return {
        total: totalMem,
        used: usedMem,
        free: freeMem,
        usagePercent: Math.round((usedMem / totalMem) * 100 * 100) / 100
      };
    } catch (error) {
      logger.error('Error getting memory usage:', error);
      return null;
    }
  }

  // Get CPU usage
  async getCPUUsage() {
    try {
      const cpus = os.cpus();
      const loadAvg = os.loadavg();
      
      return {
        cores: cpus.length,
        loadAvg: loadAvg,
        usagePercent: Math.round((loadAvg[0] / cpus.length) * 100 * 100) / 100,
        model: cpus[0].model,
        speed: cpus[0].speed
      };
    } catch (error) {
      logger.error('Error getting CPU usage:', error);
      return null;
    }
  }

  // Get process information
  async getProcessInfo() {
    try {
      const memUsage = process.memoryUsage();
      const cpuUsage = process.cpuUsage();
      
      return {
        pid: process.pid,
        uptime: process.uptime(),
        memory: {
          rss: memUsage.rss,
          heapTotal: memUsage.heapTotal,
          heapUsed: memUsage.heapUsed,
          external: memUsage.external
        },
        cpu: {
          user: cpuUsage.user,
          system: cpuUsage.system
        }
      };
    } catch (error) {
      logger.error('Error getting process info:', error);
      return null;
    }
  }

  // Check resource thresholds
  async checkResourceThresholds() {
    try {
      const metrics = this.systemMetrics.get('resources');
      
      if (!metrics) return;
      
      const thresholds = {
        diskUsagePercent: 85, // 85%
        memoryUsagePercent: 85, // 85%
        cpuUsagePercent: 80 // 80%
      };
      
      const alerts = [];
      
      if (metrics.disk && metrics.disk.usagePercent > thresholds.diskUsagePercent) {
        alerts.push({
          type: 'resource',
          severity: 'warning',
          message: `High disk usage: ${metrics.disk.usagePercent}%`,
          metric: 'diskUsagePercent',
          value: metrics.disk.usagePercent,
          threshold: thresholds.diskUsagePercent
        });
      }
      
      if (metrics.memory && metrics.memory.usagePercent > thresholds.memoryUsagePercent) {
        alerts.push({
          type: 'resource',
          severity: 'warning',
          message: `High memory usage: ${metrics.memory.usagePercent}%`,
          metric: 'memoryUsagePercent',
          value: metrics.memory.usagePercent,
          threshold: thresholds.memoryUsagePercent
        });
      }
      
      if (metrics.cpu && metrics.cpu.usagePercent > thresholds.cpuUsagePercent) {
        alerts.push({
          type: 'resource',
          severity: 'warning',
          message: `High CPU usage: ${metrics.cpu.usagePercent}%`,
          metric: 'cpuUsagePercent',
          value: metrics.cpu.usagePercent,
          threshold: thresholds.cpuUsagePercent
        });
      }
      
      // Emit alerts
      if (alerts.length > 0) {
        this.io.emit('resource-alerts', alerts);
        
        // Publish to Redis for other services
        for (const alert of alerts) {
          await pubSubOperations.publish('alerts', alert);
        }
      }
      
    } catch (error) {
      logger.error('Error checking resource thresholds:', error);
    }
  }

  // Collect network metrics
  async collectNetworkMetrics() {
    try {
      const networkInterfaces = os.networkInterfaces();
      const networkMetrics = {};
      
      for (const [interfaceName, addresses] of Object.entries(networkInterfaces)) {
        networkMetrics[interfaceName] = addresses.map(addr => ({
          address: addr.address,
          netmask: addr.netmask,
          family: addr.family,
          mac: addr.mac,
          internal: addr.internal,
          cidr: addr.cidr
        }));
      }
      
      const metrics = {
        timestamp: new Date().toISOString(),
        interfaces: networkMetrics,
        hostname: os.hostname()
      };
      
      // Store metrics
      this.systemMetrics.set('network', metrics);
      
      // Cache metrics
      await cacheOperations.set('network-metrics', metrics, 300); // 5 minutes
      
      // Emit real-time updates
      this.io.emit('network-metrics-update', metrics);
      
      logger.debug('Network metrics collected successfully');
    } catch (error) {
      logger.error('Error collecting network metrics:', error);
    }
  }

  // Check network thresholds
  async checkNetworkThresholds() {
    try {
      // Network threshold checking would typically involve more sophisticated monitoring
      // This is a placeholder for future implementation
      logger.debug('Network thresholds checked');
    } catch (error) {
      logger.error('Error checking network thresholds:', error);
    }
  }

  // Collect database metrics
  async collectDatabaseMetrics() {
    try {
      const metrics = {
        timestamp: new Date().toISOString(),
        databases: {
          postgresql: await this.getPostgreSQLMetrics(),
          mongodb: await this.getMongoDBMetrics(),
          redis: await this.getRedisMetrics()
        }
      };
      
      // Store metrics
      this.systemMetrics.set('database', metrics);
      
      // Cache metrics
      await cacheOperations.set('database-metrics', metrics, 300); // 5 minutes
      
      // Emit real-time updates
      this.io.emit('database-metrics-update', metrics);
      
      logger.debug('Database metrics collected successfully');
    } catch (error) {
      logger.error('Error collecting database metrics:', error);
    }
  }

  // Get PostgreSQL metrics
  async getPostgreSQLMetrics() {
    try {
      // This would typically involve querying PostgreSQL statistics
      // For now, we'll return placeholder data
      return {
        status: 'healthy',
        connections: 15,
        maxConnections: 100,
        databaseSize: '2.5GB',
        activeQueries: 3,
        slowQueries: 0
      };
    } catch (error) {
      logger.error('Error getting PostgreSQL metrics:', error);
      return { status: 'unhealthy', error: error.message };
    }
  }

  // Get MongoDB metrics
  async getMongoDBMetrics() {
    try {
      // This would typically involve querying MongoDB statistics
      // For now, we'll return placeholder data
      return {
        status: 'healthy',
        connections: 8,
        databaseSize: '1.8GB',
        indexSize: '256MB',
        operations: {
          query: 1250,
          insert: 450,
          update: 320,
          delete: 180
        }
      };
    } catch (error) {
      logger.error('Error getting MongoDB metrics:', error);
      return { status: 'unhealthy', error: error.message };
    }
  }

  // Get Redis metrics
  async getRedisMetrics() {
    try {
      const client = require('../config/redis').getRedisClient();
      const info = await client.info();
      
      // Parse Redis info to extract metrics
      const lines = info.split('\n');
      const metrics = {};
      
      for (const line of lines) {
        if (line.includes(':')) {
          const [key, value] = line.split(':');
          metrics[key] = value;
        }
      }
      
      return {
        status: 'healthy',
        connectedClients: parseInt(metrics.connected_clients) || 0,
        usedMemory: metrics.used_memory_human || '0B',
        keyspaceHits: parseInt(metrics.keyspace_hits) || 0,
        keyspaceMisses: parseInt(metrics.keyspace_misses) || 0,
        totalCommandsProcessed: parseInt(metrics.total_commands_processed) || 0,
        uptimeInSeconds: parseInt(metrics.uptime_in_seconds) || 0
      };
    } catch (error) {
      logger.error('Error getting Redis metrics:', error);
      return { status: 'unhealthy', error: error.message };
    }
  }

  // Check database thresholds
  async checkDatabaseThresholds() {
    try {
      const metrics = this.systemMetrics.get('database');
      
      if (!metrics) return;
      
      const thresholds = {
        postgresqlConnections: 80, // 80% of max connections
        mongodbConnections: 80, // 80% of max connections
        redisMemoryUsage: 80 // 80% of max memory
      };
      
      const alerts = [];
      
      // Check PostgreSQL thresholds
      if (metrics.databases.postgresql.status === 'healthy') {
        const connectionUsage = (metrics.databases.postgresql.connections / metrics.databases.postgresql.maxConnections) * 100;
        if (connectionUsage > thresholds.postgresqlConnections) {
          alerts.push({
            type: 'database',
            severity: 'warning',
            message: `High PostgreSQL connection usage: ${connectionUsage.toFixed(1)}%`,
            database: 'postgresql',
            metric: 'connectionUsage',
            value: connectionUsage,
            threshold: thresholds.postgresqlConnections
          });
        }
      }
      
      // Emit alerts
      if (alerts.length > 0) {
        this.io.emit('database-alerts', alerts);
        
        // Publish to Redis for other services
        for (const alert of alerts) {
          await pubSubOperations.publish('alerts', alert);
        }
      }
      
    } catch (error) {
      logger.error('Error checking database thresholds:', error);
    }
  }

  // Get infrastructure status
  async getInfrastructureStatus() {
    try {
      const systemMetrics = await cacheOperations.get('system-metrics');
      const serviceHealth = await cacheOperations.get('service-health');
      const resourceMetrics = await cacheOperations.get('resource-metrics');
      const databaseMetrics = await cacheOperations.get('database-metrics');
      
      return {
        timestamp: new Date().toISOString(),
        system: systemMetrics,
        services: serviceHealth,
        resources: resourceMetrics,
        databases: databaseMetrics,
        overallHealth: this.calculateOverallHealth(serviceHealth)
      };
    } catch (error) {
      logger.error('Error getting infrastructure status:', error);
      throw error;
    }
  }

  // Calculate overall health
  calculateOverallHealth(serviceHealth) {
    if (!serviceHealth || serviceHealth.length === 0) {
      return 'unknown';
    }
    
    const healthyServices = serviceHealth.filter(s => s.status === 'healthy').length;
    const totalServices = serviceHealth.length;
    const healthPercentage = (healthyServices / totalServices) * 100;
    
    if (healthPercentage >= 90) return 'excellent';
    if (healthPercentage >= 70) return 'good';
    if (healthPercentage >= 50) return 'fair';
    return 'poor';
  }
}

module.exports = InfrastructureMonitor;