const bcrypt = require('bcryptjs');
const authConfig = require('../config/auth');

class User {
  constructor(data = {}, dbConnection = null) {
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

  // Metodi statici per query database
  static get tableName() {
    return 'users';
  }

  static get db() {
    // Fallback al database globale per compatibilità
    if (!this._db) {
      const database = require('../config/database');
      return database.getConnection();
    }
    return this._db;
  }

  static setDatabase(dbConnection) {
    this._db = dbConnection;
  }

  // Trova utente per email
  static async findByEmail(email) {
    try {
      const user = await this.db(this.tableName)
        .where('email', email.toLowerCase())
        .first();
      
      return user ? new User(user) : null;
    } catch (error) {
      console.error('❌ Errore ricerca utente per email:', error);
      throw new Error('Errore ricerca utente');
    }
  }

  // Trova utente per ID
  static async findById(id) {
    try {
      const user = await this.db(this.tableName)
        .where('id', id)
        .first();
      
      return user ? new User(user) : null;
    } catch (error) {
      console.error('❌ Errore ricerca utente per ID:', error);
      throw new Error('Errore ricerca utente');
    }
  }

  // Crea nuovo utente
  static async create(userData) {
    try {
      // Validazione dati base
      if (!userData.email || !userData.password || !userData.name) {
        throw new Error('Email, password e nome sono obbligatori');
      }

      // Verifica se email già esiste
      const existingUser = await this.findByEmail(userData.email);
      if (existingUser) {
        throw new Error('Email già registrata');
      }

      // Hash password
      const password_hash = await bcrypt.hash(userData.password, authConfig.getSaltRounds());

      // Prepara dati per inserimento
      const userToCreate = {
        email: userData.email.toLowerCase(),
        password_hash,
        name: userData.name,
        avatar_path: userData.avatar_path || null,
        date_of_birth: userData.date_of_birth || null,
        gender: userData.gender || null,
        height: userData.height || null,
        weight: userData.weight || null,
        activity_level: userData.activity_level || 'moderate',
        timezone: userData.timezone || 'Europe/Rome',
        language: userData.language || 'it',
        email_verified: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const [userId] = await this.db(this.tableName).insert(userToCreate);
      return await this.findById(userId);
    } catch (error) {
      console.error('❌ Errore creazione utente:', error);
      throw error;
    }
  }

  // Aggiorna utente
  async update(updates) {
    try {
      const allowedFields = [
        'name', 'avatar_path', 'date_of_birth', 'gender', 
        'height', 'weight', 'activity_level', 'timezone', 
        'language', 'email_verified'
      ];

      const filteredUpdates = {};
      Object.keys(updates).forEach(key => {
        if (allowedFields.includes(key)) {
          filteredUpdates[key] = updates[key];
        }
      });

      filteredUpdates.updated_at = new Date().toISOString();

      await User.db(User.tableName)
        .where('id', this.id)
        .update(filteredUpdates);

      // Ricarica dati aggiornati
      Object.assign(this, filteredUpdates);
      return this;
    } catch (error) {
      console.error('❌ Errore aggiornamento utente:', error);
      throw new Error('Errore aggiornamento profilo');
    }
  }

  // Verifica password
  async verifyPassword(password) {
    try {
      return await bcrypt.compare(password, this.password_hash);
    } catch (error) {
      console.error('❌ Errore verifica password:', error);
      return false;
    }
  }

  // Cambia password
  async changePassword(newPassword) {
    try {
      if (!authConfig.isValidPassword(newPassword)) {
        throw new Error('Password non valida. Deve contenere almeno 8 caratteri, una maiuscola e un numero.');
      }

      const password_hash = await bcrypt.hash(newPassword, authConfig.getSaltRounds());
      
      await User.db(User.tableName)
        .where('id', this.id)
        .update({
          password_hash,
          updated_at: new Date().toISOString(),
          reset_token: null,
          reset_token_expires: null,
        });

      this.password_hash = password_hash;
      this.reset_token = null;
      this.reset_token_expires = null;
      
      return true;
    } catch (error) {
      console.error('❌ Errore cambio password:', error);
      throw error;
    }
  }

  // Imposta token reset password
  async setResetToken(token) {
    try {
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 ora
      
      await User.db(User.tableName)
        .where('id', this.id)
        .update({
          reset_token: token,
          reset_token_expires: expiresAt.toISOString(),
          updated_at: new Date().toISOString(),
        });

      this.reset_token = token;
      this.reset_token_expires = expiresAt.toISOString();
      
      return true;
    } catch (error) {
      console.error('❌ Errore impostazione token reset:', error);
      throw new Error('Errore impostazione token reset');
    }
  }

  // Aggiorna ultimo login
  async updateLastLogin() {
    try {
      const now = new Date().toISOString();
      
      await User.db(User.tableName)
        .where('id', this.id)
        .update({
          last_login: now,
          updated_at: now,
        });

      this.last_login = now;
      this.updated_at = now;
      
      return true;
    } catch (error) {
      console.error('❌ Errore aggiornamento ultimo login:', error);
      return false;
    }
  }

  // Calcola BMR (Basal Metabolic Rate)
  calculateBMR() {
    if (!this.weight || !this.height || !this.date_of_birth || !this.gender) {
      return null;
    }

    const age = this.getAge();
    if (!age) return null;

    // Formula di Harris-Benedict rivista
    let bmr;
    if (this.gender === 'male') {
      bmr = 88.362 + (13.397 * this.weight) + (4.799 * this.height) - (5.677 * age);
    } else {
      bmr = 447.593 + (9.247 * this.weight) + (3.098 * this.height) - (4.330 * age);
    }

    return Math.round(bmr);
  }

  // Calcola TDEE (Total Daily Energy Expenditure)
  calculateTDEE() {
    const bmr = this.calculateBMR();
    if (!bmr || !this.activity_level) return null;

    const activityMultipliers = {
      sedentary: 1.2,     // Poco o nessun esercizio
      light: 1.375,       // Esercizio leggero 1-3 giorni/settimana
      moderate: 1.55,     // Esercizio moderato 3-5 giorni/settimana
      active: 1.725,      // Esercizio intenso 6-7 giorni/settimana
      very_active: 1.9,   // Esercizio molto intenso, lavoro fisico
    };

    const multiplier = activityMultipliers[this.activity_level] || 1.55;
    return Math.round(bmr * multiplier);
  }

  // Calcola età
  getAge() {
    if (!this.date_of_birth) return null;
    
    const birthDate = new Date(this.date_of_birth);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  }

  // Calcola BMI
  calculateBMI() {
    if (!this.weight || !this.height) return null;
    
    const heightInMeters = this.height / 100;
    const bmi = this.weight / (heightInMeters * heightInMeters);
    
    return Math.round(bmi * 10) / 10;
  }

  // Ottieni categoria BMI
  getBMICategory() {
    const bmi = this.calculateBMI();
    if (!bmi) return null;

    if (bmi < 18.5) return 'Sottopeso';
    if (bmi < 25) return 'Normopeso';
    if (bmi < 30) return 'Sovrappeso';
    return 'Obesità';
  }

  // Serializza per JSON (rimuove dati sensibili)
  toJSON() {
    const user = { ...this };
    delete user.password_hash;
    delete user.reset_token;
    delete user.reset_token_expires;
    
    // Aggiungi dati calcolati
    user.age = this.getAge();
    user.bmi = this.calculateBMI();
    user.bmi_category = this.getBMICategory();
    user.bmr = this.calculateBMR();
    user.tdee = this.calculateTDEE();
    
    return user;
  }

  // Elimina utente (soft delete o hard delete)
  async delete(hardDelete = false) {
    try {
      if (hardDelete) {
        // Hard delete - rimuove completamente
        await User.db(User.tableName)
          .where('id', this.id)
          .del();
      } else {
        // Soft delete - disattiva account
        await this.update({
          email: `deleted_${Date.now()}_${this.email}`,
          email_verified: false,
        });
      }
      
      return true;
    } catch (error) {
      console.error('❌ Errore eliminazione utente:', error);
      throw new Error('Errore eliminazione account');
    }
  }

  // Statistiche utente
  static async getStats() {
    try {
      const stats = await this.db(this.tableName)
        .select([
          this.db.raw('COUNT(*) as total_users'),
          this.db.raw('COUNT(CASE WHEN email_verified = 1 THEN 1 END) as verified_users'),
          this.db.raw('COUNT(CASE WHEN created_at >= date("now", "-30 days") THEN 1 END) as new_users_30d'),
          this.db.raw('COUNT(CASE WHEN last_login >= date("now", "-7 days") THEN 1 END) as active_users_7d'),
        ])
        .first();

      return stats;
    } catch (error) {
      console.error('❌ Errore statistiche utenti:', error);
      return null;
    }
  }
}

module.exports = User;
