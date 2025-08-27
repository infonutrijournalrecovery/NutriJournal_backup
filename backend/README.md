# NutriJournal Backend API - Documentazione Completa

## 📋 Panoramica

NutriJournal è un'API completa per il tracciamento nutrizionale con focus sul mercato italiano. Include integrazione con OpenFoodFacts, database di alimenti italiani tradizionali, tracciamento attività, analytics avanzati e gestione dispensa.

### � Caratteristiche Principali

- **Autenticazione JWT sicura** con reset password via email
- **Database prodotti integrato** con OpenFoodFacts e traduzione automatica
- **Alimenti italiani tradizionali** con database curato (pizza, pasta, gelati, etc.)
- **Tracciamento attività fisica** con calcolo calorie MET
- **Analytics nutrizionali** con trend settimanali/mensili e insights automatici
- **Gestione dispensa** con inventario, scadenze e lista spesa intelligente
- **Sistema ricette** con controllo ingredienti disponibili
- **Gestione allergeni e additivi** secondo standard EU
- **Rate limiting e sicurezza avanzata**
- **Interfaccia completamente in italiano**

---

## 🚀 Avvio Rapido

### Installazione

```bash
cd backend
npm install
```

### Configurazione

Crea file `.env`:

```env
# Server
PORT=3000
NODE_ENV=development
JWT_SECRET=your-super-secret-jwt-key-here

# Database (SQLite - nessuna configurazione aggiuntiva richiesta)
DB_PATH=./database.sqlite

# Email (per reset password - vedi EMAIL_SETUP.md per configurazione dettagliata)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-gmail-app-password
FROM_EMAIL=noreply@nutrijournal.app
FROM_NAME=NutriJournal

# Sicurezza (opzionale)
BLOCKED_IPS=192.168.1.100,10.0.0.50
```

### 📧 Configurazione Email (Reset Password)

Per abilitare il recupero password via email, configura le credenziali SMTP nel file `.env`:

1. **Gmail (Raccomandato)**: Segui la guida completa in [`EMAIL_SETUP.md`](./EMAIL_SETUP.md)
2. **Altri provider**: Outlook, Yahoo, o server SMTP personalizzato
3. **Senza email**: Il sistema funziona anche senza configurazione email (reset password disabilitato)

⚠️ **Importante**: Usa sempre password specifiche per app, mai la tua password principale!

### Avvio

```bash
npm start
```

Il server sarà disponibile su `http://localhost:3000`

Se vedi il messaggio:
- ✅ `Configurazione email inizializzata correttamente` → Reset password abilitato
- ⚠️ `Configurazione email non completa` → Reset password disabilitato (funzionale comunque)

### **Backend Completato al 100%** ✅

