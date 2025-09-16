const Meal = require('../models/Meal');
const Analytics = require('../models/Analytics');
const Product = require('../models/Product');
const upsertProductWithMerge = require('../models/upsertProductWithMerge');
const { ValidationError, NotFoundError, UnauthorizedError } = require('../middleware/errorHandler');
const { logger } = require('../middleware/logging');
const mealSchemas = require('../validation/schemas/meal');

/**
 * Controller per la gestione dei pasti
 */
class MealController {

  /**
   * Ottiene tutti i pasti di un giorno specifico, raggruppati per tipo
   */
  static async getMealsByType(userId, date) {
    const types = ['breakfast', 'lunch', 'dinner', 'snack'];
    const result = {};

    for (const type of types) {
      let meals = await Meal.findByDate(userId, date, type);
      if (!Array.isArray(meals)) meals = [];

      const mealsWithItems = await Promise.all(
        meals.map(async (meal) => {
          const itemsWithProducts = await Promise.all(
            (meal.items || []).map(async (item) => {
              if (!item.product_id) return { ...item, product: null };

              try {
                const product = await Product.findById(item.product_id);
                return {
                  ...item,
                  product: product ? {
                    id: product.id,
                    name: product.name,
                    name_it: product.name_it,
                    display_name: product.display_name,
                    calories: product.calories,
                    carbs: product.carbs,
                    proteins: product.proteins,
                    fats: product.fats
                  } : null
                };
              } catch (err) {
                logger.error(`Errore caricando prodotto ${item.product_id}: ${err.message}`);
                return { ...item, product: null };
              }
            })
          );

          return {
            ...meal, // plain object
            items: itemsWithProducts
          };
        })
      );

      result[type] = mealsWithItems;
    }

    return result;
  }

