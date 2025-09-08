const Joi = require('joi');

const activitySchemas = {
    createActivity: Joi.object({
        name: Joi.string().required().trim().min(1).max(255)
            .messages({
                'string.empty': 'Il nome dell\'attività è obbligatorio',
                'string.min': 'Il nome dell\'attività deve essere di almeno 1 carattere',
                'string.max': 'Il nome dell\'attività non può superare i 255 caratteri'
            }),
        type: Joi.string().required().trim()
            .messages({
                'string.empty': 'Il tipo di attività è obbligatorio'
            }),
        duration_minutes: Joi.number().required().positive().integer()
            .messages({
                'number.base': 'La durata deve essere un numero',
                'number.positive': 'La durata deve essere positiva',
                'number.integer': 'La durata deve essere un numero intero'
            }),
        intensity: Joi.string().valid('low', 'moderate', 'high').default('moderate')
            .messages({
                'any.only': 'Intensità non valida (low/moderate/high)'
            }),
        date: Joi.date().iso().max('now').messages({
            'date.format': 'Data non valida (formato: YYYY-MM-DD)',
            'date.max': 'La data non può essere nel futuro'
        }),
        notes: Joi.string().allow('').max(1000)
            .messages({
                'string.max': 'Le note non possono superare i 1000 caratteri'
            }),
        distance_km: Joi.number().min(0)
            .messages({
                'number.min': 'La distanza deve essere un numero positivo'
            }),
        steps: Joi.number().integer().min(0)
            .messages({
                'number.integer': 'I passi devono essere un numero intero',
                'number.min': 'I passi devono essere un numero positivo'
            }),
        heart_rate_avg: Joi.number().integer().min(30).max(250)
            .messages({
                'number.min': 'Frequenza cardiaca media non valida',
                'number.max': 'Frequenza cardiaca media non valida'
            }),
        heart_rate_max: Joi.number().integer().min(30).max(250)
            .messages({
                'number.min': 'Frequenza cardiaca massima non valida',
                'number.max': 'Frequenza cardiaca massima non valida'
            })
    }),

    updateActivity: Joi.object({
        name: Joi.string().trim().min(1).max(255)
            .messages({
                'string.min': 'Il nome dell\'attività deve essere di almeno 1 carattere',
                'string.max': 'Il nome dell\'attività non può superare i 255 caratteri'
            }),
        type: Joi.string().trim(),
        duration_minutes: Joi.number().positive().integer()
            .messages({
                'number.positive': 'La durata deve essere positiva',
                'number.integer': 'La durata deve essere un numero intero'
            }),
        intensity: Joi.string().valid('low', 'moderate', 'high')
            .messages({
                'any.only': 'Intensità non valida (low/moderate/high)'
            }),
        date: Joi.date().iso().max('now').messages({
            'date.format': 'Data non valida (formato: YYYY-MM-DD)',
            'date.max': 'La data non può essere nel futuro'
        }),
        notes: Joi.string().allow('').max(1000)
            .messages({
                'string.max': 'Le note non possono superare i 1000 caratteri'
            }),
        distance_km: Joi.number().min(0)
            .messages({
                'number.min': 'La distanza deve essere un numero positivo'
            }),
        steps: Joi.number().integer().min(0)
            .messages({
                'number.integer': 'I passi devono essere un numero intero',
                'number.min': 'I passi devono essere un numero positivo'
            }),
        heart_rate_avg: Joi.number().integer().min(30).max(250)
            .messages({
                'number.min': 'Frequenza cardiaca media non valida',
                'number.max': 'Frequenza cardiaca media non valida'
            }),
        heart_rate_max: Joi.number().integer().min(30).max(250)
            .messages({
                'number.min': 'Frequenza cardiaca massima non valida',
                'number.max': 'Frequenza cardiaca massima non valida'
            })
    })
};

module.exports = activitySchemas;
