const jwt = require('jsonwebtoken');
const config = require('./environment');

// Simple token blacklist con pulizia automatica
class TokenBlacklist {
  constructor() {
    this.blacklist = new Map(); // Map per memorizzare token e loro scadenza
    
    // Pulizia automatica ogni ora
    setInterval(() => this.cleanup(), 60 * 60 * 1000);
  }

  add(token, exp) {
    this.blacklist.set(token, exp);
  }

  has(token) {
    return this.blacklist.has(token);
  }

  // Rimuove token scaduti
  cleanup() {
    const now = Date.now();
    for (const [token, exp] of this.blacklist.entries()) {
      if (exp < now) {
        this.blacklist.delete(token);
      }
    }
  }
}

const tokenBlacklist = new TokenBlacklist();

class AuthConfig {
  // Genera JWT token
  generateToken(payload) {
    return jwt.sign(payload, config.auth.jwtSecret, {
      expiresIn: config.auth.jwtExpiresIn,
      issuer: 'nutrijournal-backend',
      audience: 'nutrijournal-app',
    });
  }

  // Verifica JWT token
  verifyToken(token) {
    try {
      // Verifica se il token è nella blacklist
      if (tokenBlacklist.has(token)) {
        throw new Error('Token revocato');
      }

      const decoded = jwt.verify(token, config.auth.jwtSecret, {
        issuer: 'nutrijournal-backend',
        audience: 'nutrijournal-app',
      });

      return decoded;
    } catch (error) {
      throw new Error('Token non valido');
    }
  }

  // Revoca token (es. al logout)
  revokeToken(token) {
    try {
      const decoded = jwt.decode(token);
      if (decoded && decoded.exp) {
        tokenBlacklist.add(token, decoded.exp * 1000);
        return true;
      }
      return false;
    } catch (error) {
      return false;
    }
  }

  // Genera refresh token
  generateRefreshToken(payload) {
    return jwt.sign(payload, config.auth.jwtSecret, {
      expiresIn: '30d',
      issuer: 'nutrijournal-backend',
      audience: 'nutrijournal-app',
    });
  }

  // Genera token per reset password
  generateResetToken(userId) {
    const payload = {
      userId,
      type: 'password_reset',
      timestamp: Date.now(),
    };

    return jwt.sign(payload, config.auth.jwtSecret, {
      expiresIn: '1h', // Token reset valido 1 ora
      issuer: 'nutrijournal-backend',
      audience: 'nutrijournal-app',
    });
  }

  // Verifica token reset password
  
  // Genera risposta di autenticazione
  generateAuthResponse(user, message) {
    // Crea payload per il token
    const tokenPayload = {
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role || 'user'
    };

    // Genera access token e refresh token
    const accessToken = this.generateToken(tokenPayload);
    const refreshToken = this.generateRefreshToken(tokenPayload);

    // Restituisci risposta completa
    return {
      message,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role || 'user'
      },
      tokens: {
        accessToken,
        refreshToken
      }
    };
  }
  verifyResetToken(token) {
    try {
      const payload = jwt.verify(token, config.auth.jwtSecret, {
        issuer: 'nutrijournal-backend',
        audience: 'nutrijournal-app',
      });

      if (payload.type !== 'password_reset') {
        throw new Error('Tipo token non valido');
      }

      return payload;
    } catch (error) {
      throw new Error('Token reset non valido o scaduto');
    }
  }

  // Estrae token dall'header Authorization
  extractTokenFromHeader(authHeader) {
    if (!authHeader) {
      return null;
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return null;
    }

    return parts[1];
  }

  // Valida formato email
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Valida password (almeno 8 caratteri, 1 maiuscola, 1 numero)
  isValidPassword(password) {
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
    return passwordRegex.test(password);
  }

  // Genera salt per bcrypt
  getSaltRounds() {
    return config.auth.saltRounds;
  }

  // Configurazione cookie sicuri (se necessario)
  getCookieOptions() {
    return {
      httpOnly: true,
      secure: config.server.nodeEnv === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 giorni
    };
  }
}

module.exports = new AuthConfig();
