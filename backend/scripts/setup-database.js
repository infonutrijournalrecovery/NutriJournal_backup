require('dotenv').config();

const path = require('path');
const fs = require('fs');
const database = require('../src/config/database');

async function setupDatabase() {
  try {
    console.log('🔧 Inizializzazione database NutriJournal...');

    // Inizializza connessione database
    await database.initialize();

    // Crea tabelle
    await createTables();

    // Crea indici
    await createIndexes();

    // Crea directory per immagini
    createDirectories();

    console.log('✅ Database inizializzato con successo!');
    console.log(`📍 Percorso database: ${path.resolve(require('../src/config/environment').database.path)}`);

  } catch (error) {
    console.error('❌ Errore durante setup database:', error);
    process.exit(1);
  } finally {
    await database.close();
  }
}

async function createTables() {
  const db = database.getConnection();

  console.log('📋 Creazione tabelle...');

  // Tabella utenti
  await db.schema.createTable('users', (table) => {
    table.increments('id').primary();
    table.string('email', 255).unique().notNullable();
    table.string('password_hash', 255).notNullable();
    table.string('name', 255).notNullable();
    table.string('avatar_path', 500).nullable();
    table.date('date_of_birth').nullable();
    table.enum('gender', ['male', 'female', 'other']).nullable();
    table.decimal('height', 5, 2).nullable();
    table.decimal('weight', 5, 2).nullable();
    table.enum('activity_level', ['sedentary', 'light', 'moderate', 'active', 'very_active']).defaultTo('moderate');
    table.string('timezone', 50).defaultTo('Europe/Rome');
    table.string('language', 10).defaultTo('it');
    table.datetime('created_at').defaultTo(db.fn.now());
    table.datetime('updated_at').defaultTo(db.fn.now());
    table.datetime('last_login').nullable();
    table.boolean('email_verified').defaultTo(false);
    table.string('reset_token', 255).nullable();
    table.datetime('reset_token_expires').nullable();
  });

  // Tabella obiettivi nutrizionali
  await db.schema.createTable('nutrition_goals', (table) => {
    table.increments('id').primary();
    table.integer('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE');
    table.enum('goal_type', ['weight_loss', 'weight_gain', 'maintenance', 'muscle_gain']).notNullable();
    table.decimal('target_weight', 5, 2).nullable();
    table.integer('target_calories').nullable();
    table.decimal('target_carbs_percent', 5, 2).defaultTo(50);
    table.decimal('target_protein_percent', 5, 2).defaultTo(20);
    table.decimal('target_fat_percent', 5, 2).defaultTo(30);
    table.decimal('target_water_liters', 4, 2).defaultTo(2.0);
    table.decimal('weekly_weight_change', 4, 2).defaultTo(0);
    table.date('start_date').nullable();
    table.date('target_date').nullable();
    table.boolean('is_active').defaultTo(true);
    table.datetime('created_at').defaultTo(db.fn.now());
  });

  // Tabella categorie prodotti
  await db.schema.createTable('categories', (table) => {
    table.increments('id').primary();
    table.string('name', 255).notNullable();
    table.string('name_it', 255).notNullable();
    table.text('description').nullable();
    table.string('icon', 100).nullable();
    table.integer('parent_id').unsigned().nullable().references('id').inTable('categories');
    table.datetime('created_at').defaultTo(db.fn.now());
  });

  // Tabella prodotti
  await db.schema.createTable('products', (table) => {
    table.increments('id').primary();
    table.string('barcode', 20).unique().nullable();
    table.string('name', 500).notNullable();
    table.string('name_it', 500).nullable();
    table.string('brand', 255).nullable();
    table.string('brand_it', 255).nullable();
    table.integer('category_id').unsigned().nullable().references('id').inTable('categories');
    table.string('image_path', 500).nullable();
    
    // Valori nutrizionali per 100g
    table.decimal('calories', 8, 2).nullable();
    table.decimal('proteins', 8, 2).nullable();
    table.decimal('carbs', 8, 2).nullable();
    table.decimal('fats', 8, 2).nullable();
    table.decimal('fiber', 8, 2).nullable();
    table.decimal('sugars', 8, 2).nullable();
    table.decimal('salt', 8, 2).nullable();
    
    // Vitamine (mg/mcg per 100g)
    table.decimal('vitamin_a', 8, 2).nullable();
    table.decimal('vitamin_c', 8, 2).nullable();
    table.decimal('vitamin_d', 8, 2).nullable();
    table.decimal('vitamin_e', 8, 2).nullable();
    table.decimal('vitamin_k', 8, 2).nullable();
    table.decimal('thiamin', 8, 2).nullable();
    table.decimal('riboflavin', 8, 2).nullable();
    table.decimal('niacin', 8, 2).nullable();
    table.decimal('vitamin_b6', 8, 2).nullable();
    table.decimal('folate', 8, 2).nullable();
    table.decimal('vitamin_b12', 8, 2).nullable();
    table.decimal('biotin', 8, 2).nullable();
    table.decimal('pantothenic_acid', 8, 2).nullable();
    
    // Minerali (mg per 100g)
    table.decimal('calcium', 8, 2).nullable();
    table.decimal('iron', 8, 2).nullable();
    table.decimal('magnesium', 8, 2).nullable();
    table.decimal('phosphorus', 8, 2).nullable();
    table.decimal('potassium', 8, 2).nullable();
    table.decimal('sodium', 8, 2).nullable();
    table.decimal('zinc', 8, 2).nullable();
    table.decimal('copper', 8, 2).nullable();
    table.decimal('manganese', 8, 2).nullable();
    table.decimal('selenium', 8, 2).nullable();
    table.decimal('iodine', 8, 2).nullable();
    table.decimal('chromium', 8, 2).nullable();
    table.decimal('molybdenum', 8, 2).nullable();
    
    // Acidi grassi
    table.decimal('saturated_fats', 8, 2).nullable();
    table.decimal('monounsaturated_fats', 8, 2).nullable();
    table.decimal('polyunsaturated_fats', 8, 2).nullable();
    table.decimal('trans_fats', 8, 2).nullable();
    table.decimal('cholesterol', 8, 2).nullable();
    
    // Altri nutrienti
    table.decimal('alcohol', 8, 2).nullable();
    table.decimal('caffeine', 8, 2).nullable();
    table.decimal('water', 8, 2).nullable();
    
    // Scores
    table.enum('nutriscore', ['A', 'B', 'C', 'D', 'E']).nullable();
    table.integer('nova_group').nullable();
    table.enum('ecoscore', ['A', 'B', 'C', 'D', 'E']).nullable();
    
    // Metadati
    table.enum('source', ['local', 'openfoodfacts', 'user']).defaultTo('user');
    table.string('original_language', 10).nullable();
    table.enum('translation_status', ['none', 'auto', 'manual', 'verified']).defaultTo('none');
    table.boolean('is_favorite').defaultTo(false);
    table.integer('usage_count').defaultTo(0);
    table.datetime('last_used').nullable();
    table.datetime('created_at').defaultTo(db.fn.now());
    table.datetime('updated_at').defaultTo(db.fn.now());
  });

  // Tabella pasti
  await db.schema.createTable('meals', (table) => {
    table.increments('id').primary();
    table.integer('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE');
    table.enum('meal_type', ['breakfast', 'lunch', 'dinner', 'snack']).notNullable();
    table.string('meal_name', 255).nullable();
    table.date('date').notNullable();
    table.time('time').nullable();
    table.string('location', 255).nullable();
    table.text('notes').nullable();
    
    // Totali nutrizionali calcolati
    table.decimal('total_calories', 8, 2).defaultTo(0);
    table.decimal('total_proteins', 8, 2).defaultTo(0);
    table.decimal('total_carbs', 8, 2).defaultTo(0);
    table.decimal('total_fats', 8, 2).defaultTo(0);
    table.decimal('total_fiber', 8, 2).defaultTo(0);
    
    table.datetime('created_at').defaultTo(db.fn.now());
    table.datetime('updated_at').defaultTo(db.fn.now());
  });

  // Tabella items dei pasti
  await db.schema.createTable('meal_items', (table) => {
    table.increments('id').primary();
    table.integer('meal_id').unsigned().references('id').inTable('meals').onDelete('CASCADE');
    table.integer('product_id').unsigned().references('id').inTable('products').onDelete('CASCADE');
    table.decimal('quantity', 8, 2).notNullable();
    table.enum('unit', ['g', 'ml', 'piece', 'cup', 'tbsp', 'tsp']).defaultTo('g');
    
    // Valori nutrizionali per questa porzione
    table.decimal('calories', 8, 2).nullable();
    table.decimal('proteins', 8, 2).nullable();
    table.decimal('carbs', 8, 2).nullable();
    table.decimal('fats', 8, 2).nullable();
    table.decimal('fiber', 8, 2).nullable();
    
    table.datetime('created_at').defaultTo(db.fn.now());
  });

  // Tabella attività fisiche
  await db.schema.createTable('activities', (table) => {
    table.increments('id').primary();
    table.integer('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE');
    table.string('activity_type', 100).notNullable();
    table.string('activity_name', 255).nullable();
    table.integer('duration_minutes').notNullable();
    table.enum('intensity', ['low', 'moderate', 'high', 'very_high']).nullable();
    table.decimal('calories_burned', 8, 2).nullable();
    table.date('date').notNullable();
    table.time('time').nullable();
    table.text('notes').nullable();
    
    // Dati specifici per tipo di attività
    table.decimal('distance_km', 8, 2).nullable();
    table.integer('steps').nullable();
    table.decimal('weight_kg', 8, 2).nullable();
    table.integer('heart_rate_avg').nullable();
    
    table.datetime('created_at').defaultTo(db.fn.now());
  });

  // Tabella tracciamento peso
  await db.schema.createTable('weight_entries', (table) => {
    table.increments('id').primary();
    table.integer('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE');
    table.decimal('weight', 5, 2).notNullable();
    table.decimal('body_fat_percentage', 5, 2).nullable();
    table.decimal('muscle_mass', 5, 2).nullable();
    table.date('date').notNullable();
    table.time('time').nullable();
    table.text('notes').nullable();
    
    table.datetime('created_at').defaultTo(db.fn.now());
  });

  // Tabella gestione dispensa
  await db.schema.createTable('pantry_items', (table) => {
    table.increments('id').primary();
    table.integer('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE');
    table.integer('product_id').unsigned().references('id').inTable('products').onDelete('CASCADE');
    table.decimal('quantity', 8, 2).notNullable();
    table.enum('unit', ['g', 'ml', 'piece', 'package']).defaultTo('g');
    table.date('purchase_date').nullable();
    table.date('expiry_date').nullable();
    table.decimal('price', 10, 2).nullable();
    table.string('location', 100).nullable();
    
    table.datetime('created_at').defaultTo(db.fn.now());
    table.datetime('updated_at').defaultTo(db.fn.now());
  });

  // Tabella traduzioni prodotti
  await db.schema.createTable('product_translations', (table) => {
    table.increments('id').primary();
    table.integer('product_id').unsigned().references('id').inTable('products').onDelete('CASCADE');
    table.string('field_name', 100).notNullable();
    table.text('original_text').nullable();
    table.text('translated_text').nullable();
    table.string('source_language', 10).nullable();
    table.string('target_language', 10).defaultTo('it');
    table.enum('translation_method', ['auto', 'manual']).defaultTo('auto');
    table.decimal('confidence_score', 3, 2).nullable();
    table.boolean('verified').defaultTo(false);
    table.datetime('created_at').defaultTo(db.fn.now());
    table.datetime('updated_at').defaultTo(db.fn.now());
  });

  // Tabella token reset password
  await db.schema.createTable('password_reset_tokens', (table) => {
    table.increments('id').primary();
    table.integer('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE');
    table.string('token', 255).unique().notNullable();
    table.datetime('expires_at').notNullable();
    table.boolean('used').defaultTo(false);
    table.string('ip_address', 45).nullable();
    table.text('user_agent').nullable();
    table.datetime('created_at').defaultTo(db.fn.now());
    table.datetime('used_at').nullable();
  });

  // Tabella log email
  await db.schema.createTable('email_logs', (table) => {
    table.increments('id').primary();
    table.integer('user_id').unsigned().nullable().references('id').inTable('users').onDelete('CASCADE');
    table.enum('email_type', ['password_reset', 'welcome', 'verification']).notNullable();
    table.string('recipient_email', 255).notNullable();
    table.string('subject', 255).nullable();
    table.enum('status', ['sent', 'failed', 'pending']).notNullable();
    table.text('error_message').nullable();
    table.datetime('sent_at').nullable();
    table.datetime('created_at').defaultTo(db.fn.now());
  });

  console.log('✅ Tabelle create con successo');
}

