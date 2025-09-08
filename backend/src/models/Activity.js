const sqlite3 = require('sqlite3');
const path = require('path');

// Tipi di attività validi e loro valori MET
const ACTIVITY_TYPES = {
    CARDIO: {
        walking: { name: 'Camminata', met: 3.8 },
        running: { name: 'Corsa', met: 8.0 },
        cycling: { name: 'Ciclismo', met: 7.5 },
        swimming: { name: 'Nuoto', met: 6.0 },
    },
    STRENGTH: {
        gym: { name: 'Palestra', met: 5.0 },
        bodyweight: { name: 'Corpo libero', met: 4.0 },
        weightlifting: { name: 'Sollevamento pesi', met: 6.0 },
    },
    FLEXIBILITY: {
        yoga: { name: 'Yoga', met: 2.5 },
        stretching: { name: 'Stretching', met: 2.3 },
        pilates: { name: 'Pilates', met: 3.0 },
    },
    SPORTS: {
        soccer: { name: 'Calcio', met: 7.0 },
        basketball: { name: 'Basket', met: 6.5 },
        tennis: { name: 'Tennis', met: 5.0 },
        volleyball: { name: 'Pallavolo', met: 3.0 },
    },
    OTHER: {
        dancing: { name: 'Ballo', met: 4.8 },
        hiking: { name: 'Escursione', met: 6.0 },
        gardening: { name: 'Giardinaggio', met: 3.5 },
    }
};

class Activity {
    constructor(database) {
        this.db = database;
        this.ACTIVITY_TYPES = ACTIVITY_TYPES;
    }

    // Inizializza tabella activities
    async initialize() {
        const sql = `
            CREATE TABLE IF NOT EXISTS activities (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                type VARCHAR(50) NOT NULL,
                name VARCHAR(255) NOT NULL,
                duration_minutes INTEGER NOT NULL,
                calories_burned DECIMAL(8,2) DEFAULT 0,
                intensity VARCHAR(20) DEFAULT 'moderate',
                date DATE NOT NULL,
                start_time TIME,
                end_time TIME,
                notes TEXT,
                heart_rate_avg INTEGER,
                heart_rate_max INTEGER,
                distance_km DECIMAL(10,2),
                steps INTEGER,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
            )
        `;

        return new Promise((resolve, reject) => {
            this.db.run(sql, (err) => {
                if (err) {
                    console.error('Errore creazione tabella activities:', err);
                    reject(err);
                } else {
                    console.log('✅ Tabella activities creata/verificata');
                    resolve();
                }
            });
        });
    }

