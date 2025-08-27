const sqlite3 = require('sqlite3');

class Pantry {
    constructor(database) {
        this.db = database;
    }

    // Inizializza tabelle pantry
    async initialize() {
        // Tabella prodotti in dispensa
        const pantryItemsSql = `
            CREATE TABLE IF NOT EXISTS pantry_items (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                barcode VARCHAR(50),
                product_name VARCHAR(255) NOT NULL,
                brand VARCHAR(255),
                category VARCHAR(100),
                quantity DECIMAL(10,2) NOT NULL DEFAULT 1,
                unit VARCHAR(20) DEFAULT 'pz',
                purchase_date DATE,
                expiry_date DATE,
                opened_date DATE,
                location VARCHAR(100) DEFAULT 'dispensa',
                notes TEXT,
                price DECIMAL(8,2),
                nutritional_info TEXT,
                image_url VARCHAR(500),
                status VARCHAR(20) DEFAULT 'available',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
            )
        `;

        // Tabella shopping list
        const shoppingListSql = `
            CREATE TABLE IF NOT EXISTS shopping_list (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                item_name VARCHAR(255) NOT NULL,
                category VARCHAR(100),
                quantity DECIMAL(10,2) DEFAULT 1,
                unit VARCHAR(20) DEFAULT 'pz',
                priority INTEGER DEFAULT 2,
                notes TEXT,
                estimated_price DECIMAL(8,2),
                purchased BOOLEAN DEFAULT FALSE,
                purchased_date DATE,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
            )
        `;

        // Tabella ricette
        const recipesSql = `
            CREATE TABLE IF NOT EXISTS recipes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                name VARCHAR(255) NOT NULL,
                description TEXT,
                servings INTEGER DEFAULT 1,
                prep_time_minutes INTEGER,
                cook_time_minutes INTEGER,
                difficulty VARCHAR(20) DEFAULT 'medium',
                cuisine VARCHAR(100),
                instructions TEXT,
                nutritional_info TEXT,
                image_url VARCHAR(500),
                tags TEXT,
                is_favorite BOOLEAN DEFAULT FALSE,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
            )
        `;

        // Tabella ingredienti ricette
        const recipeIngredientsSql = `
            CREATE TABLE IF NOT EXISTS recipe_ingredients (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                recipe_id INTEGER NOT NULL,
                ingredient_name VARCHAR(255) NOT NULL,
                quantity DECIMAL(10,2) NOT NULL,
                unit VARCHAR(20) NOT NULL,
                notes TEXT,
                FOREIGN KEY (recipe_id) REFERENCES recipes (id) ON DELETE CASCADE
            )
        `;

        try {
            await this.runQuery(pantryItemsSql);
            console.log('✅ Tabella pantry_items creata/verificata');
            
            await this.runQuery(shoppingListSql);
            console.log('✅ Tabella shopping_list creata/verificata');
            
            await this.runQuery(recipesSql);
            console.log('✅ Tabella recipes creata/verificata');
            
            await this.runQuery(recipeIngredientsSql);
            console.log('✅ Tabella recipe_ingredients creata/verificata');
            
        } catch (error) {
            console.error('❌ Errore creazione tabelle pantry:', error);
            throw error;
        }
    }

