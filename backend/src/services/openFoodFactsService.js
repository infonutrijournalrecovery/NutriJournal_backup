const axios = require('axios');
const { logger } = require('../middleware/logging');
const usdaService = require('./usdaService');

class OpenFoodFactsService {
    constructor() {
        this.baseUrl = 'https://world.openfoodfacts.org/cgi/search.pl';
        this.defaultFields = [
            'code',
            'product_name',
            'product_name_en',
            'brands',
            'image_url',
            'serving_size',
            'serving_quantity',
            'nutriments',
            'categories',
            'labels',
            'ingredients_text',
            'allergens',
            'ecoscore_grade',
            'nutriscore_grade',
            'unique_scans_n',
            'popularity_tags',
            'countries_tags'
        ];
    }

    async searchProducts(query, page = 1, limit = 20, includeStandard = true) {
        try {
            // Log della ricerca
            console.log(`Searching for: "${query}" (page ${page}, limit ${limit})`);
            
            // Ricerca parallela su USDA se richiesto
            const usdaPromise = includeStandard ? 
                usdaService.searchProducts(query, Math.floor(limit / 2), page) : 
                Promise.resolve({ products: [], pagination: { total: 0 } });
            
            // Parametri di ricerca per OpenFoodFacts
            const url = 'https://world.openfoodfacts.org/cgi/search.pl';
            const response = await axios.get(url, {
                params: {
                    search_terms: query,
                    search_simple: 1,
                    action: 'process',
                    json: 1,
                    page_size: limit,
                    page: page,
                    fields: [
                        'code',
                        'product_name',
                        'brands',
                        'image_url',
                        'serving_size',
                        'serving_quantity',
                        'nutriments',
                        'nutrition_data_per',
                        'categories_tags',
                        'allergens_tags',
                        'ingredients_text',
                        'ecoscore_grade',
                        'nutriscore_grade',
                        'nutrition_grades',
                        'unique_scans_n',
                        'countries_tags',
                        'generic_name'
                    ].join(',')
                }
            });

            console.log('OpenFoodFacts response:', response.data);
            
            if (!response.data.products || !Array.isArray(response.data.products)) {
                console.error('Invalid response format from OpenFoodFacts');
                return {
                    products: [],
                    pagination: {
                        page,
                        pageSize: limit,
                        total: 0
                    }
                };
            }

            // Filtra e trasforma i risultati
            const transformedProducts = response.data.products
                .filter(product => {
                    return product.product_name && 
                           product.code &&
                           product.nutriments;
                })
                .map(product => {
                    const servingSize = product.serving_size || '100g';
                    const servingQuantity = product.serving_quantity || 100;
                    
                    // Usa il nome del prodotto
                    const productName = product.product_name;
                    
                    // Gestisci le porzioni
                    const unit = this.extractUnit(servingSize);
                    const nutritionPerServing = this.calculateNutritionPerServing(product);
                    
                    // Popolarità dal numero di scansioni
                    const popularity = product.unique_scans_n || 0;
                    
                    return {
                        id: product.code,
                        name: productName,
                        brand: product.brands,
                        description: product.generic_name,
                        image: product.image_url,
                        serving: {
                            size: servingSize,
                            quantity: servingQuantity,
                            unit: unit,
                            description: `${servingSize} (${servingQuantity}${unit})`
                        },
                        nutrition_per_100g: {
                            calories: Math.round(product.nutriments['energy-kcal_100g'] || 0),
                            proteins: Math.round((product.nutriments.proteins_100g || 0) * 10) / 10,
                            carbohydrates: Math.round((product.nutriments.carbohydrates_100g || 0) * 10) / 10,
                            fats: Math.round((product.nutriments.fat_100g || 0) * 10) / 10,
                            fiber: Math.round((product.nutriments.fiber_100g || 0) * 10) / 10,
                            sodium: Math.round((product.nutriments.sodium_100g || 0) * 10) / 10,
                            sugars: Math.round((product.nutriments.sugars_100g || 0) * 10) / 10,
                            saturated_fat: Math.round((product.nutriments['saturated-fat_100g'] || 0) * 10) / 10
                        },
                        nutrition_per_serving: nutritionPerServing ? {
                            calories: Math.round(nutritionPerServing.calories),
                            proteins: Math.round(nutritionPerServing.proteins * 10) / 10,
                            carbohydrates: Math.round(nutritionPerServing.carbohydrates * 10) / 10,
                            fats: Math.round(nutritionPerServing.fats * 10) / 10,
                            fiber: Math.round(nutritionPerServing.fiber * 10) / 10,
                            sodium: Math.round(nutritionPerServing.sodium * 10) / 10,
                            sugars: Math.round(nutritionPerServing.sugars * 10) / 10,
                            saturated_fat: Math.round(nutritionPerServing.saturated_fat * 10) / 10
                        } : null,
                        categories: product.categories ? product.categories.split(',').map(c => c.trim()) : [],
                        allergens: product.allergens ? product.allergens.split(',').map(a => a.trim()) : [],
                        ingredients: product.ingredients_text,
                        eco_score: product.ecoscore_grade,
                        nutri_score: product.nutriscore_grade,
                        popularity: popularity,
                        verified: true, // se il prodotto ha superato i filtri precedenti
                        countries: product.countries_tags || []
                    };
                })
                // Ordina prima per nome esatto, poi per popolarità
                .sort((a, b) => {
                    const exactMatchA = a.name.toLowerCase() === query.toLowerCase();
                    const exactMatchB = b.name.toLowerCase() === query.toLowerCase();
                    if (exactMatchA && !exactMatchB) return -1;
                    if (!exactMatchA && exactMatchB) return 1;
                    return b.popularity - a.popularity;
                });

            // Attendi i risultati USDA
            const usdaResults = await usdaPromise;
            
            // Combina i risultati
            const allProducts = [...usdaResults.products, ...transformedProducts];
            
            // Ordina per rilevanza
            const sortedProducts = allProducts.sort((a, b) => {
                const exactMatchA = a.name.toLowerCase() === query.toLowerCase();
                const exactMatchB = b.name.toLowerCase() === query.toLowerCase();
                if (exactMatchA && !exactMatchB) return -1;
                if (!exactMatchA && exactMatchB) return 1;
                return b.popularity - a.popularity;
            });

            return {
                products: sortedProducts,
                pagination: {
                    page: parseInt(page),
                    pageSize: parseInt(limit),
                    total: (response.data.count || transformedProducts.length) + (usdaResults.pagination?.total || 0)
                },
                sources: {
                    openFoodFacts: transformedProducts.length,
                    usda: usdaResults.products.length
                }
            };

        } catch (error) {
            logger.error('Errore nella ricerca OpenFoodFacts:', {
                error: error.message,
                query,
                page,
                limit
            });
            throw error;
        }
    }

