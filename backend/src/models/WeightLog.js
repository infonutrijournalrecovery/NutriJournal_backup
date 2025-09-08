const database = require('../config/database');

class WeightLog {
    constructor(data = {}) {
        this.id = data.id;
        this.user_id = data.user_id;
        this.weight = data.weight;
        this.date = data.date;
        this.notes = data.notes;
        this.created_at = data.created_at;
    }

    static get tableName() {
        return 'weight_logs';
    }

    /**
     * Trova log peso per intervallo di date
     */
    static findByDateRange(userId, startDate, endDate) {
        return new Promise((resolve, reject) => {
            database.sqliteDb.all(
                `SELECT * FROM ${this.tableName} 
                 WHERE user_id = ? AND date >= ? AND date <= ?
                 ORDER BY date ASC`,
                [userId, startDate, endDate],
                (err, rows) => {
                    if (err) {
                        console.error('❌ Errore ricerca log peso:', err);
                        reject(new Error('Errore ricerca log peso'));
                    } else {
                        resolve(rows.map(row => new WeightLog(row)));
                    }
                }
            );
        });
    }

    /**
     * Crea un nuovo log peso
     */
    static create(data) {
        return new Promise((resolve, reject) => {
            const { user_id, weight, date, notes } = data;
            
            database.sqliteDb.run(
                `INSERT INTO ${this.tableName} (user_id, weight, date, notes)
                 VALUES (?, ?, ?, ?)`,
                [user_id, weight, date, notes],
                function(err) {
                    if (err) {
                        console.error('❌ Errore creazione log peso:', err);
                        reject(new Error('Errore creazione log peso'));
                    } else {
                        resolve(new WeightLog({ id: this.lastID, ...data }));
                    }
                }
            );
        });
    }

    /**
     * Calcola statistiche peso per un periodo
     */
    static async getStats(userId, startDate, endDate) {
        const logs = await this.findByDateRange(userId, startDate, endDate);
        
        if (!logs.length) {
            return null;
        }

        const weights = logs.map(log => log.weight);
        
        return {
            current: weights[weights.length - 1],
            start: weights[0],
            change: weights[weights.length - 1] - weights[0],
            changePercentage: ((weights[weights.length - 1] - weights[0]) / weights[0]) * 100,
            min: Math.min(...weights),
            max: Math.max(...weights),
            average: weights.reduce((a, b) => a + b) / weights.length
        };
    }
}

module.exports = WeightLog;
