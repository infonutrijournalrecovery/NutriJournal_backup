const express = require('express');
const cors = require('./middleware/cors');
const { errorHandler } = require('./middleware/errorHandler');
const { logger } = require('./middleware/logging');

const router = express.Router();

// Import route modules
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const productRoutes = require('./routes/products');
const mealRoutes = require('./routes/meals');
const nutritionRoutes = require('./routes/nutrition');

// Applica middleware globale
router.use(cors);
router.use(logger);

// Route di benvenuto per l'API
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Benvenuto in NutriJournal API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      products: '/api/products',
      meals: '/api/meals',
      nutrition: '/api/nutrition',
    },
    documentation: '/api/docs',
    health: '/api/health',
  });
});

// Health check endpoint
router.get('/health', (req, res) => {
  const uptime = Math.floor(process.uptime());
  const uptimeHours = Math.floor(uptime / 3600);
  const uptimeMinutes = Math.floor((uptime % 3600) / 60);
  const uptimeSeconds = uptime % 60;

  res.json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: `${uptimeHours}h ${uptimeMinutes}m ${uptimeSeconds}s`,
    uptime_seconds: uptime,
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024 * 100) / 100 + ' MB',
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024 * 100) / 100 + ' MB',
    },
    node_version: process.version,
    environment: process.env.NODE_ENV || 'development',
  });
});

// Registra tutte le route dell'API
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/products', productRoutes);
router.use('/meals', mealRoutes);
router.use('/nutrition', nutritionRoutes);

// Route per documentazione API (placeholder)
router.get('/docs', (req, res) => {
  res.json({
    success: true,
    message: 'Documentazione API NutriJournal',
    version: '1.0.0',
    endpoints: {
      authentication: {
        'POST /api/auth/register': 'Registra nuovo utente',
        'POST /api/auth/login': 'Login utente',
        'POST /api/auth/refresh': 'Rinnova token di accesso',
        'POST /api/auth/logout': 'Logout utente',
        'POST /api/auth/forgot-password': 'Richiedi reset password',
        'POST /api/auth/reset-password': 'Reset password con token',
        'POST /api/auth/change-password': 'Cambia password (autenticato)',
        'GET /api/auth/profile': 'Ottieni profilo utente',
        'PUT /api/auth/profile': 'Aggiorna profilo utente',
        'DELETE /api/auth/account': 'Elimina account',
      },
      users: {
        'GET /api/users/profile': 'Profilo utente completo',
        'GET /api/users/goals': 'Obiettivi nutrizionali',
        'POST /api/users/goals': 'Crea obiettivo',
        'GET /api/users/preferences': 'Preferenze utente',
        'GET /api/users/stats': 'Statistiche personali',
        'POST /api/users/weight': 'Registra peso',
        'GET /api/users/weight/history': 'Storico peso',
        'POST /api/users/avatar': 'Upload avatar',
        'GET /api/users/export': 'Esporta dati utente',
      },
      products: {
        'GET /api/products/search': 'Cerca prodotti OpenFoodFacts',
        'GET /api/products/barcode/:barcode': 'Prodotto per barcode',
        'POST /api/products/custom': 'Crea prodotto personalizzato',
        'GET /api/products/custom': 'Prodotti personalizzati utente',
        'GET /api/products/most-used': 'Prodotti più utilizzati',
        'GET /api/products/favorites': 'Prodotti preferiti',
        'POST /api/products/:id/favorite': 'Aggiungi/rimuovi preferito',
        'GET /api/products/:id/nutrition': 'Dettagli nutrizionali',
        'POST /api/products/:id/rate': 'Valuta prodotto',
      },
      meals: {
        'GET /api/meals/day/:date': 'Pasti di un giorno',
        'POST /api/meals': 'Crea nuovo pasto',
        'GET /api/meals/:id': 'Dettagli pasto',
        'PUT /api/meals/:id': 'Aggiorna pasto',
        'DELETE /api/meals/:id': 'Elimina pasto',
        'POST /api/meals/:id/items': 'Aggiungi elemento al pasto',
        'POST /api/meals/:id/duplicate': 'Duplica pasto',
        'GET /api/meals/search': 'Cerca pasti',
        'GET /api/meals/stats': 'Statistiche pasti',
      },
      nutrition: {
        'GET /api/nutrition/goals/active': 'Obiettivo attivo',
        'POST /api/nutrition/goals': 'Crea obiettivo nutrizionale',
        'GET /api/nutrition/analysis/day/:date': 'Analisi giornaliera',
        'GET /api/nutrition/analysis/period': 'Analisi periodo',
        'GET /api/nutrition/recommendations': 'Raccomandazioni',
        'GET /api/nutrition/trends': 'Tendenze nutrizionali',
        'POST /api/nutrition/calculate-needs': 'Calcola fabbisogno',
        'GET /api/nutrition/reports/weekly': 'Report settimanale',
        'GET /api/nutrition/export': 'Esporta dati nutrizionali',
      },
    },
    notes: {
      authentication: 'La maggior parte degli endpoint richiede autenticazione JWT',
      rate_limiting: 'Tutti gli endpoints hanno rate limiting applicato',
      validation: 'Tutti gli input vengono validati automaticamente',
      cors: 'CORS configurato per applicazioni Ionic/mobile',
      language: 'API completamente localizzata in italiano',
    },
  });
});

// Route per gestire endpoint non trovati
router.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint non trovato',
    message: `L'endpoint ${req.method} ${req.originalUrl} non esiste`,
    available_endpoints: '/api/docs',
  });
});

// Applica error handler globale
router.use(errorHandler);

module.exports = router;
