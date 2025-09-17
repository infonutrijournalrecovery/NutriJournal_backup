/**
 * Utility per calcoli nutrizionali
 */

// Coefficienti per calcolo BMR (Harris-Benedict Equation)
const BMR_COEFFICIENTS = {
  male: {
    base: 88.362,
    weight: 13.397,
    height: 4.799,
    age: 5.677,
  },
  female: {
    base: 447.593,
    weight: 9.247,
    height: 3.098,
    age: 4.330,
  },
};

// Moltiplicatori attività per TDEE
const ACTIVITY_MULTIPLIERS = {
  sedentary: 1.2,        // Poco o nessun esercizio
  light: 1.375,          // Esercizio leggero 1-3 giorni/settimana
  moderate: 1.55,        // Esercizio moderato 3-5 giorni/settimana
  active: 1.725,         // Esercizio intenso 6-7 giorni/settimana
  very_active: 1.9,      // Esercizio molto intenso o lavoro fisico
};

// Categorie BMI secondo WHO
const BMI_CATEGORIES = {
  underweight: { min: 0, max: 18.4, label: 'Sottopeso' },
  normal: { min: 18.5, max: 24.9, label: 'Normale' },
  overweight: { min: 25.0, max: 29.9, label: 'Sovrappeso' },
  obese_1: { min: 30.0, max: 34.9, label: 'Obesità Classe I' },
  obese_2: { min: 35.0, max: 39.9, label: 'Obesità Classe II' },
  obese_3: { min: 40.0, max: 100, label: 'Obesità Classe III' },
};

// Valori di riferimento per nutrienti (RDA Italiane)
const NUTRIENT_REFERENCES = {
  // Macronutrienti (percentuali delle calorie totali)
  protein_percent: { min: 10, max: 35 },
  carbs_percent: { min: 45, max: 65 },
  fat_percent: { min: 20, max: 35 },
  
  // Vitamine (per adulti)
  vitamin_a: { male: 900, female: 700, unit: 'μg' }, // mcg
  vitamin_c: { male: 90, female: 75, unit: 'mg' },
  vitamin_d: { male: 15, female: 15, unit: 'μg' },
  vitamin_e: { male: 15, female: 15, unit: 'mg' },
  vitamin_k: { male: 120, female: 90, unit: 'μg' },
  vitamin_b1: { male: 1.2, female: 1.1, unit: 'mg' },
  vitamin_b2: { male: 1.3, female: 1.1, unit: 'mg' },
  vitamin_b3: { male: 16, female: 14, unit: 'mg' },
  vitamin_b6: { male: 1.3, female: 1.3, unit: 'mg' },
  vitamin_b9: { male: 400, female: 400, unit: 'μg' },
  vitamin_b12: { male: 2.4, female: 2.4, unit: 'μg' },
  
  // Minerali
  calcium: { male: 1000, female: 1000, unit: 'mg' },
  iron: { male: 8, female: 18, unit: 'mg' },
  magnesium: { male: 400, female: 310, unit: 'mg' },
  phosphorus: { male: 700, female: 700, unit: 'mg' },
  potassium: { male: 3500, female: 3500, unit: 'mg' },
  zinc: { male: 11, female: 8, unit: 'mg' },
  selenium: { male: 55, female: 55, unit: 'μg' },
  
  // Limiti massimi
  sodium: { max: 2300, unit: 'mg' },
  saturated_fat_percent: { max: 10 }, // % delle calorie totali
  added_sugars_percent: { max: 10 }, // % delle calorie totali
};

class NutritionCalculator {
  /**
   * Calcola BMR (Basal Metabolic Rate) usando Harris-Benedict Equation
   */
  static calculateBMR(weight, height, age, gender) {
    if (!weight || !height || !age || !gender) {
      throw new Error('Parametri mancanti per calcolo BMR');
    }

    const coeffs = BMR_COEFFICIENTS[gender];
    if (!coeffs) {
      throw new Error('Genere non valido');
    }

    return coeffs.base + 
           (coeffs.weight * weight) + 
           (coeffs.height * height) - 
           (coeffs.age * age);
  }

  /**
   * Calcola TDEE (Total Daily Energy Expenditure)
   */
  static calculateTDEE(bmr, activityLevel) {
    const multiplier = ACTIVITY_MULTIPLIERS[activityLevel];
    if (!multiplier) {
      throw new Error('Livello di attività non valido');
    }

    return bmr * multiplier;
  }

  /**
   * Calcola BMI (Body Mass Index)
   */
  static calculateBMI(weight, height) {
    if (!weight || !height) {
      throw new Error('Peso e altezza richiesti per calcolo BMI');
    }

    const heightInMeters = height / 100;
    return weight / (heightInMeters * heightInMeters);
  }

