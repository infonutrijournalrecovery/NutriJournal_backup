const express = require('express');
const { authMiddleware } = require('../middleware/auth');
const { handleErrors } = require('../middleware/errorHandler');
const ActivityController = require('../controllers/activityController');

/**
 * Configurazione router attività
 * @param {Object} database - Istanza del database
 * @returns {express.Router} Router configurato
 */
function setupActivitiesRoutes(database) {
    const router = express.Router();
    const activityController = new ActivityController(database);

    // Middleware di autenticazione per tutte le routes
    router.use(authMiddleware);

    // Routes per CRUD base
    router.post('/', handleErrors(activityController.createActivity.bind(activityController)));
    router.get('/', handleErrors(activityController.getActivities.bind(activityController)));
    router.get('/:activityId', handleErrors(activityController.getActivityById.bind(activityController)));
    router.put('/:activityId', handleErrors(activityController.updateActivity.bind(activityController)));
    router.delete('/:activityId', handleErrors(activityController.deleteActivity.bind(activityController)));

    // Routes per i report
    router.get('/reports/weekly', handleErrors(activityController.getWeeklyReport.bind(activityController)));
    router.get('/reports/monthly', handleErrors(activityController.getMonthlyReport.bind(activityController)));
    router.get('/reports/quarterly', handleErrors(activityController.getQuarterlyReport.bind(activityController)));

    // Route per ottenere i tipi di attività disponibili
    router.get('/types/available', handleErrors((req, res) => {
        const activityTypes = activityController.activityModel.ACTIVITY_TYPES;
        res.json({
            success: true,
            data: {
                types: Object.entries(activityTypes).reduce((acc, [category, activities]) => {
                    acc[category] = Object.entries(activities).map(([key, value]) => ({
                        id: key,
                        name: value.name,
                        met: value.met
                    }));
                    return acc;
                }, {}),
                timestamp: new Date().toISOString()
            }
        });
    }));

    // Route per duplicare un'attività
    router.post('/:activityId/duplicate', handleErrors(async (req, res) => {
        await activityController.duplicateActivity(req, res);
    }));

    return router;
}

module.exports = setupActivitiesRoutes;

module.exports = setupActivitiesRoutes;
