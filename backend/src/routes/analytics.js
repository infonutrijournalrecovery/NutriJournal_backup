
const express = require('express');
const AuthMiddleware = require('../middleware/auth');
const AnalyticsController = require('../controllers/analyticsController');

// Factory function: riceve la connessione SQLite e restituisce il router configurato
function createAnalyticsRouter(sqliteDb) {
    const router = express.Router();
    const analyticsController = new AnalyticsController(sqliteDb);
    const auth = AuthMiddleware.verifyToken;

    // GET /api/analytics/dashboard - Dashboard principale
    router.get('/dashboard', auth, async (req, res, next) => {
        console.log('[DEBUG] Route /api/analytics/dashboard chiamata');
        await analyticsController.getDashboard(req, res, next);
    });

    // GET /api/analytics/nutrition/trends - Trend nutrizionali
    router.get('/nutrition/trends', auth, async (req, res, next) => {
        await analyticsController.getNutritionTrends(req, res, next);
    });

    // GET /api/analytics/nutrition/stats - Statistiche nutrizionali
    router.get('/nutrition/stats', auth, async (req, res, next) => {
        await analyticsController.getNutritionStats(req, res, next);
    });

    // GET /api/analytics/nutrition/progress - Progresso obiettivi
    router.get('/nutrition/progress', auth, async (req, res, next) => {
        await analyticsController.getGoalProgress(req, res, next);
    });

    // PUT /api/analytics/nutrition/today - Aggiorna trend di oggi
    router.put('/nutrition/today', auth, async (req, res, next) => {
        await analyticsController.updateTodayNutrition(req, res, next);
    });

    // GET /api/analytics/weekly - Analisi settimanale
    router.get('/weekly', auth, async (req, res, next) => {
        await analyticsController.getWeeklyAnalysis(req, res, next);
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

    return router;
}

module.exports = createAnalyticsRouter;
