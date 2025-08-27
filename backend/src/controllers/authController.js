const bcrypt = require('bcryptjs');
const User = require('../models/User');
const authConfig = require('../config/auth');
const emailConfig = require('../config/email');
const { ValidationError, UnauthorizedError, ConflictError, NotFoundError } = require('../middleware/errorHandler');
const { logSecurity, logEmail } = require('../middleware/logging');

class AuthController {
  // Registrazione nuovo utente
  static async register(req, res) {
    try {
      const { email, password, name, ...profileData } = req.body;

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

      // Log evento sicurezza
      logSecurity('user_registered', {
        userId: user.id,
        email: user.email,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
      });

      // Invia email di benvenuto (non bloccante)
      if (emailConfig.isEmailConfigured) {
        emailConfig.sendWelcomeEmail(user.email, user.name)
          .then(() => logEmail('welcome', user.email, 'sent'))
          .catch(error => logEmail('welcome', user.email, 'failed', error));
      }

      // Genera token di accesso
      const authResponse = authConfig.generateAuthResponse(user, 'Registrazione completata con successo');

      res.status(201).json(authResponse);
    } catch (error) {
      throw error;
    }
  }

  // Login utente
  static async login(req, res) {
    try {
      const { email, password } = req.body;

      // Trova utente per email
      const user = await User.findByEmail(email);
      if (!user) {
        logSecurity('login_failed', {
          email,
          reason: 'user_not_found',
          ip: req.ip,
          userAgent: req.get('User-Agent'),
        });
        throw new UnauthorizedError('Credenziali non valide');
      }

      // Verifica password
      const isPasswordValid = await user.verifyPassword(password);
      if (!isPasswordValid) {
        logSecurity('login_failed', {
          userId: user.id,
          email: user.email,
          reason: 'invalid_password',
          ip: req.ip,
          userAgent: req.get('User-Agent'),
        });
        throw new UnauthorizedError('Credenziali non valide');
      }

      // Aggiorna ultimo login
      await user.updateLastLogin();

      // Log successo
      logSecurity('login_success', {
        userId: user.id,
        email: user.email,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
      });

      // Genera risposta con token
      const authResponse = authConfig.generateAuthResponse(user, 'Login effettuato con successo');

      res.json(authResponse);
    } catch (error) {
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
        throw new UnauthorizedError('Utente non trovato');
      }

      // Genera nuovo token
      const authResponse = authConfig.generateAuthResponse(user, 'Token aggiornato con successo');

      res.json(authResponse);
    } catch (error) {
      throw new UnauthorizedError('Refresh token non valido');
    }
  }

  // Logout (invalidazione lato client)
  static async logout(req, res) {
    try {
      // Log logout
      if (req.user) {
        logSecurity('logout', {
          userId: req.user.id,
          email: req.user.email,
          ip: req.ip,
          userAgent: req.get('User-Agent'),
        });
      }

      res.json({
        success: true,
        message: 'Logout effettuato con successo',
      });
    } catch (error) {
      throw error;
    }
  }

  // Richiesta reset password
  static async forgotPassword(req, res) {
    try {
      const { email } = req.body;

      // Trova utente
      const user = await User.findByEmail(email);
      if (!user) {
        // Non rivelare se l'email esiste o meno per sicurezza
        return res.json({
          success: true,
          message: 'Se l\'email esiste, riceverai le istruzioni per il reset della password',
        });
      }

      // Verifica se email service è configurato
      if (!emailConfig.isEmailConfigured) {
        throw new Error('Servizio email non configurato');
      }

      // Genera token reset
      const resetToken = authConfig.generateResetToken(user.id);
      await user.setResetToken(resetToken);

      // Invia email
      await emailConfig.sendPasswordResetEmail(user.email, resetToken, user.name);

      // Log evento
      logSecurity('password_reset_requested', {
        userId: user.id,
        email: user.email,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
      });

      logEmail('password_reset', user.email, 'sent');

      res.json({
        success: true,
        message: 'Se l\'email esiste, riceverai le istruzioni per il reset della password',
      });
    } catch (error) {
      if (error.message === 'Servizio email non configurato') {
        throw new Error('Reset password non disponibile. Contatta l\'amministratore.');
      }
      
      logEmail('password_reset', req.body.email, 'failed', error);
      throw error;
    }
  }

  // Reset password con token
  static async resetPassword(req, res) {
    try {
      const { token } = req.params;
      const { password, confirmPassword } = req.body;

      // Validazione password
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
        throw new UnauthorizedError('Token reset non valido o scaduto');
      }

      // Verifica scadenza token
      if (user.reset_token_expires && new Date() > new Date(user.reset_token_expires)) {
        throw new UnauthorizedError('Token reset scaduto');
      }

      // Cambia password
      await user.changePassword(password);

      // Log evento
      logSecurity('password_reset_completed', {
        userId: user.id,
        email: user.email,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
      });

      res.json({
        success: true,
        message: 'Password cambiata con successo',
      });
    } catch (error) {
      throw error;
    }
  }

  // Cambio password (utente autenticato)
  static async changePassword(req, res) {
    try {
      const { currentPassword, newPassword, confirmPassword } = req.body;

      // Validazione
      if (newPassword !== confirmPassword) {
        throw new ValidationError('Le nuove password non corrispondono');
      }

      if (!authConfig.isValidPassword(newPassword)) {
        throw new ValidationError('Password deve contenere almeno 8 caratteri, una maiuscola e un numero');
      }

      // Verifica password attuale
      const isCurrentPasswordValid = await req.user.verifyPassword(currentPassword);
      if (!isCurrentPasswordValid) {
        throw new UnauthorizedError('Password attuale non corretta');
      }

      // Cambia password
      await req.user.changePassword(newPassword);

      // Log evento
      logSecurity('password_changed', {
        userId: req.user.id,
        email: req.user.email,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
      });

      res.json({
        success: true,
        message: 'Password cambiata con successo',
      });
    } catch (error) {
      throw error;
    }
  }

  // Profilo utente corrente
  static async getProfile(req, res) {
    try {
      res.json({
        success: true,
        data: {
          user: req.user.toJSON(),
        },
      });
    } catch (error) {
      throw error;
    }
  }

  // Aggiorna profilo utente
  static async updateProfile(req, res) {
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

      res.json({
        success: true,
        message: 'Profilo aggiornato con successo',
        data: {
          user: req.user.toJSON(),
        },
      });
    } catch (error) {
      throw error;
    }
  }

  // Verifica token reset (controllo validità)
  static async verifyResetToken(req, res) {
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
      throw error;
    }
  }

  // Elimina account utente
  static async deleteAccount(req, res) {
    try {
      const { password } = req.body;

      // Verifica password per sicurezza
      const isPasswordValid = await req.user.verifyPassword(password);
      if (!isPasswordValid) {
        throw new UnauthorizedError('Password non corretta');
      }

      // Log evento
      logSecurity('account_deleted', {
        userId: req.user.id,
        email: req.user.email,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
      });

      // Elimina account (soft delete)
      await req.user.delete(false);

      res.json({
        success: true,
        message: 'Account eliminato con successo',
      });
    } catch (error) {
      throw error;
    }
  }

  // Statistiche autenticazione (admin)
  static async getAuthStats(req, res) {
    try {
      const stats = await User.getStats();

      res.json({
        success: true,
        data: {
          stats,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      throw error;
    }
  }
}

module.exports = AuthController;
