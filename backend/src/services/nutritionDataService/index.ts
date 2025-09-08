import axios from 'axios';
import { NutritionSearchResult, SearchOptions, EdamamResponse } from './types';
import { localMealsDatabase } from './localData';
import { logger } from '../../middleware/logging';
import { cacheService } from '../cacheService';
import FuzzySearch from 'fuzzy-search';

class NutritionDataService {
    private readonly baseUrl: string;

    constructor() {
        this.baseUrl = 'https://api.edamam.com';
    }

    private get appId(): string {
        return process.env['EDAMAM_APP_ID'] || '';
    }

    private get appKey(): string {
        return process.env['EDAMAM_APP_KEY'] || '';
    }

    private searchLocalDatabase(query: string): NutritionSearchResult[] {
        const searcher = new FuzzySearch(localMealsDatabase, ['name', 'description'], {
            caseSensitive: false,
        });

        return searcher.search(query);
    }

    private async searchEdamamFood(query: string, options: SearchOptions = {}): Promise<NutritionSearchResult[]> {
        try {
            const response = await axios.get<EdamamResponse>(`${this.baseUrl}/api/food-database/v2/parser`, {
                params: {
                    app_id: this.appId,
                    app_key: this.appKey,
                    ingr: query,
                    lang: options.language || 'it',
                    category: options.category || 'generic-meals'
                }
            });

            logger.info('Risposta API ricevuta', {
                query,
                resultsCount: response.data.hints.length
            });

            return response.data.hints.map(item => ({
                id: item.food.foodId,
                name: item.food.label,
                description: item.food.category,
                portion_size: {
                    amount: 100,
                    unit: 'g'
                },
                nutrition: {
                    calories: item.food.nutrients.ENERC_KCAL,
                    proteins: item.food.nutrients.PROCNT,
                    carbohydrates: item.food.nutrients.CHOCDF,
                    fats: item.food.nutrients.FAT,
                    fiber: item.food.nutrients.FIBTG,
                    sodium: item.food.nutrients.NA
                },
                image_url: item.food.image,
                source: 'edamam'
            }));
        } catch (error) {
            logger.error('Errore nella ricerca Edamam', {
                query,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            throw error;
        }
    }

    async searchSimilarMeals(query: string, options: SearchOptions = {}): Promise<NutritionSearchResult[]> {
        try {
            // Normalizza e pulisci la query
            const normalizedQuery = query.trim().toLowerCase();
            if (!normalizedQuery) {
                throw new Error('Query di ricerca vuota');
            }

            // Controlla la cache
            const cacheKey = `meal_search:${normalizedQuery}:${options.language}`;
            const cachedResults = await cacheService.get<NutritionSearchResult[]>(cacheKey);
            
            if (cachedResults) {
                logger.info('Risultati recuperati dalla cache', { query: normalizedQuery });
                return cachedResults;
            }

            let results: NutritionSearchResult[] = [];

            // Prova prima con l'API esterna
            if (this.appId && this.appKey) {
                try {
                    results = await this.searchEdamamFood(normalizedQuery, options);
                    logger.info('Risultati recuperati da API', {
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

            // Se non ci sono risultati o l'API non è configurata, usa il database locale
            if (results.length === 0) {
                results = this.searchLocalDatabase(normalizedQuery);
                logger.info('Risultati recuperati da database locale', {
                    query: normalizedQuery,
                    count: results.length
                });
            }

            // Limita i risultati
            const limit = Math.min(options.limit || 10, 25);
            results = results.slice(0, limit);

            // Salva in cache
            if (results.length > 0) {
                await cacheService.set(cacheKey, results, 24 * 60 * 60); // Cache per 24 ore
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

    async getMealNutrition(mealId: string): Promise<NutritionSearchResult> {
        try {
            // Controlla la cache
            const cacheKey = `meal_nutrition:${mealId}`;
            const cachedData = await cacheService.get<NutritionSearchResult>(cacheKey);
            
            if (cachedData) {
                logger.info('Valori nutrizionali recuperati dalla cache', { mealId });
                return cachedData;
            }

            let nutrition: NutritionSearchResult;

            // Se è un ID locale, cerca nel database locale
            if (mealId.startsWith('local_')) {
                const localMeal = localMealsDatabase.find(meal => meal.id === mealId);
                if (!localMeal) {
                    throw new Error('Pasto non trovato nel database locale');
                }
                nutrition = localMeal;
            } else {
                // Altrimenti usa l'API
                if (!this.appId || !this.appKey) {
                    throw new Error('API credentials not configured');
                }

                const response = await axios.get(`${this.baseUrl}/api/food-database/v2/nutrients`, {
                    params: {
                        app_id: this.appId,
                        app_key: this.appKey,
                        foodId: mealId
                    }
                });

                const food = response.data;
                nutrition = {
                    id: mealId,
                    name: food.label,
                    description: food.category,
                    portion_size: {
                        amount: 100,
                        unit: 'g'
                    },
                    nutrition: {
                        calories: food.nutrients.ENERC_KCAL,
                        proteins: food.nutrients.PROCNT,
                        carbohydrates: food.nutrients.CHOCDF,
                        fats: food.nutrients.FAT,
                        fiber: food.nutrients.FIBTG,
                        sodium: food.nutrients.NA
                    },
                    image_url: food.image,
                    source: 'edamam'
                };
            }

            // Salva in cache
            await cacheService.set(cacheKey, nutrition, 7 * 24 * 60 * 60); // Cache per 7 giorni

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

export const nutritionDataService = new NutritionDataService();
