const database = require('../config/database');

class Product {
  /**
   * Verifica se esiste un prodotto con l'id specificato
   * @param {number|string} productId
   * @returns {Promise<boolean>}
   */
  static async exists(productId) {
    return new Promise((resolve, reject) => {
      this.db.get(
        'SELECT id FROM products WHERE id = ? LIMIT 1',
        [productId],
        (err, row) => {
          if (err) reject(err);
          else resolve(!!row);
        }
      );
    });
  }
  constructor(data = {}) {
    this.id = data.id;
    this.barcode = data.barcode;
    this.name = data.name;
    this.name_it = data.name_it;
    this.brand = data.brand;
    this.brand_it = data.brand_it;
    this.category_id = data.category_id;
    this.image_path = data.image_path;
    
    // Valori nutrizionali per 100g
    this.calories = data.calories;
    this.proteins = data.proteins;
    this.carbs = data.carbs;
    this.fats = data.fats;
    this.fiber = data.fiber;
    this.sugars = data.sugars;
    this.salt = data.salt;
    
    // Vitamine (mg/mcg per 100g)
    this.vitamin_a = data.vitamin_a;
    this.vitamin_c = data.vitamin_c;
    this.vitamin_d = data.vitamin_d;
    this.vitamin_e = data.vitamin_e;
    this.vitamin_k = data.vitamin_k;
    this.thiamin = data.thiamin;
    this.riboflavin = data.riboflavin;
    this.niacin = data.niacin;
    this.vitamin_b6 = data.vitamin_b6;
    this.folate = data.folate;
    this.vitamin_b12 = data.vitamin_b12;
    this.biotin = data.biotin;
    this.pantothenic_acid = data.pantothenic_acid;
    
    // Minerali (mg per 100g)
    this.calcium = data.calcium;
    this.iron = data.iron;
    this.magnesium = data.magnesium;
    this.phosphorus = data.phosphorus;
    this.potassium = data.potassium;
    this.sodium = data.sodium;
    this.zinc = data.zinc;
    this.copper = data.copper;
    this.manganese = data.manganese;
    this.selenium = data.selenium;
    this.iodine = data.iodine;
    this.chromium = data.chromium;
    this.molybdenum = data.molybdenum;
    
    // Acidi grassi
    this.saturated_fats = data.saturated_fats;
    this.monounsaturated_fats = data.monounsaturated_fats;
    this.polyunsaturated_fats = data.polyunsaturated_fats;
    this.trans_fats = data.trans_fats;
    this.cholesterol = data.cholesterol;
    
    // Altri nutrienti
    this.alcohol = data.alcohol;
    this.caffeine = data.caffeine;
    this.water = data.water;
    
    // Scores
    this.nutriscore = data.nutriscore;
    this.nova_group = data.nova_group;
    this.ecoscore = data.ecoscore;
    
    // Metadati
    this.source = data.source || 'user';
    this.original_language = data.original_language;
    this.translation_status = data.translation_status || 'none';
    this.is_favorite = data.is_favorite || false;
    this.usage_count = data.usage_count || 0;
    this.last_used = data.last_used;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }

  static get tableName() {
    return 'products';
  }

  // Metodi per la gestione della dispensa
  static async addToPantry(userId, productId) {
    const product = await this.findById(productId);
    if (!product) {
      throw new Error('Prodotto non trovato');
    }

    return new Promise((resolve, reject) => {
      database.sqliteDb.run(
        `INSERT OR REPLACE INTO pantry_items (user_id, product_id) VALUES (?, ?)`,
        [userId, productId],
        function(err) {
          if (err) reject(err);
          else resolve({ success: true });
        }
      );
    });
  }

  static async removeFromPantry(userId, productId) {
    return new Promise((resolve, reject) => {
      database.sqliteDb.run(
        'DELETE FROM pantry_items WHERE user_id = ? AND product_id = ?',
        [userId, productId],
        function(err) {
          if (err) reject(err);
          else resolve({ success: true });
        }
      );
    });
  }

