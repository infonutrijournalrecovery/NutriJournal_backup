const sqlite3 = require('sqlite3');
const path = require('path');

class Activity {
    constructor(database) {
        this.db = database;
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
        // MET (Metabolic Equivalent of Task) values per tipo di attività
        const metValues = {
            walking: 3.8,
            running: 8.0,
            cycling: 7.5,
            swimming: 6.0,
            gym: 5.0,
            yoga: 2.5,
            dancing: 4.8,
            soccer: 7.0,
            basketball: 6.5,
            tennis: 5.0,
            hiking: 6.0,
            climbing: 8.0,
            skiing: 7.0,
            rowing: 4.8,
            boxing: 9.0,
            martial_arts: 7.5,
            football: 8.0,
            volleyball: 3.0,
            golf: 4.8,
            baseball: 5.0
        };

        const met = metValues[type] || 4.0; // Default MET se tipo non trovato
        
        // Calorie = MET × weight(kg) × time(hours)
        const calories = met * weight_kg * (duration_minutes / 60);
        
        return Math.round(calories);
    }
}

module.exports = Activity;