Il backend di NutriJournal è ora **completamente sviluppato** con tutte le funzionalità richieste:
```
nutrijournal-backend/
├── 📁 src/
│   ├── 📁 config/
│   │   ├── database.js         # Configurazione SQLite locale
│   │   ├── auth.js            # JWT locale + configurazione email
│   │   ├── external-apis.js   # OpenFoodFacts + traduzione
│   │   ├── email.js           # Configurazione Nodemailer
│   │   └── environment.js     # Environment variables locali
│   │
│   ├── 📁 models/              # Database Models (ORM)
│   │   ├── User.js            # Utenti con profili avanzati
│   │   ├── Product.js         # Prodotti alimentari completi
│   │   ├── Meal.js            # Pasti con analisi nutrizionale
│   │   ├── NutritionGoal.js   # Obiettivi personalizzati
│   │   ├── Activity.js        # Attività fisiche
│   │   ├── Notification.js    # Sistema notifiche
│   │   ├── Pantry.js          # Gestione dispensa
│   │   └── Analytics.js       # Dati analitici
│   │
│   ├── 📁 controllers/         # Business Logic
│   │   ├── authController.js  # Autenticazione + reset password
│   │   ├── userController.js  # Gestione utenti e profili
│   │   ├── productController.js # Ricerca prodotti + OpenFoodFacts
│   │   ├── mealController.js  # Tracciamento pasti
│   │   ├── nutritionController.js # Analisi nutrizionale
│   │   ├── activityController.js # Tracciamento attività
│   │   ├── analyticsController.js # Report e statistiche
│   │   ├── translationController.js # Traduzioni prodotti
│   │   └── emailController.js # Gestione invio email
│   │
│   ├── 📁 routes/              # API Endpoints
│   │   ├── auth.js            # /api/auth/* (con reset password)
│   │   ├── users.js           # /api/users/*
│   │   ├── products.js        # /api/products/* (con OpenFoodFacts)
│   │   ├── meals.js           # /api/meals/*
│   │   ├── nutrition.js       # /api/nutrition/*
│   │   ├── activities.js      # /api/activities/*
│   │   ├── analytics.js       # /api/analytics/*
│   │   ├── translations.js    # /api/translations/*
│   │   └── email.js           # /api/email/*
│   │
│   ├── 📁 services/            # Servizi Locali + API Esterne
│   │   ├── openFoodFactsService.js # OpenFoodFacts (obbligatorio)
│   │   ├── translationService.js # Traduzione automatica prodotti
│   │   ├── emailService.js    # Servizio invio email
│   │   ├── localDatabaseService.js # Gestione database locale
│   │   ├── nutritionService.js # Calcoli nutrizionali locali
│   │   ├── cacheService.js    # Cache prodotti locali
│   │   └── analyticsService.js # Analytics offline
│   │
│   ├── 📁 middleware/          # Custom Middleware
│   │   ├── auth.js            # JWT verification locale
│   │   ├── validation.js      # Input validation
│   │   ├── rateLimit.js       # Rate limiting locale
│   │   ├── cors.js            # CORS per Ionic multi-platform
│   │   ├── logging.js         # Logging su file locale
│   │   └── errorHandler.js    # Error handling
│   │
│   ├── 📁 utils/               # Utility Functions
│   │   ├── calculations.js    # BMR, TDEE, macro calculations
│   │   ├── validators.js      # Data validation
│   │   ├── formatters.js      # Data formatting
│   │   ├── constants.js       # App constants
│   │   ├── helpers.js         # General helpers
│   │   └── encryption.js      # Data encryption
│   │
│   ├── 📁 database/            # Database Locale
│   │   ├── connection.js      # Connessione SQLite locale
│   │   ├── migrations/        # Schema migrations
│   │   ├── seeds/            # Dati di esempio (in italiano)
│   │   └── indexes.js        # Database indexes
│   │
│   └── 📁 data/               # Dati Statici Italiani
│       ├── additives.json    # Additivi alimentari E-codes (italiano)
│       ├── allergens.json    # Database allergeni (italiano)
│       ├── nutrients.json    # Nutrienti e RDA (italiano)
│       ├── food-categories.json # Categorie alimentari (italiano)
│       ├── activity-types.json # Tipi di attività fisica (italiano)
│       └── translations.json # Dizionario traduzioni prodotti
│
├── 📁 tests/                  # Test Suite
│   ├── unit/                 # Unit tests
│   ├── integration/          # Integration tests
│   └── e2e/                  # End-to-end tests
│
├── 📁 docs/                   # Documentation
│   ├── api-docs.md           # API documentation
│   ├── database-schema.md    # Database schema
│   └── deployment.md         # Deployment guide
│
├── 📁 scripts/                # Utility Scripts
│   ├── seed-database.js      # Database seeding (dati italiani)
│   ├── migrate.js            # Migrations
│   └── translate-products.js # Script traduzione prodotti
│
├── package.json              # Dependencies
├── .env.example              # Environment template
└── README.md                 # This file
```

## 🚀 **Funzionalità Backend Italiane**

### **1. Sistema di Autenticazione + Reset Password**
```javascript
// JWT locale + reset password via email
POST   /api/auth/register      # Registrazione utente locale
POST   /api/auth/login         # Login con JWT locale
POST   /api/auth/refresh       # Refresh token locale
POST   /api/auth/logout        # Logout sicuro
POST   /api/auth/forgot-password # Richiesta reset password via email
POST   /api/auth/reset-password  # Reset password con token email
POST   /api/auth/change-password # Cambio password (utente loggato)
GET    /api/auth/profile       # Profilo utente locale
PUT    /api/auth/profile       # Aggiornamento profilo locale
```

### **2. Gestione Utenti e Profili Avanzata**
```javascript
// Profili utente con dati biometrici e obiettivi
GET    /api/users/profile      # Profilo utente completo
PUT    /api/users/profile      # Aggiornamento profilo
GET    /api/users/goals        # Obiettivi nutrizionali
PUT    /api/users/goals        # Aggiornamento obiettivi
GET    /api/users/preferences  # Preferenze app
PUT    /api/users/preferences  # Aggiornamento preferenze
GET    /api/users/stats        # Statistiche personali
DELETE /api/users/account      # Eliminazione account
```

### **3. Database Prodotti con OpenFoodFacts Obbligatorio**
```javascript
// Database locale + OpenFoodFacts integrato con traduzione
GET    /api/products/search/:query     # Ricerca nel database locale (italiano)
GET    /api/products/search-online/:query # Ricerca OpenFoodFacts + traduzione
GET    /api/products/barcode/:ean      # Ricerca barcode locale
POST   /api/products/import-barcode/:ean # Import da OpenFoodFacts (tradotto)
GET    /api/products/:id               # Dettagli prodotto locale
POST   /api/products/custom           # Aggiunta prodotto personalizzato
PUT    /api/products/:id              # Modifica prodotto locale
DELETE /api/products/:id              # Eliminazione prodotto locale
GET    /api/products/categories       # Categorie alimentari (italiano)
GET    /api/products/recent           # Prodotti usati di recente
GET    /api/products/favorites        # Prodotti preferiti
POST   /api/products/translate        # Traduzione singolo prodotto
```

