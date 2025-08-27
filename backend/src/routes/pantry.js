const express = require('express');
const router = express.Router();
const AuthMiddleware = require('../middleware/auth');
const { validate } = require('../utils/validation');
const database = require('../config/database');
const PantryController = require('../controllers/pantryController');

// Inizializza controller
const pantryController = new PantryController(database.db);

// Middleware di autenticazione
const auth = AuthMiddleware.verifyToken;

// === GESTIONE DISPENSA ===

// GET /api/pantry - Ottieni elementi dispensa
router.get('/', auth, async (req, res) => {
    await pantryController.getItems(req, res);
});

// POST /api/pantry - Aggiungi elemento alla dispensa
router.post('/', auth, validate('addPantryItem'), async (req, res) => {
    await pantryController.addItem(req, res);
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

// GET /api/pantry/expiring - Elementi in scadenza
router.get('/expiring', auth, async (req, res) => {
    await pantryController.getExpiringItems(req, res);
});

// GET /api/pantry/:itemId - Ottieni elemento specifico
router.get('/:itemId', auth, async (req, res) => {
    await pantryController.getItemById(req, res);
});

// PUT /api/pantry/:itemId - Aggiorna elemento
router.put('/:itemId', auth, validate('updatePantryItem'), async (req, res) => {
    await pantryController.updateItem(req, res);
});

// DELETE /api/pantry/:itemId - Elimina elemento
router.delete('/:itemId', auth, async (req, res) => {
    await pantryController.deleteItem(req, res);
});

// POST /api/pantry/:itemId/consume - Consuma quantità prodotto
router.post('/:itemId/consume', auth, validate('consumePantryItem'), async (req, res) => {
    await pantryController.consumeItem(req, res);
});

// POST /api/pantry/:itemId/duplicate - Duplica elemento
router.post('/:itemId/duplicate', auth, validate('duplicatePantryItem'), async (req, res) => {
    await pantryController.duplicateItem(req, res);
});

// === LISTA DELLA SPESA ===

// GET /api/pantry/shopping-list - Ottieni lista della spesa
router.get('/shopping-list', auth, async (req, res) => {
    await pantryController.getShoppingList(req, res);
});

// POST /api/pantry/shopping-list - Aggiungi alla lista della spesa
router.post('/shopping-list', auth, validate('addToShoppingList'), async (req, res) => {
    await pantryController.addToShoppingList(req, res);
});

// PUT /api/pantry/shopping-list/:itemId - Segna come completato
router.put('/shopping-list/:itemId', auth, validate('completeShoppingItem'), async (req, res) => {
    await pantryController.completeShoppingItem(req, res);
});

// DELETE /api/pantry/shopping-list/:itemId - Elimina dalla lista
router.delete('/shopping-list/:itemId', auth, async (req, res) => {
    await pantryController.deleteShoppingItem(req, res);
});

module.exports = router;
