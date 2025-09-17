
const Joi = require('joi');


// Validatori personalizzati per l'app NutriJournal

/**
 * Schema per aggiunta elemento in dispensa
 */
const addPantryItemSchema = Joi.object({
    barcode: Joi.string()
        .pattern(/^[0-9]{8,14}$/)
        .required()
        .messages({
            'string.pattern.base': 'Il barcode deve essere numerico (8-14 cifre)',
            'any.required': 'Il barcode è obbligatorio'
        }),
    name: Joi.string()
        .min(1)
        .max(200)
        .required()
        .messages({
            'string.min': 'Il nome del prodotto è obbligatorio',
            'string.max': 'Il nome non può superare 200 caratteri',
            'any.required': 'Il nome del prodotto è obbligatorio'
        }),
    quantity: Joi.number()
        .min(1)
        .required()
        .messages({
            'number.min': 'La quantità deve essere almeno 1',
            'any.required': 'La quantità è obbligatoria'
        }),
    unit: Joi.string()
        .max(10)
        .required()
        .messages({
            'string.max': 'L\'unità di misura non può superare 10 caratteri',
            'any.required': 'L\'unità di misura è obbligatoria'
        }),
    brand: Joi.string()
        .max(100)
        .allow('', null),
    category: Joi.string()
        .max(100)
        .allow('', null),
    notes: Joi.string()
        .max(500)
        .optional()
});


// Validatori personalizzati per l'app NutriJournal

/**
 * Schema per registrazione utente
 */
const userRegistrationSchema = Joi.object({
    name: Joi.string()
        .min(2)
        .max(50)
        .required()
        .messages({
            'string.min': 'Il nome deve avere almeno 2 caratteri',
            'string.max': 'Il nome non può superare 50 caratteri',
            'any.required': 'Il nome è obbligatorio'
        }),
    
    email: Joi.string()
        .email()
        .required()
        .messages({
            'string.email': 'Inserisci un indirizzo email valido',
            'any.required': 'L\'email è obbligatoria'
        }),
    
    password: Joi.string()
        .min(6)
        .max(50)
        .required()
        .messages({
            'string.min': 'La password deve avere almeno 6 caratteri',
            'string.max': 'La password non può superare 50 caratteri',
            'any.required': 'La password è obbligatoria'
        }),
    
    birth_date: Joi.date()
        .max('now')
        .required()
        .messages({
            'date.max': 'La data di nascita non può essere futura',
            'any.required': 'La data di nascita è obbligatoria'
        }),
    
    gender: Joi.string()
        .valid('male', 'female', 'other')
        .required()
        .messages({
            'any.only': 'Il genere deve essere male, female o other',
            'any.required': 'Il genere è obbligatorio'
        }),
    
    height: Joi.number()
        .min(50)
        .max(250)
        .required()
        .messages({
            'number.min': 'L\'altezza deve essere almeno 50 cm',
            'number.max': 'L\'altezza non può superare 250 cm',
            'any.required': 'L\'altezza è obbligatoria'
        }),
    
    weight: Joi.number()
        .min(20)
        .max(500)
        .required()
        .messages({
            'number.min': 'Il peso deve essere almeno 20 kg',
            'number.max': 'Il peso non può superare 500 kg',
            'any.required': 'Il peso è obbligatorio'
        }),
    
    activity_level: Joi.string()
        .valid('sedentary', 'lightly_active', 'moderately_active', 'very_active', 'extremely_active')
        .default('sedentary')
        .messages({
            'any.only': 'Livello di attività non valido'
        })
});

/**
 * Schema per login utente
 */
const userLoginSchema = Joi.object({
    email: Joi.string()
        .email()
        .required()
        .messages({
            'string.email': 'Inserisci un indirizzo email valido',
            'any.required': 'L\'email è obbligatoria'
        }),
    
    password: Joi.string()
        .required()
        .messages({
            'any.required': 'La password è obbligatoria'
        })
});

/**
 * Schema per aggiornamento profilo utente
 */
