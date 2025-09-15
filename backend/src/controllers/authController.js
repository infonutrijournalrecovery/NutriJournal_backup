const bcrypt = require('bcryptjs');
const User = require('../models/User');
const authConfig = require('../config/auth');
const emailConfig = require('../config/email');
const database = require('../config/database');
const { ValidationError, UnauthorizedError, ConflictError, NotFoundError } = require('../middleware/errorHandler');
const { logger } = require('../middleware/logging');

class AuthController {

  // Cambio password utente autenticato
  static async changePassword(req, res, next) {
    console.log('>>> [DEBUG] ENTERED changePassword TOP (lines 12-60)');
    try {
      // DEBUG: logga il body ricevuto
      console.log('DEBUG changePassword req.body:', req.body);
      const user = req.user;
      const { currentPassword, newPassword } = req.body;
      // Log valori estratti
      console.log('DEBUG controller currentPassword:', currentPassword, 'newPassword:', newPassword);
      // Controllo robusto: stringhe vuote/spazi
      if (!currentPassword || !newPassword || !currentPassword.trim() || !newPassword.trim()) {
        throw new ValidationError('Password attuale e nuova password sono obbligatorie');
      }
      // Verifica password attuale
      const isMatch = await user.verifyPassword(currentPassword);
      if (!isMatch) {
        throw new UnauthorizedError('La password attuale non è corretta');
      }
      // Valida nuova password
      if (!authConfig.isValidPassword(newPassword)) {
        throw new ValidationError('La nuova password non rispetta i requisiti di sicurezza');
      }
      // Aggiorna hash
      const bcrypt = require('bcryptjs');
      const newHash = await bcrypt.hash(newPassword, authConfig.saltRounds || 10);
      await user.updatePasswordHash(newHash);
      logger.info('Password cambiata', { userId: user.id });
      res.json({ success: true, message: 'Password aggiornata con successo' });
    } catch (error) {
      logger.warn('Errore cambio password', { userId: req.user?.id, error: error.message });
      next(error);
    }
  }
  // Registrazione nuovo utente
  static async register(req, res, next) {
    try {
      const { email, password, name, ...profileData } = req.body;
      // Fix: mappa birth_date a date_of_birth se presente
      if (profileData.birth_date && !profileData.date_of_birth) {
        profileData.date_of_birth = profileData.birth_date;
        delete profileData.birth_date;
      }

      // Validazione input
      if (!email || !password || !name) {
        throw new ValidationError('Email, password e nome sono obbligatori');
      }

      if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
        throw new ValidationError('Formato email non valido');
      }

      if (!authConfig.isValidPassword(password)) {
        throw new ValidationError('Password deve contenere almeno 8 caratteri, una maiuscola e un numero');
      }

  // Verifica se email già esistente
  const existingUser = await User.findByEmail(email, database.sqliteDb);
      if (existingUser) {
        throw new ConflictError('Email già registrata');
      }

      // Crea nuovo utente
      const user = await User.create({
        email,
        password,
        name,
        ...profileData,
      }, database.sqliteDb);

      // Se sono presenti dati obiettivo, crea subito un NutritionGoal
      const goalFields = [
        'goal_type', 'target_weight', 'start_date'
      ];
      const goalData = {};
      for (const field of goalFields) {
        if (req.body[field] !== undefined) goalData[field] = req.body[field];
      }
      let createdGoal = null;
      if (goalData.goal_type) {
        const NutritionGoal = require('../models/NutritionGoal');
        createdGoal = await NutritionGoal.create({
          user_id: user.id,
          is_active: 1,
          ...goalData
        });
        logger.info('Obiettivo nutrizionale creato contestualmente alla registrazione', {
          userId: user.id,
          goal_type: goalData.goal_type
        });
      }

      // Log evento registrazione
      logger.info('Nuovo utente registrato', {
        userId: user.id,
        email: user.email,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });

      // Genera token di accesso
      const authResponse = authConfig.generateAuthResponse(user, 'Registrazione completata con successo');

      res.status(201).json({
        success: true,
        data: authResponse
      });
    } catch (error) {
      throw error;
    }
  }

  // Login utente
  static async login(req, res, next) {
    try {
      console.log('👉 Tentativo di login per:', req.body);
      const { email, password } = req.body;

      // Validazione input
      if (!email || !password) {
        throw new ValidationError('Email e password sono obbligatori');
      }

      // Trova utente per email
      console.log('🔍 Cerco utente con email:', email);
      const user = await User.findByEmail(email, database.sqliteDb);
      console.log('👤 Utente trovato:', user ? 'sì' : 'no');
      if (!user) {
        console.log('❌ Utente non trovato');
        logger.warn('Tentativo login fallito: utente non trovato', {
          email,
          ip: req.ip,
          userAgent: req.get('User-Agent')
        });
        throw new UnauthorizedError('Credenziali non valide');
      }

      // Verifica password
      console.log('🔒 Verifica password per utente:', user.email);
      const isPasswordValid = await user.verifyPassword(password);
      console.log('🔑 Password valida:', isPasswordValid ? 'sì' : 'no');
      if (!isPasswordValid) {
        console.log('❌ Password non valida');
        logger.warn('Tentativo login fallito: password non valida', {
          userId: user.id,
          email: user.email,
          ip: req.ip,
          userAgent: req.get('User-Agent')
        });
        throw new UnauthorizedError('Credenziali non valide');
      }

      // Aggiorna ultimo login
      await user.updateLastLogin();

      // Log successo
      logger.info('Login effettuato con successo', {
        userId: user.id,
        email: user.email,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });

      // Genera risposta con token
      const authResponse = authConfig.generateAuthResponse(user, 'Login effettuato con successo');

      res.json({
        success: true,
        data: authResponse
      });
    } catch (error) {
      logger.error('Errore durante il login', { error: error.message });
      return next(error);
    }
  }

  // Refresh token
  static async refreshToken(req, res) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        throw new ValidationError('Refresh token richiesto');
      }

      // Verifica refresh token
      const payload = authConfig.verifyToken(refreshToken);
      const user = await User.findById(payload.userId);

      if (!user) {
        logger.warn('Refresh token non valido: utente non trovato', { 
          tokenPayload: payload 
        });
        throw new UnauthorizedError('Token non valido');
      }

      // Genera nuovo token
      const authResponse = authConfig.generateAuthResponse(user, 'Token aggiornato con successo');

      logger.info('Token aggiornato con successo', {
        userId: user.id,
        email: user.email
      });

      res.json(authResponse);
    } catch (error) {
      logger.error('Errore refresh token', { error: error.message });
      next(new UnauthorizedError('Token non valido'));
    }
  }

  // Logout
  static async logout(req, res) {
    try {
      if (req.user) {
        logger.info('Logout effettuato', {
          userId: req.user.id,
          email: req.user.email,
          ip: req.ip,
          userAgent: req.get('User-Agent')
        });
      }

      res.json({
        success: true,
        message: 'Logout effettuato con successo'
      });
    } catch (error) {
      logger.error('Errore durante il logout', { error: error.message });
      next(error);
    }
  }

  // Richiesta reset password
  static async forgotPassword(req, res, next) {
    try {
      if (!req || !req.body) {
        logger.error('forgotPassword: req o req.body undefined', { req });
        throw new ValidationError('Richiesta non valida: corpo mancante');
      }
      logger.info('forgotPassword: req.body ricevuto', { body: req.body });
      const { email } = req.body;

      if (!email || !email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
        throw new ValidationError('Indirizzo email non valido');
      }

  // Trova utente
  const user = await User.findByEmail(email, database.sqliteDb);
      if (!user) {
        // Non rivelare se l'email esiste o meno per sicurezza
        return res.json({
          success: true,
          message: 'Se l\'email esiste, riceverai una nuova password temporanea'
        });
      }

      // Verifica se email service è configurato
      if (!emailConfig.isEmailConfigured) {
        throw new Error('Servizio email non configurato');
      }

      // Genera password temporanea sicura
      const tempPassword = Math.random().toString(36).slice(-10) + Math.floor(Math.random()*100);
      const bcrypt = require('bcryptjs');
      const saltRounds = authConfig.getSaltRounds ? authConfig.getSaltRounds() : 10;
      const passwordHash = await bcrypt.hash(tempPassword, saltRounds);

      // Aggiorna la password dell'utente nel db
      await user.updatePasswordHash(passwordHash);

      try {
        // Invia email con la password temporanea
        await emailConfig.sendTemporaryPasswordEmail(user.email, tempPassword, user.name);
        logger.info('Email password temporanea inviata', {
          userId: user.id,
          email: user.email
        });
      } catch (error) {
        logger.error('Errore invio email password temporanea', {
          userId: user.id,
          email: user.email,
          error: error.message
        });
        throw new Error('Errore invio email password temporanea');
      }

      res.json({
        success: true,
        message: 'Se l\'email esiste, riceverai una nuova password temporanea'
      });
    } catch (error) {
      logger.error('Errore richiesta reset password', { error: error.message });
      next(error);
    }
  }




  // Profilo utente
  static async getProfile(req, res, next) {
    try {
      res.json({
        success: true,
        data: {
          user: req.user.toJSON()
        }
      });
    } catch (error) {
      logger.error('Errore recupero profilo', { error: error.message });
      next(error);
    }
  }

  // Aggiorna profilo
  static async updateProfile(req, res, next) {
    try {
      const allowedFields = [
        'name', 'avatar_path', 'date_of_birth', 'gender',
        'height', 'weight', 'activity_level', 'timezone', 'language'
      ];

      const updates = {};
      Object.keys(req.body).forEach(key => {
        if (allowedFields.includes(key)) {
          updates[key] = req.body[key];
        }
      });

      if (Object.keys(updates).length === 0) {
        throw new ValidationError('Nessun campo valido da aggiornare');
      }

      await req.user.update(updates);

      logger.info('Profilo aggiornato', {
        userId: req.user.id,
        email: req.user.email,
        updatedFields: Object.keys(updates)
      });

      res.json({
        success: true,
        message: 'Profilo aggiornato con successo',
        data: {
          user: req.user.toJSON()
        }
      });
    } catch (error) {
      logger.error('Errore aggiornamento profilo', { error: error.message });
      next(error);
    }
  }


  // Elimina account
  static async deleteAccount(req, res, next) {
    try {
      const { password } = req.body;

      const isPasswordValid = await req.user.verifyPassword(password);
      if (!isPasswordValid) {
        logger.warn('Tentativo eliminazione account con password errata', {
          userId: req.user.id,
          email: req.user.email,
          ip: req.ip
        });
        throw new UnauthorizedError('Password non corretta');
      }

      logger.info('Account eliminato', {
        userId: req.user.id,
        email: req.user.email,
        ip: req.ip
      });

      await req.user.delete(false);

      res.json({
        success: true,
        message: 'Account eliminato con successo'
      });
    } catch (error) {
      logger.error('Errore eliminazione account', { error: error.message });
      next(error);
    }
  }

  // Statistiche autenticazione (admin)
  static async getAuthStats(req, res, next) {
    try {
      // Verifica permessi admin
      if (!req.user.isAdmin) {
        throw new UnauthorizedError('Accesso non autorizzato');
      }
      const stats = await User.getStats();

      res.json({
        success: true,
        data: {
          stats,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      logger.error('Errore recupero statistiche auth', { 
        error: error.message,
        userId: req.user?.id
      });
      next(error);
    }
  }
}

module.exports = AuthController;
