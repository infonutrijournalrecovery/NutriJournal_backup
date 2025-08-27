const express = require('express');
const router = express.Router();
const MealController = require('../controllers/mealController');
const AuthMiddleware = require('../middleware/auth');
const { validate } = require('../utils/validation');

// Middleware di autenticazione
const auth = AuthMiddleware.verifyToken;

// GET /api/meals/day/:date - Pasti per giorno specifico
router.get('/day/:date', auth, MealController.getDayMeals);

// GET /api/meals/recent - Pasti recenti
router.get('/recent', auth, MealController.getRecentMeals);

// GET /api/meals/favorites - Pasti preferiti
router.get('/favorites', auth, MealController.getFavoriteMeals);

// GET /api/meals/stats - Statistiche pasti
router.get('/stats', auth, MealController.getMealStats);

// GET /api/meals/search - Cerca pasti
router.get('/search', auth, MealController.searchMeals);

// GET /api/meals/suggestions/:date - Suggerimenti per la giornata
router.get('/suggestions/:date', auth, MealController.getDaySuggestions);

// POST /api/meals - Crea nuovo pasto
router.post('/', auth, validate('createMeal'), MealController.createMeal);

// GET /api/meals/:mealId - Ottieni pasto specifico
router.get('/:mealId', auth, MealController.getMeal);

// PUT /api/meals/:mealId - Aggiorna pasto
router.put('/:mealId', auth, validate('updateMeal'), MealController.updateMeal);

// DELETE /api/meals/:mealId - Elimina pasto
router.delete('/:mealId', auth, MealController.deleteMeal);

// POST /api/meals/:mealId/items - Aggiungi cibo al pasto
router.post('/:mealId/items', auth, validate('addMealItem'), MealController.addMealItem);

// PUT /api/meals/:mealId/items/:itemId - Aggiorna cibo nel pasto
router.put('/:mealId/items/:itemId', auth, validate('updateMealItem'), MealController.updateMealItem);

// DELETE /api/meals/:mealId/items/:itemId - Rimuovi cibo dal pasto
router.delete('/:mealId/items/:itemId', auth, MealController.removeMealItem);

// POST /api/meals/:mealId/duplicate - Duplica pasto
router.post('/:mealId/duplicate', auth, validate('duplicateMeal'), MealController.duplicateMeal);

// POST /api/meals/:mealId/favorite - Aggiungi/rimuovi dai preferiti
router.post('/:mealId/favorite', auth, MealController.toggleFavoriteMeal);

// GET /api/meals/:mealId/nutrition - Analisi nutrizionale del pasto
router.get('/:mealId/nutrition', auth, MealController.getNutritionAnalysis);

module.exports = router;