async function createIndexes() {
  const db = database.getConnection();

  console.log('📊 Creazione indici...');

  // Indici per performance
  await db.raw('CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)');
  await db.raw('CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode)');
  await db.raw('CREATE INDEX IF NOT EXISTS idx_products_name ON products(name)');
  await db.raw('CREATE INDEX IF NOT EXISTS idx_products_name_it ON products(name_it)');
  await db.raw('CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand)');
  await db.raw('CREATE INDEX IF NOT EXISTS idx_products_usage ON products(usage_count, is_favorite)');
  await db.raw('CREATE INDEX IF NOT EXISTS idx_meals_user_date ON meals(user_id, date)');
  await db.raw('CREATE INDEX IF NOT EXISTS idx_meal_items_meal ON meal_items(meal_id)');
  await db.raw('CREATE INDEX IF NOT EXISTS idx_activities_user_date ON activities(user_id, date)');
  await db.raw('CREATE INDEX IF NOT EXISTS idx_weight_entries_user_date ON weight_entries(user_id, date)');
  await db.raw('CREATE INDEX IF NOT EXISTS idx_pantry_user_expiry ON pantry_items(user_id, expiry_date)');
  await db.raw('CREATE INDEX IF NOT EXISTS idx_nutrition_goals_user_active ON nutrition_goals(user_id, is_active)');
  await db.raw('CREATE INDEX IF NOT EXISTS idx_product_translations_product ON product_translations(product_id)');
  await db.raw('CREATE INDEX IF NOT EXISTS idx_password_reset_token ON password_reset_tokens(token)');
  await db.raw('CREATE INDEX IF NOT EXISTS idx_email_logs_user ON email_logs(user_id, email_type)');

  console.log('✅ Indici creati con successo');
}

function createDirectories() {
  console.log('📁 Creazione directory...');

  const directories = [
    'data',
    'images',
    'images/products',
    'images/avatars',
    'images/temp',
    'cache',
    'cache/openfoodfacts',
    'cache/translations',
    'logs'
  ];

  directories.forEach(dir => {
    const dirPath = path.join(__dirname, '..', dir);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
      console.log(`📁 Creata directory: ${dir}`);
    }
  });

  console.log('✅ Directory create con successo');
}

// Esegui setup se chiamato direttamente
if (require.main === module) {
  setupDatabase();
}

module.exports = setupDatabase;
