const Meal = require('../models/Meal');
const Product = require('../models/Product');
const NutritionGoal = require('../models/NutritionGoal');
const { ValidationError, NotFoundError } = require('../middleware/errorHandler');

class MealController {
  // Ottieni tutti i pasti di un giorno
  static async getDayMeals(req, res) {
    try {
      const { date } = req.params;
      
      if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        throw new ValidationError('Formato data non valido (richiesto: YYYY-MM-DD)');
      }

      const meals = await Meal.findByUserAndDate(req.user.id, date);

      // Calcola totali nutrizionali del giorno
      const dayTotals = meals.reduce((totals, meal) => {
        const mealNutrition = meal.calculateNutrition();
        Object.keys(mealNutrition).forEach(key => {
          totals[key] = (totals[key] || 0) + (mealNutrition[key] || 0);
        });
        return totals;
      }, {});

      // Ottieni obiettivo attivo per confronto
      const activeGoal = await NutritionGoal.findActiveByUser(req.user.id);
      
      res.json({
        success: true,
        data: {
          date,
          meals: meals.map(meal => meal.toJSON()),
          day_totals: dayTotals,
          active_goal: activeGoal ? activeGoal.toJSON() : null,
          progress: activeGoal ? activeGoal.calculateProgressForNutrition(dayTotals) : null,
        },
      });
    } catch (error) {
      throw error;
    }
  }

  // Crea un nuovo pasto
  static async createMeal(req, res) {
    try {
      const mealData = {
        ...req.body,
        user_id: req.user.id,
      };

      // Validazione dati obbligatori
      if (!mealData.name || !mealData.date) {
        throw new ValidationError('Nome e data del pasto sono obbligatori');
      }

      const meal = await Meal.create(mealData);

      res.status(201).json({
        success: true,
        message: 'Pasto creato con successo',
        data: {
          meal: meal.toJSON(),
        },
      });
    } catch (error) {
      throw error;
    }
  }

  // Ottieni dettagli di un pasto specifico
  static async getMeal(req, res) {
    try {
      const { mealId } = req.params;

      const meal = await Meal.findById(mealId);
      if (!meal) {
        throw new NotFoundError('Pasto non trovato');
      }

      // Verifica ownership
      if (meal.user_id !== req.user.id) {
        throw new ValidationError('Non autorizzato ad accedere a questo pasto');
      }

      // Carica gli elementi del pasto con dettagli prodotti
      await meal.loadItems();

      res.json({
        success: true,
        data: {
          meal: meal.toJSON(),
          nutrition: meal.calculateNutrition(),
        },
      });
    } catch (error) {
      throw error;
    }
  }

  // Aggiorna un pasto
  static async updateMeal(req, res) {
    try {
      const { mealId } = req.params;

      const meal = await Meal.findById(mealId);
      if (!meal) {
        throw new NotFoundError('Pasto non trovato');
      }

      // Verifica ownership
      if (meal.user_id !== req.user.id) {
        throw new ValidationError('Non autorizzato a modificare questo pasto');
      }

      await meal.update(req.body);

      res.json({
        success: true,
        message: 'Pasto aggiornato con successo',
        data: {
          meal: meal.toJSON(),
        },
      });
    } catch (error) {
      throw error;
    }
  }

  // Elimina un pasto
  static async deleteMeal(req, res) {
    try {
      const { mealId } = req.params;

      const meal = await Meal.findById(mealId);
      if (!meal) {
        throw new NotFoundError('Pasto non trovato');
      }

      // Verifica ownership
      if (meal.user_id !== req.user.id) {
        throw new ValidationError('Non autorizzato a eliminare questo pasto');
      }

      await meal.delete();

      res.json({
        success: true,
        message: 'Pasto eliminato con successo',
      });
    } catch (error) {
      throw error;
    }
  }

  // Aggiungi elemento al pasto
  static async addMealItem(req, res) {
    try {
      const { mealId } = req.params;
      const { product_id, quantity, unit = 'g', notes } = req.body;

      if (!product_id || !quantity) {
        throw new ValidationError('ID prodotto e quantità sono obbligatori');
      }

      const meal = await Meal.findById(mealId);
      if (!meal) {
        throw new NotFoundError('Pasto non trovato');
      }

      // Verifica ownership
      if (meal.user_id !== req.user.id) {
        throw new ValidationError('Non autorizzato a modificare questo pasto');
      }

      // Verifica che il prodotto esista
      const product = await Product.findById(product_id);
      if (!product) {
        throw new NotFoundError('Prodotto non trovato');
      }

      const item = await meal.addItem({
        product_id,
        quantity: parseFloat(quantity),
        unit,
        notes,
      });

      // Ricarica il pasto con tutti gli elementi
      await meal.loadItems();

      res.status(201).json({
        success: true,
        message: 'Elemento aggiunto al pasto',
        data: {
          item,
          meal: meal.toJSON(),
          nutrition: meal.calculateNutrition(),
        },
      });
    } catch (error) {
      throw error;
    }
  }

  // Aggiorna elemento del pasto
  static async updateMealItem(req, res) {
    try {
      const { mealId, itemId } = req.params;

      const meal = await Meal.findById(mealId);
      if (!meal) {
        throw new NotFoundError('Pasto non trovato');
      }

      // Verifica ownership
      if (meal.user_id !== req.user.id) {
        throw new ValidationError('Non autorizzato a modificare questo pasto');
      }

      const updatedItem = await meal.updateItem(itemId, req.body);

      // Ricarica il pasto con tutti gli elementi
      await meal.loadItems();

      res.json({
        success: true,
        message: 'Elemento del pasto aggiornato',
        data: {
          item: updatedItem,
          meal: meal.toJSON(),
          nutrition: meal.calculateNutrition(),
        },
      });
    } catch (error) {
      throw error;
    }
  }

  // Rimuovi elemento dal pasto
  static async removeMealItem(req, res) {
    try {
      const { mealId, itemId } = req.params;

      const meal = await Meal.findById(mealId);
      if (!meal) {
        throw new NotFoundError('Pasto non trovato');
      }

      // Verifica ownership
      if (meal.user_id !== req.user.id) {
        throw new ValidationError('Non autorizzato a modificare questo pasto');
      }

      await meal.removeItem(itemId);

      // Ricarica il pasto con tutti gli elementi
      await meal.loadItems();

      res.json({
        success: true,
        message: 'Elemento rimosso dal pasto',
        data: {
          meal: meal.toJSON(),
          nutrition: meal.calculateNutrition(),
        },
      });
    } catch (error) {
      throw error;
    }
  }

  // Duplica un pasto
  static async duplicateMeal(req, res) {
    try {
      const { mealId } = req.params;
      const { date, time, name } = req.body;

      const originalMeal = await Meal.findById(mealId);
      if (!originalMeal) {
        throw new NotFoundError('Pasto non trovato');
      }

      // Verifica ownership
      if (originalMeal.user_id !== req.user.id) {
        throw new ValidationError('Non autorizzato ad accedere a questo pasto');
      }

      // Carica gli elementi del pasto originale
      await originalMeal.loadItems();

      const duplicatedMeal = await originalMeal.duplicate({
        date: date || new Date().toISOString().split('T')[0],
        time: time || new Date().toISOString().split('T')[1].substring(0, 8),
        name: name || `Copia di ${originalMeal.name}`,
      });

      res.status(201).json({
        success: true,
        message: 'Pasto duplicato con successo',
        data: {
          meal: duplicatedMeal.toJSON(),
          nutrition: duplicatedMeal.calculateNutrition(),
        },
      });
    } catch (error) {
      throw error;
    }
  }

  // Ottieni pasti recenti dell'utente
  static async getRecentMeals(req, res) {
    try {
      const limit = parseInt(req.query.limit) || 10;
      const days = parseInt(req.query.days) || 7;

      const meals = await Meal.findRecentByUser(req.user.id, { limit, days });

      res.json({
        success: true,
        data: {
          meals: meals.map(meal => meal.toJSON()),
          period_days: days,
        },
      });
    } catch (error) {
      throw error;
    }
  }

  // Ottieni pasti preferiti dell'utente
  static async getFavoriteMeals(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;

      const meals = await Meal.findFavoritesByUser(req.user.id, { page, limit });

      res.json({
        success: true,
        data: {
          meals: meals.data.map(meal => meal.toJSON()),
          pagination: {
            page,
            limit,
            total: meals.total,
            hasMore: meals.total > page * limit,
          },
        },
      });
    } catch (error) {
      throw error;
    }
  }

  // Aggiungi/rimuovi pasto dai preferiti
  static async toggleFavoriteMeal(req, res) {
    try {
      const { mealId } = req.params;

      const meal = await Meal.findById(mealId);
      if (!meal) {
        throw new NotFoundError('Pasto non trovato');
      }

      // Verifica ownership
      if (meal.user_id !== req.user.id) {
        throw new ValidationError('Non autorizzato a modificare questo pasto');
      }

      const isFavorite = await meal.toggleFavorite();

      res.json({
        success: true,
        message: isFavorite ? 'Pasto aggiunto ai preferiti' : 'Pasto rimosso dai preferiti',
        data: {
          meal_id: mealId,
          is_favorite: isFavorite,
        },
      });
    } catch (error) {
      throw error;
    }
  }

  // Ottieni statistiche sui pasti dell'utente
  static async getMealStats(req, res) {
    try {
      const days = parseInt(req.query.days) || 30;
      const stats = await Meal.getUserMealStats(req.user.id, days);

      res.json({
        success: true,
        data: {
          stats,
          period_days: days,
          generated_at: new Date().toISOString(),
        },
      });
    } catch (error) {
      throw error;
    }
  }

  // Cerca pasti per nome o ingredienti
  static async searchMeals(req, res) {
    try {
      const { query, page = 1, limit = 20 } = req.query;

      if (!query || query.trim().length < 2) {
        throw new ValidationError('Query di ricerca deve essere di almeno 2 caratteri');
      }

      const searchResults = await Meal.searchByUser(req.user.id, query.trim(), {
        page: parseInt(page),
        limit: parseInt(limit),
      });

      res.json({
        success: true,
        data: {
          meals: searchResults.data.map(meal => meal.toJSON()),
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: searchResults.total,
            hasMore: searchResults.total > parseInt(page) * parseInt(limit),
          },
          search_query: query,
        },
      });
    } catch (error) {
      throw error;
    }
  }

  // Ottieni analisi nutrizionale di un periodo
  static async getNutritionAnalysis(req, res) {
    try {
      const { startDate, endDate } = req.query;

      if (!startDate || !endDate) {
        throw new ValidationError('Date di inizio e fine sono obbligatorie');
      }

      if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate) || !/^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
        throw new ValidationError('Formato date non valido (richiesto: YYYY-MM-DD)');
      }

      const analysis = await Meal.getNutritionAnalysis(req.user.id, startDate, endDate);

      res.json({
        success: true,
        data: {
          analysis,
          period: {
            start_date: startDate,
            end_date: endDate,
            days: Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24)) + 1,
          },
        },
      });
    } catch (error) {
      throw error;
    }
  }

  // Ottieni suggerimenti per completare la giornata
  static async getDaySuggestions(req, res) {
    try {
      const { date } = req.params;

      if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        throw new ValidationError('Formato data non valido (richiesto: YYYY-MM-DD)');
      }

      const suggestions = await Meal.getDaySuggestions(req.user.id, date);

      res.json({
        success: true,
        data: {
          date,
          suggestions,
        },
      });
    } catch (error) {
      throw error;
    }
  }
}

module.exports = MealController;
