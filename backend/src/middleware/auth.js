const authConfig = require('../config/auth');
const User = require('../models/User');

class AuthMiddleware {
  // Middleware per verificare JWT token
  static async verifyToken(req, res, next) {
    try {
      console.log('[DEBUG] AuthMiddleware.verifyToken chiamato, header:', req.headers.authorization);
      // Estrai token dall'header Authorization
      const authHeader = req.headers.authorization;
      const token = authConfig.extractTokenFromHeader(authHeader);

      if (!token) {
        return res.status(401).json({
          success: false,
          message: 'Token di accesso richiesto',
          error: 'MISSING_TOKEN',
        });
      }

      // Verifica validità token
      const payload = authConfig.verifyToken(token);
      
  // Carica dati utente
  const database = require('../config/database');
  const user = await User.findById(payload.userId, database.sqliteDb);
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Utente non trovato',
          error: 'USER_NOT_FOUND',
        });
      }

      // Aggiungi utente alla request
      req.user = user;
      req.userId = user.id;
      req.token = token;

      next();
    } catch (error) {
      console.error('❌ Errore verifica token:', error);

      let message = 'Token non valido';
      let errorCode = 'INVALID_TOKEN';

      if (error.name === 'TokenExpiredError') {
        message = 'Token scaduto';
        errorCode = 'TOKEN_EXPIRED';
      } else if (error.name === 'JsonWebTokenError') {
        message = 'Token malformato';
        errorCode = 'MALFORMED_TOKEN';
      }

      return res.status(401).json({
        success: false,
        message,
        error: errorCode,
      });
    }
  }

  // Middleware opzionale - non fallisce se non c'è token
  static async optionalAuth(req, res, next) {
    try {
      const authHeader = req.headers.authorization;
      const token = authConfig.extractTokenFromHeader(authHeader);

      if (token) {
        const payload = authConfig.verifyToken(token);
        const user = await User.findById(payload.userId);
        
        if (user) {
          req.user = user;
          req.userId = user.id;
          req.token = token;
        }
      }

      next();
    } catch (error) {
      // Continua comunque, ma senza utente autenticato
      next();
    }
  }

  // Middleware per verificare che l'utente sia proprietario della risorsa
  static requireOwnership(resourceField = 'user_id') {
    return async (req, res, next) => {
      try {
        if (!req.user) {
          return res.status(401).json({
            success: false,
            message: 'Autenticazione richiesta',
            error: 'AUTH_REQUIRED',
          });
        }

        // Se la risorsa è direttamente l'utente stesso
        if (resourceField === 'self') {
          const resourceUserId = req.params.id || req.params.userId;
          if (resourceUserId && resourceUserId != req.user.id) {
            return res.status(403).json({
              success: false,
              message: 'Non autorizzato ad accedere a questa risorsa',
              error: 'ACCESS_DENIED',
            });
          }
        }

        next();
      } catch (error) {
        console.error('❌ Errore verifica ownership:', error);
        return res.status(500).json({
          success: false,
          message: 'Errore verifica autorizzazioni',
          error: 'OWNERSHIP_CHECK_FAILED',
        });
      }
    };
  }

  // Middleware per verificare se l'email è verificata
  static requireEmailVerification(req, res, next) {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Autenticazione richiesta',
        error: 'AUTH_REQUIRED',
      });
    }

    if (!req.user.email_verified) {
      return res.status(403).json({
        success: false,
        message: 'Email non verificata. Verifica la tua email per continuare.',
        error: 'EMAIL_NOT_VERIFIED',
      });
    }

    next();
  }

  // Middleware per aggiornare ultimo accesso
  static async updateLastLogin(req, res, next) {
    try {
      if (req.user) {
        // Non aspettare la completion per non rallentare la response
        req.user.updateLastLogin().catch(error => {
          console.error('❌ Errore aggiornamento ultimo login:', error);
        });
      }
      next();
    } catch (error) {
      // Non bloccare la request se l'aggiornamento fallisce
      next();
    }
  }

  // Genera response con token
  static generateAuthResponse(user, message = 'Login effettuato con successo') {
    const token = authConfig.generateToken({
      userId: user.id,
      email: user.email,
      timestamp: Date.now(),
    });

    const refreshToken = authConfig.generateRefreshToken({
      userId: user.id,
      email: user.email,
      timestamp: Date.now(),
    });

    return {
      success: true,
      message,
      data: {
        user: user.toJSON(),
        token,
        refreshToken,
        expiresIn: '7d',
      },
    };
  }

  // Middleware per validare refresh token
  static async validateRefreshToken(req, res, next) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(400).json({
          success: false,
          message: 'Refresh token richiesto',
          error: 'MISSING_REFRESH_TOKEN',
        });
      }

      const payload = authConfig.verifyToken(refreshToken);
      const user = await User.findById(payload.userId);

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Utente non trovato',
          error: 'USER_NOT_FOUND',
        });
      }

      req.user = user;
      req.refreshTokenPayload = payload;
      next();
    } catch (error) {
      console.error('❌ Errore validazione refresh token:', error);

      return res.status(401).json({
        success: false,
        message: 'Refresh token non valido',
        error: 'INVALID_REFRESH_TOKEN',
      });
    }
  }

  // Middleware per rate limiting specifico per auth
  static createAuthRateLimit() {
    const rateLimit = require('express-rate-limit');
    
    return rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minuti
      max: 5, // max 5 tentativi di login per IP
      message: {
        success: false,
        message: 'Troppi tentativi di login. Riprova tra 15 minuti.',
        error: 'RATE_LIMIT_EXCEEDED',
      },
      standardHeaders: true,
      legacyHeaders: false,
      // Resetta il counter dopo login riuscito
      skipSuccessfulRequests: true,
    });
  }


  // Estrai informazioni di autenticazione dalla request
  static extractAuthInfo(req) {
    return {
      isAuthenticated: !!req.user,
      userId: req.userId || null,
      userEmail: req.user ? req.user.email : null,
      hasToken: !!req.token,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent'),
    };
  }
}

module.exports = {
  AuthMiddleware,
  authenticate: AuthMiddleware.verifyToken,
  verifyToken: AuthMiddleware.verifyToken,
  authMiddleware: AuthMiddleware.verifyToken,
  requireRole: AuthMiddleware.requireRole,
  optionalAuth: AuthMiddleware.optionalAuth,
  getAuthContext: AuthMiddleware.getAuthContext,
};
