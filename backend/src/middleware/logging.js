const winston = require('winston');
const path = require('path');
const fs = require('fs');
const config = require('../config/environment');

// Crea directory logs se non esiste
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Configurazione formato log
const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss',
  }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
    let log = `${timestamp} [${level.toUpperCase()}]: ${message}`;
    
    if (Object.keys(meta).length > 0) {
      log += ` ${JSON.stringify(meta)}`;
    }
    
    if (stack) {
      log += `\n${stack}`;
    }
    
    return log;
  })
);

// Logger principale
const logger = winston.createLogger({
  level: config.server.nodeEnv === 'development' ? 'debug' : 'info',
  format: logFormat,
  transports: [
    // File log generale
    new winston.transports.File({
      filename: path.join(logsDir, 'app.log'),
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 5,
      tailable: true,
    }),
    
    // File log solo errori
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 5,
      tailable: true,
    }),
  ],
});

// Console log in sviluppo
if (config.server.nodeEnv === 'development') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));
}

// Logger specifico per email
const emailLogger = winston.createLogger({
  level: 'info',
  format: logFormat,
  transports: [
    new winston.transports.File({
      filename: path.join(logsDir, 'email.log'),
      maxsize: 5 * 1024 * 1024, // 5MB
      maxFiles: 3,
      tailable: true,
    }),
  ],
});

// Logger specifico per traduzioni
const translationLogger = winston.createLogger({
  level: 'info',
  format: logFormat,
  transports: [
    new winston.transports.File({
      filename: path.join(logsDir, 'translations.log'),
      maxsize: 5 * 1024 * 1024, // 5MB
      maxFiles: 3,
      tailable: true,
    }),
  ],
});

// Logger specifico per sicurezza
const securityLogger = winston.createLogger({
  level: 'warn',
  format: logFormat,
  transports: [
    new winston.transports.File({
      filename: path.join(logsDir, 'security.log'),
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 10,
      tailable: true,
    }),
  ],
});

// Middleware per logging richieste HTTP
const httpLoggingMiddleware = (req, res, next) => {
  const startTime = Date.now();
  
  // Info richiesta
  const requestInfo = {
    method: req.method,
    url: req.url,
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.get('User-Agent'),
    device: req.device?.type || 'unknown',
    userId: req.userId || null,
  };

  // Log richiesta in entrata (solo in sviluppo o per errori)
  if (config.server.nodeEnv === 'development' || req.url.includes('/auth/')) {
    logger.debug('Richiesta in entrata', requestInfo);
  }

  // Override del metodo res.end per catturare response
  const originalEnd = res.end;
  res.end = function(chunk, encoding) {
    const responseTime = Date.now() - startTime;
    
    const responseInfo = {
      ...requestInfo,
      statusCode: res.statusCode,
      responseTime: `${responseTime}ms`,
      contentLength: res.get('Content-Length') || 0,
    };

    // Log basato su status code
    if (res.statusCode >= 500) {
      logger.error('Errore server', responseInfo);
    } else if (res.statusCode >= 400) {
      logger.warn('Errore client', responseInfo);
    } else if (res.statusCode >= 300) {
      logger.info('Redirect', responseInfo);
    } else {
      // Log successo solo se tempo di risposta alto o in sviluppo
      if (responseTime > 1000 || config.server.nodeEnv === 'development') {
        logger.info('Richiesta completata', responseInfo);
      }
    }

    // Log sicurezza per tentativi sospetti
    if (res.statusCode === 401 || res.statusCode === 403) {
      securityLogger.warn('Tentativo accesso non autorizzato', {
        ...responseInfo,
        body: req.body ? JSON.stringify(req.body) : null,
      });
    }

    originalEnd.call(this, chunk, encoding);
  };

  next();
};

// Middleware per logging errori non catturati
const errorLoggingMiddleware = (error, req, res, next) => {
  const errorInfo = {
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userId: req.userId || null,
    body: req.body,
    headers: req.headers,
  };

  logger.error('Errore non gestito', errorInfo);
  
  next(error);
};

// Funzioni di logging specifiche
const logEmail = (type, email, status, error = null) => {
  emailLogger.info('Email evento', {
    type,
    email,
    status,
    error: error?.message || null,
    timestamp: new Date().toISOString(),
  });
};

const logTranslation = (productId, fromLang, toLang, status, confidence = null) => {
  translationLogger.info('Traduzione evento', {
    productId,
    fromLang,
    toLang,
    status,
    confidence,
    timestamp: new Date().toISOString(),
  });
};

const logSecurity = (event, details) => {
  securityLogger.warn('Evento sicurezza', {
    event,
    ...details,
    timestamp: new Date().toISOString(),
  });
};

const logDatabase = (operation, table, recordId = null, error = null) => {
  const logLevel = error ? 'error' : 'debug';
  
  logger.log(logLevel, 'Operazione database', {
    operation,
    table,
    recordId,
    error: error?.message || null,
    timestamp: new Date().toISOString(),
  });
};

const logExternalApi = (api, endpoint, status, responseTime, error = null) => {
  logger.info('Chiamata API esterna', {
    api,
    endpoint,
    status,
    responseTime: `${responseTime}ms`,
    error: error?.message || null,
    timestamp: new Date().toISOString(),
  });
};

// Log rotazione e pulizia
const cleanupOldLogs = () => {
  const maxAge = 30 * 24 * 60 * 60 * 1000; // 30 giorni
  const now = Date.now();

  fs.readdir(logsDir, (err, files) => {
    if (err) return;

    files.forEach(file => {
      const filePath = path.join(logsDir, file);
      
      fs.stat(filePath, (err, stats) => {
        if (err) return;
        
        if (now - stats.mtime.getTime() > maxAge) {
          fs.unlink(filePath, (err) => {
            if (!err) {
              logger.info('Log file eliminato', { file });
            }
          });
        }
      });
    });
  });
};

// Pulizia automatica ogni settimana
setInterval(cleanupOldLogs, 7 * 24 * 60 * 60 * 1000);

// Gestione graceful degli stream di log
process.on('SIGINT', () => {
  logger.end();
  emailLogger.end();
  translationLogger.end();
  securityLogger.end();
});

module.exports = {
  // Logger principali
  logger,
  emailLogger,
  translationLogger,
  securityLogger,
  
  // Middleware
  httpLoggingMiddleware,
  errorLoggingMiddleware,
  
  // Funzioni di logging specifiche
  logEmail,
  logTranslation,
  logSecurity,
  logDatabase,
  logExternalApi,
  
  // Utility
  cleanupOldLogs,
};
