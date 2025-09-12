const database = require('../config/database');
const User = require('./User');

class NutritionGoal {
  /**
   * Ricalcola e salva un nuovo obiettivo nutrizionale per l'utente
   * @param {User} user - Oggetto utente
   * @returns {Promise<NutritionGoal>} Il nuovo obiettivo creato
   */
  static recalculateGoals(user) {
    return new Promise((resolve, reject) => {
      // Disattiva eventuale obiettivo attivo
      database.sqliteDb.run(
        `UPDATE nutrition_goals SET is_active = 0 WHERE user_id = ? AND is_active = 1`,
        [user.id],
        function (err) {
          if (err) {
            console.error('❌ Errore disattivazione obiettivo attivo:', err);
            return reject(err);
          }
          // Calcola calorie target
          const goalType = 'maintenance';
          const target_calories = NutritionGoal.calculateTargetCalories(user, { goal_type: goalType });
          const now = new Date().toISOString();
          const goalToCreate = {
            user_id: user.id,
            goal_type: goalType,
            target_weight: user.weight,
            target_calories,
            target_carbs_percent: 50,
            target_protein_percent: 20,
            target_fat_percent: 30,
            target_water_liters: 2.0,
            weekly_weight_change: 0,
            start_date: now,
            is_active: 1,
            created_at: now
          };
          const fields = Object.keys(goalToCreate).join(', ');
          const placeholders = Object.keys(goalToCreate).map(() => '?').join(', ');
          const values = Object.values(goalToCreate);
          database.sqliteDb.run(
            `INSERT INTO nutrition_goals (${fields}) VALUES (${placeholders})`,
            values,
            function (err) {
              if (err) {
                console.error('❌ Errore inserimento nuovo obiettivo:', err);
                return reject(err);
              }
              // Recupera il nuovo obiettivo
              NutritionGoal.findById(this.lastID)
                .then(resolve)
                .catch(reject);
            }
          );
        }
      );
    });
  }
  /**
   * Ricalcola e salva un nuovo obiettivo nutrizionale per l'utente
   * @param {User} user - Oggetto utente
   * @returns {Promise<NutritionGoal>} Il nuovo obiettivo creato
   */
  static async recalculateGoals(user) {
    return new Promise((resolve, reject) => {
      // Disattiva eventuale obiettivo attivo
      database.sqliteDb.run(
        `UPDATE nutrition_goals SET is_active = 0 WHERE user_id = ? AND is_active = 1`,
        [user.id],
        function (err) {
          if (err) {
            console.error('Errore disattivazione obiettivo attivo:', err);
            return reject(err);
          }
          // Calcola calorie target
          const goalType = 'maintenance';
          const target_calories = NutritionGoal.calculateTargetCalories(user, { goal_type: goalType });
          const now = new Date().toISOString();
          const goalToCreate = {
            user_id: user.id,
            goal_type: goalType,
            target_weight: user.weight,
            target_calories,
            target_carbs_percent: 50,
            target_protein_percent: 20,
            target_fat_percent: 30,
            target_water_liters: 2.0,
            weekly_weight_change: 0,
            start_date: now,
            is_active: 1,
            created_at: now
          };
          const fields = Object.keys(goalToCreate).join(', ');
          const placeholders = Object.keys(goalToCreate).map(() => '?').join(', ');
          const values = Object.values(goalToCreate);
          database.sqliteDb.run(
            `INSERT INTO nutrition_goals (${fields}) VALUES (${placeholders})`,
            values,
            function (err) {
              if (err) {
                console.error('Errore inserimento nuovo obiettivo:', err);
                return reject(err);
              }
              // Recupera il nuovo obiettivo
              NutritionGoal.findById(this.lastID)
                .then(resolve)
                .catch(reject);
            }
          );
        }
      );
    });
  }
  constructor(data = {}) {
    this.id = data.id;
    this.user_id = data.user_id;
    this.goal_type = data.goal_type;
    
    // Obiettivi peso
    this.target_weight = data.target_weight;
    this.weekly_weight_change = data.weekly_weight_change;
    
    // Obiettivi macronutrienti
    this.calories_target = data.calories_target;
    this.proteins_target = data.proteins_target;
    this.carbs_target = data.carbs_target;
    this.fats = {
      total_target: data.fats_target,
      saturated_target: data.fats_saturated_target,
      unsaturated_target: data.fats_unsaturated_target
    };
    
    // Altri nutrienti
    this.fiber_target = data.fiber_target;
    this.water_target = data.water_target;
    
    // Micronutrienti (vitamine e minerali)
    this.vitamins_minerals = data.vitamins_minerals || {};
    
    // Date e stato
    this.start_date = data.start_date;
    this.target_date = data.target_date;
    this.is_active = data.is_active !== false; // default true
    this.created_at = data.created_at;
  }