### **4. Tracciamento Pasti e Nutrizione**
```javascript
// Sistema completo di tracciamento nutrizionale
GET    /api/meals/today              # Pasti di oggi
POST   /api/meals                    # Aggiunta pasto
PUT    /api/meals/:id                # Modifica pasto
DELETE /api/meals/:id                # Eliminazione pasto
GET    /api/meals/history/:date      # Storico pasti
GET    /api/nutrition/daily/:date    # Analisi nutrizionale giornaliera
GET    /api/nutrition/weekly        # Analisi settimanale
GET    /api/nutrition/monthly       # Analisi mensile
GET    /api/nutrition/goals-progress # Progresso obiettivi
```

### **5. Tracciamento Attività Fisica**
```javascript
// Integrazione con fitness trackers e calcolo calorie
GET    /api/activities/today         # Attività di oggi
POST   /api/activities               # Aggiunta attività
PUT    /api/activities/:id           # Modifica attività
DELETE /api/activities/:id           # Eliminazione attività
GET    /api/activities/types         # Tipi di attività
GET    /api/activities/calories      # Calorie bruciate
GET    /api/activities/weekly        # Report settimanale
```

### **6. Analytics e Reportistica Locale**
```javascript
// Analytics calcolate localmente - nessun dato inviato altrove
GET    /api/analytics/dashboard      # Dashboard dati locali
GET    /api/analytics/trends         # Trend nutrizionali locali
GET    /api/analytics/insights       # Insights personalizzati locali
GET    /api/analytics/weekly-report  # Report settimanale
GET    /api/analytics/monthly-report # Report mensile
GET    /api/analytics/export-csv     # Export dati CSV locale
GET    /api/analytics/export-pdf     # Export PDF locale
POST   /api/analytics/custom-report  # Report personalizzati
```

### **7. Gestione Dispensa (Pantry)**
```javascript
// Gestione intelligente della dispensa
GET    /api/pantry/items            # Prodotti in dispensa
POST   /api/pantry/items            # Aggiunta prodotto
PUT    /api/pantry/items/:id        # Aggiornamento quantità
DELETE /api/pantry/items/:id        # Rimozione prodotto
GET    /api/pantry/expiring         # Prodotti in scadenza
GET    /api/pantry/shopping-list    # Lista della spesa auto
POST   /api/pantry/recipe-suggest   # Suggerimenti ricette
```

### **8. Sistema Email per Reset Password**
```javascript
// Servizio email per recupero password
POST   /api/email/send-reset      # Invio email reset password
POST   /api/email/verify-token    # Verifica token reset valido
GET    /api/email/test-config     # Test configurazione email (dev)
```

### **9. Sistema Traduzioni Prodotti**
```javascript
// Traduzione automatica prodotti da OpenFoodFacts
GET    /api/translations/product/:id   # Traduzioni prodotto esistenti
POST   /api/translations/auto/:id      # Traduzione automatica prodotto
PUT    /api/translations/manual/:id    # Traduzione manuale prodotto
GET    /api/translations/missing       # Prodotti senza traduzione
POST   /api/translations/batch         # Traduzione batch multipli prodotti
```

## 💾 **Schema Database Locale SQLite**

### **Principi del Database Italiano**
- 🇮🇹 **Contenuti italiani**: Tutti i dati di default in lingua italiana
- 🔒 **Privacy totale**: Tutti i dati rimangono sul dispositivo
- 📱 **SQLite responsive**: Stesso database per mobile e desktop
- 🌐 **Cache tradotte**: Prodotti OpenFoodFacts tradotti e memorizzati
- 💪 **Performance**: Ottimizzato per uso prevalentemente offline
- � **Reset password**: Supporto email per recupero credenziali