    // Crea nuova attività
    async create(userId, activityData) {
        const {
            type,
            name,
            duration_minutes,
            calories_burned = 0,
            intensity = 'moderate',
            date,
            start_time,
            end_time,
            notes,
            heart_rate_avg,
            heart_rate_max,
            distance_km,
            steps
        } = activityData;

        const sql = `
            INSERT INTO activities (
                user_id, type, name, duration_minutes, calories_burned,
                intensity, date, start_time, end_time, notes,
                heart_rate_avg, heart_rate_max, distance_km, steps
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        return new Promise((resolve, reject) => {
            this.db.run(sql, [
                userId, type, name, duration_minutes, calories_burned,
                intensity, date, start_time, end_time, notes,
                heart_rate_avg, heart_rate_max, distance_km, steps
            ], function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({ id: this.lastID });
                }
            });
        });
    }

    // Ottieni attività per utente
    async getByUser(userId, filters = {}) {
        const { date_from, date_to, type, limit = 50, offset = 0 } = filters;
        
        let sql = `
            SELECT * FROM activities 
            WHERE user_id = ?
        `;
        const params = [userId];

        if (date_from) {
            sql += ` AND date >= ?`;
            params.push(date_from);
        }

        if (date_to) {
            sql += ` AND date <= ?`;
            params.push(date_to);
        }

        if (type) {
            sql += ` AND type = ?`;
            params.push(type);
        }

        sql += ` ORDER BY date DESC, start_time DESC LIMIT ? OFFSET ?`;
        params.push(limit, offset);

        return new Promise((resolve, reject) => {
            this.db.all(sql, params, (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    // Ottieni attività per ID
    async getById(activityId, userId) {
        const sql = `
            SELECT * FROM activities 
            WHERE id = ? AND user_id = ?
        `;

        return new Promise((resolve, reject) => {
            this.db.get(sql, [activityId, userId], (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });
    }

    // Aggiorna attività
    async update(activityId, userId, updateData) {
        const allowedFields = [
            'type', 'name', 'duration_minutes', 'calories_burned',
            'intensity', 'date', 'start_time', 'end_time', 'notes',
            'heart_rate_avg', 'heart_rate_max', 'distance_km', 'steps'
        ];

        const updates = [];
        const values = [];

        Object.keys(updateData).forEach(key => {
            if (allowedFields.includes(key) && updateData[key] !== undefined) {
                updates.push(`${key} = ?`);
                values.push(updateData[key]);
            }
        });

        if (updates.length === 0) {
            throw new Error('Nessun campo valido da aggiornare');
        }

        updates.push('updated_at = CURRENT_TIMESTAMP');
        values.push(activityId, userId);

        const sql = `
            UPDATE activities 
            SET ${updates.join(', ')}
            WHERE id = ? AND user_id = ?
        `;

        return new Promise((resolve, reject) => {
            this.db.run(sql, values, function(err) {
                if (err) {
                    reject(err);
                } else if (this.changes === 0) {
                    reject(new Error('Attività non trovata'));
                } else {
                    resolve({ changes: this.changes });
                }
            });
        });
    }

    // Elimina attività
    async delete(activityId, userId) {
        const sql = `
            DELETE FROM activities 
            WHERE id = ? AND user_id = ?
        `;

        return new Promise((resolve, reject) => {
            this.db.run(sql, [activityId, userId], function(err) {
                if (err) {
                    reject(err);
                } else if (this.changes === 0) {
                    reject(new Error('Attività non trovata'));
                } else {
                    resolve({ deleted: true });
                }
            });
        });
    }

    // Statistiche attività per periodo
    async getStats(userId, dateFrom, dateTo) {
        const sql = `
            SELECT 
                type,
                COUNT(*) as total_sessions,
                SUM(duration_minutes) as total_minutes,
                SUM(calories_burned) as total_calories,
                AVG(duration_minutes) as avg_duration,
                AVG(calories_burned) as avg_calories,
                SUM(distance_km) as total_distance,
                SUM(steps) as total_steps
            FROM activities 
            WHERE user_id = ? 
                AND date >= ? 
                AND date <= ?
            GROUP BY type
            ORDER BY total_sessions DESC
        `;

        return new Promise((resolve, reject) => {
            this.db.all(sql, [userId, dateFrom, dateTo], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    // Calorie totali bruciate per giorno
    async getDailyCalories(userId, dateFrom, dateTo) {
        const sql = `
            SELECT 
                date,
                SUM(calories_burned) as total_calories,
                SUM(duration_minutes) as total_minutes,
                COUNT(*) as total_activities
            FROM activities 
            WHERE user_id = ? 
                AND date >= ? 
                AND date <= ?
            GROUP BY date
            ORDER BY date ASC
        `;

        return new Promise((resolve, reject) => {
            this.db.all(sql, [userId, dateFrom, dateTo], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    // Tipi di attività più frequenti
    async getFrequentActivities(userId, limit = 10) {
        const sql = `
            SELECT 
                type,
                name,
                COUNT(*) as frequency,
                AVG(duration_minutes) as avg_duration,
                AVG(calories_burned) as avg_calories
            FROM activities 
            WHERE user_id = ?
            GROUP BY type, name
            ORDER BY frequency DESC
            LIMIT ?
        `;

        return new Promise((resolve, reject) => {
            this.db.all(sql, [userId, limit], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    // Calcola calorie bruciate per attività (stima basica)
    calculateCalories(type, duration_minutes, weight_kg = 70) {
        // Cerca il tipo di attività nelle categorie
        let activityMet = 4.0; // Default MET se tipo non trovato
        
        for (const category of Object.values(ACTIVITY_TYPES)) {
            if (type in category) {
                activityMet = category[type].met;
                break;
            }
        }

        const met = activityMet;
        
        // Calorie = MET × weight(kg) × time(hours)
        const calories = met * weight_kg * (duration_minutes / 60);
        
        return Math.round(calories);
    }

    // Report settimanale
    async getWeeklyReport(userId, date = new Date().toISOString().split('T')[0]) {
        const weekStart = new Date(date);
        weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Domenica della settimana
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6); // Sabato della settimana

        const sql = `
            SELECT 
                date,
                type,
                COUNT(*) as activities_count,
                SUM(duration_minutes) as total_minutes,
                SUM(calories_burned) as total_calories,
                SUM(distance_km) as total_distance
            FROM activities 
            WHERE user_id = ? 
                AND date >= ? 
                AND date <= ?
            GROUP BY date, type
            ORDER BY date ASC, type
        `;

        return new Promise((resolve, reject) => {
            this.db.all(sql, [
                userId, 
                weekStart.toISOString().split('T')[0],
                weekEnd.toISOString().split('T')[0]
            ], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve({
                        period: {
                            start: weekStart.toISOString().split('T')[0],
                            end: weekEnd.toISOString().split('T')[0]
                        },
                        daily_activities: rows,
                        summary: {
                            total_activities: rows.reduce((sum, row) => sum + row.activities_count, 0),
                            total_minutes: rows.reduce((sum, row) => sum + row.total_minutes, 0),
                            total_calories: rows.reduce((sum, row) => sum + row.total_calories, 0),
                            total_distance: rows.reduce((sum, row) => sum + (row.total_distance || 0), 0),
                        }
                    });
                }
            });
        });
    }

    // Report mensile
    async getMonthlyReport(userId, date = new Date().toISOString().split('T')[0]) {
        const monthStart = new Date(date);
        monthStart.setDate(1); // Primo del mese
        const monthEnd = new Date(monthStart);
        monthEnd.setMonth(monthEnd.getMonth() + 1);
        monthEnd.setDate(0); // Ultimo del mese

        const sql = `
            SELECT 
                strftime('%Y-%m-%d', date) as week_start,
                type,
                COUNT(*) as activities_count,
                SUM(duration_minutes) as total_minutes,
                SUM(calories_burned) as total_calories,
                SUM(distance_km) as total_distance
            FROM activities 
            WHERE user_id = ? 
                AND date >= ? 
                AND date <= ?
            GROUP BY strftime('%Y-%W', date), type
            ORDER BY week_start ASC, type
        `;

        return new Promise((resolve, reject) => {
            this.db.all(sql, [
                userId, 
                monthStart.toISOString().split('T')[0],
                monthEnd.toISOString().split('T')[0]
            ], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve({
                        period: {
                            start: monthStart.toISOString().split('T')[0],
                            end: monthEnd.toISOString().split('T')[0]
                        },
                        weekly_activities: rows,
                        summary: {
                            total_activities: rows.reduce((sum, row) => sum + row.activities_count, 0),
                            total_minutes: rows.reduce((sum, row) => sum + row.total_minutes, 0),
                            total_calories: rows.reduce((sum, row) => sum + row.total_calories, 0),
                            total_distance: rows.reduce((sum, row) => sum + (row.total_distance || 0), 0),
                        }
                    });
                }
            });
        });
    }

    // Report trimestrale
    async getQuarterlyReport(userId, date = new Date().toISOString().split('T')[0]) {
        const quarterStart = new Date(date);
        quarterStart.setMonth(Math.floor(quarterStart.getMonth() / 3) * 3);
        quarterStart.setDate(1);
        const quarterEnd = new Date(quarterStart);
        quarterEnd.setMonth(quarterStart.getMonth() + 3);
        quarterEnd.setDate(0);

        const sql = `
            SELECT 
                strftime('%Y-%m', date) as month,
                type,
                COUNT(*) as activities_count,
                SUM(duration_minutes) as total_minutes,
                SUM(calories_burned) as total_calories,
                SUM(distance_km) as total_distance,
                AVG(calories_burned) as avg_calories_per_activity
            FROM activities 
            WHERE user_id = ? 
                AND date >= ? 
                AND date <= ?
            GROUP BY strftime('%Y-%m', date), type
            ORDER BY month ASC, type
        `;

        return new Promise((resolve, reject) => {
            this.db.all(sql, [
                userId, 
                quarterStart.toISOString().split('T')[0],
                quarterEnd.toISOString().split('T')[0]
            ], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve({
                        period: {
                            start: quarterStart.toISOString().split('T')[0],
                            end: quarterEnd.toISOString().split('T')[0]
                        },
                        monthly_activities: rows,
                        summary: {
                            total_activities: rows.reduce((sum, row) => sum + row.activities_count, 0),
                            total_minutes: rows.reduce((sum, row) => sum + row.total_minutes, 0),
                            total_calories: rows.reduce((sum, row) => sum + row.total_calories, 0),
                            total_distance: rows.reduce((sum, row) => sum + (row.total_distance || 0), 0),
                            avg_calories_per_activity: rows.reduce((sum, row) => sum + row.avg_calories_per_activity, 0) / rows.length,
                        }
                    });
                }
            });
        });
    }
}

module.exports = Activity;
