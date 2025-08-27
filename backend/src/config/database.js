const knex = require('knex');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const config = require('./environment');

// Import modelli
const User = require('../models/User');
const Product = require('../models/Product');
const Meal = require('../models/Meal');
const NutritionGoal = require('../models/NutritionGoal');
const Activity = require('../models/Activity');
const Analytics = require('../models/Analytics');
const Pantry = require('../models/Pantry');

// Configurazione database SQLite
const dbConfig = {
  client: 'sqlite3',
  connection: {
    filename: config.database.path,
  },
  useNullAsDefault: true,
  migrations: {
    directory: path.join(__dirname, '../database/migrations'),
  },
  seeds: {
    directory: path.join(__dirname, '../database/seeds'),
  },
  pool: {
    min: 1,
    max: 10,
    acquireTimeoutMillis: 60000,
    createTimeoutMillis: 30000,
    destroyTimeoutMillis: 5000,
    idleTimeoutMillis: 30000,
    reapIntervalMillis: 1000,
    createRetryIntervalMillis: 100,
  },
};

// Ottimizzazioni SQLite per performance
const pragmaQueries = [
  'PRAGMA journal_mode = WAL',
  'PRAGMA synchronous = NORMAL', 
  'PRAGMA cache_size = 10000',
  'PRAGMA temp_store = MEMORY',
  'PRAGMA foreign_keys = ON',
];

class Database {
  constructor() {
    this.db = null;
    this.sqliteDb = null;
    this.models = {};
  }

  async initialize() {
    try {
      // Crea la directory del database se non esiste
      const dbDir = path.dirname(config.database.path);
      if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
      }

      // Inizializza connessione SQLite3 nativa
      this.sqliteDb = new sqlite3.Database(config.database.path);

      // Applica ottimizzazioni SQLite
      for (const pragma of pragmaQueries) {
        await new Promise((resolve, reject) => {
          this.sqliteDb.run(pragma, (err) => {
            if (err) reject(err);
            else resolve();
          });
        });
      }

      // Inizializza modelli
      await this.initializeModels();

      // Inizializza anche Knex per compatibilità
      this.db = knex(dbConfig);

      console.log('✅ Database SQLite inizializzato correttamente');
      return this.db;
    } catch (error) {
      console.error('❌ Errore inizializzazione database:', error);
      throw error;
    }
  }

  async initializeModels() {
    try {
      // Inizializza tutti i modelli
      this.models.user = new User(this.sqliteDb);
      this.models.product = new Product(this.sqliteDb);
      this.models.meal = new Meal(this.sqliteDb);
      this.models.nutritionGoal = new NutritionGoal(this.sqliteDb);
      this.models.activity = new Activity(this.sqliteDb);
      this.models.analytics = new Analytics(this.sqliteDb);
      this.models.pantry = new Pantry(this.sqliteDb);

      console.log('✅ Tutti i modelli configurati');
    } catch (error) {
      console.error('❌ Errore inizializzazione modelli:', error);
      throw error;
    }
  }

  getConnection() {
    if (!this.db) {
      throw new Error('Database non inizializzato. Chiamare initialize() prima.');
    }
    return this.db;
  }

  async close() {
    if (this.sqliteDb) {
      await new Promise((resolve) => {
        this.sqliteDb.close((err) => {
          if (err) console.error('❌ Errore chiusura SQLite:', err);
          resolve();
        });
      });
      console.log('🔌 Connessione SQLite chiusa');
    }
    
    if (this.db) {
      await this.db.destroy();
      console.log('🔌 Connessione Knex chiusa');
    }
  }

  // Test connessione database
  async testConnection() {
    try {
      await this.db.raw('SELECT 1');
      return true;
    } catch (error) {
      console.error('❌ Test connessione database fallito:', error);
      return false;
    }
  }

  // Backup database
  async backup(backupPath) {
    try {
      const fs = require('fs').promises;
      await fs.copyFile(config.database.path, backupPath);
      console.log(`💾 Backup database creato: ${backupPath}`);
    } catch (error) {
      console.error('❌ Errore creazione backup:', error);
      throw error;
    }
  }

  // Statistiche database
  async getStats() {
    try {
      const tables = await this.db.raw(`
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name NOT LIKE 'sqlite_%'
      `);

      const stats = {};
      for (const table of tables) {
        const count = await this.db(table.name).count('* as count').first();
        stats[table.name] = count.count;
      }

      return stats;
    } catch (error) {
      console.error('❌ Errore recupero statistiche database:', error);
      return {};
    }
  }
}

// Singleton instance
const database = new Database();

module.exports = database;
