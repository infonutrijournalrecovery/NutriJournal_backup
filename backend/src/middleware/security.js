const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const cors = require('cors');
const jwt = require('jsonwebtoken');

/**
 * Rate limiting per API
 */
const createRateLimit = (windowMs, max, message) => {
    return rateLimit({
        windowMs,
        max,
        message: {
            success: false,
            message,
            retry_after: Math.ceil(windowMs / 1000)
        },
        standardHeaders: true,
        legacyHeaders: false,
    });
};

// Rate limit specifici
const rateLimits = {
    // Generale - 1000 richieste per ora
    general: createRateLimit(
        60 * 60 * 1000, // 1 ora
        1000,
        'Troppe richieste. Riprova tra un\'ora.'
    ),
    
    // Auth - 5 tentativi per 15 minuti
    auth: createRateLimit(
        15 * 60 * 1000, // 15 minuti
        5,
        'Troppi tentativi di login. Riprova tra 15 minuti.'
    ),
    
    // Registrazione - 3 registrazioni per ora
    register: createRateLimit(
        60 * 60 * 1000, // 1 ora
        3,
        'Troppe registrazioni. Riprova tra un\'ora.'
    ),
    
    // Reset password - 3 tentativi per ora
    passwordReset: createRateLimit(
        60 * 60 * 1000, // 1 ora
        3,
        'Troppi tentativi di reset password. Riprova tra un\'ora.'
    ),
    
    // Ricerca prodotti - 100 ricerche per 10 minuti
    search: createRateLimit(
        10 * 60 * 1000, // 10 minuti
        100,
        'Troppe ricerche. Riprova tra 10 minuti.'
    ),
    
    // Upload - 20 upload per ora
    upload: createRateLimit(
        60 * 60 * 1000, // 1 ora
        20,
        'Troppi upload. Riprova tra un\'ora.'
    )
};

/**
 * Configurazione CORS
 */
const corsOptions = {
    origin: function (origin, callback) {
        // Ambienti permessi
        const allowedOrigins = [
            'http://localhost:3000',
            'http://localhost:4200',
            'http://localhost:8100',
            'http://localhost:8080',
            'capacitor://localhost',
            'ionic://localhost',
            'http://localhost',
            'https://localhost'
        ];
        
        // In sviluppo permetti tutte le origini
        if (process.env.NODE_ENV === 'development') {
            callback(null, true);
            return;
        }
        
        // In produzione controlla le origini permesse
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Non permesso da CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    maxAge: 86400 // 24 ore
};

/**
 * Configurazione Helmet per sicurezza
 */
const helmetOptions = {
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
            fontSrc: ["'self'", 'https://fonts.gstatic.com'],
            imgSrc: ["'self'", 'data:', 'https:', 'http:'],
            scriptSrc: ["'self'"],
            connectSrc: ["'self'", 'https://world.openfoodfacts.org'],
            frameSrc: ["'none'"],
            objectSrc: ["'none'"],
            upgradeInsecureRequests: []
        }
    },
    hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
    }
};

/**
 * Middleware di autenticazione JWT
 */
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Token di accesso richiesto'
        });
    }
    
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            if (err.name === 'TokenExpiredError') {
                return res.status(401).json({
                    success: false,
                    message: 'Token scaduto'
                });
            } else if (err.name === 'JsonWebTokenError') {
                return res.status(403).json({
                    success: false,
                    message: 'Token non valido'
                });
            } else {
                return res.status(403).json({
                    success: false,
                    message: 'Errore di autenticazione'
                });
            }
        }
        
        req.user = user;
        next();
    });
};

/**
 * Middleware per controllo proprietà risorsa
 */
const checkResourceOwnership = (resourceIdParam = 'id', userIdField = 'user_id') => {
    return async (req, res, next) => {
        try {
            const resourceId = req.params[resourceIdParam];
            const userId = req.user.id;
            
            // Qui dovresti implementare la logica per verificare
            // che la risorsa appartenga all'utente
            // Questo è un esempio generico
            
            req.resourceId = resourceId;
            req.userId = userId;
            next();
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Errore nel controllo proprietà risorsa'
            });
        }
    };
};

/**
 * Middleware per validazione formato file
 */
