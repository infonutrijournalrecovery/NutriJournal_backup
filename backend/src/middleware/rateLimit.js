const rateLimit = require('express-rate-limit');
const config = require('../config/environment');

// Rate limiting generale per tutte le API
const generalRateLimit = rateLimit({
  windowMs: config.rateLimit.windowMs, // Finestra temporale
  max: (req) => {
    // Rate limit più alto per mobile/Ionic
    const baseLimit = config.rateLimit.maxRequests;
    
    if (req.rateLimit?.mobile) {
      return baseLimit * (req.rateLimit.multiplier || 2);
    }
    
    return baseLimit;
  },
  
  message: {
    success: false,
    message: 'Troppe richieste. Riprova più tardi.',
    error: 'RATE_LIMIT_EXCEEDED',
    retryAfter: Math.ceil(config.rateLimit.windowMs / 1000),
  },

  // Headers di risposta
  standardHeaders: true,
  legacyHeaders: false,

  // Personalizza identificazione client
  keyGenerator: (req) => {
    // Combina IP e User-Agent per identificazione più precisa
    const ip = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent') || '';
    
    // Per app mobile, usa identificatori più stabili
    if (req.device?.isMobile) {
      return `mobile_${ip}_${userAgent.substring(0, 50)}`;
    }
    
    return `web_${ip}`;
  },

  // Skip per certe condizioni
  skip: (req) => {
    // Salta rate limiting per health check
    if (req.path === '/health') return true;
    
    // Salta per requests interni
    if (req.ip === '127.0.0.1' || req.ip === '::1') {
      return config.server.nodeEnv === 'development';
    }
    
    return false;
  },
});

// Rate limiting specifico per autenticazione
const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minuti
  max: 10, // Max 10 tentativi di login per IP in 15 minuti
  
  message: {
    success: false,
    message: 'Troppi tentativi di login. Riprova tra 15 minuti.',
    error: 'AUTH_RATE_LIMIT_EXCEEDED',
    retryAfter: 15 * 60,
  },

  standardHeaders: true,
  legacyHeaders: false,
  
  // Solo per requests di login/register falliti
  skipSuccessfulRequests: true,
  
  keyGenerator: (req) => {
    const ip = req.ip || req.connection.remoteAddress;
    return `auth_${ip}`;
  },
});

// Rate limiting per email (reset password, etc.)
const emailRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 ora
  max: config.rateLimit.emailMaxRequests, // Max 5 email per ora per IP
  
  message: {
    success: false,
    message: 'Troppe richieste email. Riprova tra 1 ora.',
    error: 'EMAIL_RATE_LIMIT_EXCEEDED',
    retryAfter: 60 * 60,
  },

  standardHeaders: true,
  legacyHeaders: false,
  
  keyGenerator: (req) => {
    const ip = req.ip || req.connection.remoteAddress;
    const email = req.body?.email || '';
    
    // Combina IP e email per prevenire abuse
    return `email_${ip}_${email}`;
  },
});

// Rate limiting per ricerca prodotti (OpenFoodFacts)
const searchRateLimit = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minuto
  max: (req) => {
    // Limite più basso per ricerche online
    if (req.path.includes('search-online')) {
      return 20; // Max 20 ricerche online al minuto
    }
    
    return 100; // Max 100 ricerche locali al minuto
  },
  
  message: {
    success: false,
    message: 'Troppe ricerche. Rallenta un po\'.',
    error: 'SEARCH_RATE_LIMIT_EXCEEDED',
    retryAfter: 60,
  },

  standardHeaders: true,
  legacyHeaders: false,
  
  keyGenerator: (req) => {
    const ip = req.ip || req.connection.remoteAddress;
    const userId = req.userId || 'anonymous';
    return `search_${ip}_${userId}`;
  },
});

