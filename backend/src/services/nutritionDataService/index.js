// Converted from TypeScript to JavaScript for direct Node.js usage
const axios = require('axios');
const { localMealsDatabase } = require('./localData');
const { logger } = require('../../middleware/logging');
const { cacheService } = require('../cacheService');
const FuzzySearch = require('fuzzy-search');

class NutritionDataService {
    constructor() {
        this.baseUrl = 'https://api.nal.usda.gov/fdc/v1';
    }

    get apiKey() {
        return process.env['USDA_API_KEY'] || '';
    }

    searchLocalDatabase(query) {
        const searcher = new FuzzySearch(localMealsDatabase, ['name', 'description'], {
            caseSensitive: false,
        });
        return searcher.search(query);
    }

    async searchUsdaFood(query, options = {}) {
        // Traduci la query dall'italiano all'inglese usando Google Translate
        const externalApis = require('../../config/external-apis');
        let translatedQuery = query;
        try {
            const translation = await externalApis.translateText(query, 'en', 'it');
            if (translation && translation.translatedText) {
                translatedQuery = translation.translatedText;
            }
        } catch (err) {
            // Se la traduzione fallisce, usa la query originale
            translatedQuery = query;
        }
        try {
            const dataType = options.category === 'Branded' ? ['Branded'] : options.category === 'Survey' ? ['Survey (FNDDS)'] : ['Branded', 'Survey (FNDDS)'];
            const response = await axios.post(
                `${this.baseUrl}/foods/search?api_key=${this.apiKey}`,
                {
                    query: translatedQuery,
                    dataType,
                    pageSize: options.limit || 20
                }
            );
            logger.info('Risposta API USDA ricevuta', {
                query: translatedQuery,
                resultsCount: response.data.foods.length
            });
            // Nessuna traduzione dei risultati, restituisci direttamente i prodotti USDA
            let products = response.data.foods.map((item) => ({
                id: item.fdcId,
                name: item.description,
                description: item.foodCategory,
                category: item.dataType,
                portion_size: {
                    amount: 100,
                    unit: 'g'
                },
                nutrition: {
                    calories: item.foodNutrients?.find((n) => n.nutrientName === 'Energy')?.value || 0,
                    proteins: item.foodNutrients?.find((n) => n.nutrientName === 'Protein')?.value || 0,
                    carbohydrates: item.foodNutrients?.find((n) => n.nutrientName === 'Carbohydrate, by difference')?.value || 0,
                    fats: item.foodNutrients?.find((n) => n.nutrientName === 'Total lipid (fat)')?.value || 0,
                    fiber: item.foodNutrients?.find((n) => n.nutrientName === 'Fiber, total dietary')?.value || 0,
                    sodium: item.foodNutrients?.find((n) => n.nutrientName === 'Sodium, Na')?.value || 0
                },
                image_url: undefined,
                source: 'usda'
            }));

            // Filtro: mostra solo prodotti che contengono almeno una parola chiave (IT/EN) nel nome o descrizione
            // Stopword comuni in italiano e inglese
            const stopwords = [
                'a','ad','al','alla','allo','ai','agli','all','alle','anche','avere','che','chi','ci','coi','col','come','con','contro','cui','da','dal','dallo','dalla','dai','dagli','dalle','de','dei','del','della','dello','delle','di','do','dopo','e','ed','egli','ella','en','er','era','erano','essere','fa','fra','gli','ha','hai','hanno','ho','i','il','in','io','la','le','lei','li','lo','loro','lui','ma','mi','mia','mie','miei','mio','ne','nei','nella','nelle','nello','noi','non','nostra','nostre','nostri','nostro','o','od','oggi','ogni','o','per','perché','più','quella','quelle','quelli','quello','questa','queste','questi','questo','sarà','se','sei','si','sia','siamo','siete','sono','sta','su','sua','sue','sugl','sui','sul','sulla','sulle','sullo','suo','suoi','tra','tu','tua','tue','tuo','tuoi','un','una','uno','vi','voi','vostra','vostre','vostri','vostro',
                'the','a','an','and','or','but','if','then','else','when','at','by','for','with','about','against','between','into','through','during','before','after','above','below','to','from','up','down','in','out','on','off','over','under','again','further','then','once','here','there','all','any','both','each','few','more','most','other','some','such','no','nor','not','only','own','same','so','than','too','very','can','will','just','don','should','now','of','is','are','was','were','be','been','being','have','has','had','having','do','does','did','doing','would','could','should','shall','may','might','must'
            ];
            // Estrai parole chiave significative dalla query originale e tradotta
            function extractKeywords(str) {
                return str.toLowerCase().split(/\W+/)
                    .filter(w => w && !stopwords.includes(w) && w.length >= 4);
            }
            const keywords = [ ...extractKeywords(query), ...extractKeywords(translatedQuery) ];
            products = products.filter(prod => {
                const text = (prod.name + ' ' + prod.description + ' ' + (prod.name_it || '') + ' ' + (prod.description_it || '')).toLowerCase();
                return keywords.some(word => text.includes(word));
            });
            return products;
        } catch (error) {
            logger.error('Errore nella ricerca USDA', {
                query,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            throw error;
        }
    }

    async searchSimilarMeals(query, options = {}) {
        try {
            const normalizedQuery = query.trim().toLowerCase();
            if (!normalizedQuery) {
                throw new Error('Query di ricerca vuota');
            }
            const cacheKey = `meal_search:${normalizedQuery}:${options.category || 'all'}`;
            const cachedResults = await cacheService.get(cacheKey);
            if (cachedResults) {
                logger.info('Risultati recuperati dalla cache', { query: normalizedQuery });
                return cachedResults;
            }
            let results = [];
            if (this.apiKey) {
                try {
                    results = await this.searchUsdaFood(normalizedQuery, options);
                    logger.info('Risultati recuperati da API USDA', {
                        query: normalizedQuery,
                        count: results.length
                    });
                } catch (error) {
                    logger.warn('Fallback su database locale', {
                        query: normalizedQuery,
                        error: error instanceof Error ? error.message : 'Unknown error'
                    });
                }
            }
            if (results.length === 0) {
                results = this.searchLocalDatabase(normalizedQuery);
                logger.info('Risultati recuperati da database locale', {
                    query: normalizedQuery,
                    count: results.length
                });
            }
            const limit = Math.min(options.limit || 10, 25);
            results = results.slice(0, limit);
            if (results.length > 0) {
                await cacheService.set(cacheKey, results, 24 * 60 * 60);
            }
            return results;
        } catch (error) {
            logger.error('Errore nella ricerca pasti', {
                query,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            throw error;
        }
    }

    async getMealNutrition(mealId) {
        try {
            const cacheKey = `meal_nutrition:${mealId}`;
            const cachedData = await cacheService.get(cacheKey);
            if (cachedData) {
                logger.info('Valori nutrizionali recuperati dalla cache', { mealId });
                return cachedData;
            }
            let nutrition;
            if (mealId.startsWith('local_')) {
                const localMeal = localMealsDatabase.find(meal => meal.id === mealId);
                if (!localMeal) {
                    throw new Error('Pasto non trovato nel database locale');
                }
                nutrition = localMeal;
            } else {
                if (!this.apiKey) {
                    throw new Error('API credentials not configured');
                }
                const response = await axios.get(`${this.baseUrl}/food/${mealId}?api_key=${this.apiKey}`);
                const food = response.data;
                nutrition = {
                    id: mealId,
                    name: food.description,
                    description: food.foodCategory,
                    category: food.dataType,
                    portion_size: {
                        amount: 100,
                        unit: 'g'
                    },
                    nutrition: {
                        calories: food.foodNutrients?.find((n) => n.nutrientName === 'Energy')?.value || 0,
                        proteins: food.foodNutrients?.find((n) => n.nutrientName === 'Protein')?.value || 0,
                        carbohydrates: food.foodNutrients?.find((n) => n.nutrientName === 'Carbohydrate, by difference')?.value || 0,
                        fats: food.foodNutrients?.find((n) => n.nutrientName === 'Total lipid (fat)')?.value || 0,
                        fiber: food.foodNutrients?.find((n) => n.nutrientName === 'Fiber, total dietary')?.value || 0,
                        sodium: food.foodNutrients?.find((n) => n.nutrientName === 'Sodium, Na')?.value || 0
                    },
                    image_url: undefined,
                    source: 'usda'
                };
            }
            await cacheService.set(cacheKey, nutrition, 7 * 24 * 60 * 60);
            return nutrition;
        } catch (error) {
            logger.error('Errore nel recupero valori nutrizionali', {
                mealId,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            throw error;
        }
    }
}

module.exports = { nutritionDataService: new NutritionDataService() };
