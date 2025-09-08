const fs = require('fs').promises;
const path = require('path');

class Logger {
    constructor() {
        this.logsDir = path.join(__dirname, '../../logs');
        this.logFile = path.join(this.logsDir, 'app.log');
        this.initialize();
    }

  async initialize() {
    try {
      await fs.mkdir(this.logsDir, { recursive: true });
    } catch (error) {
      console.error('Errore creazione directory logs:', error.message);
    }
  }

  formatMessage(level, message, data = null) {
    const timestamp = new Date().toISOString();
    let logMessage = `${timestamp} [${level}] ${message}`;
    
    if (data) {
      if (data instanceof Error) {
        logMessage += `\nError: ${data.message}`;
        if (data.stack) logMessage += `\nStack: ${data.stack}`;
      } else {
        try {
          logMessage += ' ' + JSON.stringify(data);
        } catch (e) {
          logMessage += ' ' + String(data);
        }
      }
    }
    
    return logMessage + '\n';
  }

  async rotateLogFile() {
    try {
      const stats = await fs.stat(this.logFile);
      if (stats.size >= this.maxLogSize) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupFile = `${this.logFile}.${timestamp}`;
        await fs.rename(this.logFile, backupFile);

        // Mantieni solo gli ultimi 5 file di backup
        const files = await fs.readdir(this.logsDir);
        const backups = files
          .filter(f => f.startsWith('app.log.'))
          .sort()
          .reverse();

        for (let i = 5; i < backups.length; i++) {
          await fs.unlink(path.join(this.logsDir, backups[i]));
        }
      }
    } catch (error) {
      if (error.code !== 'ENOENT') {
        console.error('Errore rotazione log:', error.message);
      }
    }
  }

  async writeLog(message) {
    try {
      await this.rotateLogFile();
      await fs.appendFile(this.logFile, message);
    } catch (error) {
      console.error('Errore scrittura log:', error.message);
    }
  }

  info(message, data = null) {
    const logMessage = this.formatMessage('INFO', message, data);
    console.log(logMessage);
    this.writeLog(logMessage);
  }

  error(message, error = null) {
    const logMessage = this.formatMessage('ERROR', message, error);
    console.error(logMessage);
    this.writeLog(logMessage);
  }

  warn(message, data = null) {
    const logMessage = this.formatMessage('WARN', message, data);
    console.warn(logMessage);
    this.writeLog(logMessage);
  }

  // Helper per logging richieste HTTP
  request(req, res, responseTime) {
    const data = {
      method: req.method,
      url: req.url,
      status: res.statusCode,
      time: `${responseTime}ms`,
      ip: req.ip || req.connection.remoteAddress
    };

    if (res.statusCode >= 500) {
      this.error('Errore server', data);
    } else if (res.statusCode >= 400) {
      this.warn('Errore client', data);
    } else if (responseTime > 1000) {
      this.warn('Richiesta lenta', data);
    } else {
      this.info('Richiesta completata', data);
    }
  }
}

// Esporta una singola istanza del logger
const logger = new Logger();

// Middleware per logging richieste HTTP
const requestLogger = (req, res, next) => {
  const startTime = Date.now();

  // Override res.end per catturare il momento di risposta
  const originalEnd = res.end;
  res.end = function(chunk, encoding) {
    res.end = originalEnd;
    res.end(chunk, encoding);
    const responseTime = Date.now() - startTime;
    logger.request(req, res, responseTime);
  };

  next();
};

// Middleware per logging errori
const errorLogger = (err, req, res, next) => {
  logger.error('Errore applicazione', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method
  });
  next(err);
};

module.exports = {
  logger,
  requestLogger,
  errorLogger
};

module.exports = {
    logger,
    requestLogger
};
