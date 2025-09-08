const { logger } = require('../middleware/logging');

class RecommendationService {
    constructor() {
        this.targetNutrients = {
            calories: 2000, // kcal
            proteins: 50,   // g
            carbs: 260,     // g
            fats: 70,       // g
            fiber: 25,      // g
            sugars: 50,     // g
        };
    }

    calculateProgress(currentNutrients) {
        const progress = {};
        
        Object.keys(this.targetNutrients).forEach(nutrient => {
            const current = currentNutrients[nutrient] || 0;
            const target = this.targetNutrients[nutrient];
            progress[nutrient] = {
                current,
                target,
                percentage: Math.min((current / target) * 100, 100)
            };
        });

        return progress;
    }

    generateRecommendations(progress) {
        const recommendations = [];

        // Controlla calorie
        if (progress.calories.percentage > 110) {
            recommendations.push({
                type: 'warning',
                message: 'Hai superato il tuo obiettivo calorico giornaliero. Considera pasti più leggeri.'
            });
        } else if (progress.calories.percentage < 70 && progress.calories.current > 0) {
            recommendations.push({
                type: 'info',
                message: 'Stai consumando poche calorie. Considera di aggiungere uno spuntino sano.'
            });
        }

        // Controlla proteine
        if (progress.proteins.percentage < 80) {
            recommendations.push({
                type: 'info',
                message: 'Potresti aver bisogno di più proteine. Considera di aggiungere legumi, carne magra o pesce.'
            });
        }

        // Controlla carboidrati
        if (progress.carbs.percentage > 120) {
            recommendations.push({
                type: 'warning',
                message: 'Alto consumo di carboidrati. Considera di bilanciare con più verdure e proteine.'
            });
        }

        // Controlla grassi
        if (progress.fats.percentage > 120) {
            recommendations.push({
                type: 'warning',
                message: 'Alto consumo di grassi. Cerca di limitare i cibi fritti e i grassi saturi.'
            });
        }

        // Controlla fibre
        if (progress.fiber.percentage < 70) {
            recommendations.push({
                type: 'info',
                message: 'Potresti beneficiare di più fibre. Aggiungi più frutta, verdura e cereali integrali.'
            });
        }

        // Controlla zuccheri
        if (progress.sugars.percentage > 100) {
            recommendations.push({
                type: 'warning',
                message: 'Alto consumo di zuccheri. Cerca di limitare dolci e bevande zuccherate.'
            });
        }

        return recommendations;
    }

    async getRecommendations(currentNutrients) {
        try {
            const progress = this.calculateProgress(currentNutrients);
            const recommendations = this.generateRecommendations(progress);

            return {
                progress,
                recommendations
            };
        } catch (error) {
            logger.error('Errore nella generazione delle raccomandazioni', { error: error.message });
            throw error;
        }
    }
}

module.exports = new RecommendationService();
