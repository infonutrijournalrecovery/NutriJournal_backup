// nutritionUtils.js
const { logger } = require('../middleware/logging');

/**
 * Costanti nutrizionali
 */
const NUTRITION_CONSTANTS = {
  CALORIES_PER_GRAM: {
    PROTEIN: 4,
    CARBS: 4,
    FAT: 9,
    FIBER: 2
  },
  WATER_NEEDS: {
    BASE_ML_PER_KG: 30,
    ACTIVITY_BONUS: 0.7
  },
  FAT_RATIO: {
    RECOMMENDED_UNSATURATED_TO_SATURATED: 2,
    SATURATED_MAX_PERCENTAGE: 0.33
  },
  ACTIVITY_MULTIPLIERS: {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    very_active: 1.9
  },
  GOAL_MODIFIERS: {
    weight_loss: 0.8,
    maintain: 1.0,
    muscle_gain: 1.1
  },
  MACRO_DISTRIBUTIONS: {
    weight_loss: { protein: 0.35, fat: 0.35, carbs: 0.30 },
    maintain: { protein: 0.30, fat: 0.30, carbs: 0.40 },
    muscle_gain: { protein: 0.30, fat: 0.20, carbs: 0.50 }
  }
};

/**
 * Calcola BMI
 */
function calculateBMI(weight, height) {
  if (!weight || !height || weight <= 0 || height <= 0) {
    throw new Error('Peso e altezza devono essere numeri positivi');
  }

  const h = height / 100;
  const bmi = weight / (h * h);

  let category, category_it;
  if (bmi < 18.5) { category = 'underweight'; category_it = 'Sottopeso'; }
  else if (bmi < 25) { category = 'normal'; category_it = 'Normopeso'; }
  else if (bmi < 30) { category = 'overweight'; category_it = 'Sovrappeso'; }
  else { category = 'obese'; category_it = 'Obesità'; }

  return {
    bmi: Math.round(bmi * 10) / 10,
    category,
    category_it,
    ranges: {
      underweight: '< 18.5',
      normal: '18.5 - 24.9',
      overweight: '25.0 - 29.9',
      obese: '≥ 30.0'
    }
  };
}

/**
 * Calcola BMR (Mifflin-St Jeor)
 */
function calculateBMR(weight, height, age, gender) {
  if (gender === 'male') return 10 * weight + 6.25 * height - 5 * age + 5;
  return 10 * weight + 6.25 * height - 5 * age - 161;
}

/**
 * Calcola TDEE
 */
function calculateTDEE(bmr, activityLevel) {
  const factor = NUTRITION_CONSTANTS.ACTIVITY_MULTIPLIERS[activityLevel];
  if (!factor) throw new Error('Livello di attività non valido');
  return Math.round(bmr * factor);
}

/**
 * Calcola fabbisogni nutrizionali personalizzati
 */
function calculateNutritionNeeds(user, goalType) {
  const age = calculateAge(user.date_of_birth);
  const bmr = calculateBMR(user.weight, user.height, age, user.gender === 'M' ? 'male' : 'female');
  const tdee = calculateTDEE(bmr, user.activity_level);

  const targetCalories = Math.round(tdee * (NUTRITION_CONSTANTS.GOAL_MODIFIERS[goalType] || 1));
  const distribution = NUTRITION_CONSTANTS.MACRO_DISTRIBUTIONS[goalType] || NUTRITION_CONSTANTS.MACRO_DISTRIBUTIONS.maintain;

  const macros = {
    protein: Math.round((targetCalories * distribution.protein) / NUTRITION_CONSTANTS.CALORIES_PER_GRAM.PROTEIN),
    carbs: Math.round((targetCalories * distribution.carbs) / NUTRITION_CONSTANTS.CALORIES_PER_GRAM.CARBS),
    fat: {
      total: Math.round((targetCalories * distribution.fat) / NUTRITION_CONSTANTS.CALORIES_PER_GRAM.FAT)
    }
  };
  macros.fat.saturated = Math.round(macros.fat.total * NUTRITION_CONSTANTS.FAT_RATIO.SATURATED_MAX_PERCENTAGE);
  macros.fat.unsaturated = macros.fat.total - macros.fat.saturated;

  const water = Math.round(user.weight * NUTRITION_CONSTANTS.WATER_NEEDS.BASE_ML_PER_KG);
  const fiber = Math.round((targetCalories / 1000) * 14);

  return { calories: targetCalories, macros, water, fiber, bmr, tdee };
}

/**
 * Analizza i dati nutrizionali per un periodo
 */
