const database = require('../config/database');
const { logger } = require('../middleware/logging');

class NutritionLog {
    constructor(data = {}) {
        this.id = data.id;
        this.userId = data.userId;
        this.date = data.date;
        this.meals = data.meals || [];
        this.totalCalories = data.totalCalories || 0;
        this.totalProteins = data.totalProteins || 0;
        this.totalCarbs = data.totalCarbs || 0;
        this.totalFats = data.totalFats || 0;
        this.totalFiber = data.totalFiber || 0;
        this.totalSugars = data.totalSugars || 0;
        this.createdAt = data.createdAt;
        this.updatedAt = data.updatedAt;
    }

    static get tableName() {
        return 'nutrition_logs';
    }

    static async findByUserId(userId, date) {
        try {
            const query = `
                SELECT * FROM ${this.tableName}
                WHERE user_id = ? AND date = ?
            `;
            
            const [rows] = await database.query(query, [userId, date]);
            return rows.map(row => new NutritionLog(row));
        } catch (error) {
            logger.error('Errore nel recupero dei log nutrizionali', { error: error.message });
            throw error;
        }
    }

    static async create(data) {
        try {
            const query = `
                INSERT INTO ${this.tableName}
                (user_id, date, total_calories, total_proteins, total_carbs, total_fats, total_fiber, total_sugars)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `;

            const [result] = await database.query(query, [
                data.userId,
                data.date,
                data.totalCalories,
                data.totalProteins,
                data.totalCarbs,
                data.totalFats,
                data.totalFiber,
                data.totalSugars
            ]);

            return new NutritionLog({ id: result.insertId, ...data });
        } catch (error) {
            logger.error('Errore nella creazione del log nutrizionale', { error: error.message });
            throw error;
        }
    }

    static async update(id, data) {
        try {
            const query = `
                UPDATE ${this.tableName}
                SET total_calories = ?,
                    total_proteins = ?,
                    total_carbs = ?,
                    total_fats = ?,
                    total_fiber = ?,
                    total_sugars = ?,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            `;

            await database.query(query, [
                data.totalCalories,
                data.totalProteins,
                data.totalCarbs,
                data.totalFats,
                data.totalFiber,
                data.totalSugars,
                id
            ]);

            return new NutritionLog({ id, ...data });
        } catch (error) {
            logger.error('Errore nell\'aggiornamento del log nutrizionale', { error: error.message });
            throw error;
        }
    }

    static async delete(id) {
        try {
            const query = `DELETE FROM ${this.tableName} WHERE id = ?`;
            await database.query(query, [id]);
        } catch (error) {
            logger.error('Errore nella cancellazione del log nutrizionale', { error: error.message });
            throw error;
        }
    }
}

module.exports = NutritionLog;
