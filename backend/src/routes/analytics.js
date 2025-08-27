const express = require('express');
const router = express.Router();
const AuthMiddleware = require('../middleware/auth');
const database = require('../config/database');
const AnalyticsController = require('../controllers/analyticsController');

// Inizializza controller
const analyticsController = new AnalyticsController(database.db);

// Middleware di autenticazione
const auth = AuthMiddleware.verifyToken;

// GET /api/analytics/dashboard - Dashboard principale
router.get('/dashboard', auth, async (req, res) => {
    await analyticsController.getDashboard(req, res);
});

// GET /api/analytics/nutrition/trends - Trend nutrizionali
router.get('/nutrition/trends', auth, async (req, res) => {
    await analyticsController.getNutritionTrends(req, res);
});

// GET /api/analytics/nutrition/stats - Statistiche nutrizionali
router.get('/nutrition/stats', auth, async (req, res) => {
    await analyticsController.getNutritionStats(req, res);
});

// GET /api/analytics/nutrition/progress - Progresso obiettivi
router.get('/nutrition/progress', auth, async (req, res) => {
    await analyticsController.getGoalProgress(req, res);
});

// PUT /api/analytics/nutrition/today - Aggiorna trend di oggi
router.put('/nutrition/today', auth, async (req, res) => {
    await analyticsController.updateTodayNutrition(req, res);
});

// GET /api/analytics/weekly - Analisi settimanale
router.get('/weekly', auth, async (req, res) => {
    await analyticsController.getWeeklyAnalysis(req, res);
});

// GET /api/analytics/monthly - Analisi mensile
router.get('/monthly', auth, async (req, res) => {
    await analyticsController.getMonthlyAnalysis(req, res);
});

// GET /api/analytics/compare - Confronto periodi
router.get('/compare', auth, async (req, res) => {
    await analyticsController.comparePeriods(req, res);
});

// GET /api/analytics/insights - Insight automatici
router.get('/insights', auth, async (req, res) => {
    await analyticsController.getInsights(req, res);
});

// POST /api/analytics/metrics - Salva metrica personalizzata
router.post('/metrics', auth, async (req, res) => {
    await analyticsController.saveCustomMetric(req, res);
});

// GET /api/analytics/metrics - Ottieni metriche personalizzate
router.get('/metrics', auth, async (req, res) => {
    await analyticsController.getCustomMetrics(req, res);
});

// GET /api/analytics/report - Report completo
router.get('/report', auth, async (req, res) => {
    await analyticsController.getFullReport(req, res);
});

module.exports = router;