### **Tabelle Principali (SQLite Locale)**
```sql
-- Utenti locali con supporto email per reset password
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email VARCHAR(255) UNIQUE NOT NULL, -- Email necessaria per reset password
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    avatar_path VARCHAR(500), -- Path locale, non URL
    date_of_birth DATE,
    gender ENUM('male', 'female', 'other'),
    height DECIMAL(5,2), -- cm
    weight DECIMAL(5,2), -- kg
    activity_level ENUM('sedentary', 'light', 'moderate', 'active', 'very_active'),
    timezone VARCHAR(50) DEFAULT 'Europe/Rome',
    language VARCHAR(10) DEFAULT 'it',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_login DATETIME,
    email_verified BOOLEAN DEFAULT FALSE,
    reset_token VARCHAR(255), -- Token per reset password
    reset_token_expires DATETIME -- Scadenza token reset
);

-- Obiettivi nutrizionali personalizzati
CREATE TABLE nutrition_goals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER REFERENCES users(id),
    goal_type ENUM('weight_loss', 'weight_gain', 'maintenance', 'muscle_gain'),
    target_weight DECIMAL(5,2),
    target_calories INTEGER,
    target_carbs_percent DECIMAL(5,2),
    target_protein_percent DECIMAL(5,2),
    target_fat_percent DECIMAL(5,2),
    target_water_liters DECIMAL(4,2),
    weekly_weight_change DECIMAL(4,2), -- kg per settimana
    start_date DATE,
    target_date DATE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Prodotti alimentari (database locale + OpenFoodFacts tradotti)
CREATE TABLE products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    barcode VARCHAR(20) UNIQUE,
    name VARCHAR(500) NOT NULL,
    name_it VARCHAR(500), -- Nome tradotto in italiano
    brand VARCHAR(255),
    brand_it VARCHAR(255), -- Brand tradotto in italiano
    category_id INTEGER REFERENCES categories(id),
    image_path VARCHAR(500), -- Path locale per immagini
    
    -- Dati nutrizionali per 100g (COMPLETI)
    calories DECIMAL(8,2),
    proteins DECIMAL(8,2),
    carbs DECIMAL(8,2),
    fats DECIMAL(8,2),
    fiber DECIMAL(8,2),
    sugars DECIMAL(8,2),
    salt DECIMAL(8,2),
    
    -- Vitamine (mg/mcg per 100g) - TUTTI IMPORTANTI
    vitamin_a DECIMAL(8,2),
    vitamin_c DECIMAL(8,2),
    vitamin_d DECIMAL(8,2),
    vitamin_e DECIMAL(8,2),
    vitamin_k DECIMAL(8,2),
    thiamin DECIMAL(8,2),      -- B1
    riboflavin DECIMAL(8,2),   -- B2
    niacin DECIMAL(8,2),       -- B3
    vitamin_b6 DECIMAL(8,2),
    folate DECIMAL(8,2),       -- B9
    vitamin_b12 DECIMAL(8,2),
    biotin DECIMAL(8,2),       -- B7
    pantothenic_acid DECIMAL(8,2), -- B5
    
    -- Minerali (mg per 100g) - TUTTI IMPORTANTI
    calcium DECIMAL(8,2),
    iron DECIMAL(8,2),
    magnesium DECIMAL(8,2),
    phosphorus DECIMAL(8,2),
    potassium DECIMAL(8,2),
    sodium DECIMAL(8,2),
    zinc DECIMAL(8,2),
    copper DECIMAL(8,2),
    manganese DECIMAL(8,2),
    selenium DECIMAL(8,2),
    iodine DECIMAL(8,2),
    chromium DECIMAL(8,2),
    molybdenum DECIMAL(8,2),
    
    -- Acidi grassi (g per 100g)
    saturated_fats DECIMAL(8,2),
    monounsaturated_fats DECIMAL(8,2),
    polyunsaturated_fats DECIMAL(8,2),
    trans_fats DECIMAL(8,2),
    cholesterol DECIMAL(8,2),
    
    -- Altri nutrienti importanti
    alcohol DECIMAL(8,2),
    caffeine DECIMAL(8,2),
    water DECIMAL(8,2),
    
    -- Scores di qualità
    nutriscore ENUM('A', 'B', 'C', 'D', 'E'),
    nova_group INTEGER CHECK(nova_group IN (1,2,3,4)),
    ecoscore ENUM('A', 'B', 'C', 'D', 'E'),
    
    -- Metadati e traduzioni
    source ENUM('local', 'openfoodfacts', 'user') DEFAULT 'user',
    original_language VARCHAR(10), -- Lingua originale
    translation_status ENUM('none', 'auto', 'manual', 'verified') DEFAULT 'none',
    is_favorite BOOLEAN DEFAULT FALSE,
    usage_count INTEGER DEFAULT 0, -- Tracciamento uso locale
    last_used DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Pasti con analisi nutrizionale completa
CREATE TABLE meals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER REFERENCES users(id),
    meal_type ENUM('breakfast', 'lunch', 'dinner', 'snack'),
    meal_name VARCHAR(255),
    date DATE NOT NULL,
    time TIME,
    location VARCHAR(255),
    notes TEXT,
    
    -- Totali nutrizionali calcolati
    total_calories DECIMAL(8,2),
    total_proteins DECIMAL(8,2),
    total_carbs DECIMAL(8,2),
    total_fats DECIMAL(8,2),
    total_fiber DECIMAL(8,2),
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Alimenti nei pasti con porzioni
CREATE TABLE meal_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    meal_id INTEGER REFERENCES meals(id),
    product_id INTEGER REFERENCES products(id),
    quantity DECIMAL(8,2) NOT NULL, -- grammi
    unit ENUM('g', 'ml', 'piece', 'cup', 'tbsp', 'tsp') DEFAULT 'g',
    
    -- Valori nutrizionali per questa porzione
    calories DECIMAL(8,2),
    proteins DECIMAL(8,2),
    carbs DECIMAL(8,2),
    fats DECIMAL(8,2),
    fiber DECIMAL(8,2),
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Attività fisiche
CREATE TABLE activities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER REFERENCES users(id),
    activity_type VARCHAR(100) NOT NULL,
    activity_name VARCHAR(255),
    duration_minutes INTEGER NOT NULL,
    intensity ENUM('low', 'moderate', 'high', 'very_high'),
    calories_burned DECIMAL(8,2),
    date DATE NOT NULL,
    time TIME,
    notes TEXT,
    
    -- Dati specifici per tipo di attività
    distance_km DECIMAL(8,2), -- per corsa/ciclismo
    steps INTEGER, -- per camminata
    weight_kg DECIMAL(8,2), -- per sollevamento pesi
    heart_rate_avg INTEGER,
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tracciamento peso corporeo
CREATE TABLE weight_entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER REFERENCES users(id),
    weight DECIMAL(5,2) NOT NULL,
    body_fat_percentage DECIMAL(5,2),
    muscle_mass DECIMAL(5,2),
    date DATE NOT NULL,
    time TIME,
    notes TEXT,
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Gestione dispensa
CREATE TABLE pantry_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER REFERENCES users(id),
    product_id INTEGER REFERENCES products(id),
    quantity DECIMAL(8,2) NOT NULL,
    unit ENUM('g', 'ml', 'piece', 'package') DEFAULT 'g',
    purchase_date DATE,
    expiry_date DATE,
    price DECIMAL(10,2),
    location VARCHAR(100), -- frigo, dispensa, congelatore
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Traduzioni prodotti
CREATE TABLE product_translations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER REFERENCES products(id),
    field_name VARCHAR(100) NOT NULL, -- 'name', 'brand', 'ingredients', etc.
    original_text TEXT,
    translated_text TEXT,
    source_language VARCHAR(10),
    target_language VARCHAR(10) DEFAULT 'it',
    translation_method ENUM('auto', 'manual') DEFAULT 'auto',
    confidence_score DECIMAL(3,2), -- 0.00 to 1.00
    verified BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Reset password tokens
CREATE TABLE password_reset_tokens (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER REFERENCES users(id),
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at DATETIME NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    used_at DATETIME
);

-- Cache email inviate
CREATE TABLE email_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER REFERENCES users(id),
    email_type ENUM('password_reset', 'welcome', 'verification'),
    recipient_email VARCHAR(255) NOT NULL,
    subject VARCHAR(255),
    status ENUM('sent', 'failed', 'pending'),
    error_message TEXT,
    sent_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## 🔧 **Configurazione e Deploy Locale**

### **Environment Variables**
```bash
# Database Locale
DATABASE_PATH=./data/nutrijournal.db
IMAGES_PATH=./images/

