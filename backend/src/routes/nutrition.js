const express = require('express');
const router = express.Router();
const NutritionController = require('../controllers/nutritionController');
const AuthMiddleware = require('../middleware/auth');
const { validate } = require('../utils/validation');

// Middleware di autenticazione
const auth = AuthMiddleware.verifyToken;

// GET /api/nutrition/goal/active - Obiettivo attivo
router.get('/goal/active', auth, NutritionController.getActiveGoal);

// POST /api/nutrition/goal - Crea nuovo obiettivo
router.post('/goal', auth, validate('createNutritionGoal'), NutritionController.createGoal);

// PUT /api/nutrition/goal/:goalId - Aggiorna obiettivo
router.put('/goal/:goalId', auth, validate('updateNutritionGoal'), NutritionController.updateGoal);

// GET /api/nutrition/analysis/day/:date - Analisi giornaliera
router.get('/analysis/day/:date', auth, NutritionController.getDayAnalysis);

// GET /api/nutrition/analysis/period - Analisi per periodo
router.get('/analysis/period', auth, NutritionController.getPeriodAnalysis);

// GET /api/nutrition/recommendations - Raccomandazioni nutrizionali
router.get('/recommendations', auth, NutritionController.getRecommendations);

// GET /api/nutrition/trends - Trend nutrizionali
router.get('/trends', auth, NutritionController.getNutritionTrends);

// POST /api/nutrition/calculate-needs - Calcola fabbisogni calorici
router.post('/calculate-needs', auth, validate('calculateCalorieNeeds'), NutritionController.calculateCalorieNeeds);

// GET /api/nutrition/report/weekly - Report settimanale
router.get('/report/weekly', auth, NutritionController.getWeeklyReport);

// GET /api/nutrition/export - Esporta dati nutrizionali
router.get('/export', auth, NutritionController.exportNutritionData);

module.exports = router;
