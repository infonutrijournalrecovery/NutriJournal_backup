const bcrypt = require('bcryptjs');
const authConfig = require('../config/auth');

class User {
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
    this.reset_token = data.reset_token;
    this.reset_token_expires = data.reset_token_expires;
  }

  static get tableName() {
    return 'users';
  }

  static findById(id, db) {
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
              const user = new User(row);
              user.db = db;
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
              const user = new User(row);
              user.db = db;
              resolve(user);
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
    delete user.reset_token;
    delete user.reset_token_expires;
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
