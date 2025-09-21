const client = require('prom-client');

// Create a Registry which registers the metrics
const register = new client.Registry();

// Add a default label which is added to all metrics
register.setDefaultLabels({
  app: 'mobile-app-automation'
});

// Enable the collection of default metrics
client.collectDefaultMetrics({ register });

// Custom metrics for the monitoring service
const metrics = {
  // HTTP request metrics
  httpRequestDuration: new client.Histogram({
    name: 'monitoring_http_request_duration_seconds',
    help: 'Duration of HTTP requests in seconds',
    labelNames: ['method', 'route', 'status_code'],
    buckets: [0.1, 0.5, 1, 2, 5, 10]
  }),

  // Active connections
  activeConnections: new client.Gauge({
    name: 'monitoring_active_connections',
    help: 'Number of active connections',
    labelNames: ['type']
  }),

  // Database metrics
  databaseOperations: new client.Counter({
    name: 'monitoring_database_operations_total',
    help: 'Total number of database operations',
    labelNames: ['operation', 'collection']
  }),

  // Redis metrics
  redisOperations: new client.Counter({
    name: 'monitoring_redis_operations_total',
    help: 'Total number of Redis operations',
    labelNames: ['operation']
  }),

  // Alert metrics
  alertsTriggered: new client.Counter({
    name: 'monitoring_alerts_triggered_total',
    help: 'Total number of alerts triggered',
    labelNames: ['severity', 'type']
  }),

  // Feedback metrics
  feedbackProcessed: new client.Counter({
    name: 'monitoring_feedback_processed_total',
    help: 'Total number of feedback items processed',
    labelNames: ['status', 'source']
  }),

  // System metrics
  systemMemoryUsage: new client.Gauge({
    name: 'monitoring_system_memory_usage_bytes',
    help: 'System memory usage in bytes'
  }),

  systemCpuUsage: new client.Gauge({
    name: 'monitoring_system_cpu_usage_percent',
    help: 'System CPU usage percentage'
  }),

  // Service health metrics
  serviceHealth: new client.Gauge({
    name: 'monitoring_service_health',
    help: 'Health status of services (1=healthy, 0=unhealthy)',
    labelNames: ['service']
  }),

  // Deployment metrics
  deploymentsTotal: new client.Counter({
    name: 'monitoring_deployments_total',
    help: 'Total number of deployments',
    labelNames: ['platform', 'channel', 'status']
  }),

  // Build metrics
  buildsTotal: new client.Counter({
    name: 'monitoring_builds_total',
    help: 'Total number of builds',
    labelNames: ['platform', 'status']
  }),

  // Test metrics
  testsTotal: new client.Counter({
    name: 'monitoring_tests_total',
    help: 'Total number of tests executed',
    labelNames: ['type', 'status']
  })
};

// Middleware to collect HTTP metrics
const metricsMiddleware = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    
    metrics.httpRequestDuration
      .labels(req.method, req.route?.path || req.path, res.statusCode)
      .observe(duration);
  });
  
  next();
};

// Function to update system metrics
const updateSystemMetrics = () => {
  const used = process.memoryUsage();
  
  metrics.systemMemoryUsage.set(used.heapUsed);
  
  // CPU usage (simplified)
  const cpuUsage = process.cpuUsage();
  metrics.systemCpuUsage.set(cpuUsage.user / 1000000); // Convert to percentage
};

// Function to update service health
const updateServiceHealth = (service, isHealthy) => {
  metrics.serviceHealth.labels(service).set(isHealthy ? 1 : 0);
};

// Function to increment counter metrics
const incrementCounter = (metricName, labels = {}) => {
  const metric = metrics[metricName];
  if (metric) {
    metric.inc(labels);
  }
};

// Function to observe histogram metrics
const observeHistogram = (metricName, value, labels = {}) => {
  const metric = metrics[metricName];
  if (metric) {
    metric.observe(labels, value);
  }
};

// Function to set gauge metrics
const setGauge = (metricName, value, labels = {}) => {
  const metric = metrics[metricName];
  if (metric) {
    metric.set(labels, value);
  }
};

// Setup metrics collection
const setupMetrics = () => {
  // Update system metrics every 5 seconds
  setInterval(updateSystemMetrics, 5000);
  
  return {
    register,
    metricsMiddleware,
    metrics,
    incrementCounter,
    observeHistogram,
    setGauge
  };
};

module.exports = { setupMetrics };