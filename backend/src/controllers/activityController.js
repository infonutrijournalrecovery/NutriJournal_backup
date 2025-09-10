const Activity = require('../models/Activity');
const { ValidationError, NotFoundError, UnauthorizedError } = require('../middleware/errorHandler');
const { logger } = require('../middleware/logging');
const { validate } = require('../utils/validation');
const { startTransaction } = require('../utils/database');

/**
 * Controller per la gestione delle attività fisiche
 * @class ActivityController
 */
class ActivityController {
    /**
     * Crea una nuova istanza del controller
     * @param {Object} database - Istanza del database
     */
    constructor(database) {
        this.activityModel = new Activity(database);
    }

    /**
     * Crea una nuova attività fisica
     * @param {Object} req - Request object
     * @param {Object} res - Response object
     * @param {Function} next - Next middleware function
     */
    async createActivity(req, res, next) {
        try {
            const { 
                type, name, duration, calories_burned, 
                met_value, distance, notes, date, start_time 
            } = req.body;

            // Validazione campi obbligatori
            if (!name || !name.trim()) {
                throw new ValidationError('Nome attività obbligatorio');
            }
            if (!type || !type.trim()) {
                throw new ValidationError('Tipo attività obbligatorio');
            }
            
            // Verifica che il tipo di attività sia valido
            let isValidType = false;
            for (const category of Object.values(this.activityModel.ACTIVITY_TYPES)) {
                if (type in category) {
                    isValidType = true;
                    break;
                }
            }
            if (!isValidType) {
                throw new ValidationError('Tipo attività non valido');
            }

            if (!duration || isNaN(duration) || duration <= 0) {
                throw new ValidationError('Durata deve essere un numero positivo');
            }

            // Validazione campi opzionali numerici
            if (calories_burned !== undefined && (isNaN(calories_burned) || calories_burned < 0)) {
                throw new ValidationError('Calorie bruciate deve essere un numero non negativo');
            }
            if (distance !== undefined && (isNaN(distance) || distance < 0)) {
                throw new ValidationError('Distanza deve essere un numero non negativo');
            }

            // Validazione data
            const currentDate = new Date().toISOString().split('T')[0];
            if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
                throw new ValidationError('Data non valida (formato richiesto: YYYY-MM-DD)');
            }

            logger.info('Creazione nuova attività', {
                userId: req.user.id,
                type,
                name
            });

            // Calcola automaticamente le calorie se non specificate
            let calculatedCalories = calories_burned;
            if (calculatedCalories === undefined) {
                calculatedCalories = this.activityModel.calculateCalories(type, duration);
            }

            const activity = await this.activityModel.create(
                req.user.id,
                {
                    type,
                    name,
                    duration_minutes: duration,
                    calories_burned: calculatedCalories,
                    distance_km: distance,
                    date: date || currentDate
                }
            );

            res.status(201).json({
                success: true,
                message: 'Attività creata con successo',
                data: { 
                    activity,
                    timestamp: new Date().toISOString()
                }
            });

            logger.info('Attività creata con successo', {
                userId: req.user.id,
                activityId: activity.id,
                type,
                duration
            });
        } catch (error) {
            logger.error('Errore creazione attività', {
                userId: req.user.id,
                error: error.message,
                data: req.body
            });
            next(error);
        }
    }

    /**
     * Recupera le attività dell'utente con filtri e paginazione
     * @param {Object} req - Request object
     * @param {Object} res - Response object
     * @param {Function} next - Next middleware function
     */
    async getActivities(req, res, next) {
        try {
            const { 
                date, type, 
                limit = 50, offset = 0,
                sort_by = 'date', sort_order = 'desc'
            } = req.query;

            // Validazione parametri
            if (limit && (isNaN(limit) || limit < 1 || limit > 100)) {
                throw new ValidationError('Limite non valido (deve essere tra 1 e 100)');
            }
            if (offset && (isNaN(offset) || offset < 0)) {
                throw new ValidationError('Offset non valido');
            }
            if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
                throw new ValidationError('Data non valida (formato richiesto: YYYY-MM-DD)');
            }

            const filters = { user_id: req.user.id };
            if (date) filters.date = date;
            if (type) filters.type = type;

            logger.info('Richiesta lista attività', {
                userId: req.user.id,
                filters,
                pagination: { limit, offset }
            });

            const activities = await this.activityModel.getByUser(
                req.user.id,
                {
                    ...filters,
                    limit: parseInt(limit),
                    offset: parseInt(offset)
                }
            );

            const total = await this.activityModel.countByUser(req.user.id, filters);

            // Calcola statistiche se richieste per una data specifica
            let stats = null;
            if (date) {
                stats = {
                    total_duration: activities.reduce((sum, act) => sum + (act.duration || 0), 0),
                    total_calories: activities.reduce((sum, act) => sum + (act.calories_burned || 0), 0),
                    total_distance: activities.reduce((sum, act) => sum + (act.distance || 0), 0),
                    activity_count: activities.length
                };
            }

            res.json({
                success: true,
                data: {
                    activities,
                    stats,
                    pagination: {
                        total,
                        limit: parseInt(limit),
                        offset: parseInt(offset),
                        hasMore: total > parseInt(offset) + activities.length
                    },
                    timestamp: new Date().toISOString()
                }
            });

            logger.info('Lista attività recuperata', {
                userId: req.user.id,
                activityCount: activities.length,
                total,
                hasStats: !!stats
            });
        } catch (error) {
            logger.error('Errore recupero lista attività', {
                userId: req.user.id,
                error: error.message,
                query: req.query
            });
            next(error);
        }
    }

    /**
     * Recupera i dettagli di una specifica attività
     * @param {Object} req - Request object
     * @param {Object} res - Response object
     * @param {Function} next - Next middleware function
     */
    async getActivityById(req, res, next) {
        try {
            const { activityId } = req.params;

            if (!activityId || !/^\d+$/.test(activityId)) {
                throw new ValidationError('ID attività non valido');
            }

            logger.info('Richiesta dettagli attività', {
                userId: req.user.id,
                activityId
            });

            const activity = await this.activityModel.findById(activityId);

            if (!activity) {
                throw new NotFoundError('Attività non trovata');
            }

            if (activity.user_id !== req.user.id) {
                logger.warn('Tentativo accesso non autorizzato', {
                    userId: req.user.id,
                    activityId,
                    ownerUserId: activity.user_id
                });
                throw new UnauthorizedError('Non autorizzato ad accedere a questa attività');
            }

            res.json({
                success: true,
                data: { 
                    activity,
                    timestamp: new Date().toISOString()
                }
            });

            logger.info('Dettagli attività recuperati', {
                userId: req.user.id,
                activityId
            });
        } catch (error) {
            logger.error('Errore recupero dettagli attività', {
                userId: req.user.id,
                activityId: req.params.activityId,
                error: error.message
            });
            next(error);
        }
    }

    /**
     * Aggiorna un'attività esistente
     * @param {Object} req - Request object
     * @param {Object} res - Response object
     * @param {Function} next - Next middleware function
     */
    async updateActivity(req, res, next) {
        try {
            const { activityId } = req.params;

            if (!activityId || !/^\d+$/.test(activityId)) {
                throw new ValidationError('ID attività non valido');
            }

            logger.info('Richiesta aggiornamento attività', {
                userId: req.user.id,
                activityId,
                updateFields: Object.keys(req.body)
            });

            const activity = await this.activityModel.findById(activityId);

            if (!activity) {
                throw new NotFoundError('Attività non trovata');
            }

            if (activity.user_id !== req.user.id) {
                logger.warn('Tentativo modifica non autorizzato', {
                    userId: req.user.id,
                    activityId,
                    ownerUserId: activity.user_id
                });
                throw new UnauthorizedError('Non autorizzato a modificare questa attività');
            }

            // Validazione campi numerici
            if (req.body.duration !== undefined && (isNaN(req.body.duration) || req.body.duration <= 0)) {
                throw new ValidationError('Durata deve essere un numero positivo');
            }
            if (req.body.calories_burned !== undefined && (isNaN(req.body.calories_burned) || req.body.calories_burned < 0)) {
                throw new ValidationError('Calorie bruciate deve essere un numero non negativo');
            }
            if (req.body.met_value !== undefined && (isNaN(req.body.met_value) || req.body.met_value <= 0)) {
                throw new ValidationError('Valore MET deve essere un numero positivo');
            }
            if (req.body.distance !== undefined && (isNaN(req.body.distance) || req.body.distance < 0)) {
                throw new ValidationError('Distanza deve essere un numero non negativo');
            }

            // Validazione date e orari
            if (req.body.date && !/^\d{4}-\d{2}-\d{2}$/.test(req.body.date)) {
                throw new ValidationError('Data non valida (formato richiesto: YYYY-MM-DD)');
            }
            if (req.body.start_time && !/^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/.test(req.body.start_time)) {
                throw new ValidationError('Ora non valida (formato richiesto: HH:MM:SS)');
            }

            const updatedActivity = await this.activityModel.update(activityId, {
                ...req.body,
                updated_at: new Date().toISOString()
            });

            res.json({
                success: true,
                message: 'Attività aggiornata con successo',
                data: { 
                    activity: updatedActivity,
                    timestamp: new Date().toISOString()
                }
            });

            logger.info('Attività aggiornata con successo', {
                userId: req.user.id,
                activityId
            });
        } catch (error) {
            logger.error('Errore aggiornamento attività', {
                userId: req.user.id,
                activityId: req.params.activityId,
                error: error.message,
                data: req.body
            });
            next(error);
        }
    }

    /**
     * Elimina un'attività
     * @param {Object} req - Request object
     * @param {Object} res - Response object
     * @param {Function} next - Next middleware function
     */
    async deleteActivity(req, res, next) {
        try {
            const { activityId } = req.params;
            logger.info('Richiesta eliminazione attività', {
                userId: req.user.id,
                activityId
            });

            const activity = await this.activityModel.findById(activityId);
            if (!activity) {
                throw new NotFoundError('Attività non trovata');
            }
            if (activity.user_id !== req.user.id) {
                logger.warn('Tentativo eliminazione non autorizzato', {
                    userId: req.user.id,
                    activityId,
                    ownerUserId: activity.user_id
                });
                throw new UnauthorizedError('Non autorizzato a eliminare questa attività');
            }
            await this.activityModel.delete(activityId, req.user.id);
            res.json({
                success: true,
                message: 'Attività eliminata con successo',
                data: {
                    timestamp: new Date().toISOString()
                }
            });
            logger.info('Attività eliminata con successo', {
                userId: req.user.id,
                activityId
            });
        } catch (error) {
            logger.error('Errore eliminazione attività', {
                userId: req.user.id,
                activityId: req.params.activityId,
                error: error.message
            });
            next(error);
        }
    }

    /**
     * Recupera le statistiche delle attività per un periodo
     * @param {Object} req - Request object
     * @param {Object} res - Response object
     * @param {Function} next - Next middleware function
     */
    async getStats(req, res, next) {
        try {
            const { start_date, end_date, type } = req.query;

            // Validazione date
            if (!start_date || !/^\d{4}-\d{2}-\d{2}$/.test(start_date)) {
                throw new ValidationError('Data inizio non valida (formato richiesto: YYYY-MM-DD)');
            }
            if (end_date && !/^\d{4}-\d{2}-\d{2}$/.test(end_date)) {
                throw new ValidationError('Data fine non valida (formato richiesto: YYYY-MM-DD)');
            }

            logger.info('Richiesta statistiche attività', {
                userId: req.user.id,
                startDate: start_date,
                endDate: end_date,
                type
            });

            const stats = await this.activityModel.getStats(
                req.user.id,
                start_date,
                end_date || start_date,
                type
            );

            res.json({
                success: true,
                data: { 
                    stats,
                    period: {
                        start_date,
                        end_date: end_date || start_date
                    },
                    timestamp: new Date().toISOString()
                }
            });

            logger.info('Statistiche attività recuperate', {
                userId: req.user.id,
                period: `${start_date} - ${end_date || start_date}`,
                type
            });
        } catch (error) {
            logger.error('Errore recupero statistiche', {
                userId: req.user.id,
                error: error.message,
                query: req.query
            });
            next(error);
        }
    }

    /**
     * Recupera il report settimanale delle attività
     * @param {Object} req - Request object
     * @param {Object} res - Response object
     * @param {Function} next - Next middleware function
     */
    async getWeeklyReport(req, res, next) {
        try {
            const { date } = req.query;
            if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
                throw new ValidationError('Data non valida (formato richiesto: YYYY-MM-DD)');
            }

            const report = await this.activityModel.getWeeklyReport(req.user.id, date);
            
            res.json({
                success: true,
                data: {
                    ...report,
                    timestamp: new Date().toISOString()
                }
            });

            logger.info('Report settimanale recuperato', {
                userId: req.user.id,
                period: report.period
            });
        } catch (error) {
            logger.error('Errore recupero report settimanale', {
                userId: req.user.id,
                error: error.message
            });
            next(error);
        }
    }

    /**
     * Recupera il report mensile delle attività
     * @param {Object} req - Request object
     * @param {Object} res - Response object
     * @param {Function} next - Next middleware function
     */
    async getMonthlyReport(req, res, next) {
        try {
            const { date } = req.query;
            if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
                throw new ValidationError('Data non valida (formato richiesto: YYYY-MM-DD)');
            }

            const report = await this.activityModel.getMonthlyReport(req.user.id, date);
            
            res.json({
                success: true,
                data: {
                    ...report,
                    timestamp: new Date().toISOString()
                }
            });

            logger.info('Report mensile recuperato', {
                userId: req.user.id,
                period: report.period
            });
        } catch (error) {
            logger.error('Errore recupero report mensile', {
                userId: req.user.id,
                error: error.message
            });
            next(error);
        }
    }

    /**
     * Recupera il report trimestrale delle attività
     * @param {Object} req - Request object
     * @param {Object} res - Response object
     * @param {Function} next - Next middleware function
     */
    async getQuarterlyReport(req, res, next) {
        try {
            const { date } = req.query;
            if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
                throw new ValidationError('Data non valida (formato richiesto: YYYY-MM-DD)');
            }

            const report = await this.activityModel.getQuarterlyReport(req.user.id, date);
            
            res.json({
                success: true,
                data: {
                    ...report,
                    timestamp: new Date().toISOString()
                }
            });

            logger.info('Report trimestrale recuperato', {
                userId: req.user.id,
                period: report.period
            });
        } catch (error) {
            logger.error('Errore recupero report trimestrale', {
                userId: req.user.id,
                error: error.message
            });
            next(error);
        }
    }
}

module.exports = ActivityController;
