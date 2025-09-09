const Product = require('../models/Product');
const { ValidationError, NotFoundError, UnauthorizedError } = require('../middleware/errorHandler');
const openFoodFactsService = require('../services/openFoodFactsService');
const translationService = require('../services/translationService');
const { logger } = require('../middleware/logging');
const joi = require('joi');

/**
 * Controller per la gestione dei prodotti alimentari
 */
class ProductController {
  /**
   * Validazione per la ricerca prodotti
   */
  static searchProductsValidation = {
    query: joi.string().min(2).required().messages({
      'string.min': 'La query di ricerca deve essere di almeno 2 caratteri',
      'string.empty': 'La query di ricerca è richiesta'
    }),
    page: joi.number().min(1).default(1),
    limit: joi.number().min(1).max(50).default(20)
  };

  /**
   * Cerca prodotti in OpenFoodFacts e USDA
   */
  static async searchProducts(req, res, next) {
    try {
      const { query = '', page = 1, limit = 20 } = req.query;
      const sanitizedQuery = query.trim();

      // Validazione input
      if (sanitizedQuery.length < 2) {
        throw new ValidationError('Query di ricerca deve essere di almeno 2 caratteri');
      }

      const sanitizedPage = Math.max(1, parseInt(page) || 1);
      const sanitizedLimit = Math.min(50, Math.max(1, parseInt(limit) || 20));

      logger.info('Ricerca prodotti iniziata', {
        query: sanitizedQuery,
        page: sanitizedPage,
        limit: sanitizedLimit,
        userId: req.user?.id
      });

      const searchResults = await openFoodFactsService.searchProducts(
        sanitizedQuery,
        sanitizedPage,
        sanitizedLimit
      );

      // Traduci i risultati in italiano
      const translatedResults = await Promise.all(
        searchResults.products.map(async (product) => {
          try {
            return await translationService.translateProduct(product);
          } catch (error) {
            logger.warn('Errore traduzione prodotto', {
              productId: product.id,
              error: error.message,
              userId: req.user?.id
            });
            return product; // Ritorna prodotto non tradotto in caso di errore
          }
        })
      );

      res.json({
        success: true,
        data: {
          products: translatedResults,
          pagination: {
            page: sanitizedPage,
            limit: sanitizedLimit,
            total: searchResults.total,
            hasMore: searchResults.total > sanitizedPage * sanitizedLimit
          },
          query: sanitizedQuery
        }
      });

      logger.info('Ricerca prodotti completata', {
        query: sanitizedQuery,
        resultsCount: translatedResults.length,
        userId: req.user?.id
      });
    } catch (error) {
      logger.error('Errore ricerca prodotti', {
        query: req.query.query,
        error: error.message,
        userId: req.user?.id
      });
      next(error);
    }
  }

  /**
   * Validazione per la ricerca per codice a barre
   */
  static barcodeValidation = {
    barcode: joi.string().required().pattern(/^[0-9]+$/).messages({
      'string.pattern.base': 'Il codice a barre deve contenere solo numeri',
      'string.empty': 'Il codice a barre è richiesto'
    })
  };

  /**
   * Ottiene un prodotto dal codice a barre tramite OpenFoodFacts
   */
  static async getProductByBarcode(req, res, next) {
    try {
      const { barcode } = req.params;

      logger.info('Ricerca prodotto per barcode', {
        barcode,
        userId: req.user?.id
      });

      const product = await openFoodFactsService.getProductByBarcode(barcode);
      
      if (!product) {
        throw new NotFoundError('Prodotto non trovato');
      }

      // Traduci il prodotto in italiano
      const translatedProduct = await translationService.translateProduct(product);

      res.json({
        success: true,
        data: translatedProduct
      });

      logger.info('Prodotto trovato per barcode', {
        barcode,
        productId: product.id,
        userId: req.user?.id
      });
    } catch (error) {
      logger.error('Errore ricerca prodotto per barcode', {
        barcode: req.params.barcode,
        error: error.message,
        userId: req.user?.id
      });
      next(error);
    }
  }

  /**
   * Validazione per getMostUsedProducts
   */
  static mostUsedValidation = {
    limit: joi.number().min(1).max(50).default(10)
  };