  static get tableName() {
    return 'nutrition_goals';
  }

  // Trova obiettivo per ID
  static findById(id) {
    return new Promise((resolve, reject) => {
      database.sqliteDb.get(
        `SELECT * FROM nutrition_goals WHERE id = ?`,
        [id],
        (err, row) => {
          if (err) {
            console.error('❌ Errore ricerca obiettivo per ID:', err);
            reject(new Error('Errore ricerca obiettivo'));
          } else {
            resolve(row ? new NutritionGoal(row) : null);
          }
        }
      );
    });
  }

  // Trova obiettivo attivo dell'utente
  static findActiveByUser(userId) {
    return new Promise((resolve, reject) => {
      database.sqliteDb.get(
        `SELECT * FROM nutrition_goals WHERE user_id = ? AND is_active = 1 ORDER BY created_at DESC LIMIT 1`,
        [userId],
        (err, row) => {
          if (err) {
            console.error('❌ Errore ricerca obiettivo attivo:', err);
            reject(new Error('Errore ricerca obiettivo attivo'));
          } else {
            resolve(row ? new NutritionGoal(row) : null);
          }
        }
      );
    });
  }

  // Ottieni tutti gli obiettivi dell'utente
  static async findByUser(userId, includeInactive = false) {
    try {
      let query = this.db(this.tableName)
        .where('user_id', userId);

      if (!includeInactive) {
        query = query.where('is_active', true);
      }

      const goals = await query.orderBy('created_at', 'desc');
      
      return goals.map(goal => new NutritionGoal(goal));
    } catch (error) {
      console.error('❌ Errore ricerca obiettivi utente:', error);
      throw new Error('Errore ricerca obiettivi');
    }
  }

  /**
   * Calcola il progresso verso gli obiettivi nutrizionali
   * @param {Object} dailyNutrition - Dati nutrizionali giornalieri
   * @returns {Object} Percentuali di completamento degli obiettivi
   */
  calculateProgress(dailyNutrition) {
    return {
      calories: this.calculatePercentage(dailyNutrition.calories, this.calories_target),
      proteins: this.calculatePercentage(dailyNutrition.proteins, this.proteins_target),
      carbs: this.calculatePercentage(dailyNutrition.carbs, this.carbs_target),
      fats: {
        total: this.calculatePercentage(dailyNutrition.fats.total, this.fats.total_target),
        saturated: this.calculatePercentage(dailyNutrition.fats.saturated, this.fats.saturated_target),
        unsaturated: this.calculatePercentage(dailyNutrition.fats.unsaturated, this.fats.unsaturated_target)
      },
      fiber: this.calculatePercentage(dailyNutrition.fiber, this.fiber_target),
      water: this.calculatePercentage(dailyNutrition.water, this.water_target),
      vitamins_minerals: Object.entries(this.vitamins_minerals).reduce((acc, [nutrient, target]) => {
        acc[nutrient] = this.calculatePercentage(dailyNutrition.vitamins_minerals?.[nutrient] || 0, target);
        return acc;
      }, {})
    };
  }

