const db = require('../config/database');
const sqliteDb = db.sqliteDb;

// Salva o aggiorna acqua giornaliera
exports.saveWater = (req, res, next) => {
  const userId = req.user.id;
  const { date, amount } = req.body;
  if (!date || typeof amount !== 'number') {
    return res.status(400).json({ success: false, message: 'Dati acqua non validi' });
  }
  const sql = `INSERT INTO water_logs (user_id, date, amount, created_at, updated_at)
    VALUES (?, ?, ?, datetime('now'), datetime('now'))
    ON CONFLICT(user_id, date) DO UPDATE SET amount = amount + excluded.amount, updated_at = datetime('now')`;
  sqliteDb.run(sql, [userId, date, amount], function(err) {
    if (err) return next(err);
    res.json({ success: true });
  });
};

// Recupera acqua giornaliera
exports.getWater = (req, res, next) => {
  const userId = req.user.id;
  const date = req.query.date;
  if (!date) return res.status(400).json({ success: false, message: 'Data mancante' });
  sqliteDb.get('SELECT amount FROM water_logs WHERE user_id = ? AND date = ?', [userId, date], (err, row) => {
    if (err) return next(err);
    res.json({ success: true, amount: row ? row.amount : 0 });
  });
};

// Salva o aggiorna peso giornaliero
exports.saveWeight = (req, res, next) => {
  const userId = req.user.id;
  const { date, weight } = req.body;
  if (!date || typeof weight !== 'number') {
    return res.status(400).json({ success: false, message: 'Dati peso non validi' });
  }
  const sql = `INSERT INTO weight_logs (user_id, date, weight, created_at, updated_at)
    VALUES (?, ?, ?, datetime('now'), datetime('now'))
    ON CONFLICT(user_id, date) DO UPDATE SET weight = excluded.weight, updated_at = datetime('now')`;
  sqliteDb.run(sql, [userId, date, weight], function(err) {
    if (err) return next(err);
    res.json({ success: true });
  });
};

// Recupera peso giornaliero
exports.getWeight = (req, res, next) => {
  const userId = req.user.id;
  const date = req.query.date;
  if (!date) return res.status(400).json({ success: false, message: 'Data mancante' });
  sqliteDb.get('SELECT weight FROM weight_logs WHERE user_id = ? AND date = ?', [userId, date], (err, row) => {
    if (err) return next(err);
    res.json({ success: true, weight: row ? row.weight : null });
  });
};