const userUpdateSchema = Joi.object({
    name: Joi.string()
        .min(2)
        .max(50)
        .messages({
            'string.min': 'Il nome deve avere almeno 2 caratteri',
            'string.max': 'Il nome non può superare 50 caratteri'
        }),
    
    height: Joi.number()
        .min(50)
        .max(250)
        .messages({
            'number.min': 'L\'altezza deve essere almeno 50 cm',
            'number.max': 'L\'altezza non può superare 250 cm'
        }),
    
    weight: Joi.number()
        .min(20)
        .max(500)
        .messages({
            'number.min': 'Il peso deve essere almeno 20 kg',
            'number.max': 'Il peso non può superare 500 kg'
        }),
    
    activity_level: Joi.string()
        .valid('sedentary', 'lightly_active', 'moderately_active', 'very_active', 'extremely_active')
        .messages({
            'any.only': 'Livello di attività non valido'
        }),
    
    dietary_preferences: Joi.array()
        .items(Joi.string().valid('vegetarian', 'vegan', 'gluten_free', 'lactose_free', 'keto', 'mediterranean'))
        .messages({
            'any.only': 'Preferenza alimentare non valida'
        }),
    
    allergies: Joi.array()
        .items(Joi.string())
        .messages({
            'array.base': 'Le allergie devono essere un array di stringhe'
        })
        ,
        goal: Joi.string().valid('lose_weight', 'maintain_weight', 'gain_muscle', 'gain_weight')
            .messages({
                'any.only': 'Obiettivo non valido'
            })
});

/**
 * Schema per prodotto
 */
const productSchema = Joi.object({
    name: Joi.string()
        .min(1)
        .max(200)
        .required()
        .messages({
            'string.min': 'Il nome del prodotto è obbligatorio',
            'string.max': 'Il nome non può superare 200 caratteri',
            'any.required': 'Il nome del prodotto è obbligatorio'
        }),
    
    ean: Joi.string()
        .pattern(/^\d{8,13}$/)
        .allow(null, '')
        .messages({
            'string.pattern.base': 'L\'EAN deve contenere solo numeri (8-13 cifre)'
        }),
    
    brand: Joi.string()
        .max(100)
        .allow(null, '')
        .messages({
            'string.max': 'Il brand non può superare 100 caratteri'
        }),
    
    category: Joi.string()
        .max(100)
        .allow(null, '')
        .messages({
            'string.max': 'La categoria non può superare 100 caratteri'
        }),
    
    calories_per_100g: Joi.number()
        .min(0)
        .max(1000)
        .required()
        .messages({
            'number.min': 'Le calorie non possono essere negative',
            'number.max': 'Le calorie non possono superare 1000 per 100g',
            'any.required': 'Le calorie per 100g sono obbligatorie'
        }),
    
    protein_per_100g: Joi.number()
        .min(0)
        .max(100)
        .default(0)
        .messages({
            'number.min': 'Le proteine non possono essere negative',
            'number.max': 'Le proteine non possono superare 100g per 100g'
        }),
    
    carbs_per_100g: Joi.number()
        .min(0)
        .max(100)
        .default(0)
        .messages({
            'number.min': 'I carboidrati non possono essere negativi',
            'number.max': 'I carboidrati non possono superare 100g per 100g'
        }),
    
    fat_per_100g: Joi.number()
        .min(0)
        .max(100)
        .default(0)
        .messages({
            'number.min': 'I grassi non possono essere negativi',
            'number.max': 'I grassi non possono superare 100g per 100g'
        }),
    
    fiber_per_100g: Joi.number()
        .min(0)
        .max(100)
        .default(0)
        .messages({
            'number.min': 'Le fibre non possono essere negative',
            'number.max': 'Le fibre non possono superare 100g per 100g'
        }),
    
    sugar_per_100g: Joi.number()
        .min(0)
        .max(100)
        .default(0)
        .messages({
            'number.min': 'Gli zuccheri non possono essere negativi',
            'number.max': 'Gli zuccheri non possono superare 100g per 100g'
        }),
    
    sodium_per_100g: Joi.number()
        .min(0)
        .max(10000)
        .default(0)
        .messages({
            'number.min': 'Il sodio non può essere negativo',
            'number.max': 'Il sodio non può superare 10000mg per 100g'
        }),
    
    additives: Joi.array()
        .items(Joi.string())
        .default([])
        .messages({
            'array.base': 'Gli additivi devono essere un array di stringhe'
        }),
    
    allergens: Joi.array()
        .items(Joi.string())
        .default([])
        .messages({
            'array.base': 'Gli allergeni devono essere un array di stringhe'
        }),
    
    image_url: Joi.string()
        .uri()
        .allow(null, '')
        .messages({
            'string.uri': 'L\'URL dell\'immagine non è valido'
        })
});