  /**
   * Calcola una percentuale con gestione degli edge case
   * @private
   */
  calculatePercentage(actual, target) {
    if (!target) return null;
    if (!actual) return 0;
    return Math.round((actual / target) * 100);
  }

  // Crea nuovo obiettivo
  static async create(goalData) {
    try {
      // Validazione dati base
      if (!goalData.user_id || !goalData.goal_type) {
        throw new Error('User ID e tipo obiettivo sono obbligatori');
      }

      // Verifica se utente esiste
      const user = await User.findById(goalData.user_id);
      if (!user) {
        throw new Error('Utente non trovato');
      }

      // Disattiva obiettivi precedenti se questo è attivo
      if (goalData.is_active !== false) {
        await this.db(this.tableName)
          .where('user_id', goalData.user_id)
          .update({ is_active: false });
      }

      // Calcola calorie target se non fornite
      let target_calories = goalData.target_calories;
      if (!target_calories) {
        target_calories = this.calculateTargetCalories(user, goalData);
      }

      const goalToCreate = {
        user_id: goalData.user_id,
        goal_type: goalData.goal_type,
        target_weight: goalData.target_weight,
        target_calories,
        target_carbs_percent: goalData.target_carbs_percent || 50,
        target_protein_percent: goalData.target_protein_percent || 20,
        target_fat_percent: goalData.target_fat_percent || 30,
        target_water_liters: goalData.target_water_liters || 2.0,
        weekly_weight_change: goalData.weekly_weight_change || this.getDefaultWeightChange(goalData.goal_type),
        start_date: goalData.start_date || new Date().toISOString().split('T')[0],
        target_date: goalData.target_date,
        is_active: goalData.is_active !== false,
        created_at: new Date().toISOString(),
      };

      const [goalId] = await this.db(this.tableName).insert(goalToCreate);
      return await this.findById(goalId);
    } catch (error) {
      console.error('❌ Errore creazione obiettivo:', error);
      throw error;
    }
  }

  // Calcola calorie target basate su utente e obiettivo
  static calculateTargetCalories(user, goalData) {
    const tdee = user.calculateTDEE();
    if (!tdee) return 2000; // fallback

    const weightChangeGoals = {
      weight_loss: -0.5,      // -0.5 kg/settimana
      weight_gain: 0.3,       // +0.3 kg/settimana
      muscle_gain: 0.2,       // +0.2 kg/settimana
      maintenance: 0,         // mantenimento
    };

    const weeklyChange = goalData.weekly_weight_change || weightChangeGoals[goalData.goal_type] || 0;
    
    // 1 kg di grasso = circa 7700 calorie
    const dailyCalorieAdjustment = (weeklyChange * 7700) / 7;
    
    return Math.round(tdee + dailyCalorieAdjustment);
  }

  // Ottieni cambio peso di default per tipo obiettivo
  static getDefaultWeightChange(goalType) {
    const defaults = {
      weight_loss: -0.5,
      weight_gain: 0.3,
      muscle_gain: 0.2,
      maintenance: 0,
    };
    
    return defaults[goalType] || 0;
  }

  // Aggiorna obiettivo
  async update(updates) {
    try {
      const allowedFields = [
        'goal_type', 'target_weight', 'target_calories',
        'target_carbs_percent', 'target_protein_percent', 'target_fat_percent',
        'target_water_liters', 'weekly_weight_change', 'target_date', 'is_active'
      ];

      const filteredUpdates = {};
      Object.keys(updates).forEach(key => {
        if (allowedFields.includes(key)) {
          filteredUpdates[key] = updates[key];
        }
      });

      // Se si sta attivando questo obiettivo, disattiva gli altri
      if (filteredUpdates.is_active === true) {
        await NutritionGoal.db(NutritionGoal.tableName)
          .where('user_id', this.user_id)
          .where('id', '!=', this.id)
          .update({ is_active: false });
      }

      await NutritionGoal.db(NutritionGoal.tableName)
        .where('id', this.id)
        .update(filteredUpdates);

      Object.assign(this, filteredUpdates);
      return this;
    } catch (error) {
      console.error('❌ Errore aggiornamento obiettivo:', error);
      throw new Error('Errore aggiornamento obiettivo');
    }
  }

