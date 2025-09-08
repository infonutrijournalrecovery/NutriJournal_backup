const nutritionUtils = require('./nutritionUtils');
const { logger } = require('../middleware/logging');

/**
 * Utility per i calcoli relativi ai pasti
 */
class MealUtils {
    /**
     * Calcola i valori nutrizionali totali per un pasto
     * @param {Array} products - Array di prodotti con quantità
     * @returns {Object} Totali nutrizionali
     */
    static calculateMealNutrition(products) {
        const totals = {
            calories: 0,
            proteins: 0,
            carbs: 0,
            fats: {
                total: 0,
                saturated: 0,
                unsaturated: 0
            },
            fiber: 0,
            vitamins_minerals: {}
        };

        products.forEach(({ product, quantity, unit }) => {
            const conversionFactor = this.getConversionFactor(unit, product.serving_unit);
            const servings = (quantity * conversionFactor) / product.serving_size;

            // Calcola i macronutrienti
            totals.calories += product.calories * servings;
            totals.proteins += product.proteins * servings;
            totals.carbs += product.carbs * servings;
            totals.fats.total += product.fats * servings;
            totals.fats.saturated += (product.fats_saturated || 0) * servings;
            totals.fats.unsaturated += (product.fats_unsaturated || 0) * servings;
            totals.fiber += (product.fiber || 0) * servings;

            // Aggrega micronutrienti se presenti
            if (product.vitamins_minerals) {
                Object.entries(product.vitamins_minerals).forEach(([nutrient, value]) => {
                    totals.vitamins_minerals[nutrient] = (totals.vitamins_minerals[nutrient] || 0) + 
                                                       (value * servings);
                });
            }
        });

        // Arrotonda i valori
        return {
            ...totals,
            calories: Math.round(totals.calories),
            proteins: Math.round(totals.proteins),
            carbs: Math.round(totals.carbs),
            fats: {
                total: Math.round(totals.fats.total),
                saturated: Math.round(totals.fats.saturated),
                unsaturated: Math.round(totals.fats.unsaturated)
            },
            fiber: Math.round(totals.fiber),
            vitamins_minerals: Object.fromEntries(
                Object.entries(totals.vitamins_minerals)
                    .map(([k, v]) => [k, Math.round(v * 10) / 10])
            )
        };
    }

    /**
     * Analizza la distribuzione dei pasti in un periodo
     * @param {Array} meals - Array di pasti
     * @returns {Object} Statistiche e analisi
     */
    static analyzeMealDistribution(meals) {
        const mealCounts = {
            breakfast: 0,
            lunch: 0,
            dinner: 0,
            snack: 0
        };

        const mealTimes = {
            breakfast: [],
            lunch: [],
            dinner: [],
            snack: []
        };

        meals.forEach(meal => {
            mealCounts[meal.meal_type]++;
            mealTimes[meal.meal_type].push(meal.time);
        });

        // Calcola orari medi dei pasti
        const averageTimes = {};
        Object.entries(mealTimes).forEach(([type, times]) => {
            if (times.length) {
                averageTimes[type] = this.calculateAverageTime(times);
            }
        });

        // Calcola consistenza degli orari (deviazione standard in minuti)
        const timeConsistency = {};
        Object.entries(mealTimes).forEach(([type, times]) => {
            if (times.length > 1) {
                timeConsistency[type] = this.calculateTimeConsistency(times);
            }
        });

        return {
            distribution: mealCounts,
            averageTimes,
            timeConsistency,
            totalMeals: meals.length,
            mealsPerDay: meals.length / this.getUniqueDates(meals).length
        };
    }

    /**
     * Calcola la media degli orari
     * @private
     */
    static calculateAverageTime(times) {
        const minutes = times.map(time => {
            const [hours, mins] = time.split(':').map(Number);
            return hours * 60 + mins;
        });

        const avgMinutes = minutes.reduce((a, b) => a + b) / times.length;
        const hours = Math.floor(avgMinutes / 60);
        const mins = Math.round(avgMinutes % 60);

        return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
    }

    /**
     * Calcola la consistenza degli orari (deviazione standard in minuti)
     * @private
     */
    static calculateTimeConsistency(times) {
        const minutes = times.map(time => {
            const [hours, mins] = time.split(':').map(Number);
            return hours * 60 + mins;
        });

        const avg = minutes.reduce((a, b) => a + b) / times.length;
        const squareDiffs = minutes.map(m => (m - avg) ** 2);
        const variance = squareDiffs.reduce((a, b) => a + b) / times.length;
        
        return Math.round(Math.sqrt(variance));
    }

    /**
     * Ottiene le date uniche dai pasti
     * @private
     */
    static getUniqueDates(meals) {
        return [...new Set(meals.map(m => m.date))];
    }

    /**
     * Calcola il fattore di conversione tra unità di misura
     * @private
     */
    static getConversionFactor(fromUnit, toUnit) {
        const conversions = {
            g: {
                g: 1,
                kg: 0.001,
                oz: 0.035274,
                lb: 0.00220462
            },
            ml: {
                ml: 1,
                l: 0.001,
                fl_oz: 0.033814,
                cup: 0.00416667
            }
        };

        // Se le unità sono uguali
        if (fromUnit === toUnit) return 1;

        // Se abbiamo una conversione diretta
        if (conversions[fromUnit]?.[toUnit]) {
            return conversions[fromUnit][toUnit];
        }

        // Se abbiamo una conversione inversa
        if (conversions[toUnit]?.[fromUnit]) {
            return 1 / conversions[toUnit][fromUnit];
        }

        logger.warn('Conversione unità non supportata', { fromUnit, toUnit });
        return 1; // Fallback a conversione 1:1
    }
}

module.exports = MealUtils;