  /**
   * Ottieni categoria BMI
   */
  static getBMICategory(bmi) {
    for (const [key, category] of Object.entries(BMI_CATEGORIES)) {
      if (bmi >= category.min && bmi <= category.max) {
        return {
          category: key,
          label: category.label,
          range: `${category.min}-${category.max}`,
        };
      }
    }
    return {
      category: 'unknown',
      label: 'Non classificabile',
      range: 'N/A',
    };
  }

  /**
   * Calcola fabbisogno calorico per obiettivo di peso
   */
  static calculateCalorieTarget(tdee, goalType, weeklyWeightChange = 0.5) {
    const caloriesPerKg = 7700; // Calorie per kg di grasso
    const weeklyCalorieChange = weeklyWeightChange * caloriesPerKg;
    const dailyCalorieChange = weeklyCalorieChange / 7;

    switch (goalType) {
        case 'lose_weight':
        return Math.max(tdee - dailyCalorieChange, tdee * 0.75); // Non scendere sotto 75% TDEE
      
        case 'gain_weight':
        return tdee + dailyCalorieChange;
      
  case 'maintain_weight':
  case 'maintenance':
        return tdee;
      
      default:
        return tdee;
    }
  }

  /**
   * Calcola distribuzione macronutrienti
   */
  static calculateMacroDistribution(calories, proteinGrams, carbsGrams, fatGrams) {
    const proteinCalories = proteinGrams * 4;
    const carbsCalories = carbsGrams * 4;
    const fatCalories = fatGrams * 9;

    const totalMacroCalories = proteinCalories + carbsCalories + fatCalories;

    return {
      protein: {
        grams: proteinGrams,
        calories: proteinCalories,
        percentage: calories > 0 ? (proteinCalories / calories) * 100 : 0,
      },
      carbs: {
        grams: carbsGrams,
        calories: carbsCalories,
        percentage: calories > 0 ? (carbsCalories / calories) * 100 : 0,
      },
      fat: {
        grams: fatGrams,
        calories: fatCalories,
        percentage: calories > 0 ? (fatCalories / calories) * 100 : 0,
      },
      total_macro_calories: totalMacroCalories,
      other_calories: Math.max(0, calories - totalMacroCalories),
    };
  }

  /**
   * Calcola valori nutrizionali per porzione
   */
  static calculateNutritionForServing(nutritionPer100g, servingSize, unit = 'g') {
    const multiplier = this.getServingMultiplier(servingSize, unit);
    
    const result = {};
    Object.entries(nutritionPer100g).forEach(([key, value]) => {
      result[key] = value !== null ? (value * multiplier) : null;
    });

    return result;
  }

  /**
   * Ottieni moltiplicatore per conversione porzione
   */
  static getServingMultiplier(servingSize, unit) {
    // Conversioni base (tutto a grammi per 100g)
    const conversions = {
      'g': 1,
      'mg': 0.001,
      'kg': 1000,
      'ml': 1, // Assumiamo densità 1 per liquidi
      'l': 1000,
      'cl': 10,
      'dl': 100,
      'oz': 28.35,
      'lb': 453.6,
      'cup': 240, // ml, poi convertito
      'tablespoon': 15,
      'teaspoon': 5,
    };

    const gramAmount = servingSize * (conversions[unit] || 1);
    return gramAmount / 100;
  }

