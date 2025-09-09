require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const fs = require('fs');
const { logger } = require('./middleware/logging');

// Configurazioni
const config = require('./config/environment');
const database = require('./config/database');
const emailConfig = require('./config/email');

// Middleware
const { requestLogger } = require('./middleware/logging');
const { rateLimiter, corsOptions, helmetConfig } = require('./middleware/securityMiddleware');

const authMiddleware = require('./middleware/auth');
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
const createPantryRouter = require('./routes/pantry');

class NutriJournalServer {
  constructor() {
    this.app = express();
    this.port = config.server.port;
    this.database = database;
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

      // Forza la creazione della tabella nutrition_trends se non esiste
      if (database.sqliteDb) {
        database.sqliteDb.run(`
          CREATE TABLE IF NOT EXISTS nutrition_trends (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            date DATE NOT NULL,
            calories_consumed DECIMAL(8,2) DEFAULT 0,
            calories_goal DECIMAL(8,2) DEFAULT 0,
            calories_burned DECIMAL(8,2) DEFAULT 0,
            proteins_consumed DECIMAL(8,2) DEFAULT 0,
            proteins_goal DECIMAL(8,2) DEFAULT 0,
            carbs_consumed DECIMAL(8,2) DEFAULT 0,
            carbs_goal DECIMAL(8,2) DEFAULT 0,
            fats_consumed DECIMAL(8,2) DEFAULT 0,
            fats_goal DECIMAL(8,2) DEFAULT 0,
            fiber_consumed DECIMAL(8,2) DEFAULT 0,
            water_consumed DECIMAL(8,2) DEFAULT 0,
            meals_count INTEGER DEFAULT 0,
            activities_count INTEGER DEFAULT 0,
            weight_kg DECIMAL(5,2),
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
            UNIQUE(user_id, date)
          )
        `, (err) => {
          if (err) {
            console.error('❌ Errore creazione tabella nutrition_trends:', err);
          } else {
            console.log('✅ Tabella nutrition_trends creata/verificata');
          }
        });
      }

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

      // Imposta logging base
      if (process.env.NODE_ENV !== 'test') {
        this.app.use((req, res, next) => {
          console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
          next();
        });
      }

      console.log('✅ Server configurato correttamente');

      return this.app;
    } catch (error) {
      console.error('❌ Errore inizializzazione server:', error);
      throw error;
    }
  }

  // Configura middleware di sicurezza base
  setupSecurityMiddleware() {
    // Helmet per headers di sicurezza base
    this.app.use(helmetConfig);

    // CORS configurato per Ionic
    this.app.use(cors());

    // Rate limiting base
    this.app.use(rateLimiter);

    // Security logging
    this.app.use((req, res, next) => {
      logger.info('Security check passed', {
        method: req.method,
        path: req.path,
        ip: req.ip
      });
      next();
    });
  }

  // Configura middleware di base
  setupBaseMiddleware() {
    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // DEBUG: logga ogni req.body ricevuto
    this.app.use((req, res, next) => {
      if (req.body && Object.keys(req.body).length > 0) {
        console.log('DEBUG GLOBAL req.body:', req.method, req.path, req.body);
      }
      next();
    });

    // Request logging
    this.app.use(requestLogger);

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

    // Health check avanzato
    this.app.get('/health/detailed', (req, res) => {
      res.json({
        service: 'NutriJournal Backend',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        environment: config.server.nodeEnv,
        database: 'Connected',
        email: emailConfig.isEmailConfigured ? 'Configured' : 'Not configured',
        uptime: process.uptime(),
        memory: process.memoryUsage()
      });
    });

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
  // Inizializza pantry router con db solo dopo che il db è pronto
  const pantryRouter = createPantryRouter(this.database.sqliteDb);
  this.app.use('/api/pantry', pantryRouter);

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
    
    // Error handler globale che gestisce anche gli errori di sicurezza
    this.app.use(errorHandler);
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

  // Avvia il server
  async start() {
    await this.initialize();
    return new Promise((resolve) => {
      this.server = this.app.listen(this.port, () => {
        console.log(`🚀 Server avviato su http://${this.host}:${this.port}`);
        resolve(this.server);
      });
    });
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
