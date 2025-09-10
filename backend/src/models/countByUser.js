// Conta il numero totale di attività per un utente e filtri opzionali
async function countByUser(db, userId, filters = {}) {
    let sql = `SELECT COUNT(*) as total FROM activities WHERE user_id = ?`;
    const params = [userId];
    if (filters.date) {
        sql += ` AND date = ?`;
        params.push(filters.date);
    }
    if (filters.type) {
        sql += ` AND type = ?`;
        params.push(filters.type);
    }
    return new Promise((resolve, reject) => {
        db.get(sql, params, (err, row) => {
            if (err) reject(err);
            else resolve(row.total);
        });
    });
}

module.exports = { countByUser };
