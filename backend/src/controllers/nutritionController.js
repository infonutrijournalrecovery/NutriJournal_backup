const NutritionGoal = require('../models/NutritionGoal');
const Meal = require('../models/Meal');
const { ValidationError, NotFoundError } = require('../middleware/errorHandler');

class NutritionController {
  // Ottieni obiettivo nutrizionale attivo
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

      // Calcola progresso attuale
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
        message: 'Obiettivo nutrizionale creato con successo',
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

  // Ottieni analisi nutrizionale giornaliera
  static async getDayAnalysis(req, res) {
    try {
      const { date } = req.params;

      if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        throw new ValidationError('Formato data non valido (richiesto: YYYY-MM-DD)');
      }

      // Ottieni pasti del giorno
      const meals = await Meal.findByUserAndDate(req.user.id, date);

      // Calcola totali nutrizionali
      const dayTotals = meals.reduce((totals, meal) => {
        const mealNutrition = meal.calculateNutrition();
        Object.keys(mealNutrition).forEach(key => {
          totals[key] = (totals[key] || 0) + (mealNutrition[key] || 0);
        });
        return totals;
      }, {});

      // Ottieni obiettivo attivo
      const activeGoal = await NutritionGoal.findActiveByUser(req.user.id);

      // Calcola progresso verso l'obiettivo
      let progress = null;
      if (activeGoal) {
        progress = activeGoal.calculateProgressForNutrition(dayTotals);
      }

      // Calcola BMR e TDEE dell'utente
      const userStats = {
        bmr: req.user.calculateBMR(),
        tdee: req.user.calculateTDEE(),
      };

      // Analizza la distribuzione dei macronutrienti
      const macroDistribution = {
        calories: dayTotals.calories || 0,
        protein: {
          grams: dayTotals.protein || 0,
          calories: (dayTotals.protein || 0) * 4,
          percentage: dayTotals.calories > 0 ? ((dayTotals.protein || 0) * 4 / dayTotals.calories * 100) : 0,
        },
        carbs: {
          grams: dayTotals.carbs || 0,
          calories: (dayTotals.carbs || 0) * 4,
          percentage: dayTotals.calories > 0 ? ((dayTotals.carbs || 0) * 4 / dayTotals.calories * 100) : 0,
        },
        fat: {
          grams: dayTotals.fat || 0,
          calories: (dayTotals.fat || 0) * 9,
          percentage: dayTotals.calories > 0 ? ((dayTotals.fat || 0) * 9 / dayTotals.calories * 100) : 0,
        },
      };

      res.json({
        success: true,
        data: {
          date,
          nutrition_totals: dayTotals,
          macro_distribution: macroDistribution,
          user_stats: userStats,
          active_goal: activeGoal ? activeGoal.toJSON() : null,
          progress,
          meals_count: meals.length,
        },
      });
    } catch (error) {
      throw error;
    }
  }

  // Ottieni analisi nutrizionale di un periodo
  static async getPeriodAnalysis(req, res) {
    try {
      const { startDate, endDate } = req.query;

      if (!startDate || !endDate) {
        throw new ValidationError('Date di inizio e fine sono obbligatorie');
      }

      if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate) || !/^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
        throw new ValidationError('Formato date non valido (richiesto: YYYY-MM-DD)');
      }

      const analysis = await Meal.getNutritionAnalysis(req.user.id, startDate, endDate);

      res.json({
        success: true,
        data: {
          analysis,
          period: {
            start_date: startDate,
            end_date: endDate,
            days: Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24)) + 1,
          },
        },
      });
    } catch (error) {
      throw error;
    }
  }

  // Ottieni raccomandazioni nutrizionali personalizzate
  static async getRecommendations(req, res) {
    try {
      const { date } = req.query;
      const targetDate = date || new Date().toISOString().split('T')[0];

      // Ottieni pasti del giorno
      const meals = await Meal.findByUserAndDate(req.user.id, targetDate);

      // Calcola totali attuali
      const currentTotals = meals.reduce((totals, meal) => {
        const mealNutrition = meal.calculateNutrition();
        Object.keys(mealNutrition).forEach(key => {
          totals[key] = (totals[key] || 0) + (mealNutrition[key] || 0);
        });
        return totals;
      }, {});

      // Ottieni obiettivo attivo
      const activeGoal = await NutritionGoal.findActiveByUser(req.user.id);

      // Calcola raccomandazioni
      const recommendations = [];

      if (activeGoal) {
        const targets = activeGoal.daily_targets;

        // Calorie rimanenti
        const remainingCalories = (targets.calories || 0) - (currentTotals.calories || 0);
        if (remainingCalories > 100) {
          recommendations.push({
            type: 'calorie_deficit',
            message: `Ti mancano ancora ${Math.round(remainingCalories)} calorie per raggiungere il tuo obiettivo giornaliero`,
            priority: 'medium',
          });
        } else if (remainingCalories < -200) {
          recommendations.push({
            type: 'calorie_excess',
            message: `Hai superato il tuo obiettivo calorico di ${Math.round(-remainingCalories)} calorie`,
            priority: 'high',
          });
        }

        // Proteine
        const remainingProtein = (targets.protein || 0) - (currentTotals.protein || 0);
        if (remainingProtein > 10) {
          recommendations.push({
            type: 'protein_low',
            message: `Considera di aggiungere ${Math.round(remainingProtein)}g di proteine`,
            priority: 'medium',
          });
        }

        // Idratazione (ipotetica)
        const waterTarget = 2000; // ml
        const currentWater = currentTotals.water || 0;
        if (currentWater < waterTarget * 0.7) {
          recommendations.push({
            type: 'hydration',
            message: 'Ricordati di bere più acqua durante la giornata',
            priority: 'medium',
          });
        }

        // Micronutrienti
        const lowMicronutrients = [];
        ['vitamin_c', 'vitamin_d', 'calcium', 'iron'].forEach(nutrient => {
          const current = currentTotals[nutrient] || 0;
          const target = targets[nutrient] || 0;
          if (target > 0 && current < target * 0.5) {
            lowMicronutrients.push(nutrient);
          }
        });

        if (lowMicronutrients.length > 0) {
          recommendations.push({
            type: 'micronutrients',
            message: `Considera di includere alimenti ricchi di: ${lowMicronutrients.join(', ')}`,
            priority: 'low',
          });
        }
      }

      // Raccomandazioni generali basate sui pattern alimentari
      const hourOfDay = new Date().getHours();
      if (hourOfDay >= 6 && hourOfDay <= 10 && meals.length === 0) {
        recommendations.push({
          type: 'breakfast',
          message: 'Non dimenticare di fare colazione per iniziare bene la giornata!',
          priority: 'medium',
        });
      }

      res.json({
        success: true,
        data: {
          date: targetDate,
          recommendations,
          current_totals: currentTotals,
          active_goal: activeGoal ? activeGoal.toJSON() : null,
        },
      });
    } catch (error) {
      throw error;
    }
  }

  // Ottieni tendenze nutrizionali
  static async getNutritionTrends(req, res) {
    try {
      const days = parseInt(req.query.days) || 30;
      const endDate = req.query.end_date || new Date().toISOString().split('T')[0];
      const startDate = new Date(endDate);
      startDate.setDate(startDate.getDate() - days + 1);

      const trends = await Meal.getNutritionTrends(
        req.user.id,
        startDate.toISOString().split('T')[0],
        endDate
      );

      res.json({
        success: true,
        data: {
          trends,
          period: {
            start_date: startDate.toISOString().split('T')[0],
            end_date: endDate,
            days,
          },
        },
      });
    } catch (error) {
      throw error;
    }
  }

  // Calcola fabbisogno calorico personalizzato
  static async calculateCalorieNeeds(req, res) {
    try {
      const { goal_type, activity_multiplier, target_weight_change_per_week } = req.body;

      // Calcola BMR e TDEE
      const bmr = req.user.calculateBMR();
      const tdee = req.user.calculateTDEE(activity_multiplier);

      let targetCalories = tdee;
      let recommendations = {};

      if (goal_type === 'weight_loss') {
        // Per perdere peso: deficit calorico
        const weeklyDeficit = (target_weight_change_per_week || 0.5) * 7700; // 7700 cal per kg
        const dailyDeficit = weeklyDeficit / 7;
        targetCalories = tdee - dailyDeficit;

        // Non andare sotto il BMR
        targetCalories = Math.max(targetCalories, bmr * 1.2);

        recommendations = {
          protein: Math.round(req.user.weight * 2.2), // 2.2g per kg per preservare massa muscolare
          carbs: Math.round(targetCalories * 0.3 / 4), // 30% delle calorie
          fat: Math.round(targetCalories * 0.3 / 9), // 30% delle calorie
        };
      } else if (goal_type === 'weight_gain') {
        // Per aumentare peso: surplus calorico
        const weeklysurplus = (target_weight_change_per_week || 0.5) * 7700;
        const dailySurplus = weeklysurplus / 7;
        targetCalories = tdee + dailySurplus;

        recommendations = {
          protein: Math.round(req.user.weight * 2.0), // 2g per kg
          carbs: Math.round(targetCalories * 0.45 / 4), // 45% delle calorie
          fat: Math.round(targetCalories * 0.25 / 9), // 25% delle calorie
        };
      } else {
        // Mantenimento
        recommendations = {
          protein: Math.round(req.user.weight * 1.6), // 1.6g per kg
          carbs: Math.round(targetCalories * 0.4 / 4), // 40% delle calorie
          fat: Math.round(targetCalories * 0.3 / 9), // 30% delle calorie
        };
      }

      res.json({
        success: true,
        data: {
          bmr: Math.round(bmr),
          tdee: Math.round(tdee),
          target_calories: Math.round(targetCalories),
          macro_recommendations: recommendations,
          goal_type,
          calculated_for: {
            weight: req.user.weight,
            height: req.user.height,
            age: req.user.getAge(),
            gender: req.user.gender,
            activity_level: req.user.activity_level,
          },
        },
      });
    } catch (error) {
      throw error;
    }
  }

  // Ottieni report nutrizionale settimanale
  static async getWeeklyReport(req, res) {
    try {
      const { week_start } = req.query;
      const startDate = week_start || (() => {
        const today = new Date();
        const monday = new Date(today);
        monday.setDate(today.getDate() - today.getDay() + 1);
        return monday.toISOString().split('T')[0];
      })();

      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 6);

      const weeklyData = await Meal.getWeeklyNutritionReport(
        req.user.id,
        startDate,
        endDate.toISOString().split('T')[0]
      );

      res.json({
        success: true,
        data: {
          week_start: startDate,
          week_end: endDate.toISOString().split('T')[0],
          daily_data: weeklyData.daily,
          weekly_averages: weeklyData.averages,
          weekly_totals: weeklyData.totals,
          insights: weeklyData.insights,
        },
      });
    } catch (error) {
      throw error;
    }
  }

  // Esporta dati nutrizionali
  static async exportNutritionData(req, res) {
    try {
      const { start_date, end_date, format = 'json' } = req.query;

      if (!start_date || !end_date) {
        throw new ValidationError('Date di inizio e fine sono obbligatorie');
      }

      const nutritionData = await Meal.exportNutritionData(
        req.user.id,
        start_date,
        end_date
      );

      if (format === 'csv') {
        // TODO: Implementare esportazione CSV
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="nutrition-data-${start_date}-${end_date}.csv"`);
        // Implementare conversione in CSV
      } else {
        res.json({
          success: true,
          data: nutritionData,
          export_info: {
            start_date,
            end_date,
            format,
            exported_at: new Date().toISOString(),
          },
        });
      }
    } catch (error) {
      throw error;
    }
  }
}

module.exports = NutritionController;
