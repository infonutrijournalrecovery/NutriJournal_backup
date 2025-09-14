const Meal = require('../models/Meal');
const Product = require('../models/Product');
const upsertProductWithMerge = require('../models/upsertProductWithMerge');
const { ValidationError, NotFoundError, UnauthorizedError } = require('../middleware/errorHandler');
const { logger } = require('../middleware/logging');
const MealUtils = require('../utils/mealUtils');
const mealSchemas = require('../validation/schemas/meal');

/**
 * Controller per la gestione dei pasti
 */
class MealController {

  /**
   * Ottiene tutti i pasti di un giorno specifico, raggruppati per tipo
   */
  static async getMealsByType(userId, date) {
    // Per ogni tipo di pasto, chiama findByDate
    const types = ['breakfast', 'lunch', 'dinner', 'snack'];
    const result = {};
    for (const type of types) {
      const meals = await Meal.findByDate(userId, date, type);
      console.log(`[DEBUG][getMealsByType] userId: ${userId}, date: ${date}, type: ${type}, meals trovati:`, meals);
      result[type] = meals;
    }
    return result;
  }
  /**
   * Schemi di validazione
   */
  static validations = {
    dayMeals: mealSchemas.dateParam,
    createMeal: mealSchemas.mealInput,
    updateMeal: mealSchemas.mealUpdate,
    getMeal: mealSchemas.mealId,
    deleteMeal: mealSchemas.mealId
  };

  /**
   * Ottiene tutti i pasti di un giorno specifico
   */
  static async getDayMeals(req, res, next) {
    try {
      const { date } = req.params;
      const userId = req.user.id;
      const type = req.query.type || null;

      logger.info('Richiesta pasti del giorno', {
        userId,
        date,
        type
      });

      const meals = await Meal.findByDate(userId, date, type);

      // Log dettagliato per debug struttura dati
      meals.forEach((meal, idx) => {
        logger.info(`[DEBUG][MEAL] #${idx+1}`, {
          type: meal.type || meal.meal_type,
          date: meal.date,
          itemsCount: meal.items?.length,
          items: Array.isArray(meal.items) ? meal.items.map(item => ({
            product_id: item.product_id,
            name: item.product?.name,
            name_it: item.product?.name_it,
            display_name: item.product?.display_name
          })) : []
        });
      });

      res.json({
        success: true,
        data: meals
      });

      logger.info('Pasti del giorno recuperati', {
        userId,
        date,
        type,
        mealsCount: meals.length
      });
    } catch (error) {
      logger.error('Errore recupero pasti del giorno', {
        userId: req.user.id,
        date: req.params.date,
        type: req.query.type,
        error: error.message
      });
      next(error);
    }
  }