  /**
   * Valuta qualità nutrizionale
   */
  static evaluateNutritionalQuality(nutrition, calories) {
    const quality = {
      score: 0,
      maxScore: 100,
      factors: [],
    };

    // Densità calorica (10 punti)
    const caloriesPerGram = calories / 100;
    if (caloriesPerGram < 1.5) {
      quality.score += 10;
      quality.factors.push('Bassa densità calorica');
    } else if (caloriesPerGram < 2.5) {
      quality.score += 7;
    } else if (caloriesPerGram < 4) {
      quality.score += 4;
    }

    // Contenuto proteico (15 punti)
    const proteinPercent = nutrition.protein ? (nutrition.protein * 4 / calories) * 100 : 0;
    if (proteinPercent >= 20) {
      quality.score += 15;
      quality.factors.push('Alto contenuto proteico');
    } else if (proteinPercent >= 12) {
      quality.score += 10;
    } else if (proteinPercent >= 6) {
      quality.score += 5;
    }

    // Contenuto fibre (15 punti)
    if (nutrition.fiber >= 6) {
      quality.score += 15;
      quality.factors.push('Alto contenuto di fibre');
    } else if (nutrition.fiber >= 3) {
      quality.score += 10;
    } else if (nutrition.fiber >= 1.5) {
      quality.score += 5;
    }

    // Grassi saturi (10 punti - penalità)
    const saturatedFatPercent = nutrition.saturated_fat ? (nutrition.saturated_fat * 9 / calories) * 100 : 0;
    if (saturatedFatPercent <= 5) {
      quality.score += 10;
    } else if (saturatedFatPercent <= 10) {
      quality.score += 7;
    } else if (saturatedFatPercent <= 15) {
      quality.score += 3;
    }

    // Zuccheri (10 punti - penalità)
    const sugarsPercent = nutrition.sugars ? (nutrition.sugars * 4 / calories) * 100 : 0;
    if (sugarsPercent <= 5) {
      quality.score += 10;
    } else if (sugarsPercent <= 15) {
      quality.score += 7;
    } else if (sugarsPercent <= 25) {
      quality.score += 3;
    }

    // Sodio (10 punti)
    if (!nutrition.sodium || nutrition.sodium <= 140) {
      quality.score += 10;
    } else if (nutrition.sodium <= 400) {
      quality.score += 7;
    } else if (nutrition.sodium <= 600) {
      quality.score += 3;
    }

    // Micronutrienti (30 punti)
    const micronutrients = [
      'vitamin_a', 'vitamin_c', 'vitamin_d', 'calcium', 'iron'
    ];
    let micronutrientCount = 0;
    micronutrients.forEach(nutrient => {
      if (nutrition[nutrient] && nutrition[nutrient] > 0) {
        micronutrientCount++;
      }
    });
    quality.score += (micronutrientCount / micronutrients.length) * 30;

    // Normalizza score
    quality.score = Math.min(quality.score, quality.maxScore);
    quality.percentage = Math.round((quality.score / quality.maxScore) * 100);

    // Categoria qualità
    if (quality.percentage >= 80) {
      quality.category = 'Eccellente';
    } else if (quality.percentage >= 60) {
      quality.category = 'Buona';
    } else if (quality.percentage >= 40) {
      quality.category = 'Sufficiente';
    } else {
      quality.category = 'Scarsa';
    }

    return quality;
  }

  /**
   * Ottieni raccomandazioni nutrizionali per età/genere
   */
  static getNutrientRecommendations(age, gender) {
    const recommendations = {};
    
    Object.entries(NUTRIENT_REFERENCES).forEach(([nutrient, values]) => {
      if (values.male !== undefined && values.female !== undefined) {
        recommendations[nutrient] = {
          value: values[gender] || values.male,
          unit: values.unit,
        };
      } else if (values.max !== undefined) {
        recommendations[nutrient] = {
          max: values.max,
          unit: values.unit,
        };
      } else {
        recommendations[nutrient] = values;
      }
    });

    return recommendations;
  }

  /**
   * Calcola percentuale di raggiungimento obiettivo nutrizionale
   */
  static calculateNutrientProgress(current, target) {
    if (!target || target === 0) return 0;
    return Math.min((current / target) * 100, 200); // Max 200% per visualizzazione
  }

  /**
   * Analizza carenze nutrizionali
   */
  static analyzeNutritionalDeficiencies(currentNutrition, recommendations) {
    const deficiencies = [];
    const excesses = [];

    Object.entries(recommendations).forEach(([nutrient, rec]) => {
      const current = currentNutrition[nutrient] || 0;
      
      if (rec.value) {
        const percentage = (current / rec.value) * 100;
        
        if (percentage < 50) {
          deficiencies.push({
            nutrient,
            current,
            recommended: rec.value,
            deficit: rec.value - current,
            percentage,
            severity: percentage < 25 ? 'grave' : 'moderata',
          });
        }
      } else if (rec.max && current > rec.max) {
        excesses.push({
          nutrient,
          current,
          maximum: rec.max,
          excess: current - rec.max,
          percentage: (current / rec.max) * 100,
        });
      }
    });

    return { deficiencies, excesses };
  }

  /**
   * Calcola water balance approssimativo
   */
  static calculateWaterNeeds(weight, activityLevel, climate = 'temperate') {
    // Base: 35ml per kg di peso corporeo
    let baseWater = weight * 35;

    // Aggiustamenti per attività
    const activityAdjustments = {
      sedentary: 0,
      light: 300,
      moderate: 500,
      active: 700,
      very_active: 1000,
    };

    baseWater += activityAdjustments[activityLevel] || 0;

    // Aggiustamenti per clima
    if (climate === 'hot') {
      baseWater += 500;
    } else if (climate === 'cold') {
      baseWater -= 200;
    }

    return Math.max(baseWater, 1500); // Minimo 1.5L
  }
}

module.exports = {
  NutritionCalculator,
  BMR_COEFFICIENTS,
  ACTIVITY_MULTIPLIERS,
  BMI_CATEGORIES,
  NUTRIENT_REFERENCES,
};
