const express = require('express');
const router = express.Router();
const ProductController = require('../controllers/productController');
const AuthMiddleware = require('../middleware/auth');
const { validate } = require('../utils/validation');

// Middleware di autenticazione
const auth = AuthMiddleware.verifyToken;

// GET /api/products/search - Cerca prodotti
router.get('/search', auth, ProductController.searchProducts);

// GET /api/products/barcode/:barcode - Cerca per codice a barre
router.get('/barcode/:barcode', auth, ProductController.getProductByBarcode);

// GET /api/products/favorites - Prodotti preferiti
router.get('/favorites', auth, ProductController.getFavoriteProducts);

// GET /api/products/most-used - Prodotti più utilizzati
router.get('/most-used', auth, ProductController.getMostUsedProducts);

// GET /api/products/custom - Prodotti personalizzati
router.get('/custom', auth, ProductController.getCustomProducts);

// POST /api/products/custom - Crea nuovo prodotto personalizzato
router.post('/custom', auth, validate('createProduct'), ProductController.createCustomProduct);

// GET /api/products/:productId - Ottieni prodotto specifico
router.get('/:productId', auth, ProductController.getProductNutrition);

// GET /api/products/:productId/similar - Prodotti simili
router.get('/:productId/similar', auth, ProductController.getSimilarProducts);

// GET /api/products/:productId/stats - Statistiche prodotto
router.get('/:productId/stats', auth, ProductController.getProductStats);

// GET /api/products/:productId/ratings - Valutazioni prodotto
router.get('/:productId/ratings', auth, ProductController.getProductRatings);

// PUT /api/products/custom/:productId - Aggiorna prodotto personalizzato
router.put('/custom/:productId', auth, validate('updateProduct'), ProductController.updateCustomProduct);

// DELETE /api/products/custom/:productId - Elimina prodotto personalizzato
router.delete('/custom/:productId', auth, ProductController.deleteCustomProduct);

// POST /api/products/:productId/favorite - Aggiungi/rimuovi dai preferiti
router.post('/:productId/favorite', auth, ProductController.toggleFavorite);

// POST /api/products/:productId/rate - Valuta prodotto
router.post('/:productId/rate', auth, validate('rateProduct'), ProductController.rateProduct);

// POST /api/products/:productId/sync - Sincronizza prodotto con OpenFoodFacts
router.post('/:productId/sync', auth, ProductController.syncProduct);

module.exports = router;
