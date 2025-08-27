// Utility per calcoli nutrizionali

/**
 * Calcola BMI (Body Mass Index)
 * @param {number} weight - Peso in kg
 * @param {number} height - Altezza in cm
 * @returns {object} BMI e categoria
 */
function calculateBMI(weight, height) {
    if (!weight || !height || weight <= 0 || height <= 0) {
        throw new Error('Peso e altezza devono essere numeri positivi');
    }

    const heightInMeters = height / 100;
    const bmi = weight / (heightInMeters * heightInMeters);
    
    let category = '';
    let category_it = '';
    
    if (bmi < 18.5) {
        category = 'underweight';
        category_it = 'Sottopeso';
    } else if (bmi < 25) {
        category = 'normal';
        category_it = 'Normopeso';
    } else if (bmi < 30) {
        category = 'overweight';
        category_it = 'Sovrappeso';
    } else {
        category = 'obese';
        category_it = 'Obesità';
    }

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
 * Calcola BMR (Basal Metabolic Rate) usando formula Mifflin-St Jeor
 * @param {number} weight - Peso in kg
 * @param {number} height - Altezza in cm
 * @param {number} age - Età in anni
 * @param {string} gender - 'male' o 'female'
 * @returns {number} BMR in kcal/giorno
 */
function calculateBMR(weight, height, age, gender) {
    if (!weight || !height || !age || !gender) {
        throw new Error('Tutti i parametri sono richiesti');
    }

    let bmr;
    
    if (gender.toLowerCase() === 'male' || gender.toLowerCase() === 'm') {
        bmr = (10 * weight) + (6.25 * height) - (5 * age) + 5;
    } else if (gender.toLowerCase() === 'female' || gender.toLowerCase() === 'f') {
        bmr = (10 * weight) + (6.25 * height) - (5 * age) - 161;
    } else {
        throw new Error('Genere deve essere "male" o "female"');
    }

    return Math.round(bmr);
}

/**
 * Calcola TDEE (Total Daily Energy Expenditure)
 * @param {number} bmr - BMR in kcal/giorno
 * @param {string} activityLevel - Livello di attività
 * @returns {object} TDEE e fattori di attività
 */
function calculateTDEE(bmr, activityLevel) {
    const activityFactors = {
        sedentary: { factor: 1.2, description_it: 'Sedentario (poco o nessun esercizio)' },
        lightly_active: { factor: 1.375, description_it: 'Leggermente attivo (esercizio leggero 1-3 giorni/settimana)' },
        moderately_active: { factor: 1.55, description_it: 'Moderatamente attivo (esercizio moderato 3-5 giorni/settimana)' },
        very_active: { factor: 1.725, description_it: 'Molto attivo (esercizio intenso 6-7 giorni/settimana)' },
        extremely_active: { factor: 1.9, description_it: 'Estremamente attivo (esercizio molto intenso, lavoro fisico)' }
    };

    const activity = activityFactors[activityLevel];
    if (!activity) {
        throw new Error('Livello di attività non valido');
    }

    return {
        tdee: Math.round(bmr * activity.factor),
        activity_factor: activity.factor,
        activity_description: activity.description_it,
        bmr,
        available_levels: activityFactors
    };
}

/**
 * Calcola fabbisogno calorico per obiettivo peso
 * @param {number} tdee - TDEE in kcal/giorno
 * @param {string} goal - 'lose', 'maintain', 'gain'
 * @param {number} rate - Velocità (kg/settimana)
 * @returns {object} Calorie target e informazioni
 */
function calculateCaloriesForGoal(tdee, goal, rate = 0.5) {
    const caloriesPerKg = 7700; // Calorie approssimative per kg di grasso
    const weeklyDeficit = rate * caloriesPerKg;
    const dailyDeficit = weeklyDeficit / 7;

    let targetCalories;
    let description_it;

    switch (goal.toLowerCase()) {
        case 'lose':
        case 'weight_loss':
            targetCalories = tdee - dailyDeficit;
            description_it = `Perdita di ${rate}kg/settimana`;
            break;
        case 'maintain':
        case 'maintenance':
            targetCalories = tdee;
            description_it = 'Mantenimento peso';
            break;
        case 'gain':
        case 'weight_gain':
            targetCalories = tdee + dailyDeficit;
            description_it = `Aumento di ${rate}kg/settimana`;
            break;
        default:
            throw new Error('Obiettivo non valido');
    }

    return {
        target_calories: Math.round(targetCalories),
        tdee,
        goal,
        rate_kg_per_week: rate,
        daily_deficit: Math.round(dailyDeficit),
        description_it,
        min_calories: 1200, // Minimo consigliato per donne
        min_calories_male: 1500 // Minimo consigliato per uomini
    };
}

/**
 * Calcola distribuzione macronutrienti
 * @param {number} calories - Calorie totali
 * @param {object} macroRatios - Percentuali proteine, carboidrati, grassi
 * @returns {object} Grammi di ogni macronutriente
 */
function calculateMacros(calories, macroRatios = { protein: 20, carbs: 50, fat: 30 }) {
    const { protein, carbs, fat } = macroRatios;
    
    if (protein + carbs + fat !== 100) {
        throw new Error('Le percentuali devono sommare a 100');
    }

    const proteinCalories = calories * (protein / 100);
    const carbsCalories = calories * (carbs / 100);
    const fatCalories = calories * (fat / 100);

    return {
        calories: calories,
        protein: {
            grams: Math.round(proteinCalories / 4),
            calories: Math.round(proteinCalories),
            percentage: protein
        },
        carbs: {
            grams: Math.round(carbsCalories / 4),
            calories: Math.round(carbsCalories),
            percentage: carbs
        },
        fat: {
            grams: Math.round(fatCalories / 9),
            calories: Math.round(fatCalories),
            percentage: fat
        }
    };
}

/**
 * Calcola acqua raccomandata
 * @param {number} weight - Peso in kg
 * @param {number} activityMinutes - Minuti di attività
 * @param {string} climate - 'hot', 'normal', 'cold'
 * @returns {object} Litri di acqua raccomandati
 */
function calculateWaterIntake(weight, activityMinutes = 0, climate = 'normal') {
    // Base: 35ml per kg di peso corporeo
    let baseWater = weight * 0.035;
    
    // Aggiungi per attività: 600ml per ora di attività
    const activityWater = (activityMinutes / 60) * 0.6;
    
    // Fattore climatico
    const climateFactors = {
        cold: 0.9,
        normal: 1.0,
        hot: 1.2
    };
    
    const climateFactor = climateFactors[climate] || 1.0;
    
    const totalWater = (baseWater + activityWater) * climateFactor;
    
    return {
        liters: Math.round(totalWater * 10) / 10,
        base_water: Math.round(baseWater * 10) / 10,
        activity_water: Math.round(activityWater * 10) / 10,
        climate_factor: climateFactor,
        glasses_250ml: Math.ceil(totalWater * 4) // Bicchieri da 250ml
    };
}

/**
 * Validatore formato data
 * @param {string} dateString - Data in formato YYYY-MM-DD
 * @returns {boolean} True se valida
 */
function isValidDate(dateString) {
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(dateString)) return false;
    
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date.getTime());
}

