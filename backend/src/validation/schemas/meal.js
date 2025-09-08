const Joi = require('joi');

const mealSchemas = {
    // Schema per i parametri di data
    dateParam: Joi.object({
        date: Joi.date().iso().required()
            .messages({
                'date.base': 'Data non valida',
                'any.required': 'La data è obbligatoria'
            })
    }),

    // Schema per la creazione/modifica di un pasto
    mealInput: Joi.object({
        type: Joi.string()
            .valid('breakfast', 'lunch', 'dinner', 'snack')
            .required()
            .messages({
                'any.required': 'Il tipo di pasto è obbligatorio',
                'any.only': 'Tipo pasto non valido. Valori ammessi: colazione, pranzo, cena, spuntino'
            }),
        
        date: Joi.date().iso().required()
            .messages({
                'date.base': 'Data non valida',
                'any.required': 'La data è obbligatoria'
            }),
        
        time: Joi.string()
            .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
            .required()
            .messages({
                'string.pattern.base': 'Formato ora non valido (HH:MM)',
                'any.required': 'L\'ora è obbligatoria'
            }),
        
        meal_name: Joi.string()
            .max(100)
            .optional()
            .messages({
                'string.max': 'Il nome del pasto non può superare i 100 caratteri'
            }),
        
        location: Joi.string()
            .max(100)
            .optional()
            .messages({
                'string.max': 'La location non può superare i 100 caratteri'
            }),
        
        notes: Joi.string()
            .max(500)
            .optional()
            .messages({
                'string.max': 'Le note non possono superare i 500 caratteri'
            }),
        
        items: Joi.array().items(
            Joi.object({
                product_id: Joi.string().required()
                    .messages({
                        'any.required': 'ID prodotto richiesto'
                    }),
                quantity: Joi.number().positive().required()
                    .messages({
                        'number.base': 'La quantità deve essere un numero',
                        'number.positive': 'La quantità deve essere positiva',
                        'any.required': 'La quantità è obbligatoria'
                    }),
                unit: Joi.string().required()
                    .messages({
                        'any.required': 'L\'unità di misura è obbligatoria'
                    })
            })
        ).min(1).required()
            .messages({
                'array.min': 'Devi specificare almeno un prodotto',
                'any.required': 'La lista dei prodotti è obbligatoria'
            })
    }),

    // Schema per l'aggiornamento parziale di un pasto
    mealUpdate: Joi.object({
        meal_type: Joi.string()
            .valid('breakfast', 'lunch', 'dinner', 'snack')
            .optional(),
        date: Joi.date().iso().optional(),
        time: Joi.string()
            .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
            .optional(),
        meal_name: Joi.string().max(100).optional(),
        location: Joi.string().max(100).optional(),
        notes: Joi.string().max(500).optional(),
        items: Joi.array().items(
            Joi.object({
                product_id: Joi.string().required(),
                quantity: Joi.number().positive().required(),
                unit: Joi.string().required()
            })
        ).min(1).optional()
    }).min(1) // Almeno un campo deve essere presente
        .messages({
            'object.min': 'Devi specificare almeno un campo da aggiornare'
        }),

    // Schema per l'ID del pasto
    mealId: Joi.object({
        mealId: Joi.string().required()
            .messages({
                'any.required': 'ID pasto richiesto'
            })
    })
};

module.exports = mealSchemas;
