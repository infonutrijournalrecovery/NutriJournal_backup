
const express = require('express');
const AuthMiddleware = require('../middleware/auth');
const { validate, addPantryItemSchema } = require('../utils/validation');
const PantryController = require('../controllers/pantryController');

// Export a function that receives the db and returns the router
module.exports = function createPantryRouter(sqliteDb) {
    const router = express.Router();
    const pantryController = new PantryController(sqliteDb);
    const auth = AuthMiddleware.verifyToken;


    // GET /api/pantry/has?name=...&brand=... - Verifica se un prodotto è già in dispensa (nuova logica)
    router.get('/has', auth, async (req, res, next) => {
        await pantryController.hasProduct(req, res, next);
    });

    // GET /api/pantry/has/:barcode - Verifica se un prodotto è già in dispensa (legacy, per compatibilità)
    router.get('/has/:barcode', auth, async (req, res, next) => {
        await pantryController.hasProduct(req, res, next);
    });

    // === GESTIONE DISPENSA ===

    // GET /api/pantry - Ottieni elementi dispensa
    router.get('/', auth, async (req, res) => {
        await pantryController.getItems(req, res);
    });

    // GET /api/pantry/search - Cerca prodotti in dispensa
    router.get('/search', auth, async (req, res, next) => {
        await pantryController.searchPantryProducts(req, res, next);
    });

    // POST /api/pantry/products/:productId - Aggiungi prodotto alla dispensa
    router.post('/products/:productId', auth, async (req, res, next) => {
        await pantryController.addToPantry(req, res, next);
    });

    // DELETE /api/pantry/products/:productId - Rimuovi prodotto dalla dispensa
    router.delete('/products/:productId', auth, async (req, res, next) => {
        await pantryController.removeFromPantry(req, res, next);
    });

    // POST /api/pantry - Aggiungi elemento alla dispensa
    router.post('/', auth, validate(addPantryItemSchema), async (req, res, next) => {
        await pantryController.addItem(req, res, next);
    });

    // GET /api/pantry/stats - Statistiche dispensa
    router.get('/stats', auth, async (req, res) => {
        await pantryController.getStats(req, res);
    });

    // GET /api/pantry/categories - Categorie utilizzate
    router.get('/categories', auth, async (req, res) => {
        await pantryController.getCategories(req, res);
    });

    // GET /api/pantry/locations - Posizioni utilizzate
    router.get('/locations', auth, async (req, res) => {
        await pantryController.getLocations(req, res);
    });

    return router;
};
