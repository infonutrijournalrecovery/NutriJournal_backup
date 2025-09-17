const helmet = require('helmet');
const rateLimit = require('express-rate-limit');


// CORS semplificato per development
const corsOptions = {
    origin: ['http://localhost:8100', 'http://localhost:4200'], // Ionic e Angular dev servers
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    optionsSuccessStatus: 200
};

// Configurazione base di Helmet
const helmetConfig = helmet({
    contentSecurityPolicy: false, // Disabilitato per semplicità in development
});

module.exports = {
    rateLimiter,
    corsOptions,
    helmetConfig
};
