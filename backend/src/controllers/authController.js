const bcrypt = require('bcryptjs');
const User = require('../models/User');
const authConfig = require('../config/auth');
const emailConfig = require('../config/email');
const database = require('../config/database');
const { ValidationError, UnauthorizedError, ConflictError, NotFoundError } = require('../middleware/errorHandler');
const { logger } = require('../middleware/logging');

class AuthController {
  // Registrazione nuovo utente
  static async register(req, res, next) {
    try {
      const { email, password, name, ...profileData } = req.body;

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
      const existingUser = await User.findByEmail(email);
      if (existingUser) {
        throw new ConflictError('Email già registrata');
      }

      // Crea nuovo utente
      const user = await User.create({
        email,
        password,
        name,
        ...profileData,
      });

      // Log evento registrazione
      logger.info('Nuovo utente registrato', {
        userId: user.id,
        email: user.email,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });

      // Invia email di benvenuto (solo in produzione)
      if (process.env.NODE_ENV === 'production' && emailConfig.isEmailConfigured) {
        try {
          await emailConfig.sendWelcomeEmail(user.email, user.name);
          logger.info('Email di benvenuto inviata', { email: user.email });
        } catch (error) {
          logger.error('Errore invio email di benvenuto', { email: user.email, error: error.message });
        }
      }

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
      throw error;
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
      const { email } = req.body;

      if (!email || !email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
        throw new ValidationError('Indirizzo email non valido');
      }

      // Trova utente
      const user = await User.findByEmail(email);
      if (!user) {
        // Non rivelare se l'email esiste o meno per sicurezza
        return res.json({
          success: true,
          message: 'Se l\'email esiste, riceverai le istruzioni per il reset della password'
        });
      }

      // Verifica se email service è configurato
      if (!emailConfig.isEmailConfigured) {
        throw new Error('Servizio email non configurato');
      }

      // Genera token reset
      const resetToken = authConfig.generateResetToken(user.id);
      await user.setResetToken(resetToken);

      try {
        // Invia email
        await emailConfig.sendPasswordResetEmail(user.email, resetToken, user.name);
        logger.info('Email reset password inviata', {
          userId: user.id,
          email: user.email
        });
      } catch (error) {
        logger.error('Errore invio email reset password', {
          userId: user.id,
          email: user.email,
          error: error.message
        });
        throw new Error('Errore invio email reset password');
      }

      res.json({
        success: true,
        message: 'Se l\'email esiste, riceverai le istruzioni per il reset della password'
      });
    } catch (error) {
      logger.error('Errore richiesta reset password', { error: error.message });
      next(error);
    }
  }

  // Reset password con token
  static async resetPassword(req, res, next) {
    try {
      const { token } = req.params;
      const { password, confirmPassword } = req.body;

      if (!token || !password || !confirmPassword) {
        throw new ValidationError('Token e nuova password sono obbligatori');
      }

      if (password !== confirmPassword) {
        throw new ValidationError('Le password non corrispondono');
      }

      if (!authConfig.isValidPassword(password)) {
        throw new ValidationError('Password deve contenere almeno 8 caratteri, una maiuscola e un numero');
      }

      // Verifica token
      const payload = authConfig.verifyResetToken(token);
      const user = await User.findById(payload.userId);

      if (!user || user.reset_token !== token) {
        logger.warn('Tentativo reset password con token non valido', {
          token,
          userId: payload.userId
        });
        throw new UnauthorizedError('Token reset non valido o scaduto');
      }

      if (user.reset_token_expires && new Date() > new Date(user.reset_token_expires)) {
        logger.warn('Tentativo reset password con token scaduto', {
          userId: user.id,
          email: user.email
        });
        throw new UnauthorizedError('Token reset scaduto');
      }

      // Cambia password
      await user.changePassword(password);

      logger.info('Password resettata con successo', {
        userId: user.id,
        email: user.email,
        ip: req.ip
      });

      res.json({
        success: true,
        message: 'Password cambiata con successo'
      });
    } catch (error) {
      logger.error('Errore reset password', { error: error.message });
      next(error);
    }
  }

  // Cambio password (utente autenticato)
  static async changePassword(req, res, next) {
    try {
      const { currentPassword, newPassword, confirmPassword } = req.body;

      if (!currentPassword || !newPassword || !confirmPassword) {
        throw new ValidationError('Password attuale e nuova password sono obbligatorie');
      }

      if (newPassword !== confirmPassword) {
        throw new ValidationError('Le nuove password non corrispondono');
      }

      if (!authConfig.isValidPassword(newPassword)) {
        throw new ValidationError('Password deve contenere almeno 8 caratteri, una maiuscola e un numero');
      }

      const isCurrentPasswordValid = await req.user.verifyPassword(currentPassword);
      if (!isCurrentPasswordValid) {
        logger.warn('Tentativo cambio password con password attuale errata', {
          userId: req.user.id,
          email: req.user.email,
          ip: req.ip
        });
        throw new UnauthorizedError('Password attuale non corretta');
      }

      await req.user.changePassword(newPassword);

      logger.info('Password cambiata con successo', {
        userId: req.user.id,
        email: req.user.email,
        ip: req.ip
      });

      res.json({
        success: true,
        message: 'Password cambiata con successo'
      });
    } catch (error) {
      logger.error('Errore cambio password', { error: error.message });
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

  // Verifica token reset (controllo validità)
  static async verifyResetToken(req, res, next) {
    try {
      const { token } = req.params;

      // Verifica token
      const payload = authConfig.verifyResetToken(token);
      const user = await User.findById(payload.userId);

      if (!user || user.reset_token !== token) {
        throw new UnauthorizedError('Token reset non valido');
      }

      // Verifica scadenza
      if (user.reset_token_expires && new Date() > new Date(user.reset_token_expires)) {
        throw new UnauthorizedError('Token reset scaduto');
      }

      res.json({
        success: true,
        message: 'Token reset valido',
        data: {
          email: user.email,
          expiresAt: user.reset_token_expires,
        },
      });
    } catch (error) {
      logger.error('Errore verifica token reset', { 
        error: error.message,
        token: req.params.token
      });
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
