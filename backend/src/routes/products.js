const express = require('express');
const ProductController = require('../controllers/productController');
const AuthMiddleware = require('../middleware/auth');

const router = express.Router();

// Middleware di autenticazione
const auth = AuthMiddleware.verifyToken;

// GET /api/products/search - Cerca prodotti
router.get('/search', auth, ProductController.searchProducts);

// GET /api/products/barcode/:barcode - Cerca per codice a barre
router.get('/barcode/:barcode', auth, ProductController.getProductByBarcode);

// GET /api/products/most-used - Prodotti più utilizzati
router.get('/most-used', auth, ProductController.getMostUsedProducts);

// GET /api/products/:productId - Ottieni prodotto specifico
router.get('/:productId', auth, ProductController.getProduct);

module.exports = router;
