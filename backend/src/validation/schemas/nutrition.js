const Joi = require('joi');

const nutritionSchemas = {
    // Schema per la validazione dei parametri data
    dateParam: Joi.object({
        startDate: Joi.date().iso().required()
            .messages({
                'date.base': 'La data deve essere una data valida',
                'date.format': 'La data deve essere in formato ISO (YYYY-MM-DD)',
                'any.required': 'La data di inizio è obbligatoria'
            })
    }),

    // Schema per la registrazione del peso
    weightLog: Joi.object({
        weight: Joi.number().positive().required()
            .messages({
                'number.base': 'Il peso deve essere un numero',
                'number.positive': 'Il peso deve essere positivo',
                'any.required': 'Il peso è obbligatorio'
            }),
        date: Joi.date().iso().default(() => new Date().toISOString().split('T')[0])
            .messages({
                'date.base': 'La data deve essere una data valida',
                'date.format': 'La data deve essere in formato ISO (YYYY-MM-DD)'
            }),
        notes: Joi.string().max(500).allow('').optional()
            .messages({
                'string.max': 'Le note non possono superare i 500 caratteri'
            })
    }),

    // Schema per la creazione di un obiettivo nutrizionale
    createNutritionGoal: Joi.object({
        goal_type: Joi.string().valid('weight_loss', 'maintain', 'muscle_gain').required()
            .messages({
                'any.required': 'Il tipo di obiettivo è obbligatorio',
                'any.only': 'Tipo di obiettivo non valido'
            }),
        target_weight: Joi.number().positive().optional()
            .messages({
                'number.positive': 'Il peso obiettivo deve essere positivo'
            }),
        weekly_weight_change: Joi.number().min(-1).max(1).optional()
            .messages({
                'number.min': 'Il cambiamento settimanale deve essere maggiore di -1 kg',
                'number.max': 'Il cambiamento settimanale deve essere minore di 1 kg'
            }),
        target_date: Joi.date().iso().min('now').optional()
            .messages({
                'date.base': 'La data obiettivo deve essere una data valida',
                'date.min': 'La data obiettivo deve essere futura'
            }),
        // Campi opzionali per override dei valori calcolati
        calories_target: Joi.number().positive().optional(),
        proteins_target: Joi.number().positive().optional(),
        carbs_target: Joi.number().positive().optional(),
        fats_target: Joi.number().positive().optional(),
        fiber_target: Joi.number().positive().optional(),
        water_target: Joi.number().positive().optional()
    }),

    // Schema per l'aggiornamento di un obiettivo nutrizionale
    updateNutritionGoal: Joi.object({
        goal_type: Joi.string().valid('weight_loss', 'maintain', 'muscle_gain').optional(),
        target_weight: Joi.number().positive().optional(),
        weekly_weight_change: Joi.number().min(-1).max(1).optional(),
        target_date: Joi.date().iso().min('now').optional(),
        calories_target: Joi.number().positive().optional(),
        proteins_target: Joi.number().positive().optional(),
        carbs_target: Joi.number().positive().optional(),
        fats_target: Joi.number().positive().optional(),
        fiber_target: Joi.number().positive().optional(),
        water_target: Joi.number().positive().optional(),
        is_active: Joi.boolean().optional()
    }).min(1) // Almeno un campo deve essere presente
        .messages({
            'object.min': 'Fornire almeno un campo da aggiornare'
        })
};

module.exports = nutritionSchemas;