const validateFileUpload = (allowedTypes = ['image/jpeg', 'image/png', 'image/webp'], maxSize = 5 * 1024 * 1024) => {
    return (req, res, next) => {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'Nessun file caricato'
            });
        }
        
        // Controlla tipo file
        if (!allowedTypes.includes(req.file.mimetype)) {
            return res.status(400).json({
                success: false,
                message: `Tipo di file non supportato. Tipi permessi: ${allowedTypes.join(', ')}`
            });
        }
        
        // Controlla dimensione file
        if (req.file.size > maxSize) {
            return res.status(400).json({
                success: false,
                message: `File troppo grande. Dimensione massima: ${Math.round(maxSize / 1024 / 1024)}MB`
            });
        }
        
        next();
    };
};

/**
 * Middleware per sanitizzazione input
 */
const sanitizeInput = (req, res, next) => {
    const sanitize = (obj) => {
        if (typeof obj === 'string') {
            // Rimuovi caratteri pericolosi
            return obj.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
                     .replace(/javascript:/gi, '')
                     .replace(/on\w+=/gi, '')
                     .trim();
        }
        
        if (Array.isArray(obj)) {
            return obj.map(sanitize);
        }
        
        if (typeof obj === 'object' && obj !== null) {
            const sanitized = {};
            for (const [key, value] of Object.entries(obj)) {
                sanitized[key] = sanitize(value);
            }
            return sanitized;
        }
        
        return obj;
    };
    
    if (req.body) {
        req.body = sanitize(req.body);
    }
    
    if (req.query) {
        req.query = sanitize(req.query);
    }
    
    if (req.params) {
        req.params = sanitize(req.params);
    }
    
    next();
};

/**
 * Middleware per logging sicurezza
 */
const securityLogger = (req, res, next) => {
    const startTime = Date.now();
    
    // Log richiesta
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} - IP: ${req.ip} - User: ${req.user?.id || 'anonymous'}`);
    
    // Log risposta
    const originalSend = res.send;
    res.send = function(data) {
        const duration = Date.now() - startTime;
        console.log(`[${new Date().toISOString()}] Response ${res.statusCode} - Duration: ${duration}ms`);
        
        // Log errori di sicurezza
        if (res.statusCode >= 400) {
            console.warn(`[SECURITY] ${req.method} ${req.path} - Status: ${res.statusCode} - IP: ${req.ip}`);
        }
        
        originalSend.call(this, data);
    };
    
    next();
};

/**
 * Middleware per controllo IP bloccati
 */
const checkBlockedIPs = (req, res, next) => {
    const blockedIPs = process.env.BLOCKED_IPS ? process.env.BLOCKED_IPS.split(',') : [];
    
    if (blockedIPs.includes(req.ip)) {
        return res.status(403).json({
            success: false,
            message: 'Accesso negato'
        });
    }
    
    next();
};

/**
 * Middleware per gestione errori generici
 */
const errorHandler = (err, req, res, next) => {
    console.error(`[ERROR] ${err.stack}`);
    
    // Rate limit errors
    if (err.type === 'rate_limit') {
        return res.status(429).json({
            success: false,
            message: 'Troppe richieste',
            retry_after: err.retry_after
        });
    }
    
    // CORS errors
    if (err.message === 'Non permesso da CORS') {
        return res.status(403).json({
            success: false,
            message: 'Origine non permessa'
        });
    }
    
    // JWT errors
    if (err.name === 'UnauthorizedError') {
        return res.status(401).json({
            success: false,
            message: 'Token non valido'
        });
    }
    
    // Validation errors
    if (err.name === 'ValidationError') {
        return res.status(400).json({
            success: false,
            message: 'Errore di validazione',
            errors: err.details
        });
    }
    
    // Database errors
    if (err.code === 'SQLITE_CONSTRAINT') {
        return res.status(409).json({
            success: false,
            message: 'Conflitto dati'
        });
    }
    
    // Default error
    res.status(err.status || 500).json({
        success: false,
        message: process.env.NODE_ENV === 'production' 
            ? 'Errore interno del server' 
            : err.message
    });
};

module.exports = {
    rateLimits,
    corsOptions,
    helmetOptions,
    authenticateToken,
    checkResourceOwnership,
    validateFileUpload,
    sanitizeInput,
    securityLogger,
    checkBlockedIPs,
    errorHandler
};
