const Activity = require('../models/Activity');
const { ValidationError, NotFoundError } = require('../middleware/errorHandler');
const { validate } = require('../utils/validation');

class ActivityController {
    constructor(database) {
        this.activityModel = new Activity(database);
    }

    // Crea nuova attività
    async createActivity(req, res) {
        try {
            // Validazione con Joi viene gestita nel middleware validate()
            const { 
                type, name, duration, calories_burned, 
                met_value, distance, notes, date, start_time 
            } = req.body;

            const activity = await this.activityModel.create({
                user_id: req.user.id,
                type,
                name,
                duration,
                calories_burned,
                met_value,
                distance,
                notes,
                date: date || new Date().toISOString().split('T')[0],
                start_time: start_time || new Date().toISOString().split('T')[1].substring(0, 8),
                created_at: new Date().toISOString()
            });

            res.status(201).json({
                success: true,
                message: 'Attività creata con successo',
                data: { activity }
            });
        } catch (error) {
            throw error;
        }
    }

    // Ottieni tutte le attività dell'utente
    async getActivities(req, res) {
        try {
            const { 
                date, 
                type, 
                limit = 50, 
                offset = 0,
                sort_by = 'date',
                sort_order = 'desc'
            } = req.query;

            const filters = { user_id: req.user.id };
            if (date) filters.date = date;
            if (type) filters.type = type;

            const activities = await this.activityModel.findByUser(
                req.user.id, 
                filters, 
                parseInt(limit), 
                parseInt(offset),
                sort_by,
                sort_order
            );

            const total = await this.activityModel.countByUser(req.user.id, filters);

            res.json({
                success: true,
                data: {
                    activities,
                    pagination: {
                        total,
                        limit: parseInt(limit),
                        offset: parseInt(offset),
                        hasMore: total > parseInt(offset) + activities.length
                    }
                }
            });
        } catch (error) {
            throw error;
        }
    }

    // Ottieni attività per ID
    async getActivityById(req, res) {
        try {
            const { activityId } = req.params;
            const activity = await this.activityModel.findById(activityId);

            if (!activity) {
                throw new NotFoundError('Attività non trovata');
            }

            if (activity.user_id !== req.user.id) {
                throw new ValidationError('Non autorizzato ad accedere a questa attività');
            }

            res.json({
                success: true,
                data: { activity }
            });
        } catch (error) {
            throw error;
        }
    }

    // Aggiorna attività
    async updateActivity(req, res) {
        try {
            const { activityId } = req.params;
            const activity = await this.activityModel.findById(activityId);

            if (!activity) {
                throw new NotFoundError('Attività non trovata');
            }

            if (activity.user_id !== req.user.id) {
                throw new ValidationError('Non autorizzato a modificare questa attività');
            }

            const updatedActivity = await this.activityModel.update(activityId, req.body);

            res.json({
                success: true,
                message: 'Attività aggiornata con successo',
                data: { activity: updatedActivity }
            });
        } catch (error) {
            throw error;
        }
    }

    // Elimina attività
    async deleteActivity(req, res) {
        try {
            const { activityId } = req.params;
            const activity = await this.activityModel.findById(activityId);

            if (!activity) {
                throw new NotFoundError('Attività non trovata');
            }

            if (activity.user_id !== req.user.id) {
                throw new ValidationError('Non autorizzato a eliminare questa attività');
            }

            await this.activityModel.delete(activityId);

            res.json({
                success: true,
                message: 'Attività eliminata con successo'
            });
        } catch (error) {
            throw error;
        }
    }

    // Ottieni statistiche attività per periodo
    async getActivityStats(req, res) {
        try {
            const { 
                start_date = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                end_date = new Date().toISOString().split('T')[0],
                type
            } = req.query;

            const stats = await this.activityModel.getStatsByPeriod(
                req.user.id, 
                start_date, 
                end_date, 
                type
            );

            res.json({
                success: true,
                data: {
                    stats,
                    period: { start_date, end_date }
                }
            });
        } catch (error) {
            throw error;
        }
    }

    // Ottieni attività per data specifica
    async getActivitiesByDate(req, res) {
        try {
            const { date } = req.params;
            const activities = await this.activityModel.findByDate(req.user.id, date);

            res.json({
                success: true,
                data: {
                    activities,
                    date,
                    total_activities: activities.length,
                    total_calories: activities.reduce((sum, activity) => sum + (activity.calories_burned || 0), 0),
                    total_duration: activities.reduce((sum, activity) => sum + (activity.duration || 0), 0)
                }
            });
        } catch (error) {
            throw error;
        }
    }

    // Duplica attività
    async duplicateActivity(req, res) {
        try {
            const { activityId } = req.params;
            const { date, start_time } = req.body;

            const originalActivity = await this.activityModel.findById(activityId);

            if (!originalActivity) {
                throw new NotFoundError('Attività non trovata');
            }

            if (originalActivity.user_id !== req.user.id) {
                throw new ValidationError('Non autorizzato a duplicare questa attività');
            }

            const duplicatedActivity = await this.activityModel.create({
                ...originalActivity,
                id: undefined, // Rimuovi ID per crearne uno nuovo
                date: date || new Date().toISOString().split('T')[0],
                start_time: start_time || new Date().toISOString().split('T')[1].substring(0, 8),
                created_at: new Date().toISOString()
            });

            res.status(201).json({
                success: true,
                message: 'Attività duplicata con successo',
                data: { activity: duplicatedActivity }
            });
        } catch (error) {
            throw error;
        }
    }
}

module.exports = ActivityController;