  // Calcola macronutrienti target in grammi
  getTargetMacros() {
    if (!this.target_calories) return null;

    const carbsCalories = (this.target_calories * this.target_carbs_percent) / 100;
    const proteinCalories = (this.target_calories * this.target_protein_percent) / 100;
    const fatCalories = (this.target_calories * this.target_fat_percent) / 100;

    return {
      carbs: Math.round(carbsCalories / 4), // 4 cal/g
      protein: Math.round(proteinCalories / 4), // 4 cal/g
      fat: Math.round(fatCalories / 9), // 9 cal/g
    };
  }

  // Calcola progresso verso l'obiettivo
  async calculateProgress(currentWeight = null) {
    try {
      // Se non fornito peso corrente, cerca l'ultimo peso registrato
      if (!currentWeight) {
        const latestWeight = await NutritionGoal.db('weight_entries')
          .where('user_id', this.user_id)
          .orderBy('date', 'desc')
          .orderBy('created_at', 'desc')
          .first();
        
        currentWeight = latestWeight ? latestWeight.weight : null;
      }

      if (!currentWeight || !this.target_weight) {
        return null;
      }

      const user = await User.findById(this.user_id);
      const startWeight = user ? user.weight : currentWeight;

      const totalWeightChange = this.target_weight - startWeight;
      const currentWeightChange = currentWeight - startWeight;

      let progressPercent = 0;
      if (totalWeightChange !== 0) {
        progressPercent = Math.round((currentWeightChange / totalWeightChange) * 100);
      }

      // Calcola tempo rimanente stimato
      const weeksPassed = this.getWeeksSinceStart();
      const estimatedWeeks = this.getEstimatedDurationWeeks();
      const remainingWeeks = Math.max(0, estimatedWeeks - weeksPassed);

      return {
        start_weight: startWeight,
        current_weight: currentWeight,
        target_weight: this.target_weight,
        weight_change: currentWeightChange,
        weight_remaining: this.target_weight - currentWeight,
        progress_percent: progressPercent,
        weeks_passed: weeksPassed,
        estimated_weeks_remaining: remainingWeeks,
        on_track: this.isOnTrack(currentWeight, startWeight),
      };
    } catch (error) {
      console.error('❌ Errore calcolo progresso:', error);
      return null;
    }
  }

  // Verifica se si è in linea con l'obiettivo
  isOnTrack(currentWeight, startWeight) {
    if (!this.weekly_weight_change || this.weekly_weight_change === 0) {
      return true; // obiettivo mantenimento
    }

    const weeksPassed = this.getWeeksSinceStart();
    const expectedWeightChange = this.weekly_weight_change * weeksPassed;
    const actualWeightChange = currentWeight - startWeight;

    // Tolleranza del 20%
    const tolerance = Math.abs(expectedWeightChange * 0.2);
    
    return Math.abs(actualWeightChange - expectedWeightChange) <= tolerance;
  }

  // Calcola settimane dall'inizio
  getWeeksSinceStart() {
    if (!this.start_date) return 0;
    
    const startDate = new Date(this.start_date);
    const now = new Date();
    const diffMs = now - startDate;
    const diffWeeks = diffMs / (1000 * 60 * 60 * 24 * 7);
    
    return Math.max(0, diffWeeks);
  }

  // Calcola durata stimata dell'obiettivo in settimane
  getEstimatedDurationWeeks() {
    if (!this.weekly_weight_change || this.weekly_weight_change === 0) {
      return null; // obiettivo mantenimento
    }

    if (this.target_date) {
      const startDate = new Date(this.start_date);
      const targetDate = new Date(this.target_date);
      const diffMs = targetDate - startDate;
      return Math.max(0, diffMs / (1000 * 60 * 60 * 24 * 7));
    }

    // Calcola basandosi sul peso target
    const user = User.findById(this.user_id);
    if (!user || !user.weight || !this.target_weight) {
      return null;
    }

    const weightDifference = this.target_weight - user.weight;
    return Math.abs(weightDifference / this.weekly_weight_change);
  }

