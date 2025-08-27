const User = require('../models/User');
const NutritionGoal = require('../models/NutritionGoal');
const { ValidationError, NotFoundError } = require('../middleware/errorHandler');

class UserController {
  // Ottieni profilo utente completo
  static async getProfile(req, res) {
    try {
      // Carica obiettivo attivo
      const activeGoal = await NutritionGoal.findActiveByUser(req.user.id);

      res.json({
        success: true,
        data: {
          user: req.user.toJSON(),
          activeGoal: activeGoal ? activeGoal.toJSON() : null,
        },
      });
    } catch (error) {
      throw error;
    }
  }

  // Aggiorna profilo utente
  static async updateProfile(req, res) {
    try {
      const allowedFields = [
        'name', 'avatar_path', 'date_of_birth', 'gender',
        'height', 'weight', 'activity_level', 'timezone', 'language'
      ];

      const updates = {};
      Object.keys(req.body).forEach(key => {
        if (allowedFields.includes(key) && req.body[key] !== undefined) {
          updates[key] = req.body[key];
        }
      });

      if (Object.keys(updates).length === 0) {
        throw new ValidationError('Nessun campo valido da aggiornare');
      }

      await req.user.update(updates);

      res.json({
        success: true,
        message: 'Profilo aggiornato con successo',
        data: {
          user: req.user.toJSON(),
        },
      });
    } catch (error) {
      throw error;
    }
  }

  // Ottieni obiettivi nutrizionali dell'utente
  static async getGoals(req, res) {
    try {
      const includeInactive = req.query.include_inactive === 'true';
      const goals = await NutritionGoal.findByUser(req.user.id, includeInactive);

      res.json({
        success: true,
        data: {
          goals: goals.map(goal => goal.toJSON()),
          total: goals.length,
        },
      });
    } catch (error) {
      throw error;
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
        },
        units: {
          weight: 'kg',
          height: 'cm',
          temperature: 'celsius',
        },
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
