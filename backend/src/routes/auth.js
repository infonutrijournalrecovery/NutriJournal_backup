const express = require('express');
const AuthController = require('../controllers/authController');
const { validate } = require('../utils/validation');
const { userRegistrationSchema, userLoginSchema } = require('../utils/validation');
const { rateLimiter } = require('../middleware/securityMiddleware');

const router = express.Router();

// Rate limiting per tutti gli endpoint di autenticazione
router.use(rateLimiter);

// Routes per autenticazione

// POST /auth/register - Registrazione nuovo utente
router.post('/register', validate(userRegistrationSchema), async (req, res) => {
  await AuthController.register(req, res);
});

// POST /auth/login - Login utente
router.post('/login', validate(userLoginSchema), AuthController.login);

// POST /auth/forgot-password - Reset password
router.post('/forgot-password', async (req, res, next) => {
  await AuthController.forgotPassword(req, res, next);
});


// POST /auth/refresh - Refresh token JWT
router.post('/refresh', async (req, res) => {
  await AuthController.refreshToken(req, res);
});

// POST /auth/logout - Logout utente
router.post('/logout', async (req, res) => {
  await AuthController.logout(req, res);
});


// PUT /auth/change-password - Cambio password utente autenticato
const AuthMiddleware = require('../middleware/auth');
router.put('/change-password', AuthMiddleware.verifyToken, async (req, res, next) => {
  await AuthController.changePassword(req, res, next);
});

module.exports = router;