// Rate limiting per upload/modifiche
const uploadRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minuti
  max: 50, // Max 50 upload/modifiche in 15 minuti
  
  message: {
    success: false,
    message: 'Troppe modifiche. Riprova tra 15 minuti.',
    error: 'UPLOAD_RATE_LIMIT_EXCEEDED',
    retryAfter: 15 * 60,
  },

  standardHeaders: true,
  legacyHeaders: false,
  
  keyGenerator: (req) => {
    const ip = req.ip || req.connection.remoteAddress;
    const userId = req.userId || 'anonymous';
    return `upload_${ip}_${userId}`;
  },
});

// Rate limiting per API esterne (traduzioni)
const externalApiRateLimit = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minuto
  max: 10, // Max 10 chiamate a API esterne al minuto
  
  message: {
    success: false,
    message: 'Troppe richieste di traduzione. Riprova tra 1 minuto.',
    error: 'TRANSLATION_RATE_LIMIT_EXCEEDED',
    retryAfter: 60,
  },

  standardHeaders: true,
  legacyHeaders: false,
  
  keyGenerator: (req) => {
    const ip = req.ip || req.connection.remoteAddress;
    const userId = req.userId || 'anonymous';
    return `translation_${ip}_${userId}`;
  },
});

// Middleware per logging rate limit events
const rateLimitLogger = (req, res, next) => {
  const originalSend = res.send;
  
  res.send = function(body) {
    // Log se response contiene rate limit error
    if (res.statusCode === 429) {
      console.warn(`🚫 Rate limit: ${req.method} ${req.path} from ${req.ip}`);
    }
    
    originalSend.call(this, body);
  };
  
  next();
};

// Configurazione rate limit dinamica basata su carico server
const dynamicRateLimit = (baseLimit) => {
  return rateLimit({
    windowMs: config.rateLimit.windowMs,
    max: (req) => {
      // In sviluppo, più permissivo
      if (config.server.nodeEnv === 'development') {
        return baseLimit * 5;
      }
      
      // Calcola carico server (semplificato)
      const memUsage = process.memoryUsage();
      const memPercent = memUsage.rss / (1024 * 1024 * 1024); // GB
      
      // Riduci rate limit se memoria alta
      if (memPercent > 0.8) {
        return Math.floor(baseLimit * 0.5);
      } else if (memPercent > 0.6) {
        return Math.floor(baseLimit * 0.7);
      }
      
      return baseLimit;
    },
    
    message: {
      success: false,
      message: 'Server sotto carico. Riprova più tardi.',
      error: 'SERVER_OVERLOAD',
    },
  });
};

// Rate limiting per IP sospetti
const suspiciousActivityRateLimit = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 ore
  max: 1000, // Max 1000 requests totali per IP in 24h
  
  message: {
    success: false,
    message: 'Attività sospetta rilevata. Contatta il supporto.',
    error: 'SUSPICIOUS_ACTIVITY',
  },

  standardHeaders: false,
  legacyHeaders: false,
  
  keyGenerator: (req) => {
    return `suspicious_${req.ip}`;
  },
  
  // Applica solo se si superano certe soglie
  skip: (req) => {
    // Skip per IPs locali in sviluppo
    if (config.server.nodeEnv === 'development' && 
        (req.ip === '127.0.0.1' || req.ip === '::1')) {
      return true;
    }
    
    return false;
  },
});

// Funzione helper per applicare rate limit per tipo
const applyRateLimit = (type) => {
  const rateLimiters = {
    general: generalRateLimit,
    auth: authRateLimit,
    email: emailRateLimit,
    search: searchRateLimit,
    upload: uploadRateLimit,
    externalApi: externalApiRateLimit,
    suspicious: suspiciousActivityRateLimit,
  };

  return rateLimiters[type] || generalRateLimit;
};

module.exports = {
  general: generalRateLimit,
  auth: authRateLimit,
  email: emailRateLimit,
  search: searchRateLimit,
  upload: uploadRateLimit,
  externalApi: externalApiRateLimit,
  logger: rateLimitLogger,
  dynamic: dynamicRateLimit,
  suspicious: suspiciousActivityRateLimit,
  applyRateLimit,
};
