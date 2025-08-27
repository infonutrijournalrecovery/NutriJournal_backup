const jwt = require('jsonwebtoken');
const config = require('./environment');

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
      return jwt.verify(token, config.auth.jwtSecret, {
        issuer: 'nutrijournal-backend',
        audience: 'nutrijournal-app',
      });
    } catch (error) {
      throw new Error('Token non valido');
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
