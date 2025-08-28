require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const path = require('path');
const fs = require('fs');

// Configurazioni
const config = require('./config/environment');
const database = require('./config/database');
const emailConfig = require('./config/email');

// Import security middleware
const {
    rateLimits,
    corsOptions,
    helmetOptions,
    sanitizeInput,
    securityLogger,
    checkBlockedIPs,
    errorHandler: securityErrorHandler
} = require('./middleware/security');

// Import monitoring service
const monitoringService = require('./services/monitoringService');

// Middleware legacy
const authMiddleware = require('./middleware/auth');
const rateLimitMiddleware = require('./middleware/rateLimit');
const { corsMiddleware } = require('./middleware/cors');
const { httpLoggingMiddleware } = require('./middleware/logging');
const { errorHandler } = require('./middleware/errorHandler');

// Routes (tutte implementate)
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const productRoutes = require('./routes/products');
const mealRoutes = require('./routes/meals');
const nutritionRoutes = require('./routes/nutrition');
const italianFoodRoutes = require('./routes/italian-food');
const activityRoutes = require('./routes/activities');
const analyticsRoutes = require('./routes/analytics');
const pantryRoutes = require('./routes/pantry');

class NutriJournalServer {
  constructor() {
    this.app = express();
    this.port = config.server.port;
    this.host = config.server.host;
    this.server = null;
  }

  // Inizializza server
  async initialize() {
    try {
      console.log('🚀 Inizializzazione NutriJournal Backend...');

      // Inizializza database
      await database.initialize();
      console.log('✅ Database inizializzato');

      // Inizializza configurazione email
      await emailConfig.initialize();
      console.log('✅ Configurazione email inizializzata');

      // Configura middleware di sicurezza
      this.setupSecurityMiddleware();

      // Configura middleware di base
      this.setupBaseMiddleware();

      // Configura routes
      this.setupRoutes();

      // Configura error handling
      this.setupErrorHandling();

      // Configura static files
      this.setupStaticFiles();

      console.log('✅ Server configurato correttamente');

      return this.app;
    } catch (error) {
      console.error('❌ Errore inizializzazione server:', error);
      throw error;
    }
  }

  // Configura middleware di sicurezza
  setupSecurityMiddleware() {
    // Controllo IP bloccati
    this.app.use(checkBlockedIPs);

    // Helmet per headers di sicurezza (configurazione avanzata)
    this.app.use(helmet(helmetOptions));

    // CORS configurato per Ionic (usa nuova configurazione)
    this.app.use(cors(corsOptions));

    // Rate limiting avanzato
    this.app.use(rateLimits.general);

    // Security logging
    this.app.use(securityLogger);

    // Input sanitization
    this.app.use(sanitizeInput);
  }

  // Configura middleware di base
  setupBaseMiddleware() {
    // Compression
    this.app.use(compression());
    
    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Monitoring middleware
    this.app.use(monitoringService.trackRequest());

    // Logging
    this.app.use(httpLoggingMiddleware);

    // Trust proxy (per Heroku, nginx, etc.)
    this.app.set('trust proxy', 1);
  }

