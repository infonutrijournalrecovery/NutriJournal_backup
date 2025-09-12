const express = require('express');
const AuthMiddleware = require('../middleware/auth');
const { validate } = require('../middleware/validation');
const MealController = require('../controllers/mealController');

const router = express.Router();

// GET /api/meals/single/:mealId - Ottiene un pasto specifico 
router.get('/single/:mealId', AuthMiddleware.verifyToken, validate(MealController.validations.getMeal), MealController.getMeal);

// GET /api/meals/:date[?type=...] - Ottiene tutti i pasti per una data (e tipo opzionale)
router.get('/:date', AuthMiddleware.verifyToken, validate(MealController.validations.dayMeals), MealController.getDayMeals);

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
