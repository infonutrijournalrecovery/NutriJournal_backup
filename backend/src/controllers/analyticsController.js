const Analytics = require('../models/Analytics');

class AnalyticsController {
    constructor(database) {
        this.analyticsModel = new Analytics(database);
    }

    // Dashboard principale
    async getDashboard(req, res) {
        try {
            const userId = req.user.id;
            const { days = 30 } = req.query;

            const dashboard = await this.analyticsModel.getDashboard(userId, parseInt(days));

            res.json({
                success: true,
                data: dashboard
            });

        } catch (error) {
            console.error('❌ Errore dashboard analytics:', error);
            res.status(500).json({
                success: false,
                message: 'Errore interno del server',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }

    // Trend nutrizionali
    async getNutritionTrends(req, res) {
        try {
            const userId = req.user.id;
            const {
                date_from = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                date_to = new Date().toISOString().split('T')[0]
            } = req.query;

            const trends = await this.analyticsModel.getNutritionTrends(userId, date_from, date_to);

            res.json({
                success: true,
                data: {
                    period: { date_from, date_to },
                    trends,
                    count: trends.length
                }
            });

        } catch (error) {
            console.error('❌ Errore trend nutrizionali:', error);
            res.status(500).json({
                success: false,
                message: 'Errore interno del server'
            });
        }
    }

    // Statistiche nutrizionali aggregate
    async getNutritionStats(req, res) {
        try {
            const userId = req.user.id;
            const {
                date_from = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                date_to = new Date().toISOString().split('T')[0]
            } = req.query;

            const stats = await this.analyticsModel.getNutritionStats(userId, date_from, date_to);

            res.json({
                success: true,
                data: {
                    period: { date_from, date_to },
                    stats
                }
            });

        } catch (error) {
            console.error('❌ Errore statistiche nutrizionali:', error);
            res.status(500).json({
                success: false,
                message: 'Errore interno del server'
            });
        }
    }

    // Progresso verso obiettivi
    async getGoalProgress(req, res) {
        try {
            const userId = req.user.id;
            const {
                date_from = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                date_to = new Date().toISOString().split('T')[0]
            } = req.query;

            const progress = await this.analyticsModel.getGoalProgress(userId, date_from, date_to);

            res.json({
                success: true,
                data: {
                    period: { date_from, date_to },
                    daily_progress: progress
                }
            });

        } catch (error) {
            console.error('❌ Errore progresso obiettivi:', error);
            res.status(500).json({
                success: false,
                message: 'Errore interno del server'
            });
        }
    }

    // Analisi settimanale
    async getWeeklyAnalysis(req, res) {
        try {
            const userId = req.user.id;
            const { week_start } = req.query;

            let weekStartDate;
            if (week_start) {
                weekStartDate = new Date(week_start);
            } else {
                // Inizio settimana corrente (lunedì)
                const today = new Date();
                const day = today.getDay();
                const diff = today.getDate() - day + (day === 0 ? -6 : 1);
                weekStartDate = new Date(today.setDate(diff));
            }

            const analysis = await this.analyticsModel.getWeeklyAnalysis(userId, weekStartDate);

            res.json({
                success: true,
                data: analysis
            });

        } catch (error) {
            console.error('❌ Errore analisi settimanale:', error);
            res.status(500).json({
                success: false,
                message: 'Errore interno del server'
            });
        }
    }

    // Analisi mensile
    async getMonthlyAnalysis(req, res) {
        try {
            const userId = req.user.id;
            const {
                year = new Date().getFullYear(),
                month = new Date().getMonth() + 1
            } = req.query;

            const analysis = await this.analyticsModel.getMonthlyAnalysis(
                userId, 
                parseInt(year), 
                parseInt(month)
            );

            res.json({
                success: true,
                data: analysis
            });

        } catch (error) {
            console.error('❌ Errore analisi mensile:', error);
            res.status(500).json({
                success: false,
                message: 'Errore interno del server'
            });
        }
    }

    // Confronto tra periodi
    async comparePeriods(req, res) {
        try {
            const userId = req.user.id;
            const {
                period1_start,
                period1_end,
                period2_start,
                period2_end
            } = req.query;

            if (!period1_start || !period1_end || !period2_start || !period2_end) {
                return res.status(400).json({
                    success: false,
                    message: 'Tutti i parametri di data sono richiesti'
                });
            }

            const comparison = await this.analyticsModel.comparePeriods(
                userId,
                period1_start,
                period1_end,
                period2_start,
                period2_end
            );

            res.json({
                success: true,
                data: comparison
            });

        } catch (error) {
            console.error('❌ Errore confronto periodi:', error);
            res.status(500).json({
                success: false,
                message: 'Errore interno del server'
            });
        }
    }

    // Aggiorna trend nutrizionale per oggi
    async updateTodayNutrition(req, res) {
        try {
            const userId = req.user.id;
            const today = new Date().toISOString().split('T')[0];
            const nutritionData = req.body;

            await this.analyticsModel.updateNutritionTrend(userId, today, nutritionData);

            res.json({
                success: true,
                message: 'Trend nutrizionale aggiornato',
                date: today
            });

        } catch (error) {
            console.error('❌ Errore aggiornamento trend:', error);
            res.status(500).json({
                success: false,
                message: 'Errore interno del server'
            });
        }
    }

    // Salva metrica personalizzata
    async saveCustomMetric(req, res) {
        try {
            const userId = req.user.id;
            const {
                metric_type,
                metric_name,
                value,
                unit,
                date,
                metadata
            } = req.body;

            if (!metric_type || !metric_name || value === undefined) {
                return res.status(400).json({
                    success: false,
                    message: 'Tipo metrica, nome e valore sono richiesti'
                });
            }

            const result = await this.analyticsModel.saveMetric(
                userId,
                metric_type,
                metric_name,
                value,
                unit,
                date,
                metadata
            );

            res.status(201).json({
                success: true,
                message: 'Metrica salvata con successo',
                data: { id: result.lastID }
            });

        } catch (error) {
            console.error('❌ Errore salvataggio metrica:', error);
            res.status(500).json({
                success: false,
                message: 'Errore interno del server'
            });
        }
    }

    // Ottieni metriche personalizzate
    async getCustomMetrics(req, res) {
        try {
            const userId = req.user.id;
            const {
                metric_type,
                date_from,
                date_to
            } = req.query;

            const metrics = await this.analyticsModel.getMetrics(
                userId,
                metric_type,
                date_from,
                date_to
            );

            res.json({
                success: true,
                data: {
                    filters: { metric_type, date_from, date_to },
                    metrics,
                    count: metrics.length
                }
            });

        } catch (error) {
            console.error('❌ Errore recupero metriche:', error);
            res.status(500).json({
                success: false,
                message: 'Errore interno del server'
            });
        }
    }

    // Report completo per export
    async getFullReport(req, res) {
        try {
            const userId = req.user.id;
            const {
                date_from = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                date_to = new Date().toISOString().split('T')[0],
                format = 'json'
            } = req.query;

            const [
                nutritionTrends,
                nutritionStats,
                goalProgress,
                customMetrics
            ] = await Promise.all([
                this.analyticsModel.getNutritionTrends(userId, date_from, date_to),
                this.analyticsModel.getNutritionStats(userId, date_from, date_to),
                this.analyticsModel.getGoalProgress(userId, date_from, date_to),
                this.analyticsModel.getMetrics(userId, null, date_from, date_to)
            ]);

            const report = {
                user_id: userId,
                generated_at: new Date().toISOString(),
                period: { date_from, date_to },
                summary: nutritionStats,
                daily_trends: nutritionTrends,
                goal_progress: goalProgress,
                custom_metrics: customMetrics,
                total_days: nutritionTrends.length
            };

            if (format === 'csv') {
                // TODO: Implementare export CSV
                return res.status(501).json({
                    success: false,
                    message: 'Export CSV non ancora implementato'
                });
            }

            res.json({
                success: true,
                data: report
            });

        } catch (error) {
            console.error('❌ Errore report completo:', error);
            res.status(500).json({
                success: false,
                message: 'Errore interno del server'
            });
        }
    }

    // Insight automatici
    async getInsights(req, res) {
        try {
            const userId = req.user.id;
            const { days = 30 } = req.query;

            const endDate = new Date();
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - parseInt(days));

            const dateFrom = startDate.toISOString().split('T')[0];
            const dateTo = endDate.toISOString().split('T')[0];

            const [trends, stats] = await Promise.all([
                this.analyticsModel.getNutritionTrends(userId, dateFrom, dateTo),
                this.analyticsModel.getNutritionStats(userId, dateFrom, dateTo)
            ]);

            const insights = [];

            // Insight: Calorie medie vs obiettivo
            if (stats.avg_calories && stats.avg_calories > 0) {
                const caloriesInsight = {
                    type: 'calories',
                    title: 'Consumo Calorico',
                    message: `Negli ultimi ${days} giorni hai consumato in media ${Math.round(stats.avg_calories)} calorie al giorno.`,
                    level: 'info'
                };

                if (trends.length > 0) {
                    const avgGoal = trends.reduce((sum, t) => sum + (t.calories_goal || 0), 0) / trends.length;
                    if (avgGoal > 0) {
                        const diff = stats.avg_calories - avgGoal;
                        const percentDiff = Math.abs(diff / avgGoal * 100);

                        if (percentDiff > 10) {
                            caloriesInsight.level = diff > 0 ? 'warning' : 'info';
                            caloriesInsight.message += ` Questo è ${Math.round(percentDiff)}% ${diff > 0 ? 'sopra' : 'sotto'} il tuo obiettivo medio.`;
                        }
                    }
                }

                insights.push(caloriesInsight);
            }

            // Insight: Trend proteine
            if (stats.avg_proteins && stats.avg_proteins > 0) {
                insights.push({
                    type: 'proteins',
                    title: 'Apporto Proteico',
                    message: `Il tuo apporto medio di proteine è di ${Math.round(stats.avg_proteins)}g al giorno.`,
                    level: stats.avg_proteins >= 50 ? 'success' : 'warning'
                });
            }

            // Insight: Consistenza
            const daysWithData = trends.filter(t => t.calories_consumed > 0).length;
            const consistencyRate = trends.length > 0 ? (daysWithData / trends.length * 100) : 0;

            insights.push({
                type: 'consistency',
                title: 'Consistenza Tracciamento',
                message: `Hai tracciato i tuoi pasti per ${daysWithData} giorni su ${trends.length} (${Math.round(consistencyRate)}%).`,
                level: consistencyRate >= 80 ? 'success' : consistencyRate >= 60 ? 'info' : 'warning'
            });

            res.json({
                success: true,
                data: {
                    period: { days, date_from: dateFrom, date_to: dateTo },
                    insights,
                    insights_count: insights.length
                }
            });

        } catch (error) {
            console.error('❌ Errore insights:', error);
            res.status(500).json({
                success: false,
                message: 'Errore interno del server'
            });
        }
    }
}

module.exports = AnalyticsController;
