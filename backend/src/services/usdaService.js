const axios = require('axios');
const { logger } = require('../middleware/logging');

class USDAService {
    constructor() {
        this.baseUrl = 'https://api.nal.usda.gov/fdc/v1';
        this.apiKey = process.env.USDA_API_KEY; // Da aggiungere nel file .env
    }

    async searchProducts(query, pageSize = 20, pageNumber = 1) {
        try {

            // Traduzione base (puoi espandere)
            const translationMap = {
                'pollo': 'chicken',
                'al forno': 'roasted',
                'forno': 'oven',
                'pizza margherita': 'cheese pizza',
                'pomodoro': 'tomato',
                'mozzarella': 'mozzarella cheese'
            };
            let translatedQuery = query.toLowerCase();
            Object.entries(translationMap).forEach(([it, en]) => {
                translatedQuery = translatedQuery.replace(it, en);
            });


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
                    name_it: food.description, // fallback: mostra sempre in italiano (da tradurre in futuro)
                    brand: 'USDA Standard',
                    brand_it: 'USDA Standard',
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

            // Migliora la pertinenza: ordina i risultati in base alla presenza delle parole chiave
            // 1. Split query in parole chiave (sia ITA che ENG)
            const keywords = query.toLowerCase().split(/\s+/).filter(Boolean);
            const engKeywords = translatedQuery.toLowerCase().split(/\s+/).filter(Boolean);

            // Funzione di scoring: +2 per ogni parola chiave ITA trovata, +1 per ogni ENG
            function getScore(prod) {
                const text = (prod.name + ' ' + (prod.description || '')).toLowerCase();
                let score = 0;
                keywords.forEach(k => { if (text.includes(k)) score += 2; });
                engKeywords.forEach(k => { if (text.includes(k)) score += 1; });
                return score;
            }

            const sortedProducts = [...transformedProducts].sort((a, b) => getScore(b) - getScore(a));

            return {
                products: sortedProducts,
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

            // Migliora la pertinenza: ordina i risultati in base alla presenza delle parole chiave
            // 1. Split query in parole chiave (sia ITA che ENG)
            const keywords = query.toLowerCase().split(/\s+/).filter(Boolean);
            const engKeywords = translatedQuery.toLowerCase().split(/\s+/).filter(Boolean);

            // Funzione di scoring: +2 per ogni parola chiave ITA trovata, +1 per ogni ENG
            function getScore(prod) {
                const text = (prod.name + ' ' + (prod.description || '')).toLowerCase();
                let score = 0;
                keywords.forEach(k => { if (text.includes(k)) score += 2; });
                engKeywords.forEach(k => { if (text.includes(k)) score += 1; });
                return score;
            }

            const sortedProducts = [...transformedProducts].sort((a, b) => getScore(b) - getScore(a));

            return {
                products: sortedProducts,
                pagination: {
                    page: pageNumber,
                    pageSize,
                    total: response.data.totalHits || transformedProducts.length
                }
            };
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