  /**
   * Handler Express per /by-type/:date
   */
  static async getMealsByTypeHandler(req, res, next) {
    try {
      const userId = req.user.id;
      const { date } = req.params;

      const mealsByType = await MealController.getMealsByType(userId, date);

      res.json({
        success: true,
        data: mealsByType
      });
    } catch (error) {
      logger.error('Errore getMealsByTypeHandler', {
        userId: req.user?.id,
        date: req.params.date,
        error: error.message
      });
      next(error);
    }
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

      for (const product of products) {
        try {
          const id = product.product_id || product.productId;
          if (!id) throw new Error('ID prodotto mancante');
          const productData = { ...product, id };
          await upsertProductWithMerge(productData);
          logger.info('Prodotto upsert/merge', { productId: id });
        } catch (err) {
          logger.error('Errore upsert/merge prodotto', { product, error: err.message });
          throw new NotFoundError(`Prodotto ${product.productId || product.product_id} non trovato o non aggiornabile`);
        }
      }

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

      const items = products.map(p => {
        const product_id = p.product_id || p.productId;
        return { ...p, product_id };
      });

      if (!['breakfast','lunch','dinner','snack'].includes(dbMealType)) {
        throw new Error(`Tipo pasto non valido: ${type}`);
      }

      const meal = await Meal.create({
        user_id: userId,
        meal_type: dbMealType,
        date,
        items
      });


      // Dopo la creazione del pasto, aggiorna i dati aggregati del giorno
      try {
        // Usa la connessione DB corretta: preferisci quella passata da Express app, fallback su statica
        let sqliteDb = null;
        if (req.app && typeof req.app.get === 'function' && req.app.get('sqliteDb')) {
          sqliteDb = req.app.get('sqliteDb');
        } else {
          // fallback: usa la connessione statica
          const database = require('../config/database');
          sqliteDb = database.getConnection();
        }
        const analyticsModel = new Analytics(sqliteDb);
        // Recupera tutti i pasti del giorno per l'utente
        const meals = await Meal.findByUserAndDate(userId, date, false);
        let nutritionData = {
          calories_consumed: 0,
          proteins_consumed: 0,
          carbs_consumed: 0,
          fats_consumed: 0,
          fiber_consumed: 0,
          water_consumed: 0,
          meals_count: meals.length
        };
        for (const m of meals) {
          nutritionData.calories_consumed += m.total_calories || 0;
          nutritionData.proteins_consumed += m.total_proteins || 0;
          nutritionData.carbs_consumed += m.total_carbs || 0;
          nutritionData.fats_consumed += m.total_fats || 0;
          nutritionData.fiber_consumed += m.total_fiber || 0;
          // Se hai un campo water, aggiungilo qui
        }
        await analyticsModel.updateNutritionTrend(userId, date, nutritionData);
        logger.info('Dati aggregati nutrition_trends aggiornati', { userId, date });
      } catch (aggErr) {
        logger.error('Errore aggiornamento nutrition_trends dopo creazione pasto', { userId, date, error: aggErr.message });
      }

      res.status(201).json({
        success: true,
        data: meal
      });

      logger.info('Pasto creato', { userId, mealId: meal.id });
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

      if (!meal) throw new NotFoundError('Pasto non trovato');
      if (meal.userId !== userId) throw new UnauthorizedError('Non hai accesso a questo pasto');

      const mealWithProducts = await meal.loadProducts();

      const nutrients = {
        calories: 0, proteins: 0, carbs: 0, fats: 0, fiber: 0, sugars: 0, salt: 0,
        saturated_fats: 0, monounsaturated_fats: 0, polyunsaturated_fats: 0, trans_fats: 0, cholesterol: 0,
        vitamin_a: 0, vitamin_c: 0, vitamin_d: 0, vitamin_e: 0, vitamin_k: 0,
        thiamin: 0, riboflavin: 0, niacin: 0, vitamin_b6: 0, folate: 0, vitamin_b12: 0, biotin: 0, pantothenic_acid: 0,
        calcium: 0, iron: 0, magnesium: 0, phosphorus: 0, potassium: 0, sodium: 0, zinc: 0, copper: 0, manganese: 0,
        selenium: 0, iodine: 0, chromium: 0, molybdenum: 0
      };

      for (const item of mealWithProducts.products) {
        const product = item.product;
        const quantity = item.quantity;
        const multiplier = quantity / 100;
        Object.keys(nutrients).forEach(nutrient => {
          if (product[nutrient]) nutrients[nutrient] += product[nutrient] * multiplier;
        });
      }

      res.json({ success: true, data: { ...mealWithProducts, nutrients } });

      logger.info('Dettagli pasto recuperati', { userId, mealId });
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

      const existingMeal = await Meal.findById(mealId);
      if (!existingMeal) throw new NotFoundError('Pasto non trovato');
      if (existingMeal.userId !== userId) throw new UnauthorizedError('Non hai accesso a questo pasto');

      for (const product of products) {
        const exists = await Product.exists(product.productId);
        if (!exists) throw new NotFoundError(`Prodotto ${product.productId} non trovato`);
      }

      const updatedMeal = await Meal.update(mealId, { type, date, products });

      // Dopo l'aggiornamento del pasto, aggiorna i dati aggregati del giorno
      try {
        const Analytics = require('../models/Analytics');
        const analyticsModel = new Analytics(req.app.get('sqliteDb'));
        const meals = await Meal.getMealsByDate(userId, date);
        let nutritionData = {
          calories_consumed: 0,
          proteins_consumed: 0,
          carbs_consumed: 0,
          fats_consumed: 0,
          fiber_consumed: 0,
          water_consumed: 0,
          meals_count: meals.length
        };
        for (const m of meals) {
          nutritionData.calories_consumed += m.calories || 0;
          nutritionData.proteins_consumed += m.proteins || 0;
          nutritionData.carbs_consumed += m.carbs || 0;
          nutritionData.fats_consumed += m.fats || 0;
          nutritionData.fiber_consumed += m.fiber || 0;
          nutritionData.water_consumed += m.water || 0;
        }
        await analyticsModel.updateNutritionTrend(userId, date, nutritionData);
        logger.info('Dati aggregati nutrition_trends aggiornati dopo update', { userId, date });
      } catch (aggErr) {
        logger.error('Errore aggiornamento nutrition_trends dopo updateMeal', { userId, date, error: aggErr.message });
      }

      res.json({ success: true, data: updatedMeal });
      logger.info('Pasto aggiornato', { userId, mealId });
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

      const existingMeal = await Meal.findById(mealId);
      if (!existingMeal) throw new NotFoundError('Pasto non trovato');
      if (existingMeal.userId !== userId) throw new UnauthorizedError('Non hai accesso a questo pasto');

      const mealDate = existingMeal.date;
      await Meal.delete(mealId);

      // Dopo la cancellazione del pasto, aggiorna i dati aggregati del giorno
      try {
        const Analytics = require('../models/Analytics');
        const analyticsModel = new Analytics(req.app.get('sqliteDb'));
        const meals = await Meal.getMealsByDate(userId, mealDate);
        let nutritionData = {
          calories_consumed: 0,
          proteins_consumed: 0,
          carbs_consumed: 0,
          fats_consumed: 0,
          fiber_consumed: 0,
          water_consumed: 0,
          meals_count: meals.length
        };
        for (const m of meals) {
          nutritionData.calories_consumed += m.calories || 0;
          nutritionData.proteins_consumed += m.proteins || 0;
          nutritionData.carbs_consumed += m.carbs || 0;
          nutritionData.fats_consumed += m.fats || 0;
          nutritionData.fiber_consumed += m.fiber || 0;
          nutritionData.water_consumed += m.water || 0;
        }
        await analyticsModel.updateNutritionTrend(userId, mealDate, nutritionData);
        logger.info('Dati aggregati nutrition_trends aggiornati dopo delete', { userId, mealDate });
      } catch (aggErr) {
        logger.error('Errore aggiornamento nutrition_trends dopo deleteMeal', { userId, mealDate, error: aggErr.message });
      }

      res.json({ success: true, message: 'Pasto eliminato con successo' });
      logger.info('Pasto eliminato', { userId, mealId });
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
