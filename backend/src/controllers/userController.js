const User = require('../models/User');
const NutritionGoal = require('../models/NutritionGoal');
const { ValidationError, NotFoundError } = require('../middleware/errorHandler');
const { logger } = require('../middleware/logging');

class UserController {
  // === ALLERGIE ===
  // GET /api/users/allergies
  static async getAllergies(req, res, next) {
    try {
      const db = req.user.db;
      db.all(
        'SELECT id, allergen_code, allergen_name, severity, notes, created_at FROM user_allergies WHERE user_id = ?',
        [req.user.id],
        (err, rows) => {
          if (err) return next(err);
          res.json({ success: true, data: rows });
        }
      );
    } catch (error) { next(error); }
  }

  // POST /api/users/allergies
  static async addAllergy(req, res, next) {
    try {
      const { allergen_code, allergen_name, severity, notes } = req.body;
      if (!allergen_code || !allergen_name) throw new ValidationError('allergen_code e allergen_name richiesti');
      const db = req.user.db;
      db.run(
        'INSERT INTO user_allergies (user_id, allergen_code, allergen_name, severity, notes, created_at) VALUES (?, ?, ?, ?, ?, ?)',
        [req.user.id, allergen_code, allergen_name, severity || null, notes || null, new Date().toISOString()],
        function(err) {
          if (err) return next(err);
          res.status(201).json({ success: true, data: { id: this.lastID, allergen_code, allergen_name, severity, notes } });
        }
      );
    } catch (error) { next(error); }
  }

  // PUT /api/users/allergies/:id
  static async updateAllergy(req, res, next) {
    try {
      const { id } = req.params;
      const { severity, notes } = req.body;
      const db = req.user.db;
      db.run(
        'UPDATE user_allergies SET severity = ?, notes = ? WHERE id = ? AND user_id = ?',
        [severity || null, notes || null, id, req.user.id],
        function(err) {
          if (err) return next(err);
          if (this.changes === 0) return next(new NotFoundError('Allergia non trovata'));
          res.json({ success: true, message: 'Allergia aggiornata' });
        }
      );
    } catch (error) { next(error); }
  }

  // DELETE /api/users/allergies/:id
  static async deleteAllergy(req, res, next) {
    try {
      const { id } = req.params;
      const db = req.user.db;
      db.run(
        'DELETE FROM user_allergies WHERE id = ? AND user_id = ?',
        [id, req.user.id],
        function(err) {
          if (err) return next(err);
          if (this.changes === 0) return next(new NotFoundError('Allergia non trovata'));
          res.json({ success: true, message: 'Allergia eliminata' });
        }
      );
    } catch (error) { next(error); }
  }

  // === ADDITIVI ===
  // GET /api/users/additives
  static async getAdditives(req, res, next) {
    try {
      const db = req.user.db;
      db.all(
        'SELECT id, additive_code, additive_name, sensitivity_level, notes, created_at FROM user_additive_sensitivities WHERE user_id = ?',
        [req.user.id],
        (err, rows) => {
          if (err) return next(err);
          res.json({ success: true, data: rows });
        }
      );
    } catch (error) { next(error); }
  }

  // POST /api/users/additives
  static async addAdditive(req, res, next) {
    try {
      const { additive_code, additive_name, sensitivity_level, notes } = req.body;
      if (!additive_code || !additive_name) throw new ValidationError('additive_code e additive_name richiesti');
      const db = req.user.db;
      db.run(
        'INSERT INTO user_additive_sensitivities (user_id, additive_code, additive_name, sensitivity_level, notes, created_at) VALUES (?, ?, ?, ?, ?, ?)',
        [req.user.id, additive_code, additive_name, sensitivity_level || null, notes || null, new Date().toISOString()],
        function(err) {
          if (err) return next(err);
          res.status(201).json({ success: true, data: { id: this.lastID, additive_code, additive_name, sensitivity_level, notes } });
        }
      );
    } catch (error) { next(error); }
  }

  // PUT /api/users/additives/:id
  static async updateAdditive(req, res, next) {
    try {
      const { id } = req.params;
      const { sensitivity_level, notes } = req.body;
      const db = req.user.db;
      db.run(
        'UPDATE user_additive_sensitivities SET sensitivity_level = ?, notes = ? WHERE id = ? AND user_id = ?',
        [sensitivity_level || null, notes || null, id, req.user.id],
        function(err) {
          if (err) return next(err);
          if (this.changes === 0) return next(new NotFoundError('Additivo non trovato'));
          res.json({ success: true, message: 'Additivo aggiornato' });
        }
      );
    } catch (error) { next(error); }
  }