  // Configura routes API
  setupRoutes() {
    // Health check base
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        environment: config.server.nodeEnv,
        database: 'Connected',
        email: emailConfig.isEmailConfigured ? 'Configured' : 'Not configured',
      });
    });

    // Health check avanzato con metriche
    this.app.get('/health/detailed', (req, res) => {
      const healthMetrics = monitoringService.getHealthMetrics();
      res.json({
        service: 'NutriJournal Backend',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        environment: config.server.nodeEnv,
        database: 'Connected',
        email: emailConfig.isEmailConfigured ? 'Configured' : 'Not configured',
        ...healthMetrics
      });
    });

    // Endpoint metriche (solo in development)
    if (config.server.nodeEnv === 'development') {
      this.app.get('/metrics', (req, res) => {
        const metrics = monitoringService.getMetrics();
        res.json(metrics);
      });
    }

    // API Info
    this.app.get('/api', (req, res) => {
      res.json({
        name: 'NutriJournal Backend API',
        version: '1.0.0',
        description: 'API locale per tracciamento nutrizionale italiano',
        documentation: '/api/docs',
        features: [
          'Autenticazione JWT locale',
          'Database prodotti con OpenFoodFacts',
          'Traduzioni automatiche in italiano',
          'Tracciamento pasti e nutrizione',
          'Gestione attività fisiche',
          'Analytics avanzati e trend',
          'Gestione dispensa e ricette',
          'Lista spesa intelligente',
          'Database alimenti italiani',
          'Gestione allergeni e additivi',
          'Reset password via email',
        ],
        locale: 'it',
        timezone: 'Europe/Rome',
      });
    });

    // API Routes (tutte implementate)
    this.app.use('/api/auth', authRoutes);
    this.app.use('/api/users', userRoutes);
    this.app.use('/api/products', productRoutes);
    this.app.use('/api/meals', mealRoutes);
    this.app.use('/api/nutrition', nutritionRoutes);
    this.app.use('/api/italian-food', italianFoodRoutes);
    this.app.use('/api/activities', activityRoutes);
    this.app.use('/api/analytics', analyticsRoutes);
    this.app.use('/api/pantry', pantryRoutes);

    // 404 handler per API
    this.app.use('/api/*', (req, res) => {
      res.status(404).json({
        success: false,
        message: 'Endpoint API non trovato',
        error: 'NOT_FOUND',
      });
    });
  }

  // Configura gestione errori
  setupErrorHandling() {
    // 404 handler generale
    this.app.use('*', (req, res) => {
      res.status(404).json({
        success: false,
        message: 'Risorsa non trovata',
        error: 'NOT_FOUND',
      });
    });

    // Error handler globale avanzato
    this.app.use(securityErrorHandler);
  }

  // Configura static files
  setupStaticFiles() {
    // Crea directory per upload se non esistono
    const uploadsDir = path.join(__dirname, '..', 'uploads');
    const avatarsDir = path.join(uploadsDir, 'avatars');
    
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
      console.log('📁 Creata directory uploads');
    }
    if (!fs.existsSync(avatarsDir)) {
      fs.mkdirSync(avatarsDir, { recursive: true });
      console.log('📁 Creata directory avatars');
    }

    // Serve file di upload (avatars, etc.)
    this.app.use('/uploads', express.static(uploadsDir));

    // Serve immagini prodotti
    const imagesPath = path.join(__dirname, '..', 'images');
    if (fs.existsSync(imagesPath)) {
      this.app.use('/images', express.static(imagesPath));
    }

    // Serve documentazione API (se esiste)
    const docsPath = path.join(__dirname, '..', 'docs', 'public');
    if (fs.existsSync(docsPath)) {
      this.app.use('/api/docs', express.static(docsPath));
    }
  }

  // Avvia server
  async start() {
    try {
      await this.initialize();

      this.server = this.app.listen(this.port, this.host, () => {
        console.log(`
🍎 NutriJournal Backend avviato con successo!

📍 Server: http://${this.host}:${this.port}
📍 API: http://${this.host}:${this.port}/api
📍 Health: http://${this.host}:${this.port}/health
📍 Docs: http://${this.host}:${this.port}/api/docs

🌍 Ambiente: ${config.server.nodeEnv}
🇮🇹 Locale: ${config.app.locale}
📧 Email: ${emailConfig.isEmailConfigured ? 'Configurata' : 'Non configurata'}
🔧 Database: SQLite locale

Pronto per connessioni Ionic! 🚀
        `);
      });

      // Gestione graceful shutdown
      this.setupGracefulShutdown();

      return this.server;
    } catch (error) {
      console.error('❌ Errore avvio server:', error);
      process.exit(1);
    }
  }

  // Configura graceful shutdown
  setupGracefulShutdown() {
    const gracefulShutdown = async (signal) => {
      console.log(`\n💫 Ricevuto segnale ${signal}. Arresto graceful del server...`);

      if (this.server) {
        this.server.close(async () => {
          console.log('🔌 Server HTTP chiuso');

          try {
            await database.close();
            console.log('💾 Database disconnesso');

            console.log('✅ Shutdown completato correttamente');
            process.exit(0);
          } catch (error) {
            console.error('❌ Errore durante shutdown:', error);
            process.exit(1);
          }
        });

        // Force close dopo 10 secondi
        setTimeout(() => {
          console.log('⚠️ Shutdown forzato dopo timeout');
          process.exit(1);
        }, 10000);
      } else {
        process.exit(0);
      }
    };

    // Ascolta segnali di shutdown
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Gestione errori non catturati
    process.on('uncaughtException', (error) => {
      console.error('❌ Uncaught Exception:', error);
      gracefulShutdown('UNCAUGHT_EXCEPTION');
    });

    process.on('unhandledRejection', (reason, promise) => {
      console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
      gracefulShutdown('UNHANDLED_REJECTION');
    });
  }

  // Ottieni app Express (per testing)
  getApp() {
    return this.app;
  }

  // Ferma server (per testing)
  async stop() {
    if (this.server) {
      return new Promise((resolve) => {
        this.server.close(async () => {
          await database.close();
          resolve();
        });
      });
    }
  }
}

// Avvia server se questo file è eseguito direttamente
if (require.main === module) {
  const server = new NutriJournalServer();
  server.start().catch((error) => {
    console.error('❌ Errore critico:', error);
    process.exit(1);
  });
}

module.exports = NutriJournalServer;
