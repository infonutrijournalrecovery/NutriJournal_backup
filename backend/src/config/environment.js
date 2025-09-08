require('dotenv').config();

// Validazione variabili d'ambiente critiche
const validateEnv = () => {
  if (process.env.NODE_ENV === 'production') {
    const requiredEnvVars = ['JWT_SECRET'];
    const missing = requiredEnvVars.filter(varName => !process.env[varName]);
    
    if (missing.length > 0) {
      console.warn(`⚠️ Attenzione: Mancano le seguenti variabili d'ambiente: ${missing.join(', ')}`);
      console.warn('Il sistema userà valori di fallback per test/sviluppo');
    }
  }
};

validateEnv();

module.exports = {
  // Database configuration
  database: {
    path: process.env.DATABASE_PATH || './data/nutrijournal.db',
    imagesPath: process.env.IMAGES_PATH || './images/',
  },

  // Server configuration
  server: {
    port: process.env.PORT || 3000,
    host: process.env.HOST || 'localhost',
    nodeEnv: process.env.NODE_ENV || 'development',
  },

  // Authentication configuration
  auth: {
    jwtSecret: process.env.JWT_SECRET || 'fallback_secret_key',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
    saltRounds: parseInt(process.env.SALT_ROUNDS) || 12,
  },

  // Email configuration
  email: {
    smtp: {
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    },
    from: {
      email: process.env.FROM_EMAIL || 'noreply@nutrijournal.local',
      name: process.env.FROM_NAME || 'NutriJournal',
    },
  },

  // External APIs
  externalApis: {
    openFoodFacts: {
      baseUrl: process.env.OPENFOODFACTS_API_URL || 'https://world.openfoodfacts.org/api/v0',
      userAgent: process.env.OPENFOODFACTS_USER_AGENT || 'NutriJournal/1.0',
    },
    translation: {
      apiKey: process.env.TRANSLATION_API_KEY,
    },
  },

  // CORS configuration
  cors: {
    origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : [
      'http://localhost:8100',
      'http://localhost:4200',
      'http://localhost:8080',
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept-Language'],
  },

  // Cache configuration
  cache: {
    productsTtl: parseInt(process.env.CACHE_PRODUCTS_TTL) || 3600, // 1 ora
    imagesTtl: parseInt(process.env.CACHE_IMAGES_TTL) || 86400, // 1 giorno
    maxSize: parseInt(process.env.MAX_CACHE_SIZE) || 1000,
  },

  // Rate limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minuti
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
    emailMaxRequests: parseInt(process.env.RATE_LIMIT_EMAIL_MAX) || 5,
  },

  // Application settings
  app: {
    locale: 'it',
    timezone: 'Europe/Rome',
    currency: 'EUR',
    defaultCalories: 2000,
    defaultMacros: {
      carbs: 50, // percentuale
      proteins: 20, // percentuale  
      fats: 30, // percentuale
    },
  },
};
