const express = require('express');
const AuthMiddleware = require('../middleware/auth');
const { validate } = require('../utils/validation');
const MealController = require('../controllers/mealController');

const router = express.Router();

// GET /api/meals/single/:mealId - Ottiene un pasto specifico 
router.get('/single/:mealId', AuthMiddleware.verifyToken, validate(MealController.validations.getMeal), MealController.getMeal);

// GET /api/meals/:date[?type=...] - Ottiene tutti i pasti per una data (e tipo opzionale)
router.get('/:date', AuthMiddleware.verifyToken, validate(MealController.validations.dayMeals), MealController.getDayMeals);

// GET /api/meals/by-type/:date - Ottiene tutti i pasti per una data, raggruppati per tipo
router.get('/by-type/:date', AuthMiddleware.verifyToken, async (req, res, next) => {
    try {
        const { date } = req.params;
        const userId = req.user.id;
        const meals = await MealController.getMealsByType(userId, date);
        res.json({ success: true, mealsByType: meals });
    } catch (error) {
        next(error);
    }
});

// POST /api/meals - Crea un nuovo pasto
router.post('/', (req, res, next) => {
    console.log('Headers ricevuti:', req.headers);
    console.log('Body ricevuto:', req.body);
    AuthMiddleware.verifyToken(req, res, (err) => {
        if (err) {
            console.error('Errore verifica token:', err);
            return next(err);
        }
        console.log('Token verificato, utente:', req.user);
        validate(MealController.validations.createMeal)(req, res, (err) => {
            if (err) {
                console.error('Errore validazione:', err);
                return next(err);
            }
            MealController.createMeal(req, res, next);
        });
    });
});

// PUT /api/meals/:mealId - Aggiorna un pasto esistente
router.put('/:mealId', (req, res, next) => {
    auth(req, res, (err) => {
        if (err) return next(err);
        MealController.updateMeal(req, res, next);
    });
});

// DELETE /api/meals/:mealId - Elimina un pasto
router.delete('/:mealId', (req, res, next) => {
    auth(req, res, (err) => {
        if (err) return next(err);
        MealController.deleteMeal(req, res, next);
    });
});

module.exports = router;
