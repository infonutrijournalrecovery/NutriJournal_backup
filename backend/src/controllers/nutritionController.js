const NutritionGoal = require('../models/NutritionGoal');
const NutritionLog = require('../models/NutritionLog');

class NutritionController {
  /**
   * GET /api/nutrition/goal/active
   * Restituisce l'obiettivo nutrizionale attivo per l'utente
   */
  static async getActiveGoal(req, res) {
    try {
      const goal = await NutritionGoal.findOne({ user: req.user.id, isActive: true });
      if (!goal) {
        return res.status(404).json({ message: 'Nessun obiettivo attivo trovato' });
      }
      res.json(goal);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  /**
   * POST /api/nutrition/goal
   * Crea un nuovo obiettivo nutrizionale
   */
  static async createGoal(req, res) {
    try {
      // Disattiva eventuale obiettivo attivo
      await NutritionGoal.updateMany({ user: req.user.id }, { isActive: false });

      const newGoal = new NutritionGoal({
        ...req.body,
        user: req.user.id,
        isActive: true
      });

      const savedGoal = await newGoal.save();
      res.status(201).json(savedGoal);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }

  /**
   * PUT /api/nutrition/goal/:goalId
   * Aggiorna un obiettivo nutrizionale
   */
  static async updateGoal(req, res) {
    try {
      const updatedGoal = await NutritionGoal.findOneAndUpdate(
        { _id: req.params.goalId, user: req.user.id },
        req.body,
        { new: true }
      );

      if (!updatedGoal) {
        return res.status(404).json({ message: 'Obiettivo non trovato' });
      }

      res.json(updatedGoal);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }

  /**
   * GET /api/nutrition/analysis/day/:date
   * Analisi nutrizionale giornaliera
   */
  static async getDayAnalysis(req, res) {
    try {
      const { date } = req.params;
      const logs = await NutritionLog.find({ user: req.user.id, date });

      if (!logs.length) {
        return res.json({
          calories: 0,
          protein: 0,
          carbs: 0,
          fat: 0
        });
      }

      const totals = logs.reduce(
        (acc, log) => {
          acc.calories += log.calories || 0;
          acc.protein += log.protein || 0;
          acc.carbs += log.carbs || 0;
          acc.fat += log.fat || 0;
          return acc;
        },
        { calories: 0, protein: 0, carbs: 0, fat: 0 }
      );

      res.json(totals);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  /**
   * GET /api/nutrition/analysis/period
   * Analisi nutrizionale per periodo
   */
  static async getPeriodAnalysis(req, res) {
    try {
      const { startDate, endDate } = req.query;
      const logs = await NutritionLog.find({
        user: req.user.id,
        date: { $gte: startDate, $lte: endDate }
      });

      if (!logs.length) {
        return res.json({
          calories: 0,
          protein: 0,
          carbs: 0,
          fat: 0
        });
      }

      const totals = logs.reduce(
        (acc, log) => {
          acc.calories += log.calories || 0;
          acc.protein += log.protein || 0;
          acc.carbs += log.carbs || 0;
          acc.fat += log.fat || 0;
          return acc;
        },
        { calories: 0, protein: 0, carbs: 0, fat: 0 }
      );

      res.json(totals);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  /**
   * GET /api/nutrition/recommendations
   */
  static async getRecommendations(req, res) {
    try {
      const goal = await NutritionGoal.findOne({ user: req.user.id, isActive: true });
      if (!goal) {
        return res.status(404).json({ message: 'Nessun obiettivo attivo trovato' });
      }

      // Per ora restituiamo un messaggio base
      res.json({
        message: 'Funzionalità raccomandazioni in sviluppo',
        currentGoal: goal
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  /**
   * GET /api/nutrition/trends
   */
  static async getNutritionTrends(req, res) {
    try {
      const { period = 30 } = req.query;
      const sinceDate = new Date();
      sinceDate.setDate(sinceDate.getDate() - parseInt(period, 10));

      const logs = await NutritionLog.find({
        user: req.user.id,
        date: { $gte: sinceDate }
      }).sort({ date: 1 });

      if (!logs.length) {
        return res.json([]);
      }

      const trends = logs.map(log => ({
        date: log.date,
        calories: log.calories,
        protein: log.protein,
        carbs: log.carbs,
        fat: log.fat
      }));

      res.json(trends);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  /**
   * POST /api/nutrition/calculate-needs
   */
  static async calculateCalorieNeeds(req, res) {
    try {
      const { age, gender, weight, height, activityLevel, goal } = req.body;

      // BMR con formula Mifflin-St Jeor
      let bmr = gender === 'male'
        ? 10 * weight + 6.25 * height - 5 * age + 5
        : 10 * weight + 6.25 * height - 5 * age - 161;

      const activityFactors = {
        sedentary: 1.2,
        light: 1.375,
        moderate: 1.55,
        active: 1.725,
        veryActive: 1.9
      };

      let calories = bmr * (activityFactors[activityLevel] || 1.2);

      if (goal === 'loss') calories -= 500;
      if (goal === 'gain') calories += 500;

      const macros = {
        protein: (weight * 2), // g
        fat: (calories * 0.25) / 9,
        carbs: (calories - ((weight * 2 * 4) + (calories * 0.25))) / 4
      };

      res.json({
        calories: Math.round(calories),
        macros: {
          protein: Math.round(macros.protein),
          fat: Math.round(macros.fat),
          carbs: Math.round(macros.carbs)
        }
      });
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }

  /**
   * GET /api/nutrition/report/weekly/:startDate
   */
  static async getWeeklyReport(req, res) {
    try {
      const { startDate } = req.params;
      res.json({
        message: 'Report settimanale in sviluppo',
        startDate,
        period: '7 giorni',
        userId: req.user.id
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  /**
   * GET /api/nutrition/report/monthly/:startDate
   */
  static async getMonthlyReport(req, res) {
    try {
      const { startDate } = req.params;
      res.json({
        message: 'Report mensile in sviluppo',
        startDate,
        period: '30 giorni',
        userId: req.user.id
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  /**
   * GET /api/nutrition/report/quarterly/:startDate
   */
  static async getQuarterlyReport(req, res) {
    try {
      const { startDate } = req.params;
      res.json({
        message: 'Report trimestrale in sviluppo',
        startDate,
        period: '90 giorni',
        userId: req.user.id
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  /**
   * POST /api/nutrition/weight
   */
  static async logWeight(req, res) {
    try {
      const log = new NutritionLog({
        user: req.user.id,
        date: req.body.date,
        weight: req.body.weight
      });
      await log.save();
      res.status(201).json(log);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }

  /**
   * GET /api/nutrition/weight/history
   */
  static async getWeightHistory(req, res) {
    try {
      const logs = await NutritionLog.find({ user: req.user.id })
        .select('date weight')
        .sort({ date: 1 });

      res.json(logs);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  /**
   * GET /api/nutrition/export
   */
  static async exportNutritionData(req, res) {
    try {
      const logs = await NutritionLog.find({ user: req.user.id });
      res.json({ data: logs });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
}

module.exports = NutritionController;