# Authentication
JWT_SECRET=your_local_secret_key
JWT_EXPIRES_IN=7d
SALT_ROUNDS=12

# Email Configuration (per reset password)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
FROM_EMAIL=noreply@nutrijournal.local
FROM_NAME=NutriJournal

# External APIs (OpenFoodFacts OBBLIGATORIO)
OPENFOODFACTS_API_URL=https://world.openfoodfacts.org/api/v0
OPENFOODFACTS_USER_AGENT=NutriJournal/1.0
TRANSLATION_API_KEY=optional_google_translate_key

# App Configuration
NODE_ENV=production
PORT=3000
HOST=localhost
CORS_ORIGIN=http://localhost:8100,http://localhost:4200

# Cache Configuration
CACHE_PRODUCTS_TTL=3600 # 1 ora cache prodotti
CACHE_IMAGES_TTL=86400  # 1 giorno cache immagini
MAX_CACHE_SIZE=1000     # Max 1000 prodotti in cache
```

### **Setup Locale Semplificato**
```bash
# Installazione e setup
npm install
npm run setup-database  # Crea database con dati italiani
npm run seed-italian    # Carica dati di esempio in italiano
npm start               # Avvia server locale

# Struttura cartelle locali
nutrijournal-backend/
├── data/
│   ├── nutrijournal.db      # Database SQLite principale
│   └── categories.db        # Database categorie italiane
├── images/
│   ├── products/           # Immagini prodotti (cache locale)
│   ├── avatars/            # Avatar utenti
│   └── temp/               # File temporanei
├── cache/
│   ├── openfoodfacts/      # Cache risposte OpenFoodFacts
│   └── translations/       # Cache traduzioni
└── logs/
    ├── app.log             # Log applicazione
    ├── email.log           # Log invii email
    └── translations.log    # Log traduzioni
