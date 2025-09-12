const bcrypt = require('bcryptjs');
const authConfig = require('../config/auth');

class User {
  /**
   * Calcola il TDEE (Total Daily Energy Expenditure) dell'utente
   * Usa la formula Mifflin-St Jeor
   * @returns {number} TDEE stimato
   */
  calculateTDEE() {
    // Parametri richiesti
    const weight = this.weight; // kg
    const height = this.height; // cm
    // Calcola età
    let age = 30;
    if (this.date_of_birth || this.birthDate) {
      const dob = new Date(this.date_of_birth || this.birthDate);
      const today = new Date();
      age = today.getFullYear() - dob.getFullYear();
      const m = today.getMonth() - dob.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
        age--;
      }
    }
    // Genere
    const gender = (this.gender || '').toLowerCase();
    let bmr;
    if (gender === 'male' || gender === 'm' || gender === 'maschio') {
      bmr = 10 * weight + 6.25 * height - 5 * age + 5;
    } else if (gender === 'female' || gender === 'f' || gender === 'femmina') {
      bmr = 10 * weight + 6.25 * height - 5 * age - 161;
    } else {
      // Default: use male formula
      bmr = 10 * weight + 6.25 * height - 5 * age + 5;
    }
    // Livello di attività
    let activity = 1.2;
    switch ((this.activity_level || this.activityLevel || '').toLowerCase()) {
      case 'sedentary':
        activity = 1.2; break;
      case 'light':
        activity = 1.375; break;
      case 'moderate':
        activity = 1.55; break;
      case 'active':
        activity = 1.725; break;
      case 'very_active':
      case 'very active':
        activity = 1.9; break;
    }
    return Math.round(bmr * activity);
  }
  /**
   * Aggiorna i campi profilo dell'utente
   * @param {Object} updates - Oggetto con i campi da aggiornare
   */
  updateProfile(updates) {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        return reject(new Error('Database connection not initialized'));
      }
      const allowedFields = [
        'name', 'email', 'avatar_path', 'date_of_birth', 'gender',
        'height', 'weight', 'activity_level', 'timezone', 'language'
      ];
      const setClauses = [];
      const values = [];
      for (const key of Object.keys(updates)) {
        if (allowedFields.includes(key)) {
          setClauses.push(`${key} = ?`);
          values.push(updates[key]);
          this[key] = updates[key];
        }
      }
      // Log campi effettivamente aggiornati
      console.log('[DEBUG User.updateProfile] allowedFields:', allowedFields);
      console.log('[DEBUG User.updateProfile] updates ricevuti:', updates);
      console.log('[DEBUG User.updateProfile] setClauses:', setClauses);
      if (setClauses.length === 0) {
        console.error('[DEBUG User.updateProfile] Nessun campo valido da aggiornare!');
        return reject(new Error('Nessun campo valido da aggiornare'));
      }
      setClauses.push('updated_at = ?');
      const now = new Date().toISOString();
      values.push(now);
      values.push(this.id);
      const sql = `UPDATE users SET ${setClauses.join(', ')} WHERE id = ?`;
      console.log('[DEBUG User.updateProfile] SQL:', sql);
      console.log('[DEBUG User.updateProfile] values:', values);
      this.db.run(sql, values, function (err) {
        if (err) {
          console.error('[DEBUG User.updateProfile] Errore SQL:', err);
          // Gestione errore UNIQUE/email duplicata
          if (err.code === 'SQLITE_CONSTRAINT' && err.message && err.message.includes('UNIQUE')) {
            const customErr = new Error('Email già esistente');
            customErr.name = 'ValidationError';
            customErr.details = err.message;
            return reject(customErr);
          }
          return reject(err);
        }
        resolve(true);
      });
    });
  }
  updatePasswordHash(newHash) {
    return new Promise((resolve, reject) => {
      const now = new Date().toISOString();
      if (!this.db) {
        console.error('❌ Database connection not initialized');
        resolve(false);
        return;
      }
      this.db.run(
        `UPDATE ${this.constructor.tableName} SET password_hash = ?, updated_at = ? WHERE id = ?`,
        [newHash, now, this.id],
        (err) => {
          if (err) {
            console.error('❌ Errore aggiornamento password:', err);
            resolve(false);
          } else {
            this.password_hash = newHash;
            this.updated_at = now;
            resolve(true);
          }
        }
      );
    });
  }
  constructor(data = {}, db = null) {
    this.db = db;
    this.id = data.id;
    this.email = data.email;
    this.password_hash = data.password_hash;
    this.name = data.name;
    this.avatar_path = data.avatar_path;
    this.date_of_birth = data.date_of_birth;
    this.gender = data.gender;
    this.height = data.height;
    this.weight = data.weight;
    this.activity_level = data.activity_level;
    this.timezone = data.timezone || 'Europe/Rome';
    this.language = data.language || 'it';
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
    this.last_login = data.last_login;
    this.email_verified = data.email_verified || false;
  }

  static create(data, db) {
    return new Promise((resolve, reject) => {
      if (!db) {
        return reject(new Error('Database connection not provided'));
      }
      const now = new Date().toISOString();
      bcrypt.hash(data.password, authConfig.saltRounds || 10)
        .then(password_hash => {
          const fields = [
            'email', 'password_hash', 'name', 'avatar_path', 'date_of_birth', 'gender',
            'height', 'weight', 'activity_level', 'timezone', 'language',
            'created_at', 'updated_at', 'email_verified'
          ];
          const values = [
            data.email, password_hash, data.name || null, data.avatar_path || null,
            data.date_of_birth || null, data.gender || null, data.height || null,
            data.weight || null, data.activity_level || null, data.timezone || 'Europe/Rome',
            data.language || 'it', now, now, 0
          ];
          const placeholders = fields.map(() => '?').join(', ');
          db.run(
            `INSERT INTO ${this.tableName} (${fields.join(', ')}) VALUES (${placeholders})`,
            values,
            function (err) {
              if (err) {
                console.error('❌ Errore creazione utente:', err);
                return reject(new Error('Errore creazione utente'));
              }
              User.findById(this.lastID, db)
                .then(user => resolve(user))
                .catch(e => reject(e));
            }
          );
        })
        .catch(reject);
    });
  }

  static get tableName() {
    return 'users';
  }

  static findById(id, db) {
    // Se il db non è passato, importa quello globale
    if (!db) {
      db = require('../config/database').sqliteDb;
    }
    return new Promise((resolve, reject) => {
      db.get(
        `SELECT * FROM ${this.tableName} WHERE id = ?`,
        [id],
        (err, row) => {
          if (err) {
            console.error('❌ Errore ricerca utente per ID:', err);
            reject(new Error('Errore ricerca utente'));
          } else {
            if (row) {
              const user = new User(row, db);
              resolve(user);
            } else {
              resolve(null);
            }
          }
        }
      );
    });
  }

  static findByEmail(email, db) {
    return new Promise((resolve, reject) => {
      db.get(
        `SELECT * FROM ${this.tableName} WHERE email = ? COLLATE NOCASE`,
        [email],
        (err, row) => {
          if (err) {
            console.error('❌ Errore ricerca utente per email:', err);
            reject(new Error('Errore ricerca utente'));
          } else {
            if (row) {
              resolve(new User(row, db));
            } else {
              resolve(null);
            }
          }
        }
      );
    });
  }

  verifyPassword(password) {
    return bcrypt.compare(password, this.password_hash);
  }

  toJSON() {
    const user = { ...this };
    delete user.password_hash;
    return user;
  }

  updateLastLogin() {
    return new Promise((resolve, reject) => {
      const now = new Date().toISOString();
      if (!this.db) {
        console.error('❌ Database connection not initialized');
        resolve(false);
        return;
      }
      this.db.run(
        `UPDATE ${this.constructor.tableName} SET last_login = ?, updated_at = ? WHERE id = ?`,
        [now, now, this.id],
        (err) => {
          if (err) {
            console.error('❌ Errore aggiornamento ultimo login:', err);
            resolve(false);
          } else {
            this.last_login = now;
            this.updated_at = now;
            resolve(true);
          }
        }
      );
    });
  }
}

module.exports = User;