/**
 * Schema per pasto
 */
const mealSchema = Joi.object({
    name: Joi.string()
        .min(1)
        .max(100)
        .required()
        .messages({
            'string.min': 'Il nome del pasto è obbligatorio',
            'string.max': 'Il nome non può superare 100 caratteri',
            'any.required': 'Il nome del pasto è obbligatorio'
        }),
    
    meal_type: Joi.string()
        .valid('breakfast', 'lunch', 'dinner', 'snack')
        .required()
        .messages({
            'any.only': 'Il tipo di pasto deve essere breakfast, lunch, dinner o snack',
            'any.required': 'Il tipo di pasto è obbligatorio'
        }),
    
    date: Joi.date()
        .max('now')
        .required()
        .messages({
            'date.max': 'La data non può essere futura',
            'any.required': 'La data è obbligatoria'
        }),
    
    notes: Joi.string()
        .max(500)
        .allow(null, '')
        .messages({
            'string.max': 'Le note non possono superare 500 caratteri'
        })
});

/**
 * Schema per alimento in un pasto
 */
const mealItemSchema = Joi.object({
    product_id: Joi.number()
        .integer()
        .positive()
        .required()
        .messages({
            'number.integer': 'L\'ID del prodotto deve essere un numero intero',
            'number.positive': 'L\'ID del prodotto deve essere positivo',
            'any.required': 'L\'ID del prodotto è obbligatorio'
        }),
    
    quantity: Joi.number()
        .positive()
        .max(10000)
        .required()
        .messages({
            'number.positive': 'La quantità deve essere positiva',
            'number.max': 'La quantità non può superare 10000g',
            'any.required': 'La quantità è obbligatoria'
        })
});

/**
 * Schema per obiettivi nutrizionali
 */
const nutritionGoalSchema = Joi.object({
    goal_type: Joi.string()
            .valid('lose_weight', 'gain_weight', 'maintain_weight', 'gain_muscle')
        .required()
        .messages({
            'any.only': 'Il tipo di obiettivo deve essere lose_weight, gain_weight, maintain_weight o gain_muscle',
            'any.required': 'Il tipo di obiettivo è obbligatorio'
        }),
    
    target_weight: Joi.number()
        .min(20)
        .max(500)
        .allow(null)
        .messages({
            'number.min': 'Il peso target deve essere almeno 20 kg',
            'number.max': 'Il peso target non può superare 500 kg'
        }),
    
    target_date: Joi.date()
        .min('now')
        .allow(null)
        .messages({
            'date.min': 'La data target non può essere nel passato'
        }),
    
    target_calories: Joi.number()
        .min(800)
        .max(5000)
        .required()
        .messages({
            'number.min': 'Le calorie target devono essere almeno 800',
            'number.max': 'Le calorie target non possono superare 5000',
            'any.required': 'Le calorie target sono obbligatorie'
        }),
    
    daily_protein: Joi.number()
        .min(0)
        .max(500)
        .default(0)
        .messages({
            'number.min': 'Le proteine giornaliere non possono essere negative',
            'number.max': 'Le proteine giornaliere non possono superare 500g'
        }),
    
    daily_carbs: Joi.number()
        .min(0)
        .max(1000)
        .default(0)
        .messages({
            'number.min': 'I carboidrati giornalieri non possono essere negativi',
            'number.max': 'I carboidrati giornalieri non possono superare 1000g'
        }),
    
    daily_fat: Joi.number()
        .min(0)
        .max(300)
        .default(0)
        .messages({
            'number.min': 'I grassi giornalieri non possono essere negativi',
            'number.max': 'I grassi giornalieri non possono superare 300g'
        })
});

/**
 * Schema per attività fisica
 */
