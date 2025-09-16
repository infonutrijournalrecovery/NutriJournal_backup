const sqlite3 = require('sqlite3');

class Analytics {
    constructor(database) {
        this.db = database;
    }

    // Inizializza tabelle analytics
    async initialize() {
        // Tabella per analytics generali
        const analyticsTableSql = `
            CREATE TABLE IF NOT EXISTS analytics (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                metric_type VARCHAR(50) NOT NULL,
                metric_name VARCHAR(100) NOT NULL,
                value DECIMAL(10,2) NOT NULL,
                unit VARCHAR(20),
                date DATE NOT NULL,
                period VARCHAR(20) DEFAULT 'daily',
                metadata TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
            )
        `;

        // Tabella per trend nutrizionali
        const nutritionTrendsSql = `
            CREATE TABLE IF NOT EXISTS nutrition_trends (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                date DATE NOT NULL,
                calories_consumed DECIMAL(8,2) DEFAULT 0,
                calories_goal DECIMAL(8,2) DEFAULT 0,
                calories_burned DECIMAL(8,2) DEFAULT 0,
                proteins_consumed DECIMAL(8,2) DEFAULT 0,
                proteins_goal DECIMAL(8,2) DEFAULT 0,
                carbs_consumed DECIMAL(8,2) DEFAULT 0,
                carbs_goal DECIMAL(8,2) DEFAULT 0,
                fats_consumed DECIMAL(8,2) DEFAULT 0,
                fats_goal DECIMAL(8,2) DEFAULT 0,
                fiber_consumed DECIMAL(8,2) DEFAULT 0,
                water_consumed DECIMAL(8,2) DEFAULT 0,
                meals_count INTEGER DEFAULT 0,
                activities_count INTEGER DEFAULT 0,
                weight_kg DECIMAL(5,2),
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
                UNIQUE(user_id, date)
            )
        `;

        try {
            await this.runQuery(analyticsTableSql);
            console.log('✅ Tabella analytics creata/verificata');
            
            await this.runQuery(nutritionTrendsSql);
            console.log('✅ Tabella nutrition_trends creata/verificata');
            
        } catch (error) {
            console.error('❌ Errore creazione tabelle analytics:', error);
            throw error;
        }
    }

