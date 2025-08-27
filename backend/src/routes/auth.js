const express = require('express');
const AuthController = require('../controllers/authController');
const { validate } = require('../utils/validation');
const { userRegistrationSchema, userLoginSchema } = require('../utils/validation');
const { rateLimits } = require('../middleware/security');

const router = express.Router();

// Rate limiting specifico per auth endpoints critici
router.use('/login', rateLimits.auth);
router.use('/register', rateLimits.register);
router.use('/forgot-password', rateLimits.passwordReset);
router.use('/reset-password', rateLimits.passwordReset);

// Routes per autenticazione

// POST /auth/register - Registrazione nuovo utente
router.post('/register', validate(userRegistrationSchema), async (req, res) => {
  await AuthController.register(req, res);
});

// POST /auth/login - Login utente
router.post('/login', validate(userLoginSchema), async (req, res) => {
  await AuthController.login(req, res);
});

// POST /auth/forgot-password - Reset password
router.post('/forgot-password', async (req, res) => {
  await AuthController.forgotPassword(req, res);
});

// POST /auth/reset-password/:token - Conferma reset password
router.post('/reset-password/:token', async (req, res) => {
  await AuthController.resetPassword(req, res);
});

// POST /auth/refresh - Refresh token JWT
router.post('/refresh', async (req, res) => {
  await AuthController.refreshToken(req, res);
});

// POST /auth/logout - Logout utente
router.post('/logout', async (req, res) => {
  await AuthController.logout(req, res);
});

module.exports = router;
