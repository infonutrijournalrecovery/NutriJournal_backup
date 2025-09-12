
import axios from 'axios';
import { NutritionSearchResult, SearchOptions } from './types';
import { localMealsDatabase } from './localData';
import { logger } from '../../middleware/logging';
import { cacheService } from '../cacheService';
import FuzzySearch from 'fuzzy-search';


class NutritionDataService {
    private readonly baseUrl: string;

    constructor() {
        this.baseUrl = 'https://api.nal.usda.gov/fdc/v1';
    }

    private get apiKey(): string {
        return process.env['USDA_API_KEY'] || '';
    }

    private searchLocalDatabase(query: string): NutritionSearchResult[] {
        const searcher = new FuzzySearch(localMealsDatabase, ['name', 'description'], {
            caseSensitive: false,
        });

        return searcher.search(query);
    }


    private async searchUsdaFood(query: string, options: SearchOptions = {}): Promise<NutritionSearchResult[]> {
        try {
            const dataType = options.category === 'Branded' ? ['Branded'] : options.category === 'Survey' ? ['Survey (FNDDS)'] : ['Branded', 'Survey (FNDDS)'];
            const response = await axios.post(
                `${this.baseUrl}/foods/search?api_key=${this.apiKey}`,
                {
                    query,
                    dataType,
                    pageSize: options.limit || 20
                }
            );

            logger.info('Risposta API USDA ricevuta', {
                query,
                resultsCount: response.data.foods.length
            });

            return response.data.foods.map((item: any) => ({
                id: item.fdcId,
                name: item.description,
                description: item.foodCategory,
                category: item.dataType,
                portion_size: {
                    amount: 100,
                    unit: 'g'
                },
                nutrition: {
                    calories: item.foodNutrients?.find((n: any) => n.nutrientName === 'Energy')?.value || 0,
                    proteins: item.foodNutrients?.find((n: any) => n.nutrientName === 'Protein')?.value || 0,
                    carbohydrates: item.foodNutrients?.find((n: any) => n.nutrientName === 'Carbohydrate, by difference')?.value || 0,
                    fats: item.foodNutrients?.find((n: any) => n.nutrientName === 'Total lipid (fat)')?.value || 0,
                    fiber: item.foodNutrients?.find((n: any) => n.nutrientName === 'Fiber, total dietary')?.value || 0,
                    sodium: item.foodNutrients?.find((n: any) => n.nutrientName === 'Sodium, Na')?.value || 0
                },
                image_url: undefined,
                source: 'usda'
            }));
        } catch (error) {
            logger.error('Errore nella ricerca USDA', {
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
            const cacheKey = `meal_search:${normalizedQuery}:${options.category || 'all'}`;
            const cachedResults = await cacheService.get<NutritionSearchResult[]>(cacheKey);
            if (cachedResults) {
                logger.info('Risultati recuperati dalla cache', { query: normalizedQuery });
                return cachedResults;
            }

            let results: NutritionSearchResult[] = [];

            // Prova prima con l'API USDA
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
                // Altrimenti usa l'API USDA
                if (!this.apiKey) {
                    throw new Error('API credentials not configured');
                }

                // Recupera dettagli alimento da USDA
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
                        calories: food.foodNutrients?.find((n: any) => n.nutrientName === 'Energy')?.value || 0,
                        proteins: food.foodNutrients?.find((n: any) => n.nutrientName === 'Protein')?.value || 0,
                        carbohydrates: food.foodNutrients?.find((n: any) => n.nutrientName === 'Carbohydrate, by difference')?.value || 0,
                        fats: food.foodNutrients?.find((n: any) => n.nutrientName === 'Total lipid (fat)')?.value || 0,
                        fiber: food.foodNutrients?.find((n: any) => n.nutrientName === 'Fiber, total dietary')?.value || 0,
                        sodium: food.foodNutrients?.find((n: any) => n.nutrientName === 'Sodium, Na')?.value || 0
                    },
                    image_url: undefined,
                    source: 'usda'
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
