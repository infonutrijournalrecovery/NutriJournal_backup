const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { logger } = require('../middleware/logging');

// Percorso al file del database
const dbPath = path.join(__dirname, '../../data/nutrijournal.db');

// Crea una connessione al database
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    logger.error('Errore connessione al database:', err.message);
    throw err;
  }
  logger.info('Connesso al database SQLite');
});

// Abilita le foreign keys
db.run('PRAGMA foreign_keys = ON');

// Promisify le query al database
const dbAsync = {
  run(sql, params = []) {
    return new Promise((resolve, reject) => {
      db.run(sql, params, function(err) {
        if (err) {
          logger.error('Errore esecuzione query:', { sql, params, error: err.message });
          reject(err);
        } else {
          resolve({ lastID: this.lastID, changes: this.changes });
        }
      });
    });
  },

  get(sql, params = []) {
    return new Promise((resolve, reject) => {
      db.get(sql, params, (err, result) => {
        if (err) {
          logger.error('Errore esecuzione query:', { sql, params, error: err.message });
          reject(err);
        } else {
          resolve(result);
        }
      });
    });
  },

  all(sql, params = []) {
    return new Promise((resolve, reject) => {
      db.all(sql, params, (err, rows) => {
        if (err) {
          logger.error('Errore esecuzione query:', { sql, params, error: err.message });
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }
};

// Funzione per chiudere la connessione
const closeDatabase = () => {
  return new Promise((resolve, reject) => {
    db.close((err) => {
      if (err) {
        logger.error('Errore chiusura database:', err.message);
        reject(err);
      } else {
        logger.info('Connessione database chiusa');
        resolve();
      }
    });
  });
};

module.exports = {
  db: dbAsync,
  closeDatabase
};