function analyzePeriodData(meals, activeGoal) {
  const dailyData = meals.reduce((acc, meal) => {
    const day = meal.date.toISOString().split('T')[0];
    if (!acc[day]) {
      acc[day] = { date: day, nutrients: { calories:0, protein:0, carbs:0, fat:{total:0, saturated:0, unsaturated:0}, fiber:0, water:0 }, mealCount:0 };
    }

    acc[day].mealCount++;
    Object.entries(meal.nutrients).forEach(([nutrient, value]) => {
      switch(nutrient) {
        case 'calories': case 'protein': case 'carbs': case 'fiber': case 'water':
          acc[day].nutrients[nutrient] += value; break;
        case 'fats_saturated':
          acc[day].nutrients.fat.saturated += value;
          acc[day].nutrients.fat.total += value; break;
        case 'fats_unsaturated':
          acc[day].nutrients.fat.unsaturated += value;
          acc[day].nutrients.fat.total += value; break;
      }
    });

    return acc;
  }, {});

  const stats = {
    adherence: calculateAdherence(dailyData, activeGoal),
    trends: calculateTrends(dailyData),
    distributions: calculateDistributions(dailyData),
    recommendations: generateRecommendations(dailyData, activeGoal)
  };

  return { dailyData, stats };
}

/**
 * Funzioni private per analyzePeriodData
 */
function calculateAdherence(dailyData, goal) {
  const dailyValues = Object.values(dailyData);
  return {
    calories: calculateAveragePercentage(dailyValues, 'calories', goal.calories_target),
    protein: calculateAveragePercentage(dailyValues, 'protein', goal.protein_target),
    carbs: calculateAveragePercentage(dailyValues, 'carbs', goal.carbs_target),
    fat: {
      total: calculateAveragePercentage(dailyValues, ['fat','total'], goal.fats_target),
      saturated: calculateAveragePercentage(dailyValues, ['fat','saturated'], goal.fats_saturated_target),
      unsaturated: calculateAveragePercentage(dailyValues, ['fat','unsaturated'], goal.fats_unsaturated_target)
    },
    fiber: calculateAveragePercentage(dailyValues, 'fiber', goal.fiber_target),
    water: calculateAveragePercentage(dailyValues, 'water', goal.water_target)
  };
}

function calculateTrends(dailyData) {
  const sortedDays = Object.keys(dailyData).sort();
  if (sortedDays.length < 2) return null;
  const firstDay = dailyData[sortedDays[0]].nutrients;
  const lastDay = dailyData[sortedDays[sortedDays.length-1]].nutrients;

  return {
    calories: calculatePercentageChange(firstDay.calories, lastDay.calories),
    protein: calculatePercentageChange(firstDay.protein, lastDay.protein),
    carbs: calculatePercentageChange(firstDay.carbs, lastDay.carbs),
    fat: {
      total: calculatePercentageChange(firstDay.fat.total, lastDay.fat.total),
      saturated: calculatePercentageChange(firstDay.fat.saturated, lastDay.fat.saturated),
      unsaturated: calculatePercentageChange(firstDay.fat.unsaturated, lastDay.fat.unsaturated)
    },
    fiber: calculatePercentageChange(firstDay.fiber, lastDay.fiber),
    water: calculatePercentageChange(firstDay.water, lastDay.water)
  };
}

function calculateDistributions(dailyData) {
  return Object.values(dailyData).map(day => {
    const totalCalories = day.nutrients.calories || 1;
    return {
      date: day.date,
      protein: (day.nutrients.protein * NUTRITION_CONSTANTS.CALORIES_PER_GRAM.PROTEIN / totalCalories) * 100,
      carbs: (day.nutrients.carbs * NUTRITION_CONSTANTS.CALORIES_PER_GRAM.CARBS / totalCalories) * 100,
      fat: (day.nutrients.fat.total * NUTRITION_CONSTANTS.CALORIES_PER_GRAM.FAT / totalCalories) * 100
    };
  });
}

function generateRecommendations(dailyData, goal) {
  const recommendations = [];
  const adherence = calculateAdherence(dailyData, goal);

  if (adherence.protein < 80) recommendations.push({ type:'protein', severity:'high', message:'Aumentare l\'assunzione di proteine', suggestion:'Fonti: pollo, pesce, legumi, uova' });
  if (adherence.fat.saturated > 100) recommendations.push({ type:'fats', severity:'high', message:'Ridurre i grassi saturi', suggestion:'Sostituire con grassi insaturi (olio oliva, avocado, frutta secca)' });
  if (adherence.water < 70) recommendations.push({ type:'water', severity:'medium', message:'Bere più acqua', suggestion:'Bere regolarmente durante il giorno' });

  return recommendations;
}

