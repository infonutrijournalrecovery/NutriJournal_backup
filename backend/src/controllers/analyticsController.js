const Analytics = require('../models/Analytics');
const { ValidationError, NotFoundError } = require('../middleware/errorHandler');
const { logger } = require('../middleware/logging');

/**
 * Controller per la gestione delle analitiche e statistiche
 * @class AnalyticsController
 */
class AnalyticsController {
    /**
     * Crea una nuova istanza del controller
     * @param {Object} database - Istanza del database
     */
    constructor(sqliteDb) {
        this.analyticsModel = new Analytics(sqliteDb);
    }

    /**
     * Recupera i dati per la dashboard principale
     * @param {Object} req - Request object
     * @param {Object} res - Response object
     * @param {Function} next - Next middleware function
     */
    async getDashboard(req, res, next) {
    // Log di debug: verifica connessione DB e utente
    console.log('[DEBUG] analyticsController.getDashboard: DB:', this.analyticsModel?.db ? 'OK' : 'NULL');
    console.log('[DEBUG] analyticsController.getDashboard: req.user:', req.user);
        try {
            const userId = req.user.id;
            const { days = 30 } = req.query;

            // Validazione parametri
            const daysNum = parseInt(days);
            if (isNaN(daysNum) || daysNum < 1 || daysNum > 365) {
                throw new ValidationError('Numero di giorni non valido (deve essere tra 1 e 365)');
            }

            logger.info('Richiesta dati dashboard', {
                userId,
                days: daysNum
            });


            const dashboard = await this.analyticsModel.getDashboard(userId, daysNum);
            if (!dashboard || Object.keys(dashboard).length === 0) {
                logger.warn('Dashboard vuota o non disponibile', { userId, days: daysNum });
                return res.status(200).json({ success: true, data: {}, message: 'Nessun dato disponibile per la dashboard', empty: true });
            }

            res.json({
                success: true,
                data: {
                    ...dashboard,
                    period: {
                        days: daysNum,
                        start_date: new Date(Date.now() - daysNum * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                        end_date: new Date().toISOString().split('T')[0]
                    },
                    timestamp: new Date().toISOString()
                }
            });

            logger.info('Dati dashboard recuperati', {
                userId,
                days: daysNum,
                hasData: !!dashboard
            });
        } catch (error) {
            logger.error('Errore recupero dati dashboard', {
                userId: req.user.id,
                error: error.message,
                query: req.query
            });
            next(error);
        }
    }

    /**
     * Recupera i trend nutrizionali per un periodo
     * @param {Object} req - Request object
     * @param {Object} res - Response object
     * @param {Function} next - Next middleware function
     */
    async getNutritionTrends(req, res, next) {
        try {
            const userId = req.user.id;
            const {
                date_from = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                date_to = new Date().toISOString().split('T')[0],
                group_by = 'day'
            } = req.query;

            // Validazione date
            if (!/^\d{4}-\d{2}-\d{2}$/.test(date_from)) {
                throw new ValidationError('Data inizio non valida (formato richiesto: YYYY-MM-DD)');
            }
            if (!/^\d{4}-\d{2}-\d{2}$/.test(date_to)) {
                throw new ValidationError('Data fine non valida (formato richiesto: YYYY-MM-DD)');
            }

            // Validazione periodo
            const startDate = new Date(date_from);
            const endDate = new Date(date_to);
            if (startDate > endDate) {
                throw new ValidationError('Data inizio deve essere precedente alla data fine');
            }
            if (endDate > new Date()) {
                throw new ValidationError('Data fine non può essere nel futuro');
            }

            // Validazione raggruppamento
            if (!['day', 'week', 'month'].includes(group_by)) {
                throw new ValidationError('Tipo di raggruppamento non valido (valori ammessi: day, week, month)');
            }

            logger.info('Richiesta trend nutrizionali', {
                userId,
                period: { date_from, date_to },
                groupBy: group_by
            });

            const trends = await this.analyticsModel.getNutritionTrends(
                userId, 
                date_from, 
                date_to,
                group_by
            );

            res.json({
                success: true,
                data: {
                    period: { date_from, date_to },
                    group_by,
                    trends,
                    count: trends.length,
                    timestamp: new Date().toISOString()
                }
            });

            logger.info('Trend nutrizionali recuperati', {
                userId,
                period: `${date_from} - ${date_to}`,
                trendCount: trends.length
            });
        } catch (error) {
            logger.error('Errore recupero trend nutrizionali', {
                userId: req.user.id,
                error: error.message,
                query: req.query
            });
            next(error);
        }
    }

    /**
     * Recupera il progresso degli obiettivi per un periodo
     * @param {Object} req - Request object
     * @param {Object} res - Response object
     * @param {Function} next - Next middleware function
     */
    async getGoalsProgress(req, res, next) {
        try {
            const userId = req.user.id;
            const {
                date_from = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                date_to = new Date().toISOString().split('T')[0]
            } = req.query;

            // Validazione date
            if (!/^\d{4}-\d{2}-\d{2}$/.test(date_from)) {
                throw new ValidationError('Data inizio non valida (formato richiesto: YYYY-MM-DD)');
            }
            if (!/^\d{4}-\d{2}-\d{2}$/.test(date_to)) {
                throw new ValidationError('Data fine non valida (formato richiesto: YYYY-MM-DD)');
            }

            // Validazione periodo
            const startDate = new Date(date_from);
            const endDate = new Date(date_to);
            if (startDate > endDate) {
                throw new ValidationError('Data inizio deve essere precedente alla data fine');
            }
            if (endDate > new Date()) {
                throw new ValidationError('Data fine non può essere nel futuro');
            }

            logger.info('Richiesta progresso obiettivi', {
                userId,
                period: { date_from, date_to }
            });

            const progress = await this.analyticsModel.getGoalsProgress(userId, date_from, date_to);

            res.json({
                success: true,
                data: {
                    period: { date_from, date_to },
                    daily_progress: progress,
                    summary: this.calculateProgressSummary(progress),
                    timestamp: new Date().toISOString()
                }
            });

            logger.info('Progresso obiettivi recuperato', {
                userId,
                period: `${date_from} - ${date_to}`,
                daysCount: progress.length
            });
        } catch (error) {
            logger.error('Errore recupero progresso obiettivi', {
                userId: req.user.id,
                error: error.message,
                query: req.query
            });
            next(error);
        }
    }

    /**
     * Recupera l'analisi settimanale
     * @param {Object} req - Request object
     * @param {Object} res - Response object
     * @param {Function} next - Next middleware function
     */
    async getWeeklyAnalysis(req, res, next) {
        try {
            const userId = req.user.id;
            const { week_start } = req.query;

            let weekStartDate;
            if (week_start) {
                // Validazione data
                if (!/^\d{4}-\d{2}-\d{2}$/.test(week_start)) {
                    throw new ValidationError('Data inizio settimana non valida (formato richiesto: YYYY-MM-DD)');
                }
                weekStartDate = new Date(week_start);
            } else {
                // Inizio settimana corrente (lunedì)
                const today = new Date();
                const day = today.getDay();
                const diff = today.getDate() - day + (day === 0 ? -6 : 1);
                weekStartDate = new Date(today.setDate(diff));
            }

            // Calcola fine settimana
            const weekEndDate = new Date(weekStartDate);
            weekEndDate.setDate(weekEndDate.getDate() + 6);

            logger.info('Richiesta analisi settimanale', {
                userId,
                weekStart: weekStartDate.toISOString().split('T')[0],
                weekEnd: weekEndDate.toISOString().split('T')[0]
            });

            const analysis = await this.analyticsModel.getWeeklyAnalysis(userId, weekStartDate);

            res.json({
                success: true,
                data: {
                    ...analysis,
                    period: {
                        week_start: weekStartDate.toISOString().split('T')[0],
                        week_end: weekEndDate.toISOString().split('T')[0]
                    },
                    timestamp: new Date().toISOString()
                }
            });

            logger.info('Analisi settimanale recuperata', {
                userId,
                weekStart: weekStartDate.toISOString().split('T')[0],
                hasData: !!analysis
            });
        } catch (error) {
            logger.error('Errore analisi settimanale', {
                userId: req.user.id,
                error: error.message,
                query: req.query
            });
            next(error);
        }
    }

    /**
     * Recupera l'analisi mensile
     * @param {Object} req - Request object
     * @param {Object} res - Response object
     * @param {Function} next - Next middleware function
     */
    async getMonthlyAnalysis(req, res, next) {
        try {
            const userId = req.user.id;
            const { month, year = new Date().getFullYear() } = req.query;

            // Validazione parametri
            const yearNum = parseInt(year);
            if (isNaN(yearNum) || yearNum < 2000 || yearNum > 2100) {
                throw new ValidationError('Anno non valido');
            }

            let monthNum = month ? parseInt(month) : new Date().getMonth() + 1;
            if (isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
                throw new ValidationError('Mese non valido (deve essere tra 1 e 12)');
            }

            const monthStart = new Date(yearNum, monthNum - 1, 1);
            const monthEnd = new Date(yearNum, monthNum, 0);

            logger.info('Richiesta analisi mensile', {
                userId,
                year: yearNum,
                month: monthNum
            });

            const analysis = await this.analyticsModel.getMonthlyAnalysis(userId, monthStart);

            res.json({
                success: true,
                data: {
                    ...analysis,
                    period: {
                        year: yearNum,
                        month: monthNum,
                        month_start: monthStart.toISOString().split('T')[0],
                        month_end: monthEnd.toISOString().split('T')[0]
                    },
                    timestamp: new Date().toISOString()
                }
            });

            logger.info('Analisi mensile recuperata', {
                userId,
                period: `${yearNum}-${monthNum}`,
                hasData: !!analysis
            });
        } catch (error) {
            logger.error('Errore analisi mensile', {
                userId: req.user.id,
                error: error.message,
                query: req.query
            });
            next(error);
        }
    }

    /**
     * Calcola il riepilogo del progresso
     * @private
     * @param {Array} progress - Array di progressi giornalieri
     * @returns {Object} Riepilogo del progresso
     */
    calculateProgressSummary(progress) {
        if (!progress || !progress.length) return null;

        const summary = {
            total_days: progress.length,
            goals_met: 0,
            calories_avg: 0,
            proteins_avg: 0,
            carbs_avg: 0,
            fats_avg: 0
        };

        progress.forEach(day => {
            if (day.goals_met) summary.goals_met++;
            summary.calories_avg += day.calories || 0;
            summary.proteins_avg += day.proteins || 0;
            summary.carbs_avg += day.carbohydrates || 0;
            summary.fats_avg += day.fats || 0;
        });

        // Calcola medie
        summary.calories_avg = Math.round(summary.calories_avg / progress.length);
        summary.proteins_avg = Math.round(summary.proteins_avg / progress.length);
        summary.carbs_avg = Math.round(summary.carbs_avg / progress.length);
        summary.fats_avg = Math.round(summary.fats_avg / progress.length);
        summary.success_rate = Math.round((summary.goals_met / progress.length) * 100);

        return summary;
    }
}

module.exports = AnalyticsController;
