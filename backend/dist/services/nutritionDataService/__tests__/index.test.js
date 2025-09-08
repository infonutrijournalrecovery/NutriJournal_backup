"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
const axios_1 = __importDefault(require("axios"));
const index_1 = require("../index");
const cacheService_1 = require("../../cacheService");
// Mock delle dipendenze
globals_1.jest.mock('axios');
globals_1.jest.mock('../../cacheService');
globals_1.jest.mock('../../../middleware/logging', () => require('../../../test/mocks/logger'));
const mockedAxios = globals_1.jest.mocked(axios_1.default);
const mockedCacheService = globals_1.jest.mocked(cacheService_1.cacheService);
// Mock della risposta Edamam
const mockEdamamResponse = {
    data: {
        text: 'pizza',
        hints: [
            {
                food: {
                    foodId: 'food_123',
                    label: 'Pizza Margherita',
                    category: 'Pizza',
                    nutrients: {
                        ENERC_KCAL: 266,
                        PROCNT: 8.8,
                        CHOCDF: 33.0,
                        FAT: 10.5,
                        FIBTG: 2.0,
                        NA: 520
                    },
                    image: 'https://example.com/pizza.jpg'
                }
            }
        ]
    }
};
(0, globals_1.describe)('NutritionDataService', () => {
    (0, globals_1.beforeEach)(() => {
        globals_1.jest.clearAllMocks();
        process.env['EDAMAM_APP_ID'] = 'test-app-id';
        process.env['EDAMAM_APP_KEY'] = 'test-app-key';
    });
    (0, globals_1.describe)('searchSimilarMeals', () => {
        (0, globals_1.it)('should return cached results if available', async () => {
            const mockCachedResults = [
                {
                    id: 'cached_123',
                    name: 'Cached Pizza',
                    source: 'cache',
                    portion_size: { amount: 100, unit: 'g' },
                    nutrition: {
                        calories: 250,
                        proteins: 10,
                        carbohydrates: 30,
                        fats: 12
                    }
                }
            ];
            mockedCacheService.get.mockResolvedValueOnce(mockCachedResults);
            const results = await index_1.nutritionDataService.searchSimilarMeals('pizza');
            (0, globals_1.expect)(results).toEqual(mockCachedResults);
            (0, globals_1.expect)(mockedCacheService.get).toHaveBeenCalledWith('meal_search:pizza:undefined');
            (0, globals_1.expect)(mockedAxios.get).not.toHaveBeenCalled();
        });
        (0, globals_1.it)('should search Edamam if no cached results', async () => {
            mockedCacheService.get.mockResolvedValueOnce(null);
            mockedAxios.get.mockResolvedValueOnce(mockEdamamResponse);
            const results = await index_1.nutritionDataService.searchSimilarMeals('pizza');
            (0, globals_1.expect)(results).toHaveLength(1);
            (0, globals_1.expect)(results[0].name).toBe('Pizza Margherita');
            (0, globals_1.expect)(mockedCacheService.set).toHaveBeenCalled();
        });
        (0, globals_1.it)('should use local database if Edamam fails', async () => {
            mockedCacheService.get.mockResolvedValueOnce(null);
            mockedAxios.get.mockRejectedValueOnce(new Error('API Error'));
            const results = await index_1.nutritionDataService.searchSimilarMeals('pizza');
            (0, globals_1.expect)(results.length).toBeGreaterThan(0);
            (0, globals_1.expect)(results.some(r => r.source === 'local')).toBe(true);
        });
        (0, globals_1.it)('should handle empty queries', async () => {
            await (0, globals_1.expect)(index_1.nutritionDataService.searchSimilarMeals('')).rejects.toThrow('Query di ricerca vuota');
        });
        (0, globals_1.it)('should respect result limits', async () => {
            mockedCacheService.get.mockResolvedValueOnce(null);
            const hints = Array.from({ length: 30 }, (_, i) => ({
                food: {
                    foodId: `food_${i}`,
                    label: `Pizza Margherita ${i}`,
                    category: 'Pizza',
                    nutrients: {
                        ENERC_KCAL: 266,
                        PROCNT: 8.8,
                        CHOCDF: 33.0,
                        FAT: 10.5,
                        FIBTG: 2.0,
                        NA: 520
                    },
                    image: 'https://example.com/pizza.jpg'
                }
            }));
            mockedAxios.get.mockResolvedValueOnce({
                data: {
                    hints
                }
            });
            const results = await index_1.nutritionDataService.searchSimilarMeals('pizza', { limit: 5 });
            (0, globals_1.expect)(results).toHaveLength(5);
            (0, globals_1.expect)(mockedAxios.get).toHaveBeenCalled();
            (0, globals_1.expect)(mockedCacheService.set).toHaveBeenCalled();
        });
    });
    (0, globals_1.describe)('getMealNutrition', () => {
        (0, globals_1.it)('should return cached nutrition data if available', async () => {
            const mockCachedNutrition = {
                id: 'cached_123',
                name: 'Cached Meal',
                source: 'cache',
                portion_size: { amount: 100, unit: 'g' },
                nutrition: {
                    calories: 250,
                    proteins: 10,
                    carbohydrates: 30,
                    fats: 12
                }
            };
            mockedCacheService.get.mockResolvedValueOnce(mockCachedNutrition);
            const result = await index_1.nutritionDataService.getMealNutrition('cached_123');
            (0, globals_1.expect)(result).toEqual(mockCachedNutrition);
            (0, globals_1.expect)(mockedCacheService.get).toHaveBeenCalledWith('meal_nutrition:cached_123');
            (0, globals_1.expect)(mockedAxios.get).not.toHaveBeenCalled();
        });
        (0, globals_1.it)('should use local database for local IDs', async () => {
            mockedCacheService.get.mockResolvedValueOnce(null);
            const result = await index_1.nutritionDataService.getMealNutrition('local_001');
            (0, globals_1.expect)(result).toBeDefined();
            (0, globals_1.expect)(result.source).toBe('local');
            (0, globals_1.expect)(mockedAxios.get).not.toHaveBeenCalled();
        });
        (0, globals_1.it)('should use Edamam API for external IDs', async () => {
            mockedCacheService.get.mockResolvedValueOnce(null);
            process.env['EDAMAM_APP_ID'] = 'test-app-id';
            process.env['EDAMAM_APP_KEY'] = 'test-app-key';
            mockedAxios.get.mockResolvedValueOnce({
                data: {
                    label: 'Test Meal',
                    category: 'Test Category',
                    nutrients: {
                        ENERC_KCAL: 200,
                        PROCNT: 10,
                        CHOCDF: 20,
                        FAT: 8
                    }
                }
            });
            const result = await index_1.nutritionDataService.getMealNutrition('external_123');
            (0, globals_1.expect)(result).toBeDefined();
            (0, globals_1.expect)(result.source).toBe('edamam');
            (0, globals_1.expect)(mockedCacheService.set).toHaveBeenCalled();
        });
        (0, globals_1.it)('should handle API errors for external IDs', async () => {
            mockedCacheService.get.mockResolvedValueOnce(null);
            mockedAxios.get.mockRejectedValueOnce(new Error('API Error'));
            await (0, globals_1.expect)(index_1.nutritionDataService.getMealNutrition('external_123'))
                .rejects.toThrow();
        });
    });
});