function calculateAveragePercentage(values, nutrientPath, target) {
  if (!target) return null;
  const sum = values.reduce((acc, day) => {
    const value = Array.isArray(nutrientPath) ? nutrientPath.reduce((obj,key)=>obj[key], day.nutrients) : day.nutrients[nutrientPath];
    return acc + (value || 0);
  }, 0);
  return (sum / values.length / target) * 100;
}

function calculatePercentageChange(start, end) {
  if (!start || !end) return null;
  return ((end-start)/start) * 100;
}

/**
 * Utility generiche
 */
function calculateCaloriesForGoal(tdee, goal, rate=0.5) {
  const caloriesPerKg = 7700;
  const weeklyDeficit = rate * caloriesPerKg;
  const dailyDeficit = weeklyDeficit / 7;
  let targetCalories, description_it;

  switch(goal.toLowerCase()) {
    case 'lose': case 'weight_loss':
      targetCalories = tdee - dailyDeficit;
      description_it = `Perdita di ${rate}kg/settimana`;
      break;
    case 'maintain': case 'maintenance':
      targetCalories = tdee;
      description_it = 'Mantenimento peso';
      break;
    case 'gain': case 'weight_gain':
      targetCalories = tdee + dailyDeficit;
      description_it = `Aumento di ${rate}kg/settimana`;
      break;
    default: throw new Error('Obiettivo non valido');
  }

  return {
    target_calories: Math.round(targetCalories),
    tdee,
    goal,
    rate_kg_per_week: rate,
    daily_deficit: Math.round(dailyDeficit),
    description_it,
    min_calories: 1200,
    min_calories_male: 1500
  };
}

function calculateMacros(calories, macroRatios={ protein:20, carbs:50, fat:30 }) {
  const { protein, carbs, fat } = macroRatios;
  if (protein+carbs+fat !== 100) throw new Error('Le percentuali devono sommare a 100');
  return {
    calories,
    protein:{ grams:Math.round(calories*(protein/100)/4), calories:Math.round(calories*(protein/100)), percentage:protein },
    carbs:{ grams:Math.round(calories*(carbs/100)/4), calories:Math.round(calories*(carbs/100)), percentage:carbs },
    fat:{ grams:Math.round(calories*(fat/100)/9), calories:Math.round(calories*(fat/100)), percentage:fat }
  };
}

function calculateWaterIntake(weight, activityMinutes=0, climate='normal') {
  const baseWater = weight*0.035;
  const activityWater = (activityMinutes/60)*0.6;
  const climateFactors = { cold:0.9, normal:1.0, hot:1.2 };
  const factor = climateFactors[climate] || 1.0;
  const totalWater = (baseWater + activityWater) * factor;
  return {
    liters: Math.round(totalWater*10)/10,
    base_water: Math.round(baseWater*10)/10,
    activity_water: Math.round(activityWater*10)/10,
    climate_factor: factor,
    glasses_250ml: Math.ceil(totalWater*4)
  };
}

function isValidDate(dateString) {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateString)) return false;
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date.getTime());
}

function formatDateIT(date) {
  const d = new Date(date);
  return d.toLocaleDateString('it-IT', { year:'numeric', month:'long', day:'numeric' });
}

function calculateAge(birthDate) {
  const today = new Date(), birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  if(today.getMonth()<birth.getMonth() || (today.getMonth()===birth.getMonth() && today.getDate()<birth.getDate())) age--;
  return age;
}

function isValidEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

function generateRandomPassword(length=12) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let pwd='';
  for(let i=0;i<length;i++) pwd+=chars.charAt(Math.floor(Math.random()*chars.length));
  return pwd;
}

function convertUnits(value, from, to) {
  const conversions = {
    g_kg:0.001, kg_g:1000, g_oz:0.035274, oz_g:28.3495,
    ml_l:0.001, l_ml:1000, ml_cup:0.00422675, cup_ml:236.588,
    c_f:c=>c*9/5+32, f_c:f=>(f-32)*5/9
  };
  const key = `${from}_${to}`;
  const conv = conversions[key];
  if(typeof conv==='function') return Math.round(conv(value)*100)/100;
  if(typeof conv==='number') return Math.round(value*conv*100)/100;
  throw new Error(`Conversione ${from}->${to} non supportata`);
}

module.exports = {
  calculateBMI,
  calculateBMR,
  calculateTDEE,
  calculateNutritionNeeds,
  analyzePeriodData,
  calculateCaloriesForGoal,
  calculateMacros,
  calculateWaterIntake,
  isValidDate,
  formatDateIT,
  calculateAge,
  isValidEmail,
  generateRandomPassword,
  convertUnits,
  NUTRITION_CONSTANTS
};
