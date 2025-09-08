const axios = require('axios');
const { logger } = require('../middleware/logging');

class USDAService {
    constructor() {
        this.baseUrl = 'https://api.nal.usda.gov/fdc/v1';
        this.apiKey = process.env.USDA_API_KEY; // Da aggiungere nel file .env
    }

    async searchProducts(query, pageSize = 20, pageNumber = 1) {
        try {
            // Traduciamo in inglese alcuni termini comuni italiani
            const translatedQuery = query.toLowerCase()
                .replace('pizza margherita', 'cheese pizza')
                .replace('pomodoro', 'tomato')
                .replace('mozzarella', 'mozzarella cheese');

            const response = await axios.get(`${this.baseUrl}/foods/search`, {
                params: {
                    api_key: this.apiKey,
                    query: translatedQuery,
                    pageSize,
                    pageNumber,
                    dataType: 'Survey (FNDDS)',  // Usiamo solo FNDDS per ora
                    sortBy: 'dataType.keyword',
                    sortOrder: 'desc'
                }
            });

            if (!response.data || !response.data.foods) {
                return {
                    products: [],
                    pagination: {
                        page: pageNumber,
                        pageSize,
                        total: 0
                    }
                };
            }

            const transformedProducts = response.data.foods.map(food => {
                // Estrai ingredienti dai nutrienti se disponibili
                const ingredients = food.foodNutrients
                    ?.filter(n => n.nutrientName?.toLowerCase().includes('ingredient'))
                    ?.map(n => n.nutrientName)
                    ?.join(', ') || '';

                // Estrai la descrizione dettagliata
                const description = [
                    food.additionalDescriptions,
                    food.commonNames,
                    food.scientificName,
                    food.description
                ].filter(Boolean).join(' - ');

                const serving = {
                    size: food.servingSize ? `${food.servingSize}${food.servingSizeUnit}` : '100g',
                    quantity: food.servingSize || 100,
                    unit: food.servingSizeUnit || 'g',
                    description: food.servingSize ? `${food.servingSize}${food.servingSizeUnit}` : '100g'
                };

                return {
                    id: `usda_${food.fdcId}`,
                    name: food.description,
                    brand: 'USDA Standard',
                    description: description || '',
                    image: null, // USDA non fornisce immagini
                    serving,
                    nutrition_per_100g: this.extractNutrition(food),
                    nutrition_per_serving: food.servingSize ? 
                        this.calculateServingNutrition(food, food.servingSize) : 
                        this.extractNutrition(food),
                    categories: food.foodCategory ? [food.foodCategory] : [],
                    allergens: [], // USDA non fornisce informazioni sugli allergeni in formato standard
                    eco_score: 'unknown',
                    nutri_score: 'unknown',
                    popularity: 0,
                    verified: true,
                    isStandard: true,
                    source: 'USDA',
                    ingredients: ingredients // Aggiungi gli ingredienti estratti
                };
            });

            return {
                products: transformedProducts,
                pagination: {
                    page: pageNumber,
                    pageSize,
                    total: response.data.totalHits || transformedProducts.length
                }
            };
        } catch (error) {
            logger.error('Errore nella ricerca USDA:', {
                error: error.message,
                query,
                pageSize,
                pageNumber
            });
            return {
                products: [],
                pagination: {
                    page: pageNumber,
                    pageSize,
                    total: 0
                }
            };
        }
    }

    extractNutrition(food) {
        const getNutrientValue = (nutrients, name) => {
            const nutrient = nutrients.find(n => n.nutrientName.toLowerCase().includes(name.toLowerCase()));
            return nutrient ? Math.round(nutrient.value * 10) / 10 : 0;
        };

        return {
            calories: getNutrientValue(food.foodNutrients, 'energy'),
            proteins: getNutrientValue(food.foodNutrients, 'protein'),
            carbohydrates: getNutrientValue(food.foodNutrients, 'carbohydrate'),
            fats: getNutrientValue(food.foodNutrients, 'total lipid'),
            fiber: getNutrientValue(food.foodNutrients, 'fiber'),
            sodium: getNutrientValue(food.foodNutrients, 'sodium'),
            sugars: getNutrientValue(food.foodNutrients, 'sugars'),
            saturated_fat: getNutrientValue(food.foodNutrients, 'saturated')
        };
    }

    calculateServingNutrition(food, servingSize) {
        const per100g = this.extractNutrition(food);
        const ratio = servingSize / 100;

        return Object.entries(per100g).reduce((acc, [key, value]) => {
            acc[key] = Math.round(value * ratio * 10) / 10;
            return acc;
        }, {});
    }
}

module.exports = new USDAService();
