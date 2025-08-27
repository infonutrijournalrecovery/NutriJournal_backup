const Product = require('../models/Product');
const { ValidationError, NotFoundError } = require('../middleware/errorHandler');
const openFoodFactsService = require('../services/openFoodFactsService');
const translationService = require('../services/translationService');

class ProductController {
  // Cerca prodotti su OpenFoodFacts
  static async searchProducts(req, res) {
    try {
      const { query, page = 1, limit = 20 } = req.query;

      if (!query || query.trim().length < 2) {
        throw new ValidationError('Query di ricerca deve essere di almeno 2 caratteri');
      }

      const searchResults = await openFoodFactsService.searchProducts(
        query.trim(), 
        parseInt(page), 
        parseInt(limit)
      );

      // Traduci i risultati in italiano
      const translatedResults = await Promise.all(
        searchResults.products.map(async (product) => {
          return await translationService.translateProduct(product);
        })
      );

      res.json({
        success: true,
        data: {
          products: translatedResults,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: searchResults.count,
            hasMore: searchResults.count > page * limit,
          },
          search_query: query,
        },
      });
    } catch (error) {
      throw error;
    }
  }

  // Ottieni prodotto per barcode
  static async getProductByBarcode(req, res) {
    try {
      const { barcode } = req.params;

      if (!barcode || !/^\d+$/.test(barcode)) {
        throw new ValidationError('Barcode non valido');
      }

      // Prima cerca nel database locale
      let product = await Product.findByBarcode(barcode);

      if (!product) {
        // Se non trovato localmente, cerca su OpenFoodFacts
        const offProduct = await openFoodFactsService.getProductByBarcode(barcode);
        
        if (!offProduct) {
          throw new NotFoundError('Prodotto non trovato');
        }

        // Traduci e salva nel database locale
        const translatedProduct = await translationService.translateProduct(offProduct);
        product = await Product.create({
          ...translatedProduct,
          user_id: req.user ? req.user.id : null, // Prodotto pubblico se non autenticato
        });
      }

      res.json({
        success: true,
        data: {
          product: product.toJSON(),
        },
      });
    } catch (error) {
      throw error;
    }
  }

  // Aggiungi prodotto personalizzato
  static async createCustomProduct(req, res) {
    try {
      const productData = {
        ...req.body,
        user_id: req.user.id,
        is_custom: true,
        source: 'custom',
      };

      // Validazione dati obbligatori
      const requiredFields = ['name', 'nutrition_per_100g'];
      const missingFields = requiredFields.filter(field => !productData[field]);
      
      if (missingFields.length > 0) {
        throw new ValidationError(`Campi obbligatori mancanti: ${missingFields.join(', ')}`);
      }

      const product = await Product.create(productData);

      res.status(201).json({
        success: true,
        message: 'Prodotto personalizzato creato con successo',
        data: {
          product: product.toJSON(),
        },
      });
    } catch (error) {
      throw error;
    }
  }

  // Ottieni prodotti personalizzati dell'utente
  static async getCustomProducts(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const search = req.query.search;

      const products = await Product.findCustomByUser(req.user.id, {
        page,
        limit,
        search,
      });

      res.json({
        success: true,
        data: {
          products: products.data.map(p => p.toJSON()),
          pagination: {
            page,
            limit,
            total: products.total,
            hasMore: products.total > page * limit,
          },
        },
      });
    } catch (error) {
      throw error;
    }
  }

  // Aggiorna prodotto personalizzato
  static async updateCustomProduct(req, res) {
    try {
      const { productId } = req.params;

      const product = await Product.findById(productId);
      if (!product) {
        throw new NotFoundError('Prodotto non trovato');
      }

      // Verifica che sia un prodotto personalizzato dell'utente
      if (!product.is_custom || product.user_id !== req.user.id) {
        throw new ValidationError('Non puoi modificare questo prodotto');
      }

      await product.update(req.body);

      res.json({
        success: true,
        message: 'Prodotto aggiornato con successo',
        data: {
          product: product.toJSON(),
        },
      });
    } catch (error) {
      throw error;
    }
  }

  // Elimina prodotto personalizzato
  static async deleteCustomProduct(req, res) {
    try {
      const { productId } = req.params;

      const product = await Product.findById(productId);
      if (!product) {
        throw new NotFoundError('Prodotto non trovato');
      }

      // Verifica che sia un prodotto personalizzato dell'utente
      if (!product.is_custom || product.user_id !== req.user.id) {
        throw new ValidationError('Non puoi eliminare questo prodotto');
      }

      await product.delete();

      res.json({
        success: true,
        message: 'Prodotto eliminato con successo',
      });
    } catch (error) {
      throw error;
    }
  }

  // Ottieni prodotti più utilizzati dall'utente
  static async getMostUsedProducts(req, res) {
    try {
      const limit = parseInt(req.query.limit) || 10;
      const days = parseInt(req.query.days) || 30;

      const products = await Product.getMostUsedByUser(req.user.id, {
        limit,
        days,
      });

      res.json({
        success: true,
        data: {
          products: products.map(p => ({
            ...p.toJSON(),
            usage_count: p.usage_count,
            last_used: p.last_used,
          })),
          period_days: days,
        },
      });
    } catch (error) {
      throw error;
    }
  }

  // Ottieni prodotti preferiti dell'utente
  static async getFavoriteProducts(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;

      const products = await Product.getFavoritesByUser(req.user.id, {
        page,
        limit,
      });

      res.json({
        success: true,
        data: {
          products: products.data.map(p => p.toJSON()),
          pagination: {
            page,
            limit,
            total: products.total,
            hasMore: products.total > page * limit,
          },
        },
      });
    } catch (error) {
      throw error;
    }
  }

  // Aggiungi/rimuovi prodotto dai preferiti
  static async toggleFavorite(req, res) {
    try {
      const { productId } = req.params;

      const product = await Product.findById(productId);
      if (!product) {
        throw new NotFoundError('Prodotto non trovato');
      }

      const isFavorite = await product.toggleFavorite(req.user.id);

      res.json({
        success: true,
        message: isFavorite ? 'Prodotto aggiunto ai preferiti' : 'Prodotto rimosso dai preferiti',
        data: {
          product_id: productId,
          is_favorite: isFavorite,
        },
      });
    } catch (error) {
      throw error;
    }
  }

  // Ottieni dettagli nutrizionali di un prodotto
  static async getProductNutrition(req, res) {
    try {
      const { productId } = req.params;
      const serving_size = parseFloat(req.query.serving_size) || 100;

      const product = await Product.findById(productId);
      if (!product) {
        throw new NotFoundError('Prodotto non trovato');
      }

      const nutritionData = product.getNutritionForServing(serving_size);

      res.json({
        success: true,
        data: {
          product: product.toJSON(),
          nutrition: nutritionData,
          serving_size,
          serving_unit: 'g',
        },
      });
    } catch (error) {
      throw error;
    }
  }

  // Ricerca prodotti simili
  static async getSimilarProducts(req, res) {
    try {
      const { productId } = req.params;
      const limit = parseInt(req.query.limit) || 10;

      const product = await Product.findById(productId);
      if (!product) {
        throw new NotFoundError('Prodotto non trovato');
      }

      const similarProducts = await Product.findSimilar(product, limit);

      res.json({
        success: true,
        data: {
          products: similarProducts.map(p => p.toJSON()),
          reference_product: product.toJSON(),
        },
      });
    } catch (error) {
      throw error;
    }
  }

  // Ottieni statistiche sui prodotti
  static async getProductStats(req, res) {
    try {
      const stats = await Product.getStats();

      res.json({
        success: true,
        data: {
          stats,
          generated_at: new Date().toISOString(),
        },
      });
    } catch (error) {
      throw error;
    }
  }

  // Sincronizza prodotto con OpenFoodFacts (aggiorna dati se disponibili)
  static async syncProduct(req, res) {
    try {
      const { productId } = req.params;

      const product = await Product.findById(productId);
      if (!product) {
        throw new NotFoundError('Prodotto non trovato');
      }

      if (!product.barcode) {
        throw new ValidationError('Impossibile sincronizzare: prodotto senza barcode');
      }

      // Cerca dati aggiornati su OpenFoodFacts
      const offProduct = await openFoodFactsService.getProductByBarcode(product.barcode);
      
      if (!offProduct) {
        throw new NotFoundError('Prodotto non trovato su OpenFoodFacts');
      }

      // Traduci e aggiorna
      const translatedProduct = await translationService.translateProduct(offProduct);
      
      // Mantieni i dati personalizzati dell'utente se presenti
      const updateData = {
        ...translatedProduct,
        // Preserva i campi personalizzati
        user_id: product.user_id,
        is_custom: product.is_custom,
        notes: product.notes,
        updated_at: new Date().toISOString(),
      };

      await product.update(updateData);

      res.json({
        success: true,
        message: 'Prodotto sincronizzato con successo',
        data: {
          product: product.toJSON(),
        },
      });
    } catch (error) {
      throw error;
    }
  }

  // Valuta un prodotto (1-5 stelle)
  static async rateProduct(req, res) {
    try {
      const { productId } = req.params;
      const { rating, review } = req.body;

      if (!rating || rating < 1 || rating > 5) {
        throw new ValidationError('Rating deve essere compreso tra 1 e 5');
      }

      const product = await Product.findById(productId);
      if (!product) {
        throw new NotFoundError('Prodotto non trovato');
      }

      await product.addRating(req.user.id, rating, review);

      res.json({
        success: true,
        message: 'Valutazione salvata con successo',
        data: {
          product_id: productId,
          rating,
          review,
        },
      });
    } catch (error) {
      throw error;
    }
  }

  // Ottieni valutazioni di un prodotto
  static async getProductRatings(req, res) {
    try {
      const { productId } = req.params;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;

      const product = await Product.findById(productId);
      if (!product) {
        throw new NotFoundError('Prodotto non trovato');
      }

      const ratings = await product.getRatings(page, limit);

      res.json({
        success: true,
        data: {
          ratings: ratings.data,
          pagination: {
            page,
            limit,
            total: ratings.total,
            hasMore: ratings.total > page * limit,
          },
          average_rating: ratings.average,
          total_ratings: ratings.total,
        },
      });
    } catch (error) {
      throw error;
    }
  }
}

module.exports = ProductController;
