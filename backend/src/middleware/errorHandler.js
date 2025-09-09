const { logger } = require('./logging');
const config = require('../config/environment');

// Error handler semplificato
const errorHandler = (error, req, res, next) => {
  // Log base dell'errore
  console.error('Errore:', error.message);

  // Determina status code
  let statusCode = error.statusCode || error.status || 500;
  let message = error.message || 'Si è verificato un errore';

  // Mapping errori comuni
  let errorType = 'INTERNAL_ERROR';
  let details = null;

  // Gestione tipi di errore
  if (error.name === 'ValidationError' || statusCode === 400) {
    statusCode = 400;
    message = error.message || 'Dati non validi';
    errorType = 'VALIDATION_ERROR';
    details = error.details;
  } else if (error.name === 'UnauthorizedError' || statusCode === 401) {
    statusCode = 401;
    message = 'Accesso non autorizzato';
    errorType = 'UNAUTHORIZED';
  } else if (statusCode === 403) {
    message = 'Accesso negato';
    errorType = 'FORBIDDEN';
  } else if (error.name === 'NotFoundError' || statusCode === 404) {
    statusCode = 404;
    message = error.message || 'Risorsa non trovata';
    errorType = 'NOT_FOUND';
  }
  
  // Errori di conflitto (es. email già esistente)
  else if (error.name === 'ConflictError' || statusCode === 409) {
    statusCode = 409;
    message = 'Conflitto nei dati';
    errorType = 'CONFLICT';
    details = error.message;
  }
  
  // Errori di rate limiting
  else if (error.name === 'TooManyRequestsError' || statusCode === 429) {
    statusCode = 429;
    message = 'Troppe richieste. Riprova più tardi';
    errorType = 'RATE_LIMIT_EXCEEDED';
  }
  
  // Errori del database
  else if (error.name === 'DatabaseError' || error.code === 'SQLITE_ERROR') {
    statusCode = 500;
    message = 'Errore del database';
    errorType = 'DATABASE_ERROR';
    
    // Log specifico per errori database
    logger.error('Errore database', {
      code: error.code,
      errno: error.errno,
      sql: error.sql,
    });
  }
  
  // Errori di rete/API esterne
  else if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
    statusCode = 503;
    message = 'Servizio temporaneamente non disponibile';
    errorType = 'SERVICE_UNAVAILABLE';
  }
  
  // Errori di timeout
  else if (error.code === 'ETIMEDOUT') {
    statusCode = 408;
    message = 'Richiesta scaduta';
    errorType = 'REQUEST_TIMEOUT';
  }
  
  // Errori JSON malformato
  else if (error.name === 'SyntaxError' && error.message.includes('JSON')) {
    statusCode = 400;
    message = 'Dati JSON non validi';
    errorType = 'INVALID_JSON';
  }
  
  // Errori payload troppo grande
  else if (error.code === 'LIMIT_FILE_SIZE' || error.code === 'LIMIT_PART_COUNT') {
    statusCode = 413;
    message = 'File o richiesta troppo grande';
    errorType = 'PAYLOAD_TOO_LARGE';
  }
  
  // Usa messaggio dell'errore se disponibile e appropriato
  else if (error.message && statusCode < 500) {
    message = error.message;
    errorType = 'CLIENT_ERROR';
  }

  // In produzione, nascondi dettagli errori interni
  if (config.server.nodeEnv === 'production' && statusCode >= 500) {
    message = 'Si è verificato un errore interno';
    details = null;
  } else if (config.server.nodeEnv === 'development') {
    // In sviluppo, aggiungi stack trace
    details = details || error.stack;
  }

  // Log eventi di sicurezza
  if (statusCode === 401 || statusCode === 403) {
    logger.warn('Accesso negato', {
      url: req.url,
      method: req.method,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      error: error.message,
    });
  }

  // Prepara response
  const errorResponse = {
    success: false,
    message,
    error: errorType,
    timestamp: new Date().toISOString(),
  };

  // Aggiungi dettagli se presenti
  if (details) {
    errorResponse.details = details;
  }

  // Aggiungi info per retry se appropriato
  if (statusCode === 429 || statusCode === 503) {
    errorResponse.retryAfter = 60; // secondi
  }

  // Aggiungi correlation ID per tracking
  if (req.correlationId) {
    errorResponse.correlationId = req.correlationId;
  }

  res.status(statusCode).json(errorResponse);
};

// Handler per 404 (rotte non trovate)
const notFoundHandler = (req, res) => {
  logger.warn('Rotta non trovata', {
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  });

  res.status(404).json({
    success: false,
    message: 'Endpoint non trovato',
    error: 'NOT_FOUND',
    timestamp: new Date().toISOString(),
    suggestion: 'Verifica la documentazione API per gli endpoint disponibili',
  });
};

// Wrapper per errori async
const asyncErrorHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Classe per errori personalizzati
class AppError extends Error {
  constructor(message, statusCode = 500, errorType = 'INTERNAL_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.errorType = errorType;
    this.name = 'AppError';
    
    Error.captureStackTrace(this, this.constructor);
  }
}

// Errori specifici dell'applicazione
class ValidationError extends AppError {
  constructor(message, details = null) {
    super(message, 400, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
    this.details = details;
  }
}

class NotFoundError extends AppError {
  constructor(resource = 'Risorsa') {
    super(`${resource} non trovata`, 404, 'NOT_FOUND');
    this.name = 'NotFoundError';
  }
}

class UnauthorizedError extends AppError {
  constructor(message = 'Accesso non autorizzato') {
    super(message, 401, 'UNAUTHORIZED');
    this.name = 'UnauthorizedError';
  }
}

class ForbiddenError extends AppError {
  constructor(message = 'Accesso negato') {
    super(message, 403, 'FORBIDDEN');
    this.name = 'ForbiddenError';
  }
}

class ConflictError extends AppError {
  constructor(message = 'Conflitto nei dati') {
    super(message, 409, 'CONFLICT');
    this.name = 'ConflictError';
  }
}

class RateLimitError extends AppError {
  constructor(message = 'Troppe richieste') {
    super(message, 429, 'RATE_LIMIT_EXCEEDED');
    this.name = 'RateLimitError';
  }
}

class ServiceUnavailableError extends AppError {
  constructor(message = 'Servizio non disponibile') {
    super(message, 503, 'SERVICE_UNAVAILABLE');
    this.name = 'ServiceUnavailableError';
  }
}

// Middleware per generare correlation ID
const correlationIdMiddleware = (req, res, next) => {
  req.correlationId = req.get('X-Correlation-ID') || 
                     `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  res.set('X-Correlation-ID', req.correlationId);
  next();
};

// Middleware per gestire errori unhandled
const unhandledErrorMiddleware = () => {
  // Gestione promise rejection non catturate
  process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Promise Rejection', {
      reason: reason.toString(),
      stack: reason.stack,
      promise: promise.toString(),
    });
    
    // In produzione, non terminare il processo per questo
    if (config.server.nodeEnv !== 'production') {
      process.exit(1);
    }
  });

  // Gestione eccezioni non catturate
  process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception', {
      message: error.message,
      stack: error.stack,
    });
    
    // Termina sempre il processo per uncaught exceptions
    process.exit(1);
  });
};

module.exports = {
  // Middleware principali
  errorHandler,
  notFoundHandler,
  asyncErrorHandler,
  correlationIdMiddleware,
  unhandledErrorMiddleware,
  
  // Classi di errore
  AppError,
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  ConflictError,
  RateLimitError,
  ServiceUnavailableError,
};
