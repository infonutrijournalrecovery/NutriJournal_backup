const database = require('../config/database');
const Product = require('./Product');
const { logger } = require('../middleware/logging');

class Meal {
  // Trova pasti per data (e tipo opzionale) per utente
  static async findByDate(userId, date, type = null, includeItems = true) {
    try {
      const sql = `SELECT * FROM ${this.tableName} WHERE user_id = ? AND date = ?${type ? ' AND meal_type = ?' : ''} ORDER BY time ASC, created_at ASC`;
      const params = type ? [userId, date, type] : [userId, date];
      const meals = await new Promise((resolve, reject) => {
        this.db.all(sql, params, (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        });
      });
      const mealInstances = meals.map(meal => new Meal(meal));
      if (includeItems) {
        for (const meal of mealInstances) {
          await meal.loadItems();
        }
      }
      return mealInstances;
    } catch (error) {
      console.error('❌ Errore ricerca pasti per data:', error);
      throw new Error('Errore ricerca pasti per data');
    }
  }
  // Tipi di pasto validi
  static get MEAL_TYPES() {
    return {
      BREAKFAST: 'breakfast',
      LUNCH: 'lunch',
      DINNER: 'dinner',
      SNACK: 'snack'
    };
  }

  constructor(data = {}) {
    this.id = data.id;
    this.userId = data.userId;
    this.type = this.validateMealType(data.type);
    this.meal_name = data.meal_name;
    this.date = data.date;
    this.time = data.time;
    this.location = data.location;
    this.notes = data.notes;
    
    // Totali nutrizionali calcolati
    this.total_calories = data.total_calories;
    this.total_proteins = data.total_proteins;
    this.total_carbs = data.total_carbs;
    this.total_fats = data.total_fats;
    this.total_fiber = data.total_fiber;
    
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
    
    // Array di meal_items (se caricati)
    this.items = data.items || [];
    // Array di prodotti con quantità (se caricati)
    this.products = data.products || [];
  }

  static get tableName() {
    return 'meals';
  }

  static get itemsTableName() {
    return 'meal_items';
  }

  static get db() {
    return database.getConnection();
  }

  /**
   * Carica i dettagli completi dei prodotti per questo pasto
   */
  async loadProducts() {
    try {
      // Query per ottenere tutti gli items del pasto con i dettagli dei prodotti
      const items = await this.db(Meal.itemsTableName + ' as mi')
        .select(
          'mi.*',
          'p.*'
        )
        .join('products as p', 'mi.product_id', 'p.id')
        .where('mi.meal_id', this.id);

      // Mappa gli items in un formato più utile
      this.products = items.map(item => ({
        quantity: item.quantity,
        unit: item.unit,
        product: new Product(item)
      }));

      return this;
    } catch (error) {
      logger.error('Errore nel caricamento dei prodotti del pasto:', {
        mealId: this.id,
        error: error.message
      });
      throw error;
    }
  }

  // Trova pasti recenti per utente
  static async findRecentByUser(userId, limit = 10) {
    try {
      const meals = await this.db(this.tableName)
        .where('user_id', userId)
        .orderBy('date', 'desc')
        .orderBy('time', 'desc')
        .limit(limit);

      // Carica gli items per ogni pasto
      const mealsWithItems = await Promise.all(
        meals.map(async meal => {
          const instance = new Meal(meal);
          await instance.loadItems();
          return instance;
        })
      );

      return mealsWithItems;
    } catch (error) {
      logger.error('Errore nel recupero pasti recenti:', {
        userId,
        error: error.message
      });
      throw error;
    }
  }

  // Valida il tipo pasto
  validateMealType(type) {
    if (!type) return null;
    
    const validTypes = Object.values(Meal.MEAL_TYPES);
    if (!validTypes.includes(type)) {
      throw new Error(`Tipo pasto non valido. Valori ammessi: ${validTypes.join(', ')}`);
    }
    return type;
  }

  // Trova pasto per ID con items
  static async findById(id, includeItems = true) {
    try {
      const meal = await this.db(this.tableName)
        .where('id', id)
        .first();
      
      if (!meal) return null;

      const mealInstance = new Meal(meal);
      
      if (includeItems) {
        await mealInstance.loadItems();
      }
      
      return mealInstance;
    } catch (error) {
      console.error('❌ Errore ricerca pasto per ID:', error);
      throw new Error('Errore ricerca pasto');
    }
  }