  // DELETE /api/users/additives/:id
  static async deleteAdditive(req, res, next) {
    try {
      const { id } = req.params;
      const db = req.user.db;
      db.run(
        'DELETE FROM user_additive_sensitivities WHERE id = ? AND user_id = ?',
        [id, req.user.id],
        function(err) {
          if (err) return next(err);
          if (this.changes === 0) return next(new NotFoundError('Additivo non trovato'));
          res.json({ success: true, message: 'Additivo eliminato' });
        }
      );
    } catch (error) { next(error); }
  }
  // Ottieni profilo utente completo
  static async getProfile(req, res, next) {
    try {
      // Carica obiettivo attivo
      const activeGoal = await NutritionGoal.findActiveByUser(req.user.id);

      // Estrai allergeni e additivi dal DB
      const db = req.user.db;
      const allergies = await new Promise((resolve) => {
        db.all(
          'SELECT id, allergen_code, allergen_name, severity, notes, created_at FROM user_allergies WHERE user_id = ?',
          [req.user.id],
          (err, rows) => {
            if (err) return resolve([]);
            resolve(rows || []);
          }
        );
      });
      const additives_sensitivity = await new Promise((resolve) => {
        db.all(
          'SELECT id, additive_code, additive_name, sensitivity_level, notes, created_at FROM user_additive_sensitivities WHERE user_id = ?',
          [req.user.id],
          (err, rows) => {
            if (err) return resolve([]);
            resolve(rows || []);
          }
        );
      });

      // Calcola età
      let age = null;
      if (req.user.date_of_birth) {
        const birth = new Date(req.user.date_of_birth);
        const today = new Date();
        age = today.getFullYear() - birth.getFullYear();
        const m = today.getMonth() - birth.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
          age--;
        }
      }

      // Calorie giornaliere obiettivo
      let dailyCalories = null;
      if (activeGoal && activeGoal.calories_target) {
        dailyCalories = activeGoal.calories_target;
      }

      // Pasti registrati e streak
      const Meal = require('../models/Meal');
      const mealStats = await Meal.getUserMealStats(req.user.id, 365);
      const totalMeals = mealStats?.total_meals || 0;

      const Analytics = require('../models/Analytics');
      const analytics = new Analytics(db);
      const dashboard = await analytics.getDashboard(req.user.id, 365);
      const currentStreak = dashboard?.streaks?.current || 0;

      const safeUserData = {
        id: req.user.id,
        email: req.user.email,
        name: req.user.name,
        avatar_path: req.user.avatar_path,
        date_of_birth: req.user.date_of_birth,
        gender: req.user.gender,
        height: req.user.height,
        weight: req.user.weight,
        activity_level: req.user.activity_level,
        timezone: req.user.timezone,
        language: req.user.language,
        createdAt: req.user.createdAt,
        updatedAt: req.user.updatedAt,
        allergies,
        additives_sensitivity,
        age,
        dailyCalories,
        totalMeals,
        currentStreak
      };

      res.json({
        success: true,
        data: {
          user: safeUserData,
          activeGoal: activeGoal ? activeGoal.toJSON() : null,
        },
      });

      logger.info('Profilo utente recuperato', {
        userId: req.user.id,
        hasActiveGoal: !!activeGoal,
        totalMeals,
        currentStreak
      });
    } catch (error) {
      logger.error('Errore recupero profilo utente', {
        userId: req.user.id,
        error: error.message
      });
      next(error);
    }
  }

  // Aggiorna profilo utente
  static async updateProfile(req, res, next) {
  // Log payload ricevuto
  console.log('[DEBUG] Payload updateProfile:', req.body);
    try {
      const allowedFields = [
        'name', 'email', 'avatar_path', 'date_of_birth', 'gender',
        'height', 'weight', 'activity_level', 'timezone', 'language'
      ];

      // Mappa i campi dal payload frontend ai nomi backend
      const fieldMap = {
        fullName: 'name',
        email: 'email',
        birthDate: 'date_of_birth',
      };

      // Validazione e sanitizzazione input
      const updates = {};
      Object.keys(req.body).forEach(key => {
        let backendKey = fieldMap[key] || key;
        if (allowedFields.includes(backendKey) && req.body[key] !== undefined) {
          let value = req.body[key];
          // Gestione stringhe vuote come NULL
          if (typeof value === 'string' && value.trim() === '') value = null;
          // Validazione tipo di dato
          switch(backendKey) {
            case 'height':
            case 'weight':
              value = parseFloat(value);
              if (isNaN(value) || value <= 0) {
                throw new ValidationError(`${backendKey} deve essere un numero positivo`);
              }
              break;
            case 'date_of_birth':
              if (value) {
                const date = new Date(value);
                if (isNaN(date.getTime())) {
                  throw new ValidationError('Data di nascita non valida');
                }
                value = date.toISOString().slice(0, 10);
              } else {
                value = null;
              }
              break;
            case 'email':
              // Validazione email base
              if (typeof value !== 'string' || !value.match(/^\S+@\S+\.\S+$/)) {
                throw new ValidationError('Email non valida');
              }
              break;
            case 'gender':
              if (!value || !['male','female','other','prefer_not_to_say'].includes(value)) {
                value = 'other';
              }
              break;
          }
          updates[backendKey] = value;
        }
      });

      if (Object.keys(updates).length === 0) {
        throw new ValidationError('Nessun campo valido da aggiornare');
      }

  await req.user.updateProfile(updates);
  // Log aggiornamento eseguito
  console.log('[DEBUG] Campi aggiornati:', updates);
  // Aggiorna req.user con una nuova istanza che abbia il db associato
  const UserModel = require('../models/User');
  const db = req.user.db;
  const freshUser = await UserModel.findById(req.user.id, db);
  req.user = freshUser;

      // Se sono stati aggiornati dati rilevanti per il calcolo degli obiettivi,
      // ricalcola gli obiettivi nutrizionali
      const nutritionRelevantFields = ['weight', 'height', 'activity_level', 'date_of_birth', 'gender'];
      const needsRecalculation = Object.keys(updates).some(field => nutritionRelevantFields.includes(field));

      let newGoal = null;
      if (needsRecalculation) {
        // Usa la funzione corretta dal modello NutritionGoal
        if (typeof NutritionGoal.recalculateGoals === 'function') {
          newGoal = await NutritionGoal.recalculateGoals(req.user);
          logger.info('Obiettivi nutrizionali ricalcolati dopo aggiornamento profilo', {
            userId: req.user.id,
            updatedFields: Object.keys(updates)
          });
        } else {
          logger.warn('Funzione NutritionGoal.recalculateGoals non trovata, nessun ricalcolo obiettivi');
        }
      }

      // Filtra i dati sensibili nella risposta
      const safeUserData = {
        id: req.user.id,
        name: req.user.name,
        avatar_path: req.user.avatar_path,
        date_of_birth: req.user.date_of_birth,
        gender: req.user.gender,
        height: req.user.height,
        weight: req.user.weight,
        activity_level: req.user.activity_level,
        timezone: req.user.timezone,
        language: req.user.language,
        updatedAt: req.user.updatedAt
      };

      logger.info('Profilo utente aggiornato', {
        userId: req.user.id,
        updatedFields: Object.keys(updates),
        goalsRecalculated: needsRecalculation
      });

      res.json({
        success: true,
        message: 'Profilo aggiornato con successo',
        data: {
          user: safeUserData,
          newGoal: newGoal ? newGoal.toJSON() : null
        },
      });
    } catch (error) {
      logger.error('Errore aggiornamento profilo utente', {
        userId: req.user.id,
        error: error.message,
        errorName: error.name,
        errorStack: error.stack,
        errorDetails: error.details,
        payloadRicevuto: req.body,
        updatesTentati: updates
      });
      if (error.errors) {
        console.error('[VALIDATION ERRORS]', error.errors);
      }
      next(error);
    }
  }

  // Ottieni obiettivi nutrizionali dell'utente
  static async getGoals(req, res, next) {
    try {
      const includeInactive = req.query.include_inactive === 'true';
      const goals = await NutritionGoal.findByUser(req.user.id, includeInactive);

      logger.info('Obiettivi nutrizionali recuperati', {
        userId: req.user.id,
        goalsCount: goals.length,
        includeInactive
      });

      res.json({
        success: true,
        data: {
          goals: goals.map(goal => goal.toJSON()),
          total: goals.length,
        },
      });
    } catch (error) {
      logger.error('Errore recupero obiettivi nutrizionali', {
        userId: req.user.id,
        error: error.message
      });
      next(error);
    }
  }

  // Ottieni obiettivo attivo
  static async getActiveGoal(req, res) {
    try {
      const activeGoal = await NutritionGoal.findActiveByUser(req.user.id);

      if (!activeGoal) {
        return res.json({
          success: true,
          data: { goal: null },
          message: 'Nessun obiettivo attivo trovato',
        });
      }

      // Calcola progresso
      const progress = await activeGoal.calculateProgress();

      res.json({
        success: true,
        data: {
          goal: activeGoal.toJSON(),
          progress,
        },
      });
    } catch (error) {
      throw error;
    }
  }

  // Crea nuovo obiettivo nutrizionale
  static async createGoal(req, res) {
    try {
      const goalData = {
        ...req.body,
        user_id: req.user.id,
      };

      const goal = await NutritionGoal.create(goalData);

      res.status(201).json({
        success: true,
        message: 'Obiettivo creato con successo',
        data: {
          goal: goal.toJSON(),
        },
      });
    } catch (error) {
      throw error;
    }
  }

  // Aggiorna obiettivo nutrizionale
  static async updateGoal(req, res) {
    try {
      const { goalId } = req.params;
      
      const goal = await NutritionGoal.findById(goalId);
      if (!goal) {
        throw new NotFoundError('Obiettivo non trovato');
      }

      // Verifica ownership
      if (goal.user_id !== req.user.id) {
        throw new ValidationError('Non autorizzato a modificare questo obiettivo');
      }

      await goal.update(req.body);

      res.json({
        success: true,
        message: 'Obiettivo aggiornato con successo',
        data: {
          goal: goal.toJSON(),
        },
      });
    } catch (error) {
      throw error;
    }
  }

  // Elimina obiettivo
  static async deleteGoal(req, res) {
    try {
      const { goalId } = req.params;
      
      const goal = await NutritionGoal.findById(goalId);
      if (!goal) {
        throw new NotFoundError('Obiettivo non trovato');
      }

      // Verifica ownership
      if (goal.user_id !== req.user.id) {
        throw new ValidationError('Non autorizzato a eliminare questo obiettivo');
      }

      await goal.delete();

      res.json({
        success: true,
        message: 'Obiettivo eliminato con successo',
      });
    } catch (error) {
      throw error;
    }
  }

  // Ottieni preferenze utente
  static async getPreferences(req, res) {
    try {
      const preferences = {
        timezone: req.user.timezone,
        language: req.user.language,
        activity_level: req.user.activity_level,
        // Altre preferenze che potrebbero essere aggiunte in futuro
        notifications: {
          meal_reminders: true,
          goal_progress: true,
          weekly_report: true,
        },
        privacy: {
          data_sharing: false,
          analytics: true,
        }
      };

      res.json({
        success: true,
        data: { preferences },
      });
    } catch (error) {
      throw error;
    }
  }

  // Aggiorna preferenze utente
  static async updatePreferences(req, res) {
    try {
      const { timezone, language, activity_level } = req.body;

      const updates = {};
      if (timezone) updates.timezone = timezone;
      if (language) updates.language = language;
      if (activity_level) updates.activity_level = activity_level;

      if (Object.keys(updates).length > 0) {
        await req.user.update(updates);
      }

      res.json({
        success: true,
        message: 'Preferenze aggiornate con successo',
        data: {
          user: req.user.toJSON(),
        },
      });
    } catch (error) {
      throw error;
    }
  }

  // Ottieni statistiche personali dell'utente
  static async getStats(req, res) {
    try {
      const days = parseInt(req.query.days) || 30;

      // Statistiche base dell'utente
      const userStats = {
        profile: {
          age: req.user.getAge(),
          bmi: req.user.calculateBMI(),
          bmi_category: req.user.getBMICategory(),
          bmr: req.user.calculateBMR(),
          tdee: req.user.calculateTDEE(),
        },
        account: {
          member_since: req.user.created_at,
          last_login: req.user.last_login,
          days_since_registration: Math.floor(
            (new Date() - new Date(req.user.created_at)) / (1000 * 60 * 60 * 24)
          ),
        },
      };

      // TODO: Aggiungere statistiche da meals, activities, etc. quando saranno implementate
      // const mealStats = await Meal.getUserMealStats(req.user.id, days);
      // const activityStats = await Activity.getUserActivityStats(req.user.id, days);

      res.json({
        success: true,
        data: {
          stats: userStats,
          period_days: days,
          generated_at: new Date().toISOString(),
        },
      });
    } catch (error) {
      throw error;
    }
  }

  // Registra peso corporeo
  static async logWeight(req, res) {
    try {
      const { weight, body_fat_percentage, muscle_mass, date, notes } = req.body;

      if (!weight) {
        throw new ValidationError('Peso richiesto');
      }

      const db = require('../config/database').getConnection();
      
      const weightEntry = {
        user_id: req.user.id,
        weight,
        body_fat_percentage: body_fat_percentage || null,
        muscle_mass: muscle_mass || null,
        date: date || new Date().toISOString().split('T')[0],
        time: new Date().toISOString().split('T')[1].substring(0, 8),
        notes: notes || null,
        created_at: new Date().toISOString(),
      };

      const [entryId] = await db('weight_entries').insert(weightEntry);

      // Aggiorna anche il peso nel profilo utente se è il più recente
      const latestEntry = await db('weight_entries')
        .where('user_id', req.user.id)
        .orderBy('date', 'desc')
        .orderBy('created_at', 'desc')
        .first();

      if (latestEntry && latestEntry.id === entryId) {
        await req.user.update({ weight });
      }

      res.status(201).json({
        success: true,
        message: 'Peso registrato con successo',
        data: {
          entry: {
            id: entryId,
            ...weightEntry,
          },
        },
      });
    } catch (error) {
      throw error;
    }
  }

  // Ottieni storico peso
  static async getWeightHistory(req, res) {
    try {
      const limit = parseInt(req.query.limit) || 50;
      const offset = parseInt(req.query.offset) || 0;

      const db = require('../config/database').getConnection();
      
      const entries = await db('weight_entries')
        .where('user_id', req.user.id)
        .orderBy('date', 'desc')
        .orderBy('created_at', 'desc')
        .limit(limit)
        .offset(offset);

      const total = await db('weight_entries')
        .where('user_id', req.user.id)
        .count('* as count')
        .first();

      res.json({
        success: true,
        data: {
          entries,
          pagination: {
            total: total.count,
            limit,
            offset,
            hasMore: total.count > offset + entries.length,
          },
        },
      });
    } catch (error) {
      throw error;
    }
  }

  // Upload avatar utente
  static async uploadAvatar(req, res) {
    try {
      if (!req.file) {
        throw new ValidationError('File immagine richiesto');
      }

      // TODO: Implementare logica di upload e ridimensionamento immagine
      // Per ora salviamo solo il path
      const avatarPath = `/images/avatars/${req.file.filename}`;
      
      await req.user.update({ avatar_path: avatarPath });

      res.json({
        success: true,
        message: 'Avatar aggiornato con successo',
        data: {
          avatar_path: avatarPath,
          user: req.user.toJSON(),
        },
      });
    } catch (error) {
      throw error;
    }
  }

  // Elimina avatar
  static async deleteAvatar(req, res) {
    try {
      await req.user.update({ avatar_path: null });

      res.json({
        success: true,
        message: 'Avatar eliminato con successo',
        data: {
          user: req.user.toJSON(),
        },
      });
    } catch (error) {
      throw error;
    }
  }

  // Esporta dati utente (GDPR compliance)
  static async exportData(req, res) {
    try {
      const db = require('../config/database').getConnection();

      // Raccoglie tutti i dati dell'utente
      const userData = {
        profile: req.user.toJSON(),
        goals: await db('nutrition_goals').where('user_id', req.user.id),
        weight_entries: await db('weight_entries').where('user_id', req.user.id),
        meals: await db('meals').where('user_id', req.user.id),
        activities: await db('activities').where('user_id', req.user.id),
        pantry_items: await db('pantry_items').where('user_id', req.user.id),
        export_date: new Date().toISOString(),
      };

      res.json({
        success: true,
        message: 'Dati esportati con successo',
        data: userData,
      });
    } catch (error) {
      throw error;
    }
  }
}

module.exports = UserController;