  /**
   * Ottiene i prodotti più utilizzati dall'utente
   */
  static async getMostUsedProducts(req, res, next) {
    try {
      const { limit = 10 } = req.query;
      const userId = req.user.id;

      const products = await Product.getMostUsed(userId, parseInt(limit));

      res.json({
        success: true,
        data: products
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Validazione per getProduct
   */
  static getProductValidation = {
    productId: joi.string().required().messages({
      'string.empty': 'ID prodotto richiesto'
    })
  };

  /**
   * Ottiene i dettagli di un prodotto
   */
  static async getProduct(req, res, next) {
    try {
      const { productId } = req.params;
      
      const product = await Product.findById(productId);
      
      if (!product) {
        throw new NotFoundError('Prodotto non trovato');
      }

      res.json({
        success: true,
        data: product
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Crea un nuovo prodotto personalizzato
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next middleware function
   */
  static async createProduct(req, res, next) {
    try {
      const productData = {
        ...req.body,
        user_id: req.user.id
      };

      // Validazione campi obbligatori
      if (!productData.name || !productData.name.trim()) {
        throw new ValidationError('Nome del prodotto è obbligatorio');
      }
      
      if (!productData.calories || isNaN(productData.calories) || productData.calories < 0) {
        throw new ValidationError('Calorie devono essere un numero positivo');
      }

      // Validazione macronutrienti
      const macros = ['proteins', 'carbohydrates', 'fats'];
      macros.forEach(macro => {
        if (productData[macro] !== undefined && (isNaN(productData[macro]) || productData[macro] < 0)) {
          throw new ValidationError(`${macro} deve essere un numero positivo`);
        }
      });

      logger.info('Creazione nuovo prodotto', {
        userId: req.user.id,
        productName: productData.name
      });

      const product = await Product.create(productData);

      res.status(201).json({
        success: true,
        message: 'Prodotto creato con successo',
        data: {
          product: product.toJSON()
        }
      });

      logger.info('Prodotto creato con successo', {
        userId: req.user.id,
        productId: product.id,
        productName: product.name
      });
    } catch (error) {
      logger.error('Errore creazione prodotto', {
        userId: req.user.id,
        error: error.message,
        data: req.body
      });
      next(error);
    }
  }

  /**
   * Ottieni dettagli di un prodotto specifico
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next middleware function
   */
  static async getProduct(req, res, next) {
    try {
      const { productId } = req.params;

      if (!productId || !/^\d+$/.test(productId)) {
        throw new ValidationError('ID prodotto non valido');
      }

      logger.info('Richiesta dettagli prodotto', {
        userId: req.user?.id,
        productId
      });

      const product = await Product.findById(productId);
      if (!product) {
        throw new NotFoundError('Prodotto non trovato');
      }

      // Se il prodotto è personale, verifica l'ownership
      if (product.user_id && product.user_id !== req.user?.id) {
        logger.warn('Tentativo accesso non autorizzato al prodotto', {
          userId: req.user?.id,
          productId,
          ownerUserId: product.user_id
        });
        throw new UnauthorizedError('Non autorizzato ad accedere a questo prodotto');
      }

      res.json({
        success: true,
        data: {
          product: product.toJSON()
        }
      });

      logger.info('Dettagli prodotto recuperati', {
        userId: req.user?.id,
        productId,
        isCustomProduct: !!product.user_id
      });
    } catch (error) {
      logger.error('Errore recupero dettagli prodotto', {
        userId: req.user?.id,
        productId: req.params.productId,
        error: error.message
      });
      next(error);
    }
  }

  /**
   * Aggiorna un prodotto esistente
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next middleware function
   */
  static async updateProduct(req, res, next) {
    try {
      const { productId } = req.params;

      if (!productId || !/^\d+$/.test(productId)) {
        throw new ValidationError('ID prodotto non valido');
      }

      logger.info('Richiesta aggiornamento prodotto', {
        userId: req.user.id,
        productId,
        updateFields: Object.keys(req.body)
      });

      const product = await Product.findById(productId);
      if (!product) {
        throw new NotFoundError('Prodotto non trovato');
      }

      // Verifica ownership
      if (!product.user_id || product.user_id !== req.user.id) {
        logger.warn('Tentativo modifica non autorizzata del prodotto', {
          userId: req.user.id,
          productId,
          ownerUserId: product.user_id
        });
        throw new UnauthorizedError('Non autorizzato a modificare questo prodotto');
      }

      // Validazione campi di aggiornamento
      if (req.body.name !== undefined && !req.body.name.trim()) {
        throw new ValidationError('Nome del prodotto non può essere vuoto');
      }

      if (req.body.calories !== undefined && (isNaN(req.body.calories) || req.body.calories < 0)) {
        throw new ValidationError('Calorie devono essere un numero positivo');
      }

      // Validazione macronutrienti
      const macros = ['proteins', 'carbohydrates', 'fats'];
      macros.forEach(macro => {
        if (req.body[macro] !== undefined && (isNaN(req.body[macro]) || req.body[macro] < 0)) {
          throw new ValidationError(`${macro} deve essere un numero positivo`);
        }
      });

      await product.update(req.body);

      res.json({
        success: true,
        message: 'Prodotto aggiornato con successo',
        data: {
          product: product.toJSON()
        }
      });

      logger.info('Prodotto aggiornato con successo', {
        userId: req.user.id,
        productId,
        updatedFields: Object.keys(req.body)
      });
    } catch (error) {
      logger.error('Errore aggiornamento prodotto', {
        userId: req.user.id,
        productId: req.params.productId,
        error: error.message
      });
      next(error);
    }
  }

  /**
   * Elimina un prodotto
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next middleware function
   */
  static async deleteProduct(req, res, next) {
    try {
      const { productId } = req.params;

      if (!productId || !/^\d+$/.test(productId)) {
        throw new ValidationError('ID prodotto non valido');
      }

      logger.info('Richiesta eliminazione prodotto', {
        userId: req.user.id,
        productId
      });

      const product = await Product.findById(productId);
      if (!product) {
        throw new NotFoundError('Prodotto non trovato');
      }

      // Verifica ownership
      if (!product.user_id || product.user_id !== req.user.id) {
        logger.warn('Tentativo eliminazione non autorizzata del prodotto', {
          userId: req.user.id,
          productId,
          ownerUserId: product.user_id
        });
        throw new UnauthorizedError('Non autorizzato a eliminare questo prodotto');
      }

      await product.delete();

      res.json({
        success: true,
        message: 'Prodotto eliminato con successo'
      });

      logger.info('Prodotto eliminato con successo', {
        userId: req.user.id,
        productId
      });
    } catch (error) {
      logger.error('Errore eliminazione prodotto', {
        userId: req.user.id,
        productId: req.params.productId,
        error: error.message
      });
      next(error);
    }
  }

  /**
   * Cerca prodotti nel database locale
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next middleware function
   */
  static async searchLocalProducts(req, res, next) {
    try {
      const { query = '', page = 1, limit = 20, includeCustom = true } = req.query;
      const sanitizedQuery = query.trim();

      if (sanitizedQuery.length < 2) {
        throw new ValidationError('Query di ricerca deve essere di almeno 2 caratteri');
      }

      const sanitizedPage = Math.max(1, parseInt(page) || 1);
      const sanitizedLimit = Math.min(50, Math.max(1, parseInt(limit) || 20));

      logger.info('Ricerca prodotti locali iniziata', {
        query: sanitizedQuery,
        page: sanitizedPage,
        limit: sanitizedLimit,
        includeCustom,
        userId: req.user?.id
      });

      const searchResults = await Product.search(sanitizedQuery, {
        page: sanitizedPage,
        limit: sanitizedLimit,
        userId: includeCustom ? req.user?.id : null
      });

      res.json({
        success: true,
        data: {
          products: searchResults.data.map(product => product.toJSON()),
          pagination: {
            page: sanitizedPage,
            limit: sanitizedLimit,
            total: searchResults.total,
            hasMore: searchResults.total > sanitizedPage * sanitizedLimit
          },
          query: sanitizedQuery
        }
      });

      logger.info('Ricerca prodotti locali completata', {
        query: sanitizedQuery,
        resultsCount: searchResults.data.length,
        userId: req.user?.id
      });
    } catch (error) {
      logger.error('Errore ricerca prodotti locali', {
        query: req.query.query,
        error: error.message,
        userId: req.user?.id
      });
      next(error);
    }
  }
  // Implementazioni temporanee


  static async getFavoriteProducts(req, res) {
    res.status(501).json({ message: 'Not implemented yet' });
  }

  static async getMostUsedProducts(req, res, next) {
    try {
      const { limit = 10 } = req.query;
      const sanitizedLimit = Math.min(50, Math.max(1, parseInt(limit) || 10));

      logger.info("Richiesta prodotti più utilizzati", {
        userId: req.user?.id,
        limit: sanitizedLimit
      });

      const products = await Product.getMostUsed(sanitizedLimit);

      res.json({
        success: true,
        data: products
      });

      logger.info("Prodotti più utilizzati recuperati", {
        userId: req.user?.id,
        count: products.length
      });
    } catch (error) {
      logger.error("Errore recupero prodotti più utilizzati", {
        userId: req.user?.id,
        error: error.message
      });
      next(error);
    }
  }

  static async getCustomProducts(req, res, next) {
    try {
      const { page = 1, limit = 20 } = req.query;
      const sanitizedPage = Math.max(1, parseInt(page) || 1);
      const sanitizedLimit = Math.min(50, Math.max(1, parseInt(limit) || 20));

      logger.info("Richiesta prodotti personalizzati", {
        userId: req.user?.id,
        page: sanitizedPage,
        limit: sanitizedLimit
      });

      const searchResults = await Product.searchByName("", {
        page: sanitizedPage,
        limit: sanitizedLimit,
        source: "user",
        userId: req.user.id
      });

      res.json({
        success: true,
        data: searchResults
      });

      logger.info("Prodotti personalizzati recuperati", {
        userId: req.user?.id,
        count: searchResults.products.length
      });
    } catch (error) {
      logger.error("Errore recupero prodotti personalizzati", {
        userId: req.user?.id,
        error: error.message
      });
      next(error);
    }
  }

  static async createCustomProduct(req, res, next) {
    try {
      const productData = {
        ...req.body,
        source: "user",
        user_id: req.user.id
      };

      logger.info("Richiesta creazione prodotto personalizzato", {
        userId: req.user?.id,
        productName: productData.name
      });

      const product = await Product.create(productData);

      res.status(201).json({
        success: true,
        data: product,
        message: "Prodotto creato con successo"
      });

      logger.info("Prodotto personalizzato creato", {
        userId: req.user?.id,
        productId: product.id
      });
    } catch (error) {
      logger.error("Errore creazione prodotto personalizzato", {
        userId: req.user?.id,
        error: error.message,
        data: req.body
      });
      next(error);
    }
  }

  static async getProductNutrition(req, res, next) {
    try {
      const { productId } = req.params;
      const { grams = 100 } = req.query;

      if (!productId || !/^\d+$/.test(productId)) {
        throw new ValidationError("ID prodotto non valido");
      }

      const sanitizedGrams = Math.max(0, parseFloat(grams) || 100);

      logger.info("Richiesta informazioni nutrizionali", {
        userId: req.user?.id,
        productId,
        grams: sanitizedGrams
      });

      const product = await Product.findById(productId);
      if (!product) {
        throw new NotFoundError("Prodotto non trovato");
      }

      const nutrition = product.calculateNutritionForPortion(sanitizedGrams);

      res.json({
        success: true,
        data: {
          nutrition,
          portion: sanitizedGrams
        }
      });

      logger.info("Informazioni nutrizionali recuperate", {
        userId: req.user?.id,
        productId,
        grams: sanitizedGrams
      });
    } catch (error) {
      logger.error("Errore recupero informazioni nutrizionali", {
        userId: req.user?.id,
        productId: req.params.productId,
        error: error.message
      });
      next(error);
    }
  }

  static async getSimilarProducts(req, res, next) {
    try {
      const { productId } = req.params;
      const { limit = 5 } = req.query;

      if (!productId || !/^\d+$/.test(productId)) {
        throw new ValidationError("ID prodotto non valido");
      }

      const sanitizedLimit = Math.min(20, Math.max(1, parseInt(limit) || 5));

      logger.info("Richiesta prodotti simili", {
        userId: req.user?.id,
        productId,
        limit: sanitizedLimit
      });

      const product = await Product.findById(productId);
      if (!product) {
        throw new NotFoundError("Prodotto non trovato");
      }

      const similarProducts = await product.findSimilar(sanitizedLimit);

      res.json({
        success: true,
        data: similarProducts
      });

      logger.info("Prodotti simili recuperati", {
        userId: req.user?.id,
        productId,
        count: similarProducts.length
      });
    } catch (error) {
      logger.error("Errore recupero prodotti simili", {
        userId: req.user?.id,
        productId: req.params.productId,
        error: error.message
      });
      next(error);
    }
  }

  static async getProductStats(req, res, next) {
    try {
      const { productId } = req.params;

      if (!productId || !/^\d+$/.test(productId)) {
        throw new ValidationError("ID prodotto non valido");
      }

      logger.info("Richiesta statistiche prodotto", {
        userId: req.user?.id,
        productId
      });

      const product = await Product.findById(productId);
      if (!product) {
        throw new NotFoundError("Prodotto non trovato");
      }

      const similarProducts = await product.findSimilar(5);

      res.json({
        success: true,
        data: {
          usage_count: product.usage_count,
          last_used: product.last_used,
          is_favorite: product.is_favorite,
          is_nutritionally_complete: product.isNutritionallyComplete(),
          has_translations: product.hasTranslations(),
          similar_products: similarProducts,
          created_at: product.created_at,
          updated_at: product.updated_at
        }
      });

      logger.info("Statistiche prodotto recuperate", {
        userId: req.user?.id,
        productId
      });
    } catch (error) {
      logger.error("Errore recupero statistiche prodotto", {
        userId: req.user?.id,
        productId: req.params.productId,
        error: error.message
      });
      next(error);
    }
  }

  static async updateCustomProduct(req, res, next) {
    try {
      const { productId } = req.params;
      const updates = req.body;

      if (!productId || !/^\d+$/.test(productId)) {
        throw new ValidationError("ID prodotto non valido");
      }

      logger.info("Richiesta aggiornamento prodotto personalizzato", {
        userId: req.user?.id,
        productId,
        updates: Object.keys(updates)
      });

      const product = await Product.findById(productId);
      if (!product) {
        throw new NotFoundError("Prodotto non trovato");
      }

      if (product.user_id !== req.user.id) {
        throw new UnauthorizedError("Non autorizzato a modificare questo prodotto");
      }

      const updatedProduct = await product.update(updates);

      res.json({
        success: true,
        data: updatedProduct,
        message: "Prodotto aggiornato con successo"
      });

      logger.info("Prodotto personalizzato aggiornato", {
        userId: req.user?.id,
        productId
      });
    } catch (error) {
      logger.error("Errore aggiornamento prodotto personalizzato", {
        userId: req.user?.id,
        productId: req.params.productId,
        error: error.message,
        data: req.body
      });
      next(error);
    }
  }

  static async deleteCustomProduct(req, res, next) {
    try {
      const { productId } = req.params;

      if (!productId || !/^\d+$/.test(productId)) {
        throw new ValidationError("ID prodotto non valido");
      }

      logger.info("Richiesta eliminazione prodotto personalizzato", {
        userId: req.user?.id,
        productId
      });

      const product = await Product.findById(productId);
      if (!product) {
        throw new NotFoundError("Prodotto non trovato");
      }

      if (product.user_id !== req.user.id) {
        throw new UnauthorizedError("Non autorizzato a eliminare questo prodotto");
      }

      await product.delete();

      res.json({
        success: true,
        message: "Prodotto eliminato con successo"
      });

      logger.info("Prodotto personalizzato eliminato", {
        userId: req.user?.id,
        productId
      });
    } catch (error) {
      logger.error("Errore eliminazione prodotto personalizzato", {
        userId: req.user?.id,
        productId: req.params.productId,
        error: error.message
      });
      next(error);
    }
  }

  static async toggleFavorite(req, res, next) {
    try {
      const { productId } = req.params;

      if (!productId || !/^\d+$/.test(productId)) {
        throw new ValidationError("ID prodotto non valido");
      }

      logger.info("Richiesta toggle preferito", {
        userId: req.user?.id,
        productId
      });

      const product = await Product.findById(productId);
      if (!product) {
        throw new NotFoundError("Prodotto non trovato");
      }

      const updatedProduct = await product.toggleFavorite();

      res.json({
        success: true,
        data: updatedProduct,
        message: updatedProduct.is_favorite ? "Prodotto aggiunto ai preferiti" : "Prodotto rimosso dai preferiti"
      });

      logger.info("Preferito aggiornato", {
        userId: req.user?.id,
        productId,
        isFavorite: updatedProduct.is_favorite
      });
    } catch (error) {
      logger.error("Errore toggle preferito", {
        userId: req.user?.id,
        productId: req.params.productId,
        error: error.message
      });
      next(error);
    }
  }
}

module.exports = ProductController;