/**
 * Formatta data per display italiano
 * @param {string|Date} date - Data
 * @returns {string} Data formattata
 */
function formatDateIT(date) {
    const d = new Date(date);
    return d.toLocaleDateString('it-IT', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

/**
 * Calcola età da data di nascita
 * @param {string} birthDate - Data nascita YYYY-MM-DD
 * @returns {number} Età in anni
 */
function calculateAge(birthDate) {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
    }
    
    return age;
}

/**
 * Valida email
 * @param {string} email - Email da validare
 * @returns {boolean} True se valida
 */
function isValidEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
}

/**
 * Genera password casuale
 * @param {number} length - Lunghezza password
 * @returns {string} Password generata
 */
function generateRandomPassword(length = 12) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < length; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
}

/**
 * Converte unità di misura comuni
 * @param {number} value - Valore da convertire
 * @param {string} from - Unità di partenza
 * @param {string} to - Unità di destinazione
 * @returns {number} Valore convertito
 */
function convertUnits(value, from, to) {
    const conversions = {
        // Peso
        'g_kg': 0.001,
        'kg_g': 1000,
        'g_oz': 0.035274,
        'oz_g': 28.3495,
        
        // Volume
        'ml_l': 0.001,
        'l_ml': 1000,
        'ml_cup': 0.00422675,
        'cup_ml': 236.588,
        
        // Temperatura
        'c_f': (c) => (c * 9/5) + 32,
        'f_c': (f) => (f - 32) * 5/9
    };
    
    const conversionKey = `${from}_${to}`;
    const conversion = conversions[conversionKey];
    
    if (typeof conversion === 'function') {
        return Math.round(conversion(value) * 100) / 100;
    } else if (typeof conversion === 'number') {
        return Math.round(value * conversion * 100) / 100;
    } else {
        throw new Error(`Conversione ${from} -> ${to} non supportata`);
    }
}

module.exports = {
    calculateBMI,
    calculateBMR,
    calculateTDEE,
    calculateCaloriesForGoal,
    calculateMacros,
    calculateWaterIntake,
    isValidDate,
    formatDateIT,
    calculateAge,
    isValidEmail,
    generateRandomPassword,
    convertUnits
};
