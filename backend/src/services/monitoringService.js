const config = require('../config/environment');

/**
 * Sistema di monitoraggio e metriche per NutriJournal Backend
 */
class MonitoringService {
  constructor() {
    this.metrics = {
      requests: {
        total: 0,
        success: 0,
        errors: 0,
        byEndpoint: {},
        byMethod: {},
        averageResponseTime: 0
      },
      system: {
        startTime: Date.now(),
        uptime: 0,
        memoryUsage: {},
        cpuUsage: 0
      },
      database: {
        queries: 0,
        slowQueries: 0,
        connectionPool: 0
      },
      security: {
        blockedRequests: 0,
        rateLimitHits: 0,
        authFailures: 0
      }
    };

    this.responseTimes = [];
    this.maxResponseTimeHistory = 1000; // Mantieni ultime 1000 richieste
  }

  /**
   * Middleware per tracciare le richieste
   */
  trackRequest() {
    return (req, res, next) => {
      const startTime = Date.now();
      
      // Incrementa contatori
      this.metrics.requests.total++;
      
      // Traccia per endpoint
      const endpoint = req.route?.path || req.path;
      this.metrics.requests.byEndpoint[endpoint] = 
        (this.metrics.requests.byEndpoint[endpoint] || 0) + 1;
      
      // Traccia per metodo HTTP
      this.metrics.requests.byMethod[req.method] = 
        (this.metrics.requests.byMethod[req.method] || 0) + 1;

      // Override del res.end per catturare la risposta
      const originalEnd = res.end;
      res.end = (...args) => {
        const responseTime = Date.now() - startTime;
        
        // Aggiorna metriche di risposta
        this.updateResponseMetrics(res.statusCode, responseTime);
        
        // Chiama il metodo originale
        originalEnd.apply(res, args);
      };

      next();
    };
  }

  /**
   * Aggiorna metriche di risposta
   */
  updateResponseMetrics(statusCode, responseTime) {
    if (statusCode >= 200 && statusCode < 400) {
      this.metrics.requests.success++;
    } else if (statusCode >= 400) {
      this.metrics.requests.errors++;
    }

    // Gestisci response time
    this.responseTimes.push(responseTime);
    if (this.responseTimes.length > this.maxResponseTimeHistory) {
      this.responseTimes.shift();
    }

    // Calcola media response time
    this.metrics.requests.averageResponseTime = 
      this.responseTimes.reduce((sum, time) => sum + time, 0) / this.responseTimes.length;
  }

  /**
   * Traccia query database lente
   */
  trackSlowQuery(queryTime, query) {
    this.metrics.database.queries++;
    
    if (queryTime > 1000) { // Query più lente di 1 secondo
      this.metrics.database.slowQueries++;
      console.warn(`[MONITORING] Slow query detected: ${queryTime}ms - ${query.substring(0, 100)}...`);
    }
  }

  /**
   * Traccia eventi di sicurezza
   */
  trackSecurityEvent(eventType) {
    switch (eventType) {
      case 'blocked_request':
        this.metrics.security.blockedRequests++;
        break;
      case 'rate_limit':
        this.metrics.security.rateLimitHits++;
        break;
      case 'auth_failure':
        this.metrics.security.authFailures++;
        break;
    }
  }

  /**
   * Aggiorna metriche di sistema
   */
  updateSystemMetrics() {
    this.metrics.system.uptime = Date.now() - this.metrics.system.startTime;
    this.metrics.system.memoryUsage = process.memoryUsage();
    
    // CPU usage (approssimativo)
    const usage = process.cpuUsage();
    this.metrics.system.cpuUsage = (usage.user + usage.system) / 1000000; // Converti in secondi
  }

  /**
   * Ottieni tutte le metriche
   */
  getMetrics() {
    this.updateSystemMetrics();
    
    return {
      ...this.metrics,
      timestamp: new Date().toISOString(),
      environment: config.server.nodeEnv,
      version: '1.0.0'
    };
  }

  /**
   * Ottieni metriche per health check avanzato
   */
  getHealthMetrics() {
    this.updateSystemMetrics();
    
    const memoryMB = Math.round(this.metrics.system.memoryUsage.rss / 1024 / 1024);
    const uptimeHours = Math.round(this.metrics.system.uptime / 1000 / 60 / 60 * 100) / 100;
    const errorRate = this.metrics.requests.total > 0 
      ? Math.round((this.metrics.requests.errors / this.metrics.requests.total) * 100 * 100) / 100
      : 0;

    return {
      status: this.determineHealthStatus(),
      uptime: `${uptimeHours}h`,
      memory: `${memoryMB}MB`,
      requests: {
        total: this.metrics.requests.total,
        success: this.metrics.requests.success,
        errors: this.metrics.requests.errors,
        errorRate: `${errorRate}%`
      },
      performance: {
        avgResponseTime: `${Math.round(this.metrics.requests.averageResponseTime)}ms`,
        slowQueries: this.metrics.database.slowQueries
      },
      security: {
        blockedRequests: this.metrics.security.blockedRequests,
        rateLimitHits: this.metrics.security.rateLimitHits,
        authFailures: this.metrics.security.authFailures
      }
    };
  }

  /**
   * Determina stato di salute del sistema
   */
  determineHealthStatus() {
    const errorRate = this.metrics.requests.total > 0 
      ? (this.metrics.requests.errors / this.metrics.requests.total) * 100
      : 0;
    
    const memoryMB = this.metrics.system.memoryUsage.rss / 1024 / 1024;
    const avgResponseTime = this.metrics.requests.averageResponseTime;

    // Criteri per determinare lo stato
    if (errorRate > 10) return 'unhealthy'; // Più del 10% di errori
    if (memoryMB > 512) return 'degraded'; // Più di 512MB di memoria
    if (avgResponseTime > 2000) return 'degraded'; // Response time > 2s
    if (this.metrics.database.slowQueries > 10) return 'degraded'; // Troppe query lente

    return 'healthy';
  }

  /**
   * Reset delle metriche (per testing o manutenzione)
   */
  resetMetrics() {
    this.metrics.requests = {
      total: 0,
      success: 0,
      errors: 0,
      byEndpoint: {},
      byMethod: {},
      averageResponseTime: 0
    };
    
    this.metrics.database.queries = 0;
    this.metrics.database.slowQueries = 0;
    
    this.metrics.security = {
      blockedRequests: 0,
      rateLimitHits: 0,
      authFailures: 0
    };
    
    this.responseTimes = [];
    console.log('[MONITORING] Metriche reset completato');
  }
}

// Singleton instance
const monitoringService = new MonitoringService();

module.exports = monitoringService;