  static async searchInPantry(userId, query = '') {
    return new Promise((resolve, reject) => {
      const sqlQuery = `
        SELECT p.*, 
               1 as in_pantry
        FROM products p
        INNER JOIN pantry_items pi ON p.id = pi.product_id 
        WHERE pi.user_id = ? 
        AND (? = '' OR p.name LIKE ? OR p.brand LIKE ?)
        ORDER BY p.name`;
      
      const searchQuery = `%${query}%`;
      database.sqliteDb.all(
        sqlQuery,
        [userId, query, searchQuery, searchQuery],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });
  }

  static get db() {
    return database.sqliteDb;
  }

  // Trova prodotto per ID
  static async findById(id) {
    return new Promise((resolve, reject) => {
      this.db.get(
        'SELECT * FROM products WHERE id = ?',
        [id],
        (err, row) => {
          if (err) {
            console.error('❌ Errore ricerca prodotto per ID:', err);
            reject(new Error('Errore ricerca prodotto'));
          } else {
            resolve(row ? new Product(row) : null);
          }
        }
      );
    });
  }

  // Trova prodotto per barcode
  static async findByBarcode(barcode) {
    return new Promise((resolve, reject) => {
      this.db.get(
        'SELECT * FROM products WHERE barcode = ?',
        [barcode],
        (err, row) => {
          if (err) {
            console.error('❌ Errore ricerca prodotto per barcode:', err);
            reject(new Error('Errore ricerca prodotto'));
          } else {
            resolve(row ? new Product(row) : null);
          }
        }
      );
    });
  }

  // Cerca prodotti per nome (ricerca locale)
  static async searchByName(query, options = {}) {
    return new Promise((resolve, reject) => {
      const {
        page = 1,
        limit = 20,
        category_id = null,
        source = null,
        onlyFavorites = false,
      } = options;

      const offset = (page - 1) * limit;
      let params = [];
      let whereConditions = [];
      let whereSql = '';

      // Condizioni di ricerca base
      whereConditions.push('(name LIKE ? OR name_it LIKE ? OR brand LIKE ? OR brand_it LIKE ?)');
      params.push(`%${query}%`, `%${query}%`, `%${query}%`, `%${query}%`);

      if (category_id) {
        whereConditions.push('category_id = ?');
        params.push(category_id);
      }

      if (source) {
        whereConditions.push('source = ?');
        params.push(source);
      }

      if (onlyFavorites) {
        whereConditions.push('is_favorite = 1');
      }

      if (whereConditions.length > 0) {
        whereSql = 'WHERE ' + whereConditions.join(' AND ');
      }

      // Query per il conteggio totale
      const countSql = `SELECT COUNT(*) as count FROM ${this.tableName} ${whereSql}`;
      
      this.db.get(countSql, params, (countErr, countRow) => {
        if (countErr) {
          console.error('❌ Errore conteggio prodotti:', countErr);
          return reject(new Error('Errore ricerca prodotti'));
        }

        const total = countRow.count;

        // Query principale con ordinamento e paginazione
        const sql = `
          SELECT * FROM ${this.tableName} 
          ${whereSql}
          ORDER BY usage_count DESC, is_favorite DESC, name ASC
          LIMIT ? OFFSET ?
        `;

        this.db.all(sql, [...params, limit, offset], (err, rows) => {
          if (err) {
            console.error('❌ Errore ricerca prodotti per nome:', err);
            return reject(new Error('Errore ricerca prodotti'));
          }

          resolve({
            products: rows.map(row => new Product(row)),
            pagination: {
              page,
              limit,
              total,
              totalPages: Math.ceil(total / limit),
            },
          });
        });
      });
    });
  }

  // Ottieni prodotti più utilizzati
  static async getMostUsed(limit = 10) {
    try {
      const products = await this.db(this.tableName)
        .where('usage_count', '>', 0)
        .orderBy('usage_count', 'desc')
        .orderBy('last_used', 'desc')
        .limit(limit);

      return products.map(p => new Product(p));
    } catch (error) {
      console.error('❌ Errore recupero prodotti più utilizzati:', error);
      return [];
    }
  }

  // Ottieni prodotti preferiti
  static async getFavorites() {
    try {
      const products = await this.db(this.tableName)
        .where('is_favorite', true)
        .orderBy('name');

      return products.map(p => new Product(p));
    } catch (error) {
      console.error('❌ Errore recupero prodotti preferiti:', error);
      return [];
    }
  }

  // Ottieni prodotti recenti
  static async getRecent(limit = 20) {
    try {
      const products = await this.db(this.tableName)
        .whereNotNull('last_used')
        .orderBy('last_used', 'desc')
        .limit(limit);

      return products.map(p => new Product(p));
    } catch (error) {
      console.error('❌ Errore recupero prodotti recenti:', error);
      return [];
    }
  }

  // Crea nuovo prodotto
  static async create(productData) {
    try {
      // Validazione dati base
      if (!productData.name) {
        throw new Error('Nome prodotto obbligatorio');
      }

      // Verifica se barcode già esiste (se fornito)
      if (productData.barcode) {
        const existing = await this.findByBarcode(productData.barcode);
        if (existing) {
          throw new Error('Prodotto con questo barcode già esistente');
        }
      }

      const productToCreate = {
        ...productData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Inserimento manuale compatibile con sqlite3
      await new Promise((resolve, reject) => {
        database.sqliteDb.run(
          `INSERT INTO products (id, name, created_at, updated_at) VALUES (?, ?, ?, ?)`,
          [productToCreate.id, productToCreate.name, productToCreate.created_at, productToCreate.updated_at],
          function(err) {
            if (err) reject(err);
            else resolve();
          }
        );
      });
      return await this.findById(productToCreate.id);
    } catch (error) {
      console.error('❌ Errore creazione prodotto:', error);
      throw error;
    }
  }

  // Aggiorna prodotto
  async update(updates) {
    try {
      const updatedData = {
        ...updates,
        updated_at: new Date().toISOString(),
      };

      await Product.db(Product.tableName)
        .where('id', this.id)
        .update(updatedData);

      Object.assign(this, updatedData);
      return this;
    } catch (error) {
      console.error('❌ Errore aggiornamento prodotto:', error);
      throw new Error('Errore aggiornamento prodotto');
    }
  }

  // Incrementa contatore utilizzo
  async incrementUsage() {
    try {
      const now = new Date().toISOString();
      
      await Product.db(Product.tableName)
        .where('id', this.id)
        .update({
          usage_count: this.usage_count + 1,
          last_used: now,
          updated_at: now,
        });

      this.usage_count += 1;
      this.last_used = now;
      this.updated_at = now;
      
      return this;
    } catch (error) {
      console.error('❌ Errore incremento utilizzo:', error);
      return this;
    }
  }

  // Aggiungi/rimuovi dai preferiti
  async toggleFavorite() {
    try {
      const is_favorite = !this.is_favorite;
      
      await this.update({ is_favorite });
      
      return this;
    } catch (error) {
      console.error('❌ Errore toggle preferito:', error);
      throw new Error('Errore modifica preferiti');
    }
  }

  // Calcola valori nutrizionali per una porzione specifica
  calculateNutritionForPortion(grams) {
    if (!grams || grams <= 0) return null;

    const factor = grams / 100; // I valori sono per 100g

    const nutrition = {
      grams,
      calories: this.calories ? Math.round(this.calories * factor * 10) / 10 : null,
      proteins: this.proteins ? Math.round(this.proteins * factor * 10) / 10 : null,
      carbs: this.carbs ? Math.round(this.carbs * factor * 10) / 10 : null,
      fats: this.fats ? Math.round(this.fats * factor * 10) / 10 : null,
      fiber: this.fiber ? Math.round(this.fiber * factor * 10) / 10 : null,
      sugars: this.sugars ? Math.round(this.sugars * factor * 10) / 10 : null,
      salt: this.salt ? Math.round(this.salt * factor * 100) / 100 : null,
      sodium: this.sodium ? Math.round(this.sodium * factor * 100) / 100 : null,
    };

    // Aggiungi vitamine se presenti
    const vitamins = [
      'vitamin_a', 'vitamin_c', 'vitamin_d', 'vitamin_e', 'vitamin_k',
      'thiamin', 'riboflavin', 'niacin', 'vitamin_b6', 'folate', 
      'vitamin_b12', 'biotin', 'pantothenic_acid'
    ];

    vitamins.forEach(vitamin => {
      if (this[vitamin]) {
        nutrition[vitamin] = Math.round(this[vitamin] * factor * 100) / 100;
      }
    });

    // Aggiungi minerali se presenti
    const minerals = [
      'calcium', 'iron', 'magnesium', 'phosphorus', 'potassium',
      'zinc', 'copper', 'manganese', 'selenium', 'iodine',
      'chromium', 'molybdenum'
    ];

    minerals.forEach(mineral => {
      if (this[mineral]) {
        nutrition[mineral] = Math.round(this[mineral] * factor * 100) / 100;
      }
    });

    return nutrition;
  }

  // Ottieni nome preferito (italiano se disponibile)
  getDisplayName() {
    return this.name_it || this.name || 'Prodotto senza nome';
  }

  // Ottieni brand preferito (italiano se disponibile)
  getDisplayBrand() {
    return this.brand_it || this.brand;
  }

  // Verifica se prodotto ha traduzioni
  hasTranslations() {
    return this.translation_status !== 'none' && 
           (this.name_it || this.brand_it);
  }

  // Verifica se prodotto è completo nutrizionalmente
  isNutritionallyComplete() {
    return !!(this.calories && this.proteins && this.carbs && this.fats);
  }

  // Elimina prodotto
  async delete() {
    try {
      await Product.db(Product.tableName)
        .where('id', this.id)
        .del();
      
      return true;
    } catch (error) {
      console.error('❌ Errore eliminazione prodotto:', error);
      throw new Error('Errore eliminazione prodotto');
    }
  }

  // Serializza per JSON
  toJSON() {
    const product = { ...this };
    
    // Aggiungi dati calcolati
    product.display_name = this.getDisplayName();
    product.display_brand = this.getDisplayBrand();
    product.has_translations = this.hasTranslations();
    product.is_nutritionally_complete = this.isNutritionallyComplete();
    
    return product;
  }

  // Statistiche prodotti
  static async getStats() {
    try {
      const stats = await this.db(this.tableName)
        .select([
          this.db.raw('COUNT(*) as total_products'),
          this.db.raw('COUNT(CASE WHEN source = "local" THEN 1 END) as local_products'),
          this.db.raw('COUNT(CASE WHEN source = "openfoodfacts" THEN 1 END) as openfoodfacts_products'),
          this.db.raw('COUNT(CASE WHEN source = "user" THEN 1 END) as user_products'),
          this.db.raw('COUNT(CASE WHEN is_favorite = 1 THEN 1 END) as favorite_products'),
          this.db.raw('COUNT(CASE WHEN translation_status != "none" THEN 1 END) as translated_products'),
          this.db.raw('AVG(usage_count) as avg_usage_count'),
        ])
        .first();

      return stats;
    } catch (error) {
      console.error('❌ Errore statistiche prodotti:', error);
      return null;
    }
  }

  // Cerca prodotti simili
  async findSimilar(limit = 5) {
    try {
      let queryBuilder = Product.db(Product.tableName)
        .where('id', '!=', this.id);

      // Cerca per brand simile
      if (this.brand || this.brand_it) {
        const brand = this.brand_it || this.brand;
        queryBuilder = queryBuilder.where(function() {
          this.whereILike('brand', `%${brand}%`)
            .orWhereILike('brand_it', `%${brand}%`);
        });
      }

      // Se non trova per brand, cerca per categoria
      if (this.category_id) {
        queryBuilder = queryBuilder.orWhere('category_id', this.category_id);
      }

      const products = await queryBuilder
        .orderBy('usage_count', 'desc')
        .limit(limit);

      return products.map(p => new Product(p));
    } catch (error) {
      console.error('❌ Errore ricerca prodotti simili:', error);
      return [];
    }
  }
}

module.exports = Product;
