const database = require('../config/database');
const Product = require('./Product');
const { logger } = require('../middleware/logging');

class Meal {
  // Trova pasti per data (e tipo opzionale) per utente
  static async findByDate(userId, date, type = null, includeItems = true) {
    try {
      // Mappa valori italiani in inglese per meal_type
      const typeMap = {
        'Colazione': 'breakfast',
        'Pranzo': 'lunch',
        'Cena': 'dinner',
        'Spuntino': 'snack',
        'colazione': 'breakfast',
        'pranzo': 'lunch',
        'cena': 'dinner',
        'spuntino': 'snack',
      };
      let mappedType = type;
      if (type && typeMap[type]) {
        mappedType = typeMap[type];
      }
      const sql = `SELECT * FROM ${this.tableName} WHERE user_id = ? AND date = ?${mappedType ? ' AND meal_type = ?' : ''} ORDER BY time ASC, created_at ASC`;
      const params = mappedType ? [userId, date, mappedType] : [userId, date];
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
  // Valorizza sempre type a partire da meal_type o type
  this.type = data.meal_type || data.type || null;
  this.meal_type = data.meal_type || data.type || null;
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
      const db = Meal.db;
      const sql = `SELECT mi.*, p.* FROM meal_items mi JOIN products p ON mi.product_id = p.id WHERE mi.meal_id = ?`;
      const items = await new Promise((resolve, reject) => {
        db.all(sql, [this.id], (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        });
      });
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
      const db = this.db;
      const sql = `SELECT * FROM ${this.tableName} WHERE user_id = ? ORDER BY date DESC, time DESC LIMIT ?`;
      const meals = await new Promise((resolve, reject) => {
        db.all(sql, [userId, limit], (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        });
      });
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
      const db = this.db;
      const table = this.tableName;
      const meal = await new Promise((resolve, reject) => {
        db.get(`SELECT * FROM ${table} WHERE id = ?`, [id], (err, row) => {
          if (err) reject(err);
          else resolve(row);
        });
      });
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
      const db = this.db;
      const sql = `SELECT * FROM ${this.tableName} WHERE user_id = ? AND date = ? ORDER BY time ASC, created_at ASC`;
      const meals = await new Promise((resolve, reject) => {
        db.all(sql, [userId, date], (err, rows) => {
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
      console.error('❌ Errore ricerca pasti per utente e data:', error);
      throw new Error('Errore ricerca pasti');
    }
  }

  // Ottieni pasti dell'utente per periodo
  static async findByUserAndDateRange(userId, startDate, endDate, includeItems = false) {
    try {
      const db = this.db;
      const sql = `SELECT * FROM ${this.tableName} WHERE user_id = ? AND date BETWEEN ? AND ? ORDER BY date DESC, time DESC`;
      const meals = await new Promise((resolve, reject) => {
        db.all(sql, [userId, startDate, endDate], (err, rows) => {
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
  const { logger } = require('../middleware/logging');
    const db = this.db;

    return await new Promise((resolve, reject) => {
      db.serialize(async () => {
        try {
          db.run('BEGIN TRANSACTION');

          // Validazione dati base
          if (!mealData.user_id || !mealData.date) {
            throw new Error('User ID e data sono obbligatori');
          }

          // Usa sempre il tipo già normalizzato dal controller, ma se manca normalizza qui
          let mealType = mealData.meal_type;
          if (!mealType && mealData.type) {
            // Mappa italiano/inglese su costanti
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
            const key = (mealData.type || '').toLowerCase();
            mealType = MEAL_TYPE_MAP[key] || 'snack';
          }
          if (!mealType) mealType = 'snack';

          // Forza il campo date in formato YYYY-MM-DD
          let dateOnly = mealData.date;
          if (typeof dateOnly === 'string' && dateOnly.length > 10) {
            // Gestisce ISO string tipo '2025-09-13T00:00:00.000Z'
            dateOnly = new Date(dateOnly).toISOString().split('T')[0];
          }
          if (typeof dateOnly === 'string' && dateOnly.length === 10) {
            // Già in formato YYYY-MM-DD
            dateOnly = dateOnly;
          }

          const mealToCreate = {
            user_id: mealData.user_id,
            meal_type: mealType,
            meal_name: mealData.meal_name,
            date: dateOnly,
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

          db.run(
            `INSERT INTO ${this.tableName} (user_id, meal_type, meal_name, date, time, location, notes, total_calories, total_proteins, total_carbs, total_fats, total_fiber, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              mealToCreate.user_id,
              mealToCreate.meal_type,
              mealToCreate.meal_name,
              mealToCreate.date,
              mealToCreate.time,
              mealToCreate.location,
              mealToCreate.notes,
              mealToCreate.total_calories,
              mealToCreate.total_proteins,
              mealToCreate.total_carbs,
              mealToCreate.total_fats,
              mealToCreate.total_fiber,
              mealToCreate.created_at,
              mealToCreate.updated_at
            ],
            async function(err) {
              if (err) {
                db.run('ROLLBACK');
                console.error('❌ Errore inserimento pasto:', err);
                return reject(err);
              }
              const mealId = this.lastID;

              // Aggiungi items se forniti
              if (mealData.items && mealData.items.length > 0) {
                let errorOccurred = false;
                let completed = 0;
                for (const item of mealData.items) {
                  // Usa i valori nutrizionali dal payload se disponibili, altrimenti calcola dal prodotto DB
                  let calories = null, proteins = null, carbs = null, fats = null, fiber = null;
                  let extraNutrients = {};
                  try {
                    // 1. Prova a prendere direttamente dai campi item
                    calories = item.calories ?? item.totalNutrition?.calories ?? null;
                    proteins = item.proteins ?? item.totalNutrition?.proteins ?? null;
                    carbs = item.carbs ?? item.carbohydrates ?? item.totalNutrition?.carbohydrates ?? item.totalNutrition?.carbs ?? null;
                    fats = item.fats ?? item.totalNutrition?.fats ?? null;
                    fiber = item.fiber ?? item.totalNutrition?.fiber ?? null;

                    // 2. Estrai tutti gli altri nutrienti dinamici dal payload (escludi quelli già mappati)
                    const knownKeys = [
                      'calories','proteins','carbs','carbohydrates','fats','fiber','product_id','productId','quantity','unit','name','brand','category','ean','imageUrl','totalNutrition','nutritionPer100g','sugar','sugars','sodium','salt','saturatedFats','saturated_fat','vitaminC','vitamin_a','vitamin_c','vitamin_d','vitamin_e','vitamin_k','thiamin','riboflavin','niacin','vitamin_b6','folate','vitamin_b12','biotin','pantothenic_acid','calcium','iron','magnesium','phosphorus','potassium','zinc','copper','manganese','selenium','iodine','chromium','molybdenum'
                    ];
                    // Prendi da item.totalNutrition e item.nutritionPer100g
                    const nutrientSources = [item.totalNutrition, item.nutritionPer100g, item];
                    for (const src of nutrientSources) {
                      if (src && typeof src === 'object') {
                        for (const [k, v] of Object.entries(src)) {
                          if (!knownKeys.includes(k) && v != null) {
                            extraNutrients[k] = v;
                          }
                        }
                      }
                    }

                    // 3. Se ancora null, calcola dal prodotto DB
                    if ([calories, proteins, carbs, fats, fiber].some(v => v === null)) {
                      const product = await Product.findById(item.product_id);
                      if (product) {
                        const nutrition = product.calculateNutritionForPortion(item.quantity);
                        if (nutrition) {
                          if (calories === null) calories = nutrition.calories;
                          if (proteins === null) proteins = nutrition.proteins;
                          if (carbs === null) carbs = nutrition.carbs;
                          if (fats === null) fats = nutrition.fats;
                          if (fiber === null) fiber = nutrition.fiber;
                        }
                      }
                    }
                    logger.info('[DEBUG][Meal.create] Inserimento meal_item', {
                      mealId,
                      product_id: item.product_id,
                      quantity: item.quantity,
                      calories,
                      proteins,
                      carbs,
                      fats,
                      fiber,
                      extraNutrients
                    });
                  } catch (e) {
                    logger.error('[DEBUG][Meal.create] Errore calcolo nutrizionali meal_item', { mealId, product_id: item.product_id, error: e.message });
                  }
                  db.run(
                    `INSERT INTO meal_items (meal_id, product_id, quantity, unit, calories, proteins, carbs, fats, fiber, created_at, updated_at, extra_nutrients) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                      mealId,
                      item.product_id,
                      item.quantity,
                      item.unit,
                      calories,
                      proteins,
                      carbs,
                      fats,
                      fiber,
                      mealToCreate.created_at,
                      mealToCreate.updated_at,
                      Object.keys(extraNutrients).length > 0 ? JSON.stringify(extraNutrients) : null
                    ],
                    async function(err) {
                      if (err && !errorOccurred) {
                        errorOccurred = true;
                        db.run('ROLLBACK');
                        console.error('❌ Errore inserimento meal_item:', err);
                        return reject(err);
                      }
                      completed++;
                      if (completed === mealData.items.length && !errorOccurred) {
                        // Calcola e aggiorna i totali nutrizionali dopo aver inserito tutti gli items
                        await Meal.recalculateMealTotals(Meal.db, mealId);
                        db.run('COMMIT');
                        resolve(Meal.findById(mealId));
                      }
                    }
                  );
                }
              } else {
                // Nessun item: commit diretto
                db.run('COMMIT');
                resolve(Meal.findById(mealId));
              }
            }
          );
        } catch (error) {
          db.run('ROLLBACK');
          console.error('❌ Errore creazione pasto:', error);
          reject(error);
        }
      });
    });
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
      const db = Meal.db;
      const setClause = Object.keys(filteredUpdates).map(k => `${k} = ?`).join(', ');
      const values = [...Object.values(filteredUpdates), this.id];
      await new Promise((resolve, reject) => {
        db.run(
          `UPDATE ${Meal.tableName} SET ${setClause} WHERE id = ?`,
          values,
          function(err) {
            if (err) reject(err);
            else resolve();
          }
        );
      });
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
      const db = Meal.db;
      const sql = `SELECT meal_items.*, products.name, products.name_it, products.brand, products.brand_it FROM meal_items LEFT JOIN products ON meal_items.product_id = products.id WHERE meal_items.meal_id = ? ORDER BY meal_items.created_at ASC`;
      const items = await new Promise((resolve, reject) => {
        db.all(sql, [this.id], (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        });
      });
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
    const db = Meal.db;
    try {
      await new Promise((resolve, reject) => {
        db.serialize(async () => {
          try {
            db.run('BEGIN TRANSACTION');
            await Meal.addItemToMeal(db, this.id, itemData);
            await Meal.recalculateMealTotals(db, this.id);
            db.run('COMMIT');
            // Ricarica dati aggiornati
            const updatedMeal = await Meal.findById(this.id);
            Object.assign(this, updatedMeal);
            resolve(this);
          } catch (error) {
            db.run('ROLLBACK');
            console.error('❌ Errore aggiunta item al pasto:', error);
            reject(error);
          }
        });
      });
      return this;
    } catch (error) {
      console.error('❌ Errore aggiunta item al pasto:', error);
      throw error;
    }
  }

  // Rimuovi item dal pasto
  async removeItem(itemId) {
    const db = Meal.db;
    try {
      await new Promise((resolve, reject) => {
        db.serialize(async () => {
          try {
            db.run('BEGIN TRANSACTION');
            await new Promise((res, rej) => {
              db.run(
                `DELETE FROM ${Meal.itemsTableName} WHERE id = ? AND meal_id = ?`,
                [itemId, this.id],
                function(err) {
                  if (err) rej(err); else res();
                }
              );
            });
            await Meal.recalculateMealTotals(db, this.id);
            db.run('COMMIT');
            // Ricarica dati aggiornati
            const updatedMeal = await Meal.findById(this.id);
            Object.assign(this, updatedMeal);
            resolve(this);
          } catch (error) {
            db.run('ROLLBACK');
            console.error('❌ Errore rimozione item dal pasto:', error);
            reject(error);
          }
        });
      });
      return this;
    } catch (error) {
      console.error('❌ Errore rimozione item dal pasto:', error);
      throw error;
    }
  }

  // Aggiorna quantità di un item
  async updateItemQuantity(itemId, newQuantity) {
    const db = Meal.db;
    try {
      await new Promise((resolve, reject) => {
        db.serialize(async () => {
          try {
            db.run('BEGIN TRANSACTION');
            // Trova item e prodotto
            const item = await new Promise((res, rej) => {
              db.get(
                `SELECT meal_items.*, products.* FROM meal_items LEFT JOIN products ON meal_items.product_id = products.id WHERE meal_items.id = ? AND meal_items.meal_id = ?`,
                [itemId, this.id],
                (err, row) => {
                  if (err) rej(err); else res(row);
                }
              );
            });
            if (!item) throw new Error('Item non trovato');
            // Calcola nuovi valori nutrizionali
            const product = new Product(item);
            const nutrition = product.calculateNutritionForPortion(newQuantity);
            await new Promise((res, rej) => {
              db.run(
                `UPDATE ${Meal.itemsTableName} SET quantity = ?, calories = ?, proteins = ?, carbs = ?, fats = ?, fiber = ? WHERE id = ?`,
                [newQuantity, nutrition.calories, nutrition.proteins, nutrition.carbs, nutrition.fats, nutrition.fiber, itemId],
                function(err) {
                  if (err) rej(err); else res();
                }
              );
            });
            await Meal.recalculateMealTotals(db, this.id);
            db.run('COMMIT');
            // Ricarica dati aggiornati
            const updatedMeal = await Meal.findById(this.id);
            Object.assign(this, updatedMeal);
            resolve(this);
          } catch (error) {
            db.run('ROLLBACK');
            console.error('❌ Errore aggiornamento quantità item:', error);
            reject(error);
          }
        });
      });
      return this;
    } catch (error) {
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

  // Metodo statico per ricalcolare totali pasto (compatibile con SQLite classico)
  static async recalculateMealTotals(db, mealId) {
    return new Promise((resolve, reject) => {
      db.get(
        `SELECT 
          SUM(calories) as total_calories,
          SUM(proteins) as total_proteins,
          SUM(carbs) as total_carbs,
          SUM(fats) as total_fats,
          SUM(fiber) as total_fiber
        FROM meal_items WHERE meal_id = ?`,
        [mealId],
        (err, totals) => {
          if (err) {
            console.error('❌ Errore calcolo totali meal_items:', err);
            return reject(err);
          }
          db.run(
            `UPDATE meals SET 
              total_calories = ?,
              total_proteins = ?,
              total_carbs = ?,
              total_fats = ?,
              total_fiber = ?,
              updated_at = ?
            WHERE id = ?`,
            [
              Math.round((totals.total_calories || 0) * 10) / 10,
              Math.round((totals.total_proteins || 0) * 10) / 10,
              Math.round((totals.total_carbs || 0) * 10) / 10,
              Math.round((totals.total_fats || 0) * 10) / 10,
              Math.round((totals.total_fiber || 0) * 10) / 10,
              new Date().toISOString(),
              mealId
            ],
            function(err2) {
              if (err2) {
                console.error('❌ Errore update totali meal:', err2);
                return reject(err2);
              }
              resolve(true);
            }
          );
        }
      );
    });
  }

  // Elimina pasto
  async delete() {
    const db = Meal.db;
    try {
      await new Promise((resolve, reject) => {
        db.serialize(async () => {
          try {
            db.run('BEGIN TRANSACTION');
            await new Promise((res, rej) => {
              db.run(
                `DELETE FROM ${Meal.itemsTableName} WHERE meal_id = ?`,
                [this.id],
                function(err) {
                  if (err) rej(err); else res();
                }
              );
            });
            await new Promise((res, rej) => {
              db.run(
                `DELETE FROM ${Meal.tableName} WHERE id = ?`,
                [this.id],
                function(err) {
                  if (err) rej(err); else res();
                }
              );
            });
            db.run('COMMIT');
            resolve(true);
          } catch (error) {
            db.run('ROLLBACK');
            console.error('❌ Errore eliminazione pasto:', error);
            reject(new Error('Errore eliminazione pasto'));
          }
        });
      });
      return true;
    } catch (error) {
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
  // Esporta sempre il campo type valorizzato (in inglese)
  meal.type = this.meal_type || this.type || null;
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