    // Helper per eseguire query con Promise
    runQuery(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.run(sql, params, function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({ lastID: this.lastID, changes: this.changes });
                }
            });
        });
    }

    // Helper per query SELECT
    getAllQuery(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.all(sql, params, (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows || []);
                }
            });
        });
    }

    // Aggiorna dati nutrizionali giornalieri
    async updateNutritionTrend(userId, date, nutritionData) {
        const {
            calories_consumed = 0,
            calories_goal = 0,
            calories_burned = 0,
            proteins_consumed = 0,
            proteins_goal = 0,
            carbs_consumed = 0,
            carbs_goal = 0,
            fats_consumed = 0,
            fats_goal = 0,
            fiber_consumed = 0,
            water_consumed = 0,
            meals_count = 0,
            activities_count = 0,
            weight_kg = null
        } = nutritionData;

        const sql = `
            INSERT OR REPLACE INTO nutrition_trends (
                user_id, date, calories_consumed, calories_goal, calories_burned,
                proteins_consumed, proteins_goal, carbs_consumed, carbs_goal,
                fats_consumed, fats_goal, fiber_consumed, water_consumed,
                meals_count, activities_count, weight_kg, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        `;
        const params = [
            userId, date, calories_consumed, calories_goal, calories_burned,
            proteins_consumed, proteins_goal, carbs_consumed, carbs_goal,
            fats_consumed, fats_goal, fiber_consumed, water_consumed,
            meals_count, activities_count, weight_kg
        ];
        // Logging dettagliato
        console.log('[DEBUG][Analytics.updateNutritionTrend] SQL:', sql);
        console.log('[DEBUG][Analytics.updateNutritionTrend] Params:', params);
        try {
            const result = await this.runQuery(sql, params);
            console.log('[DEBUG][Analytics.updateNutritionTrend] Result:', result);
            return result;
        } catch (err) {
            console.error('[ERROR][Analytics.updateNutritionTrend]', err);
            throw err;
        }
    }

    // Ottieni trend nutrizionali per periodo
    async getNutritionTrends(userId, dateFrom, dateTo) {
        const sql = `
            SELECT * FROM nutrition_trends 
            WHERE user_id = ? 
                AND date >= ? 
                AND date <= ?
            ORDER BY date ASC
        `;

        return this.getAllQuery(sql, [userId, dateFrom, dateTo]);
    }

    // Statistiche nutrizionali aggregate
    async getNutritionStats(userId, dateFrom, dateTo) {
        const sql = `
            SELECT 
                COUNT(*) as total_days,
                AVG(calories_consumed) as avg_calories,
                AVG(proteins_consumed) as avg_proteins,
                AVG(carbs_consumed) as avg_carbs,
                AVG(fats_consumed) as avg_fats,
                AVG(fiber_consumed) as avg_fiber,
                AVG(water_consumed) as avg_water,
                SUM(calories_consumed) as total_calories,
                SUM(calories_burned) as total_calories_burned,
                SUM(meals_count) as total_meals,
                SUM(activities_count) as total_activities,
                AVG(weight_kg) as avg_weight,
                MIN(weight_kg) as min_weight,
                MAX(weight_kg) as max_weight
            FROM nutrition_trends 
            WHERE user_id = ? 
                AND date >= ? 
                AND date <= ?
        `;

        const results = await this.getAllQuery(sql, [userId, dateFrom, dateTo]);
        return results[0] || {};
    }

    // Progresso verso obiettivi
    async getGoalProgress(userId, dateFrom, dateTo) {
        const sql = `
            SELECT 
                date,
                calories_consumed,
                calories_goal,
                (calories_consumed / NULLIF(calories_goal, 0) * 100) as calories_progress,
                proteins_consumed,
                proteins_goal,
                (proteins_consumed / NULLIF(proteins_goal, 0) * 100) as proteins_progress,
                carbs_consumed,
                carbs_goal,
                (carbs_consumed / NULLIF(carbs_goal, 0) * 100) as carbs_progress,
                fats_consumed,
                fats_goal,
                (fats_consumed / NULLIF(fats_goal, 0) * 100) as fats_progress
            FROM nutrition_trends 
            WHERE user_id = ? 
                AND date >= ? 
                AND date <= ?
                AND calories_goal > 0
            ORDER BY date ASC
        `;

        return this.getAllQuery(sql, [userId, dateFrom, dateTo]);
    }

    // Analisi settimanale
    async getWeeklyAnalysis(userId, weekStart) {
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);

        const trends = await this.getNutritionTrends(userId, 
            weekStart.toISOString().split('T')[0], 
            weekEnd.toISOString().split('T')[0]
        );

        const stats = await this.getNutritionStats(userId,
            weekStart.toISOString().split('T')[0], 
            weekEnd.toISOString().split('T')[0]
        );

        // Calcola giorni di successo (raggiungimento obiettivi)
        const successDays = trends.filter(day => {
            const caloriesSuccess = day.calories_goal > 0 && 
                Math.abs(day.calories_consumed - day.calories_goal) / day.calories_goal <= 0.1;
            return caloriesSuccess;
        }).length;

        return {
            week_start: weekStart.toISOString().split('T')[0],
            week_end: weekEnd.toISOString().split('T')[0],
            daily_trends: trends,
            summary: {
                ...stats,
                success_days: successDays,
                success_rate: trends.length > 0 ? (successDays / trends.length * 100) : 0
            }
        };
    }

    // Analisi mensile
    async getMonthlyAnalysis(userId, year, month) {
        const monthStart = new Date(year, month - 1, 1);
        const monthEnd = new Date(year, month, 0);

        const trends = await this.getNutritionTrends(userId,
            monthStart.toISOString().split('T')[0],
            monthEnd.toISOString().split('T')[0]
        );

        const stats = await this.getNutritionStats(userId,
            monthStart.toISOString().split('T')[0],
            monthEnd.toISOString().split('T')[0]
        );

        // Analisi per settimane
        const weeks = [];
        const currentDate = new Date(monthStart);
        
        while (currentDate <= monthEnd) {
            const weekStart = new Date(currentDate);
            const weekEnd = new Date(currentDate);
            weekEnd.setDate(weekEnd.getDate() + 6);
            
            if (weekEnd > monthEnd) {
                weekEnd.setTime(monthEnd.getTime());
            }

            const weekAnalysis = await this.getWeeklyAnalysis(userId, weekStart);
            weeks.push(weekAnalysis);

            currentDate.setDate(currentDate.getDate() + 7);
        }

        return {
            year,
            month,
            month_name: monthStart.toLocaleDateString('it-IT', { month: 'long' }),
            daily_trends: trends,
            weekly_analysis: weeks,
            monthly_summary: stats
        };
    }

    // Salva metrica personalizzata
    async saveMetric(userId, metricType, metricName, value, unit = null, date = null, metadata = null) {
        const sql = `
            INSERT INTO analytics (
                user_id, metric_type, metric_name, value, unit, date, metadata
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `;

        const metricDate = date || new Date().toISOString().split('T')[0];
        const metricMetadata = metadata ? JSON.stringify(metadata) : null;

        return this.runQuery(sql, [
            userId, metricType, metricName, value, unit, metricDate, metricMetadata
        ]);
    }

    // Ottieni metriche personalizzate
    async getMetrics(userId, metricType = null, dateFrom = null, dateTo = null) {
        let sql = `
            SELECT * FROM analytics 
            WHERE user_id = ?
        `;
        const params = [userId];

        if (metricType) {
            sql += ` AND metric_type = ?`;
            params.push(metricType);
        }

        if (dateFrom) {
            sql += ` AND date >= ?`;
            params.push(dateFrom);
        }

        if (dateTo) {
            sql += ` AND date <= ?`;
            params.push(dateTo);
        }

        sql += ` ORDER BY date DESC, created_at DESC`;

        const metrics = await this.getAllQuery(sql, params);
        
        // Parse metadata JSON
        return metrics.map(metric => ({
            ...metric,
            metadata: metric.metadata ? JSON.parse(metric.metadata) : null
        }));
    }

    // Dashboard analytics generale
    async getDashboard(userId, days = 30) {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const dateFrom = startDate.toISOString().split('T')[0];
        const dateTo = endDate.toISOString().split('T')[0];

        const [nutritionStats, goalProgress, recentTrendsRaw] = await Promise.all([
            this.getNutritionStats(userId, dateFrom, dateTo),
            this.getGoalProgress(userId, dateFrom, dateTo),
            this.getNutritionTrends(userId, dateFrom, dateTo)
        ]);

        const recentTrends = Array.isArray(recentTrendsRaw) ? recentTrendsRaw : [];

        // Calcola streak (giorni consecutivi di successo)
        let currentStreak = 0;
        let maxStreak = 0;
        let tempStreak = 0;

        const sortedTrends = recentTrends.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        for (const trend of sortedTrends) {
            const isSuccess = trend.calories_goal > 0 && 
                Math.abs(trend.calories_consumed - trend.calories_goal) / trend.calories_goal <= 0.1;
            
            if (isSuccess) {
                tempStreak++;
                if (trend === sortedTrends[0]) { // Se è il giorno più recente
                    currentStreak = tempStreak;
                }
            } else {
                maxStreak = Math.max(maxStreak, tempStreak);
                tempStreak = 0;
            }
        }
        maxStreak = Math.max(maxStreak, tempStreak);

        return {
            period: {
                days,
                start_date: dateFrom,
                end_date: dateTo
            },
            summary: nutritionStats,
            streaks: {
                current: currentStreak,
                best: maxStreak
            },
            recent_progress: Array.isArray(goalProgress) ? goalProgress.slice(-7) : [], // Ultimi 7 giorni
            trends_count: recentTrends.length
        };
    }

    // Confronto periodi
    async comparePeriods(userId, period1Start, period1End, period2Start, period2End) {
        const [stats1, stats2] = await Promise.all([
            this.getNutritionStats(userId, period1Start, period1End),
            this.getNutritionStats(userId, period2Start, period2End)
        ]);

        const comparison = {};
        const metrics = ['avg_calories', 'avg_proteins', 'avg_carbs', 'avg_fats', 'avg_weight'];

        metrics.forEach(metric => {
            const val1 = stats1[metric] || 0;
            const val2 = stats2[metric] || 0;
            const change = val1 - val2;
            const percentChange = val2 !== 0 ? (change / val2 * 100) : 0;

            comparison[metric] = {
                period1: val1,
                period2: val2,
                change: change,
                percent_change: percentChange
            };
        });

        return {
            period1: { start: period1Start, end: period1End, stats: stats1 },
            period2: { start: period2Start, end: period2End, stats: stats2 },
            comparison
        };
    }
}

module.exports = Analytics;