  // Ottieni pasti dell'utente per data
  static async findByUserAndDate(userId, date, includeItems = true) {
    try {
      const meals = await this.db(this.tableName)
        .where('user_id', userId)
        .where('date', date)
        .orderBy('time', 'asc')
        .orderBy('created_at', 'asc');

      const mealInstances = meals.map(meal => new Meal(meal));
      
      if (includeItems) {
        for (const meal of mealInstances) {
          await meal.loadItems();
        }
      }
      
      return mealInstances;
    } catch (error) {
      console.error('❌ Errore ricerca pasti per utente e data:', error);
      throw new Error('Errore ricerca pasti');
    }
  }

  // Ottieni pasti dell'utente per periodo
  static async findByUserAndDateRange(userId, startDate, endDate, includeItems = false) {
    try {
      const meals = await this.db(this.tableName)
        .where('user_id', userId)
        .whereBetween('date', [startDate, endDate])
        .orderBy('date', 'desc')
        .orderBy('time', 'desc');

      const mealInstances = meals.map(meal => new Meal(meal));
      
      if (includeItems) {
        for (const meal of mealInstances) {
          await meal.loadItems();
        }
      }
      
      return mealInstances;
    } catch (error) {
      console.error('❌ Errore ricerca pasti per periodo:', error);
      throw new Error('Errore ricerca pasti');
    }
  }

  // Ottieni pasti di oggi dell'utente
  static async getTodayMeals(userId) {
    const today = new Date().toISOString().split('T')[0];
    return await this.findByUserAndDate(userId, today, true);
  }