const activitySchema = Joi.object({
    name: Joi.string()
        .min(1)
        .max(100)
        .required()
        .messages({
            'string.min': 'Il nome dell\'attività è obbligatorio',
            'string.max': 'Il nome non può superare 100 caratteri',
            'any.required': 'Il nome dell\'attività è obbligatorio'
        }),
    
    type: Joi.string()
        .valid('cardio', 'strength', 'flexibility', 'sports', 'daily', 'other')
        .required()
        .messages({
            'any.only': 'Il tipo di attività deve essere cardio, strength, flexibility, sports, daily o other',
            'any.required': 'Il tipo di attività è obbligatorio'
        }),
    
    duration_minutes: Joi.number()
        .integer()
        .min(1)
        .max(1440)
        .required()
        .messages({
            'number.integer': 'La durata deve essere un numero intero',
            'number.min': 'La durata deve essere almeno 1 minuto',
            'number.max': 'La durata non può superare 1440 minuti (24 ore)',
            'any.required': 'La durata è obbligatoria'
        }),
    
    intensity: Joi.string()
        .valid('low', 'moderate', 'high', 'very_high')
        .default('moderate')
        .messages({
            'any.only': 'L\'intensità deve essere low, moderate, high o very_high'
        }),
    
    met_value: Joi.number()
        .min(0.9)
        .max(15)
        .allow(null)
        .messages({
            'number.min': 'Il valore MET deve essere almeno 0.9',
            'number.max': 'Il valore MET non può superare 15'
        }),
    
    date: Joi.date()
        .max('now')
        .required()
        .messages({
            'date.max': 'La data non può essere futura',
            'any.required': 'La data è obbligatoria'
        }),
    
    notes: Joi.string()
        .max(500)
        .allow(null, '')
        .messages({
            'string.max': 'Le note non possono superare 500 caratteri'
        })
});

/**
 * Schema per ricerca prodotti
 */
const productSearchSchema = Joi.object({
    query: Joi.string()
        .min(2)
        .max(100)
        .required()
        .messages({
            'string.min': 'La query deve avere almeno 2 caratteri',
            'string.max': 'La query non può superare 100 caratteri',
            'any.required': 'La query di ricerca è obbligatoria'
        }),
    
    category: Joi.string()
        .max(50)
        .allow(null, '')
        .messages({
            'string.max': 'La categoria non può superare 50 caratteri'
        }),
    
    page: Joi.number()
        .integer()
        .min(1)
        .default(1)
        .messages({
            'number.integer': 'La pagina deve essere un numero intero',
            'number.min': 'La pagina deve essere almeno 1'
        }),
    
    limit: Joi.number()
        .integer()
        .min(1)
        .max(100)
        .default(20)
        .messages({
            'number.integer': 'Il limite deve essere un numero intero',
            'number.min': 'Il limite deve essere almeno 1',
            'number.max': 'Il limite non può superare 100'
        })
});

/**
 * Middleware di validazione
 */
const validate = (schema) => {
    return (req, res, next) => {
        const { error, value } = schema.validate(req.body, {
            abortEarly: false,
            stripUnknown: true
        });
        
        if (error) {
            const errors = error.details.map(detail => ({
                field: detail.path.join('.'),
                message: detail.message
            }));
            
            return res.status(400).json({
                success: false,
                message: 'Errori di validazione',
                errors
            });
        }
        
        req.body = value;
        next();
    };
};

/**
 * Validazione parametri query
 */
const validateQuery = (schema) => {
    return (req, res, next) => {
        const { error, value } = schema.validate(req.query, {
            abortEarly: false,
            stripUnknown: true
        });
        
        if (error) {
            const errors = error.details.map(detail => ({
                field: detail.path.join('.'),
                message: detail.message
            }));
            
            return res.status(400).json({
                success: false,
                message: 'Errori di validazione parametri',
                errors
            });
        }
        
        req.query = value;
        next();
    };
};

module.exports = {
    // Schemi
    userRegistrationSchema,
    userLoginSchema,
    userUpdateSchema,
    productSchema,
    mealSchema,
    mealItemSchema,
    nutritionGoalSchema,
    activitySchema,
    productSearchSchema,
    addPantryItemSchema,

    // Middleware
    validate,
    validateQuery
};
