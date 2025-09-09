const express = require('express');
const italianFoodService = require('../services/italianFoodService');
const openFoodFactsService = require('../services/openFoodFactsService');

const router = express.Router();

// GET /api/italian-food/search - Cerca piatti italiani
router.get('/search', async (req, res) => {
    try {
        const { q: query, category, region, diet, allergens } = req.query;
        
        if (!query) {
            return res.status(400).json({
                success: false,
                message: 'Query di ricerca richiesta'
            });
        }

        let results = [];

        // 1. Cerca nei piatti tradizionali italiani
        const italianResults = italianFoodService.searchItalianDishes(query);
        results.push(...italianResults);

        // 2. Cerca in OpenFoodFacts per alimenti italiani
        const openFoodResults = await openFoodFactsService.searchProducts(query, {
            country: 'italia',
            language: 'it'
        });
        
        // Combina risultati con priorità ai piatti tradizionali
        const combinedResults = [
            ...italianResults.map(item => ({ ...item, priority: 1 })),
            ...openFoodResults.map(item => ({ ...item, priority: 2, source: 'openfoodfacts' }))
        ];

        // Applica filtri se specificati
        let filteredResults = combinedResults;

        if (region) {
            filteredResults = filteredResults.filter(item => 
                !item.region || item.region.toLowerCase().includes(region.toLowerCase())
            );
        }

        if (diet) {
            filteredResults = filteredResults.filter(item => {
                switch (diet.toLowerCase()) {
                    case 'vegan':
                        return item.vegan === true;
                    case 'vegetarian':
                        return item.vegan === true || item.vegetarian === true;
                    case 'gluten_free':
                        return !item.allergens || !item.allergens.includes('gluten');
                    default:
                        return true;
                }
            });
        }

        if (typeof allergens === 'string') {
            const excludeAllergens = allergens.split(',');
            filteredResults = filteredResults.filter(item => 
                !item.allergens || 
                !item.allergens.some(allergen => excludeAllergens.includes(allergen))
            );
        }

        // Ordina per priorità e rilevanza
        filteredResults.sort((a, b) => {
            if (a.priority !== b.priority) {
                return a.priority - b.priority;
            }
            return 0;
        });

        res.json({
            success: true,
            data: {
                query,
                total: filteredResults.length,
                results: filteredResults.slice(0, 20) // Limita a 20 risultati
            }
        });

    } catch (error) {
        console.error('❌ Errore ricerca cibo italiano:', error);
        res.status(500).json({
            success: false,
            message: 'Errore interno del server',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// GET /api/italian-food/dish/:id - Dettagli piatto specifico
router.get('/dish/:id', (req, res) => {
    try {
        const { id } = req.params;
        const dish = italianFoodService.getDishDetails(id);
        
        if (!dish) {
            return res.status(404).json({
                success: false,
                message: 'Piatto non trovato'
            });
        }

        res.json({
            success: true,
            data: dish
        });

    } catch (error) {
        console.error('❌ Errore dettagli piatto:', error);
        res.status(500).json({
            success: false,
            message: 'Errore interno del server'
        });
    }
});

// GET /api/italian-food/nutrition/:id - Informazioni nutrizionali
router.get('/nutrition/:id', (req, res) => {
    try {
        const { id } = req.params;
        const { portion = 100 } = req.query;
        
        const nutritionInfo = italianFoodService.getNutritionalInfo(id, parseInt(portion));
        
        if (!nutritionInfo) {
            return res.status(404).json({
                success: false,
                message: 'Informazioni nutrizionali non disponibili'
            });
        }

        res.json({
            success: true,
            data: nutritionInfo
        });

    } catch (error) {
        console.error('❌ Errore informazioni nutrizionali:', error);
        res.status(500).json({
            success: false,
            message: 'Errore interno del server'
        });
    }
});

// GET /api/italian-food/suggestions - Suggerimenti di ricerca
router.get('/suggestions', (req, res) => {
    try {
        const { q: query, type = 'all' } = req.query;
        
        if (!query || query.length < 2) {
            return res.json({
                success: true,
                data: {
                    suggestions: []
                }
            });
        }

        const suggestions = italianFoodService.getSuggestions(query, type);
        
        res.json({
            success: true,
            data: {
                query,
                suggestions: suggestions.slice(0, 10)
            }
        });

    } catch (error) {
        console.error('❌ Errore suggerimenti:', error);
        res.status(500).json({
            success: false,
            message: 'Errore interno del server'
        });
    }
});

// GET /api/italian-food/regions - Lista regioni con specialità
router.get('/regions', (req, res) => {
    try {
        const regions = italianFoodService.getRegionalSpecialties();
        
        res.json({
            success: true,
            data: {
                regions
            }
        });

    } catch (error) {
        console.error('❌ Errore regioni:', error);
        res.status(500).json({
            success: false,
            message: 'Errore interno del server'
        });
    }
});

// GET /api/italian-food/region/:region - Piatti per regione
router.get('/region/:region', (req, res) => {
    try {
        const { region } = req.params;
        const dishes = italianFoodService.getDishesByRegion(region);
        
        res.json({
            success: true,
            data: {
                region,
                dishes
            }
        });

    } catch (error) {
        console.error('❌ Errore piatti regione:', error);
        res.status(500).json({
            success: false,
            message: 'Errore interno del server'
        });
    }
});

// GET /api/italian-food/additives/search - Cerca additivi
router.get('/additives/search', (req, res) => {
    try {
        const { q: query } = req.query;
        
        if (!query) {
            return res.status(400).json({
                success: false,
                message: 'Query di ricerca richiesta'
            });
        }

        const additives = italianFoodService.searchAdditives(query);
        
        res.json({
            success: true,
            data: {
                query,
                total: additives.length,
                additives
            }
        });

    } catch (error) {
        console.error('❌ Errore ricerca additivi:', error);
        res.status(500).json({
            success: false,
            message: 'Errore interno del server'
        });
    }
});

// GET /api/italian-food/allergens/search - Cerca allergeni
router.get('/allergens/search', (req, res) => {
    try {
        const { q: query } = req.query;
        
        if (!query) {
            return res.status(400).json({
                success: false,
                message: 'Query di ricerca richiesta'
            });
        }

        const allergens = italianFoodService.searchAllergens(query);
        
        res.json({
            success: true,
            data: {
                query,
                total: allergens.length,
                allergens
            }
        });

    } catch (error) {
        console.error('❌ Errore ricerca allergeni:', error);
        res.status(500).json({
            success: false,
            message: 'Errore interno del server'
        });
    }
});

// GET /api/italian-food/filter - Filtra per preferenze dietetiche
router.get('/filter', (req, res) => {
    try {
        const { diet, exclude_allergens } = req.query;
        
        let results = [];
        
        if (diet) {
            results = italianFoodService.filterByDiet(diet);
        }
        
        if (typeof exclude_allergens === 'string') {
            const excludeList = exclude_allergens.split(',');
            if (results.length > 0) {
                results = results.filter(dish => 
                    !dish.allergens || 
                    !dish.allergens.some(allergen => excludeList.includes(allergen))
                );
            } else {
                results = italianFoodService.filterByAllergens(excludeList);
            }
        }
        
        res.json({
            success: true,
            data: {
                filters: { diet, exclude_allergens },
                total: results.length,
                results
            }
        });

    } catch (error) {
        console.error('❌ Errore filtri:', error);
        res.status(500).json({
            success: false,
            message: 'Errore interno del server'
        });
    }
});

// GET /api/italian-food/stats - Statistiche database
router.get('/stats', (req, res) => {
    try {
        const stats = italianFoodService.getStats();
        
        res.json({
            success: true,
            data: stats
        });

    } catch (error) {
        console.error('❌ Errore statistiche:', error);
        res.status(500).json({
            success: false,
            message: 'Errore interno del server'
        });
    }
});

module.exports = router;