    // Estrae l'unità di misura dalla stringa della porzione
    extractUnit(servingSize) {
        if (!servingSize) return 'g';
        
        const units = {
            'g': 'g',
            'gr': 'g',
            'grammi': 'g',
            'grammes': 'g',
            'ml': 'ml',
            'millilitri': 'ml',
            'oz': 'oz',
            'ounce': 'oz',
            'unit': 'unit',
            'piece': 'unit',
            'pezzo': 'unit',
            'pezzi': 'unit'
        };
        
        const servingSizeLower = servingSize.toLowerCase();
        for (const [key, value] of Object.entries(units)) {
            if (servingSizeLower.includes(key)) {
                return value;
            }
        }
        
        return 'g';
    }

    // Calcola i valori nutrizionali per 100g
    calculateNutritionPer100g(product) {
        if (!product.nutriments) return null;

        return {
            calories: Math.round(product.nutriments['energy-kcal_100g'] || 0),
            proteins: Math.round((product.nutriments.proteins_100g || 0) * 10) / 10,
            carbohydrates: Math.round((product.nutriments.carbohydrates_100g || 0) * 10) / 10,
            fats: Math.round((product.nutriments.fat_100g || 0) * 10) / 10,
            saturated_fat: Math.round((product.nutriments['saturated-fat_100g'] || 0) * 10) / 10,
            fiber: Math.round((product.nutriments.fiber_100g || 0) * 10) / 10,
            sodium: Math.round((product.nutriments.sodium_100g || 0) * 10) / 10,
            sugars: Math.round((product.nutriments.sugars_100g || 0) * 10) / 10
        };
    }

    // Calcola i valori nutrizionali per porzione
    calculateNutritionPerServing(product) {
        if (!product.nutriments) return null;
        if (!product.serving_quantity) return this.calculateNutritionPer100g(product);

        const servingRatio = product.serving_quantity / 100;
        const per100g = this.calculateNutritionPer100g(product);

        return Object.entries(per100g).reduce((acc, [key, value]) => {
            acc[key] = Math.round(value * servingRatio * 10) / 10;
            return acc;
        }, {});
    }
}

module.exports = new OpenFoodFactsService();
