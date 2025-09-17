const database = require('../config/database');
const User = require('./User');

class NutritionGoal {
  /**
   * Calcola le calorie target in base ai dati utente e tipo obiettivo
   * @param {User} user
   * @param {Object} goalData
   * @returns {number}
   */
  static calculateTargetCalories(user, goalData = {}) {
    // Calcolo BMR (Mifflin-St Jeor)
    let age = 30;
    if (user.date_of_birth || user.birthDate) {
      const dob = new Date(user.date_of_birth || user.birthDate);
      const today = new Date();
      age = today.getFullYear() - dob.getFullYear();
      const m = today.getMonth() - dob.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
        age--;
      }
    }
    const gender = (user.gender || '').toLowerCase();
    let bmr;
    if (gender === 'male' || gender === 'm' || gender === 'maschio') {
      bmr = 10 * user.weight + 6.25 * user.height - 5 * age + 5;
    } else if (gender === 'female' || gender === 'f' || gender === 'femmina') {
      bmr = 10 * user.weight + 6.25 * user.height - 5 * age - 161;
    } else {
      bmr = 10 * user.weight + 6.25 * user.height - 5 * age + 5;
    }
    // Moltiplicatore attività
    const activityMultipliers = {
      'sedentary': 1.2,
      'light': 1.375,
      'moderate': 1.55,
      'active': 1.725,
      'very_active': 1.9
    };
    const activityLevel = (user.activity_level || user.activityLevel || '').toLowerCase();
    const multiplier = activityMultipliers[activityLevel] || 1.2;
    let calories = bmr * multiplier;
    // Aggiustamento obiettivo
    let adjustment = 0;
    const goalType = goalData.goal_type || user.goal || 'maintain_weight';
    switch (goalType) {
      case 'lose_weight': adjustment = -500; break;
      case 'gain_muscle': adjustment = 300; break;
      case 'gain_weight': adjustment = 500; break;
      default: adjustment = 0; break;
    }
    return Math.round(calories + adjustment);
  }
  // Verifica se l'obiettivo è scaduto
  isExpired() {
    if (!this.target_date) return false;
    const now = new Date();
    const target = new Date(this.target_date);
    return now > target;
  }
  // Restituisce il valore di default per weekly_weight_change in base al tipo obiettivo
  static getDefaultWeightChange(goalType) {
    switch (goalType) {
      case 'lose_weight': return -0.5;
      case 'gain_weight': return 0.5;
      case 'gain_muscle': return 0.25;
      case 'maintain_weight': return 0;
      default: return 0;
    }
  }
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
          const goalType = 'maintain_weight';
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
          const goalType = 'maintain_weight';
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

    // Obiettivi macronutrienti (compatibilità con nomi diversi)
    this.target_calories = data.target_calories || data.calories_target;
    this.target_carbs_percent = data.target_carbs_percent;
    this.target_protein_percent = data.target_protein_percent;
    this.target_fat_percent = data.target_fat_percent;
    this.target_water_liters = data.target_water_liters;

    // Compatibilità con vecchi nomi
    this.calories_target = this.target_calories;
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
        async (err, row) => {
          if (err) {
            console.error('❌ Errore ricerca obiettivo attivo:', err);
            reject(new Error('Errore ricerca obiettivo attivo'));
          } else {
            if (row) {
              const User = require('./User');
              const user = await User.findById(userId);
              const goal = new NutritionGoal(row);
              goal.user = user;
              resolve(goal);
            } else {
              resolve(null);
            }
          }
        }
      );
    });
  }

  // Ottieni tutti gli obiettivi dell'utente
  static async findByUser(userId, includeInactive = false) {
    return new Promise((resolve, reject) => {
      let sql = `SELECT * FROM nutrition_goals WHERE user_id = ?`;
      let params = [userId];
      if (!includeInactive) {
        sql += ` AND is_active = 1`;
      }
      sql += ` ORDER BY created_at DESC`;
      database.sqliteDb.all(sql, params, async (err, rows) => {
        if (err) {
          console.error('❌ Errore ricerca obiettivi utente:', err);
          return reject(new Error('Errore ricerca obiettivi'));
        }
        // Recupera utente per calcoli
        const User = require('./User');
        let user = null;
        if (rows.length > 0) {
          user = await User.findById(userId);
        }
        resolve(rows.map(goal => {
          const g = new NutritionGoal(goal);
          if (user) g.user = user;
          return g;
        }));
      });
    });
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

      // Macro ratios dinamici come nel frontend
      let proteinRatio, carbsRatio, fatsRatio;
      switch (goalData.goal_type) {
        case 'lose_weight':
          proteinRatio = 0.30; carbsRatio = 0.40; fatsRatio = 0.30; break;
        case 'gain_muscle':
          proteinRatio = 0.25; carbsRatio = 0.45; fatsRatio = 0.30; break;
        case 'gain_weight':
          proteinRatio = 0.20; carbsRatio = 0.50; fatsRatio = 0.30; break;
        case 'maintain_weight':
          proteinRatio = 0.25; carbsRatio = 0.45; fatsRatio = 0.30; break;
        default: // maintain_weight
          proteinRatio = 0.25; carbsRatio = 0.45; fatsRatio = 0.30; break;
      }

      // Calcolo acqua come nel frontend
      let waterML = user.weight * 35;
      const activityBonus = {
        'sedentary': 0,
        'light': 200,
        'moderate': 400,
        'active': 600,
        'very_active': 800
      };
      waterML += activityBonus[user.activity_level] || 400;
      const target_water_liters = Math.round((waterML / 1000) * 10) / 10;

      // Calcolo goal adjustment come nel frontend
      let goalAdjustment = 0;
      switch (goalData.goal_type) {
        case 'lose_weight': goalAdjustment = -500; break;
        case 'gain_muscle': goalAdjustment = 300; break;
        case 'gain_weight': goalAdjustment = 500; break;
        default: goalAdjustment = 0; break;
      }

      const goalToCreate = {
        user_id: goalData.user_id,
        goal_type: goalData.goal_type,
        target_weight: goalData.target_weight,
        target_calories: goalData.target_calories || this.calculateTargetCalories(user, goalData),
        target_carbs_percent: Math.round(carbsRatio * 100),
        target_protein_percent: Math.round(proteinRatio * 100),
        target_fat_percent: Math.round(fatsRatio * 100),
        target_water_liters,
        goal_adjustment: goalAdjustment,
  weekly_weight_change: goalData.weekly_weight_change || NutritionGoal.getDefaultWeightChange(goalData.goal_type),
        start_date: goalData.start_date || new Date().toISOString().split('T')[0],
        target_date: goalData.target_date,
        is_active: goalData.is_active !== false,
        created_at: new Date().toISOString(),
      };

      // Inserimento con callback style
      return await new Promise((resolve, reject) => {
        // Disattiva obiettivi precedenti se questo è attivo
        if (goalToCreate.is_active) {
          database.sqliteDb.run(
            `UPDATE nutrition_goals SET is_active = 0 WHERE user_id = ?`,
            [goalToCreate.user_id],
            function (err) {
              if (err) {
                console.error('❌ Errore disattivazione obiettivi precedenti:', err);
                return reject(err);
              }
              insertGoal();
            }
          );
        } else {
          insertGoal();
        }

        function insertGoal() {
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
              NutritionGoal.findById(this.lastID)
                .then(resolve)
                .catch(reject);
            }
          );
        }
      });
    } catch (error) {
      console.error('❌ Errore creazione obiettivo:', error);
      throw error;
    }
  }

  // Calcola macronutrienti target in grammi
  getTargetMacros() {
    if (!this.target_calories) return null;

    const carbsCalories = (this.target_calories * this.target_carbs_percent) / 100;
    const proteinCalories = (this.target_calories * this.target_protein_percent) / 100;
    const fatCalories = (this.target_calories * this.target_fat_percent) / 100;

    return {
      carbsGrams: Math.round(carbsCalories / 4),
      carbsCalories: Math.round(carbsCalories),
      carbsPercentage: this.target_carbs_percent,
      proteinGrams: Math.round(proteinCalories / 4),
      proteinCalories: Math.round(proteinCalories),
      proteinPercentage: this.target_protein_percent,
      fatsGrams: Math.round(fatCalories / 9),
      fatsCalories: Math.round(fatCalories),
      fatsPercentage: this.target_fat_percent
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
      lose_weight: 'Perdita di peso',
      gain_weight: 'Aumento di peso',
      maintain_weight: 'Mantenimento',
      gain_muscle: 'Aumento massa muscolare',
    };
    
    return types[this.goal_type] || 'Obiettivo personalizzato';
  }

  // Aggiorna obiettivo
  update(updates) {
    return new Promise((resolve, reject) => {
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
        database.sqliteDb.run(
          `UPDATE nutrition_goals SET is_active = 0 WHERE user_id = ? AND id != ?`,
          [this.user_id, this.id],
          (err) => {
            if (err) {
              console.error('❌ Errore disattivazione altri obiettivi:', err);
              return reject(new Error('Errore aggiornamento obiettivo'));
            }
            updateGoal();
          }
        );
      } else {
        updateGoal();
      }

      const self = this;
      function updateGoal() {
        const fields = Object.keys(filteredUpdates);
        if (fields.length === 0) return resolve(self);
        const setClause = fields.map(f => `${f} = ?`).join(', ');
        const values = fields.map(f => filteredUpdates[f]);
        values.push(self.id);
        database.sqliteDb.run(
          `UPDATE nutrition_goals SET ${setClause} WHERE id = ?`,
          values,
          (err) => {
            if (err) {
              console.error('❌ Errore aggiornamento obiettivo:', err);
              return reject(new Error('Errore aggiornamento obiettivo'));
            }
            Object.assign(self, filteredUpdates);
            resolve(self);
          }
        );
      }
    });
  }

  // Restituisce raccomandazioni per l'obiettivo
  getRecommendations() {
    const recommendations = [];
    if (this.goal_type === 'lose_weight') {
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
    } else if (this.goal_type === 'gain_muscle') {
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

    // Esplicita i campi fondamentali per la dashboard
    goal.target_calories = this.target_calories;
    goal.target_carbs_percent = this.target_carbs_percent;
    goal.target_protein_percent = this.target_protein_percent;
    goal.target_fat_percent = this.target_fat_percent;
    goal.target_water_liters = this.target_water_liters;
    goal.goal_adjustment = this.goal_adjustment || 0;

    // Aggiungi dati calcolati
    goal.goal_type_italian = this.getGoalTypeItalian();
    goal.target_macros = this.getTargetMacros();
    goal.weeks_since_start = this.getWeeksSinceStart();
    goal.estimated_duration_weeks = this.getEstimatedDurationWeeks();
    goal.is_expired = this.isExpired();
    goal.recommendations = this.getRecommendations();

    // Espone anche i valori singoli come nel frontend
    if (goal.target_macros) {
      goal.proteinGrams = goal.target_macros.proteinGrams;
      goal.proteinCalories = goal.target_macros.proteinCalories;
      goal.proteinPercentage = goal.target_macros.proteinPercentage;
      goal.carbsGrams = goal.target_macros.carbsGrams;
      goal.carbsCalories = goal.target_macros.carbsCalories;
      goal.carbsPercentage = goal.target_macros.carbsPercentage;
      goal.fatsGrams = goal.target_macros.fatsGrams;
      goal.fatsCalories = goal.target_macros.fatsCalories;
      goal.fatsPercentage = goal.target_macros.fatsPercentage;
    }

    // Espone anche il calcolo acqua e goal adjustment
    goal.dailyWater = goal.target_water_liters;
    goal.waterIntake = goal.target_water_liters;

    // Espone BMR, livello attività e calorie attività
    try {
      // Recupera dati utente se disponibili
      const user = this.user || this._user || null;
      if (user && user.weight && user.height && user.gender && (user.activity_level || user.activityLevel)) {
        // Calcolo BMR
        let age = 30;
        if (user.birthDate || user.date_of_birth) {
          const dob = new Date(user.birthDate || user.date_of_birth);
          const today = new Date();
          age = today.getFullYear() - dob.getFullYear();
          const m = today.getMonth() - dob.getMonth();
          if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
            age--;
          }
        }
        const gender = (user.gender || '').toLowerCase();
        let bmr;
        if (gender === 'male' || gender === 'm' || gender === 'maschio') {
          bmr = 10 * user.weight + 6.25 * user.height - 5 * age + 5;
        } else if (gender === 'female' || gender === 'f' || gender === 'femmina') {
          bmr = 10 * user.weight + 6.25 * user.height - 5 * age - 161;
        } else {
          bmr = 10 * user.weight + 6.25 * user.height - 5 * age + 5;
        }
        // Livello attività
        const activityMultipliers = {
          'sedentary': 1.2,
          'light': 1.375,
          'moderate': 1.55,
          'active': 1.725,
          'very_active': 1.9
        };
        const activityLevel = (user.activity_level || user.activityLevel || '').toLowerCase();
        const multiplier = activityMultipliers[activityLevel] || 1.2;
        goal.bmr = Math.round(bmr);
        goal.activity_level = activityLevel;
        goal.activity_level_label = {
          'sedentary': 'Sedentario',
          'light': 'Leggero',
          'moderate': 'Moderato',
          'active': 'Attivo',
          'very_active': 'Molto attivo'
        }[activityLevel] || activityLevel;
        // Calorie attività = TDEE - BMR
        goal.activity_calories = Math.round(bmr * multiplier - bmr);
      } else {
        goal.bmr = null;
        goal.activity_level = null;
        goal.activity_level_label = null;
        goal.activity_calories = null;
      }
    } catch (e) {
      goal.bmr = null;
      goal.activity_level = null;
      goal.activity_level_label = null;
      goal.activity_calories = null;
    }

    return goal;
  }

  // Statistiche obiettivi
  static async getStats() {
    // TODO: Implement stats with sqliteDb if needed
  }
}

module.exports = NutritionGoal;