    // Helper per eseguire query
    runQuery(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.run(sql, params, function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({ lastID: this.lastID, changes: this.changes });
                }
            });
        });
    }

    getAllQuery(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.all(sql, params, (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    getQuery(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.get(sql, params, (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });
    }

    // === GESTIONE DISPENSA ===

    // Aggiungi prodotto alla dispensa
    async addItem(userId, itemData) {
        const {
            barcode,
            product_name,
            brand,
            category,
            quantity = 1,
            unit = 'pz',
            purchase_date,
            expiry_date,
            location = 'dispensa',
            notes,
            price,
            nutritional_info
        } = itemData;

        const sql = `
            INSERT INTO pantry_items (
                user_id, barcode, product_name, brand, category,
                quantity, unit, purchase_date, expiry_date, location,
                notes, price, nutritional_info
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const nutritionalJson = nutritional_info ? JSON.stringify(nutritional_info) : null;

        return this.runQuery(sql, [
            userId, barcode, product_name, brand, category,
            quantity, unit, purchase_date, expiry_date, location,
            notes, price, nutritionalJson
        ]);
    }

    // Ottieni tutti gli articoli della dispensa
    async getItems(userId, filters = {}) {
        const { category, location, status = 'available', search, expired_soon } = filters;
        
        let sql = `
            SELECT * FROM pantry_items 
            WHERE user_id = ? AND status = ?
        `;
        const params = [userId, status];

        if (category) {
            sql += ` AND category = ?`;
            params.push(category);
        }

        if (location) {
            sql += ` AND location = ?`;
            params.push(location);
        }

        if (search) {
            sql += ` AND (product_name LIKE ? OR brand LIKE ?)`;
            params.push(`%${search}%`, `%${search}%`);
        }

        if (expired_soon) {
            const futureDate = new Date();
            futureDate.setDate(futureDate.getDate() + parseInt(expired_soon));
            sql += ` AND expiry_date <= ?`;
            params.push(futureDate.toISOString().split('T')[0]);
        }

        sql += ` ORDER BY expiry_date ASC, product_name ASC`;

        const items = await this.getAllQuery(sql, params);
        
        return items.map(item => ({
            ...item,
            nutritional_info: item.nutritional_info ? JSON.parse(item.nutritional_info) : null,
            days_to_expiry: item.expiry_date ? 
                Math.ceil((new Date(item.expiry_date) - new Date()) / (1000 * 60 * 60 * 24)) : null
        }));
    }

    // Aggiorna quantità prodotto
    async updateQuantity(itemId, userId, newQuantity) {
        const sql = `
            UPDATE pantry_items 
            SET quantity = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ? AND user_id = ?
        `;

        return this.runQuery(sql, [newQuantity, itemId, userId]);
    }

    // Consuma prodotto (riduci quantità)
    async consumeItem(itemId, userId, consumedQuantity) {
        const item = await this.getQuery(
            `SELECT quantity FROM pantry_items WHERE id = ? AND user_id = ?`,
            [itemId, userId]
        );

        if (!item) {
            throw new Error('Prodotto non trovato');
        }

        const newQuantity = Math.max(0, item.quantity - consumedQuantity);
        const status = newQuantity === 0 ? 'consumed' : 'available';

        const sql = `
            UPDATE pantry_items 
            SET quantity = ?, status = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ? AND user_id = ?
        `;

        return this.runQuery(sql, [newQuantity, status, itemId, userId]);
    }

    // Prodotti in scadenza
    async getExpiringItems(userId, days = 7) {
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + days);

        const sql = `
            SELECT * FROM pantry_items 
            WHERE user_id = ? 
                AND status = 'available'
                AND expiry_date IS NOT NULL
                AND expiry_date <= ?
            ORDER BY expiry_date ASC
        `;

        return this.getAllQuery(sql, [userId, futureDate.toISOString().split('T')[0]]);
    }

    // === SHOPPING LIST ===

    // Aggiungi alla lista spesa
    async addToShoppingList(userId, itemData) {
        const {
            item_name,
            category,
            quantity = 1,
            unit = 'pz',
            priority = 2,
            notes,
            estimated_price
        } = itemData;

        const sql = `
            INSERT INTO shopping_list (
                user_id, item_name, category, quantity, unit,
                priority, notes, estimated_price
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;

        return this.runQuery(sql, [
            userId, item_name, category, quantity, unit,
            priority, notes, estimated_price
        ]);
    }

    // Ottieni lista spesa
    async getShoppingList(userId, purchased = false) {
        const sql = `
            SELECT * FROM shopping_list 
            WHERE user_id = ? AND purchased = ?
            ORDER BY priority DESC, category ASC, item_name ASC
        `;

        return this.getAllQuery(sql, [userId, purchased]);
    }

    // Marca come acquistato
    async markAsPurchased(listItemId, userId) {
        const sql = `
            UPDATE shopping_list 
            SET purchased = TRUE, 
                purchased_date = CURRENT_DATE,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ? AND user_id = ?
        `;

        return this.runQuery(sql, [listItemId, userId]);
    }

    // Suggerimenti automatici per lista spesa
    async suggestShoppingItems(userId) {
        // Prodotti finiti di recente
        const recentlyConsumed = await this.getAllQuery(`
            SELECT product_name, category, AVG(quantity) as avg_quantity
            FROM pantry_items 
            WHERE user_id = ? 
                AND status = 'consumed'
                AND updated_at >= date('now', '-30 days')
            GROUP BY product_name, category
            ORDER BY updated_at DESC
            LIMIT 10
        `, [userId]);

        // Prodotti in scadenza o finiti
        const lowStock = await this.getAllQuery(`
            SELECT product_name, category, quantity, unit
            FROM pantry_items 
            WHERE user_id = ? 
                AND status = 'available'
                AND (quantity <= 1 OR expiry_date <= date('now', '+3 days'))
            ORDER BY quantity ASC, expiry_date ASC
        `, [userId]);

        return {
            recently_consumed: recentlyConsumed,
            low_stock: lowStock
        };
    }

    // === RICETTE ===

    // Aggiungi ricetta
    async addRecipe(userId, recipeData) {
        const {
            name,
            description,
            servings = 1,
            prep_time_minutes,
            cook_time_minutes,
            difficulty = 'medium',
            cuisine,
            instructions,
            nutritional_info,
            tags,
            ingredients = []
        } = recipeData;

        try {
            // Inserisci ricetta
            const recipeResult = await this.runQuery(`
                INSERT INTO recipes (
                    user_id, name, description, servings, prep_time_minutes,
                    cook_time_minutes, difficulty, cuisine, instructions,
                    nutritional_info, tags
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                userId, name, description, servings, prep_time_minutes,
                cook_time_minutes, difficulty, cuisine, instructions,
                nutritional_info ? JSON.stringify(nutritional_info) : null,
                tags ? JSON.stringify(tags) : null
            ]);

            const recipeId = recipeResult.lastID;

            // Inserisci ingredienti
            for (const ingredient of ingredients) {
                await this.runQuery(`
                    INSERT INTO recipe_ingredients (
                        recipe_id, ingredient_name, quantity, unit, notes
                    ) VALUES (?, ?, ?, ?, ?)
                `, [
                    recipeId, ingredient.name, ingredient.quantity, 
                    ingredient.unit, ingredient.notes
                ]);
            }

            return { id: recipeId };

        } catch (error) {
            throw new Error(`Errore aggiunta ricetta: ${error.message}`);
        }
    }

    // Ottieni ricette con ingredienti
    async getRecipes(userId, filters = {}) {
        const { search, cuisine, difficulty, available_ingredients } = filters;
        
        let sql = `
            SELECT r.*, 
                   GROUP_CONCAT(ri.ingredient_name || ' (' || ri.quantity || ' ' || ri.unit || ')') as ingredients_text
            FROM recipes r
            LEFT JOIN recipe_ingredients ri ON r.id = ri.recipe_id
            WHERE r.user_id = ?
        `;
        const params = [userId];

        if (search) {
            sql += ` AND (r.name LIKE ? OR r.description LIKE ?)`;
            params.push(`%${search}%`, `%${search}%`);
        }

        if (cuisine) {
            sql += ` AND r.cuisine = ?`;
            params.push(cuisine);
        }

        if (difficulty) {
            sql += ` AND r.difficulty = ?`;
            params.push(difficulty);
        }

        sql += ` GROUP BY r.id ORDER BY r.created_at DESC`;

        const recipes = await this.getAllQuery(sql, params);
        
        return recipes.map(recipe => ({
            ...recipe,
            tags: recipe.tags ? JSON.parse(recipe.tags) : [],
            nutritional_info: recipe.nutritional_info ? JSON.parse(recipe.nutritional_info) : null
        }));
    }

    // Verifica ingredienti disponibili per ricetta
    async checkRecipeIngredients(userId, recipeId) {
        const ingredients = await this.getAllQuery(`
            SELECT * FROM recipe_ingredients WHERE recipe_id = ?
        `, [recipeId]);

        const availability = [];

        for (const ingredient of ingredients) {
            const available = await this.getQuery(`
                SELECT SUM(quantity) as total_quantity, unit
                FROM pantry_items 
                WHERE user_id = ? 
                    AND product_name LIKE ?
                    AND status = 'available'
                GROUP BY unit
            `, [userId, `%${ingredient.ingredient_name}%`]);

            availability.push({
                ...ingredient,
                available_quantity: available?.total_quantity || 0,
                available_unit: available?.unit,
                sufficient: available && available.total_quantity >= ingredient.quantity
            });
        }

        return availability;
    }

    // Statistiche dispensa
    async getPantryStats(userId) {
        const stats = await this.getQuery(`
            SELECT 
                COUNT(*) as total_items,
                COUNT(CASE WHEN status = 'available' THEN 1 END) as available_items,
                COUNT(CASE WHEN expiry_date <= date('now', '+7 days') THEN 1 END) as expiring_soon,
                COUNT(CASE WHEN quantity <= 1 THEN 1 END) as low_stock,
                SUM(CASE WHEN price IS NOT NULL THEN price * quantity END) as total_value,
                COUNT(DISTINCT category) as categories_count,
                COUNT(DISTINCT location) as locations_count
            FROM pantry_items 
            WHERE user_id = ?
        `, [userId]);

        const categoryStats = await this.getAllQuery(`
            SELECT 
                category,
                COUNT(*) as items_count,
                SUM(CASE WHEN price IS NOT NULL THEN price * quantity END) as category_value
            FROM pantry_items 
            WHERE user_id = ? AND status = 'available'
            GROUP BY category
            ORDER BY items_count DESC
        `, [userId]);

        return {
            ...stats,
            categories: categoryStats
        };
    }
}

module.exports = Pantry;