  // Ottieni tipo obiettivo in italiano
  getGoalTypeItalian() {
    const types = {
      weight_loss: 'Perdita di peso',
      weight_gain: 'Aumento di peso',
      maintenance: 'Mantenimento',
      muscle_gain: 'Aumento massa muscolare',
    };
    
    return types[this.goal_type] || 'Obiettivo personalizzato';
  }

  // Verifica se obiettivo è scaduto
  isExpired() {
    if (!this.target_date) return false;
    
    const targetDate = new Date(this.target_date);
    const now = new Date();
    
    return now > targetDate;
  }

  // Disattiva obiettivo
  async deactivate() {
    return await this.update({ is_active: false });
  }

  // Elimina obiettivo
  async delete() {
    try {
      await NutritionGoal.db(NutritionGoal.tableName)
        .where('id', this.id)
        .del();
      
      return true;
    } catch (error) {
      console.error('❌ Errore eliminazione obiettivo:', error);
      throw new Error('Errore eliminazione obiettivo');
    }
  }

  // Genera raccomandazioni basate sull'obiettivo
  getRecommendations() {
    const recommendations = [];

    if (this.goal_type === 'weight_loss') {
      recommendations.push({
        type: 'calories',
        message: 'Mantieni un deficit calorico moderato per una perdita di peso sostenibile',
        icon: '🔥',
      });
      recommendations.push({
        type: 'protein',
        message: 'Aumenta le proteine per preservare la massa muscolare',
        icon: '💪',
      });
    } else if (this.goal_type === 'muscle_gain') {
      recommendations.push({
        type: 'calories',
        message: 'Mantieni un leggero surplus calorico per supportare la crescita muscolare',
        icon: '📈',
      });
      recommendations.push({
        type: 'protein',
        message: 'Consuma almeno 1.6-2.2g di proteine per kg di peso corporeo',
        icon: '🥩',
      });
    }

    if (this.target_water_liters) {
      recommendations.push({
        type: 'water',
        message: `Bevi almeno ${this.target_water_liters}L di acqua al giorno`,
        icon: '💧',
      });
    }

    return recommendations;
  }

  // Serializza per JSON
  toJSON() {
    const goal = { ...this };
    
    // Aggiungi dati calcolati
    goal.goal_type_italian = this.getGoalTypeItalian();
    goal.target_macros = this.getTargetMacros();
    goal.weeks_since_start = this.getWeeksSinceStart();
    goal.estimated_duration_weeks = this.getEstimatedDurationWeeks();
    goal.is_expired = this.isExpired();
    goal.recommendations = this.getRecommendations();
    
    return goal;
  }

  // Statistiche obiettivi
  static async getStats() {
    try {
      const stats = await this.db(this.tableName)
        .select([
          this.db.raw('COUNT(*) as total_goals'),
          this.db.raw('COUNT(CASE WHEN is_active = 1 THEN 1 END) as active_goals'),
          this.db.raw('COUNT(CASE WHEN goal_type = "weight_loss" THEN 1 END) as weight_loss_goals'),
          this.db.raw('COUNT(CASE WHEN goal_type = "weight_gain" THEN 1 END) as weight_gain_goals'),
          this.db.raw('COUNT(CASE WHEN goal_type = "maintenance" THEN 1 END) as maintenance_goals'),
          this.db.raw('COUNT(CASE WHEN goal_type = "muscle_gain" THEN 1 END) as muscle_gain_goals'),
          this.db.raw('AVG(target_calories) as avg_target_calories'),
        ])
        .first();

      return stats;
    } catch (error) {
      console.error('❌ Errore statistiche obiettivi:', error);
      return null;
    }
  }
}

module.exports = NutritionGoal;
