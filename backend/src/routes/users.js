const express = require('express');
const UserController = require('../controllers/userController');
const AuthMiddleware = require('../middleware/auth');

const { validate, userUpdateSchema } = require('../utils/validation');
const { rateLimiter } = require('../middleware/securityMiddleware');
const multer = require('multer');
const path = require('path');

const router = express.Router();

// Configura multer per upload avatar
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/avatars/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `avatar-${req.user.id}-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo file non supportato'), false);
    }
  }
});

// Middleware di autenticazione
const auth = AuthMiddleware.verifyToken;


// === PROFILO UTENTE ===
router.get('/profile', auth, UserController.getProfile);
router.put('/profile', auth, validate(userUpdateSchema), UserController.updateProfile);

// === ALLERGIE ===
router.get('/allergies', auth, UserController.getAllergies);
router.post('/allergies', auth, UserController.addAllergy);
router.put('/allergies/:id', auth, UserController.updateAllergy);
router.delete('/allergies/:id', auth, UserController.deleteAllergy);

// === ADDITIVI ===
router.get('/additives', auth, UserController.getAdditives);
router.post('/additives', auth, UserController.addAdditive);
router.put('/additives/:id', auth, UserController.updateAdditive);
router.delete('/additives/:id', auth, UserController.deleteAdditive);

// === OBIETTIVI NUTRIZIONALI ===

// GET /api/users/goals - Ottieni obiettivi nutrizionali
router.get('/goals', auth, UserController.getGoals);

// GET /api/users/goals/active - Ottieni obiettivo attivo
router.get('/goals/active', auth, UserController.getActiveGoal);

// POST /api/users/goals - Crea nuovo obiettivo
const { nutritionGoalSchema } = require('../utils/validation');
router.post('/goals', auth, validate(nutritionGoalSchema), UserController.createGoal);

// PUT /api/users/goals/:goalId - Aggiorna obiettivo
router.put('/goals/:goalId', auth, validate('updateGoal'), UserController.updateGoal);

// DELETE /api/users/goals/:goalId - Elimina obiettivo
router.delete('/goals/:goalId', auth, UserController.deleteGoal);

// === PREFERENZE ===

// GET /api/users/preferences - Ottieni preferenze
router.get('/preferences', auth, UserController.getPreferences);

// PUT /api/users/preferences - Aggiorna preferenze
router.put('/preferences', auth, validate('updatePreferences'), UserController.updatePreferences);

// === STATISTICHE ===

// GET /api/users/stats - Ottieni statistiche personali
router.get('/stats', auth, UserController.getStats);

// === PESO CORPOREO ===

// POST /api/users/weight - Registra peso
router.post('/weight', auth, validate('logWeight'), UserController.logWeight);

// GET /api/users/weight/history - Storico peso
router.get('/weight/history', auth, UserController.getWeightHistory);

// === AVATAR ===

// POST /api/users/avatar - Upload avatar
router.post('/avatar', auth, upload.single('avatar'), UserController.uploadAvatar);

// DELETE /api/users/avatar - Elimina avatar
router.delete('/avatar', auth, UserController.deleteAvatar);

// === ESPORTAZIONE DATI ===

// GET /api/users/export - Esporta dati utente (GDPR)
router.get('/export', auth, rateLimiter, UserController.exportData);

module.exports = router;