  // Crea nuovo pasto
  static async create(mealData) {
    const trx = await this.db.transaction();
    
    try {
      // Validazione dati base
      if (!mealData.user_id || !mealData.date) {
        throw new Error('User ID e data sono obbligatori');
      }

      // Prepara dati pasto
      const mealToCreate = {
        user_id: mealData.user_id,
        meal_type: mealData.meal_type || 'snack',
        meal_name: mealData.meal_name,
        date: mealData.date,
        time: mealData.time || new Date().toISOString().split('T')[1].substring(0, 8),
        location: mealData.location,
        notes: mealData.notes,
        total_calories: 0,
        total_proteins: 0,
        total_carbs: 0,
        total_fats: 0,
        total_fiber: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Inserisci pasto
      const [mealId] = await trx(this.tableName).insert(mealToCreate);
      
      // Aggiungi items se forniti
      if (mealData.items && mealData.items.length > 0) {
        for (const item of mealData.items) {
          await this.addItemToMeal(trx, mealId, item);
        }
        
        // Ricalcola totali
        await this.recalculateMealTotals(trx, mealId);
      }

      await trx.commit();
      
      return await this.findById(mealId);
    } catch (error) {
      await trx.rollback();
      console.error('❌ Errore creazione pasto:', error);
      throw error;
    }
  }

  // Aggiorna pasto
  async update(updates) {
    try {
      const allowedFields = [
        'meal_type', 'meal_name', 'date', 'time', 
        'location', 'notes'
      ];

      const filteredUpdates = {};
      Object.keys(updates).forEach(key => {
        if (allowedFields.includes(key)) {
          filteredUpdates[key] = updates[key];
        }
      });

      filteredUpdates.updated_at = new Date().toISOString();

      await Meal.db(Meal.tableName)
        .where('id', this.id)
        .update(filteredUpdates);

      Object.assign(this, filteredUpdates);
      return this;
    } catch (error) {
      console.error('❌ Errore aggiornamento pasto:', error);
      throw new Error('Errore aggiornamento pasto');
    }
  }

  // Carica items del pasto
  async loadItems() {
    try {
      const items = await Meal.db(Meal.itemsTableName)
        .select('meal_items.*', 'products.name', 'products.name_it', 'products.brand', 'products.brand_it')
        .leftJoin('products', 'meal_items.product_id', 'products.id')
        .where('meal_items.meal_id', this.id)
        .orderBy('meal_items.created_at', 'asc');

      this.items = items.map(item => ({
        id: item.id,
        product_id: item.product_id,
        quantity: item.quantity,
        unit: item.unit,
        calories: item.calories,
        proteins: item.proteins,
        carbs: item.carbs,
        fats: item.fats,
        fiber: item.fiber,
        product: {
          id: item.product_id,
          name: item.name,
          name_it: item.name_it,
          brand: item.brand,
          brand_it: item.brand_it,
          display_name: item.name_it || item.name,
          display_brand: item.brand_it || item.brand,
        },
        created_at: item.created_at,
      }));

      return this.items;
    } catch (error) {
      console.error('❌ Errore caricamento items pasto:', error);
      this.items = [];
      return this.items;
    }
  }

  // Aggiungi item al pasto
  async addItem(itemData) {
    const trx = await Meal.db.transaction();
    
    try {
      await Meal.addItemToMeal(trx, this.id, itemData);
      await Meal.recalculateMealTotals(trx, this.id);
      await trx.commit();
      
      // Ricarica dati aggiornati
      const updatedMeal = await Meal.findById(this.id);
      Object.assign(this, updatedMeal);
      
      return this;
    } catch (error) {
      await trx.rollback();
      console.error('❌ Errore aggiunta item al pasto:', error);
      throw error;
    }
  }

  // Rimuovi item dal pasto
  async removeItem(itemId) {
    const trx = await Meal.db.transaction();
    
    try {
      await trx(Meal.itemsTableName)
        .where('id', itemId)
        .where('meal_id', this.id)
        .del();
      
      await Meal.recalculateMealTotals(trx, this.id);
      await trx.commit();
      
      // Ricarica dati aggiornati
      const updatedMeal = await Meal.findById(this.id);
      Object.assign(this, updatedMeal);
      
      return this;
    } catch (error) {
      await trx.rollback();
      console.error('❌ Errore rimozione item dal pasto:', error);
      throw error;
    }
  }

  // Aggiorna quantità di un item
  async updateItemQuantity(itemId, newQuantity) {
    const trx = await Meal.db.transaction();
    
    try {
      // Trova item e prodotto
      const item = await trx(Meal.itemsTableName)
        .select('meal_items.*', 'products.*')
        .leftJoin('products', 'meal_items.product_id', 'products.id')
        .where('meal_items.id', itemId)
        .where('meal_items.meal_id', this.id)
        .first();

      if (!item) {
        throw new Error('Item non trovato');
      }

      // Calcola nuovi valori nutrizionali
      const product = new Product(item);
      const nutrition = product.calculateNutritionForPortion(newQuantity);

      await trx(Meal.itemsTableName)
        .where('id', itemId)
        .update({
          quantity: newQuantity,
          calories: nutrition.calories,
          proteins: nutrition.proteins,
          carbs: nutrition.carbs,
          fats: nutrition.fats,
          fiber: nutrition.fiber,
        });

      await Meal.recalculateMealTotals(trx, this.id);
      await trx.commit();
      
      // Ricarica dati aggiornati
      const updatedMeal = await Meal.findById(this.id);
      Object.assign(this, updatedMeal);
      
      return this;
    } catch (error) {
      await trx.rollback();
      console.error('❌ Errore aggiornamento quantità item:', error);
      throw error;
    }
  }

  // Metodo statico per aggiungere item a un pasto (usato nelle transazioni)
  static async addItemToMeal(trx, mealId, itemData) {
    // Validazione
    if (!itemData.product_id || !itemData.quantity) {
      throw new Error('Product ID e quantità sono obbligatori');
    }

    // Carica prodotto per calcolare valori nutrizionali
    const product = await Product.findById(itemData.product_id);
    if (!product) {
      throw new Error('Prodotto non trovato');
    }

    // Calcola valori nutrizionali per la porzione
    const nutrition = product.calculateNutritionForPortion(itemData.quantity);

    const itemToCreate = {
      meal_id: mealId,
      product_id: itemData.product_id,
      quantity: itemData.quantity,
      unit: itemData.unit || 'g',
      calories: nutrition.calories,
      proteins: nutrition.proteins,
      carbs: nutrition.carbs,
      fats: nutrition.fats,
      fiber: nutrition.fiber,
      created_at: new Date().toISOString(),
    };

    await trx(this.itemsTableName).insert(itemToCreate);
    
    // Incrementa usage del prodotto
    await product.incrementUsage();
    
    return true;
  }

  // Metodo statico per ricalcolare totali pasto
  static async recalculateMealTotals(trx, mealId) {
    const totals = await trx(this.itemsTableName)
      .where('meal_id', mealId)
      .sum({
        total_calories: 'calories',
        total_proteins: 'proteins',
        total_carbs: 'carbs',
        total_fats: 'fats',
        total_fiber: 'fiber',
      })
      .first();

    await trx(this.tableName)
      .where('id', mealId)
      .update({
        total_calories: Math.round((totals.total_calories || 0) * 10) / 10,
        total_proteins: Math.round((totals.total_proteins || 0) * 10) / 10,
        total_carbs: Math.round((totals.total_carbs || 0) * 10) / 10,
        total_fats: Math.round((totals.total_fats || 0) * 10) / 10,
        total_fiber: Math.round((totals.total_fiber || 0) * 10) / 10,
        updated_at: new Date().toISOString(),
      });

    return true;
  }

  // Elimina pasto
  async delete() {
    const trx = await Meal.db.transaction();
    
    try {
      // Elimina prima gli items
      await trx(Meal.itemsTableName)
        .where('meal_id', this.id)
        .del();
      
      // Poi elimina il pasto
      await trx(Meal.tableName)
        .where('id', this.id)
        .del();
      
      await trx.commit();
      return true;
    } catch (error) {
      await trx.rollback();
      console.error('❌ Errore eliminazione pasto:', error);
      throw new Error('Errore eliminazione pasto');
    }
  }

  // Duplica pasto per un'altra data
  async duplicate(newDate, newTime = null) {
    try {
      const duplicateData = {
        user_id: this.user_id,
        meal_type: this.meal_type,
        meal_name: this.meal_name ? `${this.meal_name} (copia)` : null,
        date: newDate,
        time: newTime || this.time,
        location: this.location,
        notes: this.notes,
        items: this.items.map(item => ({
          product_id: item.product_id,
          quantity: item.quantity,
          unit: item.unit,
        })),
      };

      return await Meal.create(duplicateData);
    } catch (error) {
      console.error('❌ Errore duplicazione pasto:', error);
      throw new Error('Errore duplicazione pasto');
    }
  }

  // Ottieni tipo di pasto in italiano
  getMealTypeItalian() {
    const types = {
      breakfast: 'Colazione',
      lunch: 'Pranzo',
      dinner: 'Cena',
      snack: 'Spuntino',
    };
    
    return types[this.meal_type] || 'Pasto';
  }

  // Verifica se pasto è completo nutrizionalmente
  isNutritionallyBalanced() {
    if (!this.total_calories) return false;
    
    const carbsPercent = (this.total_carbs * 4 / this.total_calories) * 100;
    const proteinsPercent = (this.total_proteins * 4 / this.total_calories) * 100;
    const fatsPercent = (this.total_fats * 9 / this.total_calories) * 100;
    
    // Verifica se rientra in range bilanciati
    return (
      carbsPercent >= 40 && carbsPercent <= 65 &&
      proteinsPercent >= 15 && proteinsPercent <= 25 &&
      fatsPercent >= 20 && fatsPercent <= 35
    );
  }

  // Calcola distribuzione macronutrienti
  getMacroDistribution() {
    if (!this.total_calories) return null;
    
    const carbsCalories = this.total_carbs * 4;
    const proteinsCalories = this.total_proteins * 4;
    const fatsCalories = this.total_fats * 9;
    
    return {
      carbs: Math.round((carbsCalories / this.total_calories) * 100),
      proteins: Math.round((proteinsCalories / this.total_calories) * 100),
      fats: Math.round((fatsCalories / this.total_calories) * 100),
    };
  }

  // Serializza per JSON
  toJSON() {
    const meal = { ...this };
    
    // Aggiungi dati calcolati
    meal.meal_type_italian = this.getMealTypeItalian();
    meal.is_nutritionally_balanced = this.isNutritionallyBalanced();
    meal.macro_distribution = this.getMacroDistribution();
    meal.items_count = this.items.length;
    
    return meal;
  }

  // Statistiche pasti utente
  static async getUserMealStats(userId, days = 30) {
    return new Promise((resolve, reject) => {
      try {
        const db = this.db;
        const endDate = new Date().toISOString().split('T')[0];
        const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        const sql = `
          SELECT
            COUNT(*) as total_meals,
            AVG(total_calories) as avg_calories,
            AVG(total_proteins) as avg_proteins,
            AVG(total_carbs) as avg_carbs,
            AVG(total_fats) as avg_fats,
            SUM(CASE WHEN meal_type = 'breakfast' THEN 1 ELSE 0 END) as breakfast_count,
            SUM(CASE WHEN meal_type = 'lunch' THEN 1 ELSE 0 END) as lunch_count,
            SUM(CASE WHEN meal_type = 'dinner' THEN 1 ELSE 0 END) as dinner_count,
            SUM(CASE WHEN meal_type = 'snack' THEN 1 ELSE 0 END) as snack_count
          FROM meals
          WHERE user_id = ? AND date BETWEEN ? AND ?
        `;
        db.get(sql, [userId, startDate, endDate], (err, row) => {
          if (err) {
            console.error('❌ Errore statistiche pasti utente:', err);
            return reject(err);
          }
          resolve(row);
        });
      } catch (error) {
        console.error('❌ Errore statistiche pasti utente:', error);
        reject(error);
      }
    });
  }
}

module.exports = Meal;
