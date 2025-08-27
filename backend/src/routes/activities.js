const express = require('express');
const router = express.Router();
const AuthMiddleware = require('../middleware/auth');
const { validate } = require('../utils/validation');
const database = require('../config/database');
const ActivityController = require('../controllers/activityController');

// Inizializza controller
const activityController = new ActivityController(database.db);

// Middleware di autenticazione
const auth = AuthMiddleware.verifyToken;

// GET /api/activities - Ottieni attività utente
router.get('/', auth, async (req, res) => {
    await activityController.getActivities(req, res);
});

// GET /api/activities/stats - Statistiche attività
router.get('/stats', auth, async (req, res) => {
    await activityController.getActivityStats(req, res);
});

// GET /api/activities/:date - Ottieni attività per data
router.get('/:date', auth, async (req, res) => {
    await activityController.getActivitiesByDate(req, res);
});

// POST /api/activities - Crea nuova attività
router.post('/', auth, validate('createActivity'), async (req, res) => {
    await activityController.createActivity(req, res);
});

// GET /api/activities/:activityId - Ottieni attività specifica
router.get('/:activityId', auth, async (req, res) => {
    await activityController.getActivityById(req, res);
});

// PUT /api/activities/:activityId - Aggiorna attività
router.put('/:activityId', auth, validate('updateActivity'), async (req, res) => {
    await activityController.updateActivity(req, res);
});

// DELETE /api/activities/:activityId - Elimina attività
router.delete('/:activityId', auth, async (req, res) => {
    await activityController.deleteActivity(req, res);
});

// POST /api/activities/:activityId/duplicate - Duplica attività
router.post('/:activityId/duplicate', auth, validate('duplicateActivity'), async (req, res) => {
    await activityController.duplicateActivity(req, res);
});

module.exports = router;