```

## 🎯 **Integrazione con Frontend Ionic Web**

### **Responsive Design per Mobile e Desktop**
```javascript
// CORS configuration per app web responsive
const corsOptions = {
  origin: [
    'http://localhost:8100',      // Ionic serve (dev)
    'http://localhost:4200',      // Angular serve (dev)
    'http://localhost:8080',      // Build production
    'https://nutrijournal.app',   // Deploy production
    'file://',                    // App mobile buildata
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept-Language']
};
```

### **API Response Format con Traduzioni**
```javascript
// Formato risposta con supporto internazionalizzazione
const LocalApiResponse = {
  success: boolean,
  data: any,
  message: string,        // Messaggio in italiano
  errors: array,          // Errori tradotti in italiano
  offline: boolean,       // Indica se i dati sono locali o da cache
  translation: {
    hasTranslation: boolean,
    originalLanguage: string,
    confidence: number    // Affidabilità traduzione 0-1
  },
  pagination: {
    page: number,
    limit: number,
    total: number,
    totalPages: number
  },
  meta: {
    timestamp: string,
    version: string,
    locale: string,       // Sempre 'it'
    deviceType: string    // 'mobile', 'desktop', 'tablet'
  }
};
```

## 📱 **Supporto Responsive Design Ionic**

### **Features Web per Mobile e Desktop**
```javascript
// Endpoints per ottimizzazione responsive
GET    /api/ui/device-type       # Rileva tipo dispositivo (mobile/desktop)
GET    /api/ui/layout-config     # Configurazione layout responsive
POST   /api/ui/save-preferences  # Salva preferenze interfaccia
GET    /api/ui/breakpoints       # Breakpoint CSS per responsive
GET    /api/local/storage-info   # Info spazio disponibile device
POST   /api/local/image-optimize # Ottimizzazione immagini per device
```

### **PWA Features per App Web**
```javascript
// Features PWA per funzionamento app-like
GET    /api/pwa/manifest        # Manifest.json dinamico
GET    /api/pwa/service-worker  # Service worker configuration
POST   /api/pwa/install-prompt  # Trigger install prompt
GET    /api/pwa/offline-data    # Dati disponibili offline
POST   /api/pwa/sync-offline    # Sincronizzazione dati offline
```

## 🚀 **Performance e Sicurezza Locale**

### **Strategia di Cache Locale**
```javascript
// Cache su file system locale - nessun Redis necessario
- Product searches: Cache su file JSON (1 ora)
- User nutrition data: Cache in memoria (15 minuti)
- Static data: Cache permanente su disco
- OpenFoodFacts responses: Cache su disco (24 ore)
- Images: Cache permanente nella cartella locale
```

### **Ottimizzazioni Database SQLite**
```sql
-- Indici ottimizzati per SQLite locale
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_products_barcode ON products(barcode);
CREATE INDEX idx_products_name ON products(name);
CREATE INDEX idx_meals_user_date ON meals(user_id, date);
CREATE INDEX idx_activities_user_date ON activities(user_id, date);
CREATE INDEX idx_pantry_user_expiry ON pantry_items(user_id, expiry_date);

-- Ottimizzazioni SQLite
PRAGMA journal_mode = WAL;
PRAGMA synchronous = NORMAL;
PRAGMA cache_size = 10000;
PRAGMA temp_store = MEMORY;
```

## 🔒 **Sicurezza e Privacy con Email**

### **Privacy-by-Design con Servizi Essenziali**
- 🇮🇹 **Interfaccia italiana**: Privacy con esperienza utente ottimale
- 📱 **Dati locali**: Informazioni personali solo sul dispositivo
- 🔐 **Crittografia locale**: Password hashate con bcrypt
- � **Email sicura**: Reset password con token temporanei
- 🌐 **Connessione mirata**: Internet solo per ricerca prodotti
- 🔄 **Cache intelligente**: Prodotti tradotti memorizzati localmente

### **Sicurezza Authentication con Email**
```javascript
// JWT + Email Security
- Access tokens: 24 ore scadenza
- Password hashing: bcrypt con salt locale
- Reset tokens: 1 ora scadenza, uso singolo
- Email verification: Link sicuri con token
- Rate limiting: Protezione brute force
- Input sanitization: Prevenzione injection
```

### **Protezione Dati e Traduzioni**
```javascript
// Sicurezza per dati multilingua
- Translation cache: Memorizzazione sicura traduzioni
- OpenFoodFacts API: Rate limiting e retry logic
- Data validation: Verifica integrità dati tradotti
- Error handling: Gestione graceful errori traduzione
- Cache cleanup: Pulizia automatica cache obsoleta
```

---

## 🎯 **Obiettivi e Roadmap Italiano**

### **Versione 1.0 (MVP Italiano)**
- ✅ Interfaccia completamente italiana
- ✅ API Authentication con reset password email
- ✅ Database prodotti con OpenFoodFacts integrato
- ✅ Sistema traduzioni automatiche
- ✅ Responsive design mobile/desktop
- ✅ Calcoli nutrizionali completi

### **Versione 2.0 (Advanced Features)**
- 🔄 Traduzioni manuali migliorative
- 🔄 Cache intelligente prodotti
- 🔄 Analytics nutrizionali avanzate
- 🔄 Export report PDF in italiano
- 🔄 Gestione dispensa completa
- 🔄 PWA con funzionamento offline

### **Versione 3.0 (Pro Features)**
- 📋 Sistema raccomandazioni nutrizionali
- 📋 Integrazione bilancia smart
- 📋 Report medici in italiano
- 📋 Condivisione dati con nutrizionisti
- 📋 API pubbliche per integrazioni

---

## �🇹 **Vantaggi dell'Approccio Italiano**

### **✅ Esperienza Utente Italiana**
- Interfaccia completamente tradotta e localizzata
- Terminologia nutrizionale italiana corretta
- Dati prodotti tradotti e verificati
- Sistema di unità di misura italiano

### **✅ Privacy e Funzionalità**
- Dati personali sempre sul tuo dispositivo
- Connessione internet solo per arricchire database prodotti
- Reset password sicuro via email quando necessario
- Funzionamento ottimale anche senza connessione

### **✅ Design Responsive Intelligente**
- Un'unica app web che si adatta a mobile e desktop
- Performance ottimizzate per ogni tipo di schermo
- Nessuna installazione app store necessaria
- Accessibile da qualsiasi browser moderno

### **✅ Database Nutrizionale Completo**
- Tutti i nutrienti importanti sempre disponibili
- OpenFoodFacts integrato con traduzione automatica
- Cache locale per performance ottimali
- Possibilità di aggiungere prodotti personalizzati

---

## 🎨 **Specifiche Frontend Ionic per Sviluppo AI**

### **📋 Requisiti Tecnici Obbligatori**
```javascript
// Framework Stack Richiesto
Framework: Ionic 8.x + Angular 19.x
UI Library: @ionic/angular
Styling: SCSS + CSS Variables
State Management: Angular Signals (standalone components)
HTTP Client: Angular HttpClient + Interceptors
Forms: Angular Reactive Forms + Validators
Routing: Angular Router + Guards
Offline: Service Workers + IndexedDB
PWA: @angular/pwa
Icons: Ionicons + Material Icons
Charts: Chart.js o Angular Charts
Camera: @capacitor/camera (opzionale)
```

### **🇮🇹 Linguaggio e Localizzazione**
```javascript
// Tutti i testi DEVONO essere in italiano
- Titoli, labels, placeholder, messaggi errore
- Termini nutrizionali corretti in italiano
- Formati data/ora italiani (gg/mm/aaaa)
- Separatori decimali italiani (virgola, non punto)
- Unità di misura italiane (kg, cm, kcal, grammi)
- Terminologia medica/nutrizionale appropriata
```

### **📱 Layout Responsive Obbligatorio**
```javascript
// Breakpoints responsive richiesti
Mobile: < 768px (stack verticale, tab bottom)
Tablet: 768px - 1024px (grid 2 colonne)
Desktop: > 1024px (sidebar + content)

// Componenti layout principali
- Header responsive con titolo e menu
- Navigation (tabs mobile, sidebar desktop)
- Content area con scroll infinito
- Modal/popover per form
- Toast per notifiche
```

### **🎯 Pagine/Componenti Obbligatori**
```javascript
// 1. AUTENTICAZIONE
/auth/login          # Login con email/password
/auth/register       # Registrazione utente
/auth/forgot         # Reset password (con email)
/auth/reset/:token   # Form reset password

// 2. DASHBOARD PRINCIPALE
/dashboard           # Overview giornaliera con:
                     # - Calorie consumate vs obiettivo
                     # - Macro nutrients chart
                     # - Ultimi pasti
                     # - Promemoria acqua
                     # - Quick actions (aggiungi pasto/attività)

// 3. GESTIONE PASTI
/meals               # Lista pasti giornalieri
/meals/add           # Aggiungi nuovo pasto
/meals/:id/edit      # Modifica pasto esistente
/meals/:id/details   # Dettagli pasto completi

// 4. RICERCA PRODOTTI
/products/search     # Ricerca prodotti con:
                     # - Barra ricerca locale
                     # - Bottone "Cerca online" (OpenFoodFacts)
                     # - Scanner barcode (opzionale)
                     # - Lista categorie
                     # - Prodotti recenti/preferiti

/products/:id        # Dettagli prodotto con tutti i nutrienti
/products/add        # Aggiungi prodotto personalizzato

// 5. ATTIVITÀ FISICA
/activities          # Lista attività giornaliere
/activities/add      # Aggiungi attività
/activities/:id/edit # Modifica attività

// 6. PROFILO E OBIETTIVI
/profile             # Profilo utente completo
/profile/goals       # Impostazione obiettivi nutrizionali
/profile/settings    # Impostazioni app

// 7. ANALYTICS E REPORT
/analytics           # Dashboard analytics con:
                     # - Grafici trend settimanali/mensili
                     # - Progresso obiettivi
                     # - Report nutrizionali

// 8. DISPENSA
/pantry              # Gestione dispensa con scadenze
/pantry/shopping     # Lista della spesa automatica
```

### **🔧 Services Angular Richiesti**
```javascript
// auth.service.ts
- login(), register(), logout()
- forgotPassword(), resetPassword()
- getCurrentUser(), updateProfile()
- Token management con auto-refresh

// api.service.ts  
- Base HTTP service con interceptors
- Error handling centralizzato
- Loading states management
- Offline detection

// products.service.ts
- searchLocal(), searchOnline()
- getProductById(), addCustomProduct()
- translateProduct(), getCategories()
- Cache management prodotti

// meals.service.ts
- getTodayMeals(), addMeal(), updateMeal()
- calculateNutrition(), getMealHistory()

// nutrition.service.ts
- calculateDailyNutrition()
- getGoalsProgress()
- calculateBMR(), calculateTDEE()

// storage.service.ts
- Local storage/IndexedDB management
- Offline data synchronization
- Image caching locale
```

### **🎨 UI/UX Guidelines Italiane**
```javascript
// Color Scheme Suggerito
Primary: #4CAF50 (verde nutrizione)
Secondary: #FF9800 (arancione energia)
Accent: #2196F3 (blu informazioni)
Success: #4CAF50
Warning: #FF9800
Danger: #F44336

// Typography
Font: System fonts (San Francisco, Roboto)
Sizes: 12px, 14px, 16px, 18px, 24px, 32px
Weight: 400 (normal), 500 (medium), 600 (semibold)

// Spacing
Margin/Padding: 4px, 8px, 12px, 16px, 24px, 32px
Border Radius: 4px, 8px, 12px
```

### **📊 Componenti UI Specifici Richiesti**
```javascript
// nutrition-card.component.ts
- Visualizza macronutrienti con progress bars
- Calorie rimanenti con indicatore colorato
- Click per dettagli completi

// product-search.component.ts
- Barra ricerca con debounce
- Lista risultati con immagini
- Paginazione infinita
- Cache risultati recenti

// meal-form.component.ts
- Form aggiunta pasti con date picker
- Ricerca e selezione prodotti
- Calcolo quantità e porzioni
- Preview valori nutrizionali

// chart.component.ts
- Grafici trend nutrizionali
- Selector periodo (7gg, 30gg, 3mesi)
- Export immagine grafico

// barcode-scanner.component.ts (opzionale)
- Integrazione camera
- Fallback input manuale
- Feedback visivo scanning
```

### **🔄 Gestione Stati e Dati**
```javascript
// Signals Pattern per State Management
// user.signal.ts
export const userSignal = signal<User | null>(null);
export const isLoggedInSignal = computed(() => !!userSignal());

// nutrition.signal.ts  
export const dailyNutritionSignal = signal<DailyNutrition | null>(null);
export const goalsProgressSignal = computed(() => /* calcolo progresso */);

// products.signal.ts
export const recentProductsSignal = signal<Product[]>([]);
export const favoriteProductsSignal = signal<Product[]>([]);

// Offline Support Pattern
- Service Workers per cache API responses
- IndexedDB per dati utente offline
- Sync queue per modifiche offline
- Network status detection
```

### **📱 Funzionalità PWA Richieste**
```javascript
// manifest.json requirements
{
  "name": "NutriJournal",
  "short_name": "NutriJournal", 
  "description": "Tracciamento nutrizionale italiano",
  "start_url": "/",
  "display": "standalone",
  "orientation": "portrait-primary",
  "theme_color": "#4CAF50",
  "background_color": "#ffffff",
  "lang": "it"
}

// Service Worker features
- Cache API responses (OpenFoodFacts)
- Cache static assets
- Background sync quando torna online
- Push notifications per promemoria
```

### **🔍 Validazione e Error Handling**
```javascript
// Form Validation italiana
- Email: formato corretto + messaggio italiano
- Password: min 8 caratteri, maiuscola, numero
- Peso: range 30-300 kg con virgola decimale
- Altezza: range 100-250 cm
- Calorie: range 800-5000 kcal/giorno

// Error Messages in italiano
const errorMessages = {
  'network-error': 'Connessione internet assente',
  'product-not-found': 'Prodotto non trovato',
  'translation-failed': 'Traduzione non disponibile',
  'email-send-failed': 'Invio email fallito, riprova'
};
```

---

**Questo backend fornisce la base per un'esperienza NutriJournal completamente italiana, sviluppata in Ionic con design responsive per garantire un'interfaccia ottimale su mobile e desktop, mantenendo la privacy degli utenti e offrendo un database nutrizionale completo e tradotto.**
