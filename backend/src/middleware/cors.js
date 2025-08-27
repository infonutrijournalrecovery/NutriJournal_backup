const cors = require('cors');
const config = require('../config/environment');

// Configurazione CORS per supporto Ionic multi-platform
const corsOptions = {
  // Origins permessi (Ionic dev server, build, deploy)
  origin: function (origin, callback) {
    // Permetti requests senza origin (mobile apps, Postman)
    if (!origin) return callback(null, true);

    // Lista degli origins permessi
    const allowedOrigins = [
      ...config.cors.origin,
      'http://localhost:8100',    // Ionic serve default
      'http://localhost:4200',    // Angular serve default
      'http://localhost:8080',    // Build production
      'https://localhost:8100',   // HTTPS locale
      'https://localhost:4200',   // HTTPS locale
      'file://',                  // App mobile Cordova/Capacitor
      'ionic://localhost',        // Ionic Capacitor iOS
      'http://localhost',         // Ionic Capacitor Android
    ];

    // Permetti anche pattern dinamici per sviluppo
    const isAllowed = allowedOrigins.includes(origin) ||
                     origin.startsWith('http://localhost:') ||
                     origin.startsWith('https://localhost:') ||
                     origin.startsWith('ionic://') ||
                     origin.startsWith('capacitor://') ||
                     origin.startsWith('file://');

    if (isAllowed) {
      callback(null, true);
    } else {
      console.warn(`⚠️ CORS: Origin non permesso: ${origin}`);
      callback(new Error(`CORS: Origin non permesso: ${origin}`));
    }
  },

  // Credenziali permesse per JWT cookies
  credentials: true,

  // Metodi HTTP permessi
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],

  // Headers permessi
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'Access-Control-Allow-Credentials',
    'Accept-Language',
    'X-Device-Type',
    'X-App-Version',
  ],

  // Headers esposti al client
  exposedHeaders: [
    'X-Total-Count',
    'X-Page-Count',
    'X-Current-Page',
    'X-Rate-Limit-Remaining',
    'X-Rate-Limit-Reset',
  ],

  // Preflight cache
  maxAge: 86400, // 24 ore

  // Gestione OPTIONS preflight
  preflightContinue: false,
  optionsSuccessStatus: 200,
};

// Middleware CORS personalizzato con logging
const corsMiddleware = (req, res, next) => {
  // Log per debug in sviluppo
  if (config.server.nodeEnv === 'development') {
    console.log(`🌐 CORS: ${req.method} ${req.path} from ${req.get('Origin') || 'no origin'}`);
  }

  // Headers personalizzati per Ionic
  res.header('Access-Control-Allow-Origin', req.get('Origin') || '*');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Vary', 'Origin');

  // Headers specifici per mobile apps
  if (req.get('X-Device-Type')) {
    res.header('X-Device-Support', 'true');
  }

  // Gestione preflight OPTIONS
  if (req.method === 'OPTIONS') {
    res.header('Access-Control-Allow-Methods', corsOptions.methods.join(','));
    res.header('Access-Control-Allow-Headers', corsOptions.allowedHeaders.join(','));
    res.header('Access-Control-Max-Age', corsOptions.maxAge.toString());
    return res.sendStatus(200);
  }

  // Applica CORS standard
  cors(corsOptions)(req, res, next);
};

// Middleware per device detection
const deviceDetectionMiddleware = (req, res, next) => {
  const userAgent = req.get('User-Agent') || '';
  const deviceType = req.get('X-Device-Type');

  // Determina tipo di device
  let detectedDevice = 'web';
  
  if (deviceType) {
    detectedDevice = deviceType.toLowerCase();
  } else if (userAgent.includes('Ionic')) {
    detectedDevice = 'ionic';
  } else if (userAgent.includes('Capacitor')) {
    detectedDevice = 'mobile';
  } else if (userAgent.includes('Cordova')) {
    detectedDevice = 'mobile';
  } else if (/Mobile|Android|iPhone|iPad/.test(userAgent)) {
    detectedDevice = 'mobile';
  } else if (/Tablet|iPad/.test(userAgent)) {
    detectedDevice = 'tablet';
  }

  // Aggiungi info device alla request
  req.device = {
    type: detectedDevice,
    userAgent: userAgent,
    isIonic: userAgent.includes('Ionic') || deviceType === 'ionic',
    isMobile: ['mobile', 'ionic'].includes(detectedDevice),
    isTablet: detectedDevice === 'tablet',
    isDesktop: detectedDevice === 'web',
  };

  // Header di risposta per debug
  res.header('X-Detected-Device', detectedDevice);

  next();
};

// CORS specifico per OpenFoodFacts proxy
const openFoodFactsCorsMiddleware = (req, res, next) => {
  // Headers specifici per proxy OpenFoodFacts
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  
  next();
};

// Middleware per rate limiting basato su origin
const originBasedRateLimit = (req, res, next) => {
  const origin = req.get('Origin');
  
  // Rate limiting più permissivo per app mobile/Ionic
  if (origin && (
    origin.startsWith('ionic://') ||
    origin.startsWith('capacitor://') ||
    origin.startsWith('file://') ||
    req.device.isMobile
  )) {
    req.rateLimit = {
      mobile: true,
      multiplier: 2, // Doppio rate limit per mobile
    };
  }
  
  next();
};

// Configurazione CORS per ambienti diversi
const getCorsConfig = (environment) => {
  const baseConfig = { ...corsOptions };
  
  if (environment === 'production') {
    // In produzione, più restrittivo
    baseConfig.origin = config.cors.origin.filter(origin => 
      !origin.includes('localhost')
    );
  } else if (environment === 'development') {
    // In sviluppo, più permissivo
    baseConfig.origin = true; // Permetti tutti gli origins
  }
  
  return baseConfig;
};

module.exports = {
  corsMiddleware,
  deviceDetectionMiddleware,
  openFoodFactsCorsMiddleware,
  originBasedRateLimit,
  getCorsConfig,
  corsOptions,
};