  /**
   * Crea un nuovo pasto
   */
  static async createMeal(req, res, next) {
    try {
      // Accetta sia 'products' che 'items' come array di prodotti
      let products = Array.isArray(req.body.products) ? req.body.products : undefined;
      if (!products && Array.isArray(req.body.items)) products = req.body.items;
      if (!products) products = [];
      const { type, date } = req.body;
      const userId = req.user.id;

      logger.info('Creazione nuovo pasto', {
        userId,
        type,
        date,
        productsCount: products.length
      });

      // Upsert/merge prodotti: crea o aggiorna ogni prodotto con i dati più completi
      for (const product of products) {
        try {
          // Normalizza id
          const id = product.product_id || product.productId;
          if (!id) throw new Error('ID prodotto mancante');
          // Prepara dati coerenti
          const productData = { ...product, id };
          await upsertProductWithMerge(productData);
          logger.info('Prodotto upsert/merge', { productId: id });
        } catch (err) {
          logger.error('Errore upsert/merge prodotto', { product, error: err.message });
          throw new NotFoundError(`Prodotto ${product.productId || product.product_id} non trovato o non aggiornabile`);
        }
      }


      // Centralizza e normalizza il tipo pasto
      const MEAL_TYPE_MAP = {
        'colazione': 'breakfast',
        'pranzo': 'lunch',
        'cena': 'dinner',
        'spuntino': 'snack',
        'spuntini': 'snack',
        'breakfast': 'breakfast',
        'lunch': 'lunch',
        'dinner': 'dinner',
        'snack': 'snack'
      };
      function normalizeMealType(input) {
        const key = (input || '').toLowerCase();
        return MEAL_TYPE_MAP[key] || 'snack';
      }
      const dbMealType = normalizeMealType(type);

      // Mappa products in meal items con product_id e campi richiesti
      const items = products.map(p => {
        // Forza sempre la presenza di product_id
        const product_id = p.product_id || p.productId;
        return {
          ...p,
          product_id,
        };
      });


      // Validazione forte lato backend
      if (!['breakfast','lunch','dinner','snack'].includes(dbMealType)) {
        throw new Error(`Tipo pasto non valido: ${type}`);
      }
      const meal = await Meal.create({
        user_id: userId,
        meal_type: dbMealType,
        date,
        items
      });

      res.status(201).json({
        success: true,
        data: meal
      });

      logger.info('Pasto creato', {
        userId,
        mealId: meal.id
      });
    } catch (error) {
      next(error);
    }
  }
  /**
   * Ottiene i dettagli di un pasto specifico
   */
  static async getMeal(req, res, next) {
    try {
      const { mealId } = req.params;
      const userId = req.user.id;

      const meal = await Meal.findById(mealId);

      if (!meal) {
        throw new NotFoundError('Pasto non trovato');
      }

      if (meal.userId !== userId) {
        throw new UnauthorizedError('Non hai accesso a questo pasto');
      }

      // Carica i dettagli dei prodotti per calcolare i nutrienti
      const mealWithProducts = await meal.loadProducts();
      
      // Calcola i nutrienti totali
      const nutrients = {
        calories: 0,
        proteins: 0,
        carbs: 0,
        fats: 0,
        fiber: 0,
        sugars: 0,
        salt: 0,
        saturated_fats: 0,
        monounsaturated_fats: 0,
        polyunsaturated_fats: 0,
        trans_fats: 0,
        cholesterol: 0,
        // Vitamine
        vitamin_a: 0,
        vitamin_c: 0,
        vitamin_d: 0,
        vitamin_e: 0,
        vitamin_k: 0,
        thiamin: 0,
        riboflavin: 0,
        niacin: 0,
        vitamin_b6: 0,
        folate: 0,
        vitamin_b12: 0,
        biotin: 0,
        pantothenic_acid: 0,
        // Minerali
        calcium: 0,
        iron: 0,
        magnesium: 0,
        phosphorus: 0,
        potassium: 0,
        sodium: 0,
        zinc: 0,
        copper: 0,
        manganese: 0,
        selenium: 0,
        iodine: 0,
        chromium: 0,
        molybdenum: 0
      };

      // Calcola i nutrienti in base alle quantità
      for (const item of mealWithProducts.products) {
        const product = item.product;
        const quantity = item.quantity;
        const multiplier = quantity / 100; // converte in base alla quantità (i valori nutrizionali sono per 100g)

        Object.keys(nutrients).forEach(nutrient => {
          if (product[nutrient]) {
            nutrients[nutrient] += product[nutrient] * multiplier;
          }
        });
      }

      res.json({
        success: true,
        data: {
          ...mealWithProducts,
          nutrients
        }
      });

      logger.info('Dettagli pasto recuperati', {
        userId,
        mealId
      });
    } catch (error) {
      logger.error('Errore recupero dettagli pasto', {
        userId: req.user.id,
        mealId: req.params.mealId,
        error: error.message
      });
      next(error);
    }
  }

  /**
   * Aggiorna un pasto esistente
   */
  static async updateMeal(req, res, next) {
    try {
      const { mealId } = req.params;
      const { type, date, products } = req.body;
      const userId = req.user.id;

      // Verifica esistenza e proprietà del pasto
      const existingMeal = await Meal.findById(mealId);
      if (!existingMeal) {
        throw new NotFoundError('Pasto non trovato');
      }
      if (existingMeal.userId !== userId) {
        throw new UnauthorizedError('Non hai accesso a questo pasto');
      }

      // Verifica che i prodotti esistano
      for (const product of products) {
        const exists = await Product.exists(product.productId);
        if (!exists) {
          throw new NotFoundError(`Prodotto ${product.productId} non trovato`);
        }
      }

      const updatedMeal = await Meal.update(mealId, {
        type,
        date,
        products
      });

      res.json({
        success: true,
        data: updatedMeal
      });

      logger.info('Pasto aggiornato', {
        userId,
        mealId
      });
    } catch (error) {
      logger.error('Errore aggiornamento pasto', {
        userId: req.user.id,
        mealId: req.params.mealId,
        error: error.message
      });
      next(error);
    }
  }

  /**
   * Elimina un pasto
   */
  static async deleteMeal(req, res, next) {
    try {
      const { mealId } = req.params;
      const userId = req.user.id;

      // Verifica esistenza e proprietà del pasto
      const existingMeal = await Meal.findById(mealId);
      if (!existingMeal) {
        throw new NotFoundError('Pasto non trovato');
      }
      if (existingMeal.userId !== userId) {
        throw new UnauthorizedError('Non hai accesso a questo pasto');
      }

      await Meal.delete(mealId);

      res.json({
        success: true,
        message: 'Pasto eliminato con successo'
      });

      logger.info('Pasto eliminato', {
        userId,
        mealId
      });
    } catch (error) {
      logger.error('Errore eliminazione pasto', {
        userId: req.user.id,
        mealId: req.params.mealId,
        error: error.message
      });
      next(error);
    }
  }
}

module.exports = MealController;
