const fs = require('fs').promises;
const path = require('path');

class ItalianFoodService {
    constructor() {
        this.additives = null;
        this.allergens = null;
        this.italianDishes = null;
        this.loadData();
    }

    async loadData() {
        try {
            const dataPath = path.join(__dirname, '../data');
            
            // Carica dati additivi
            const additivesData = await fs.readFile(path.join(dataPath, 'additives.json'), 'utf8');
            this.additives = JSON.parse(additivesData);
            
            // Carica dati allergeni
            const allergensData = await fs.readFile(path.join(dataPath, 'allergens.json'), 'utf8');
            this.allergens = JSON.parse(allergensData);
            
            // Carica piatti italiani
            const dishesData = await fs.readFile(path.join(dataPath, 'italian_dishes.json'), 'utf8');
            this.italianDishes = JSON.parse(dishesData);
            
            console.log('✅ Dati italiani caricati con successo');
        } catch (error) {
            console.error('❌ Errore nel caricamento dati italiani:', error);
        }
    }

    // Cerca piatti italiani per nome
    searchItalianDishes(query) {
        if (!this.italianDishes) return [];
        
        const searchTerm = query.toLowerCase();
        const results = [];
        
        // Cerca in tutte le categorie
        Object.keys(this.italianDishes.traditional_dishes).forEach(category => {
            Object.keys(this.italianDishes.traditional_dishes[category]).forEach(dishKey => {
                const dish = this.italianDishes.traditional_dishes[category][dishKey];
                
                if (dish.name_it.toLowerCase().includes(searchTerm) ||
                    dishKey.toLowerCase().includes(searchTerm)) {
                    
                    results.push({
                        ...dish,
                        id: dishKey,
                        category: category,
                        source: 'traditional_italian'
                    });
                }
            });
        });
        
        return results;
    }

    // Ottieni informazioni dettagliate su un piatto
    getDishDetails(dishId) {
        if (!this.italianDishes) return null;
        
        // Cerca in tutte le categorie
        for (const category of Object.keys(this.italianDishes.traditional_dishes)) {
            if (this.italianDishes.traditional_dishes[category][dishId]) {
                const dish = this.italianDishes.traditional_dishes[category][dishId];
                
                return {
                    ...dish,
                    id: dishId,
                    category: category,
                    allergen_details: this.getDetailedAllergens(dish.allergens || []),
                    additives_info: this.analyzeIngredients(dish.ingredients || []),
                    source: 'traditional_italian'
                };
            }
        }
        
        return null;
    }

    // Analizza ingredienti per trovare additivi
    analyzeIngredients(ingredients) {
        if (!this.additives) return [];
        
        const foundAdditives = [];
        
        ingredients.forEach(ingredient => {
            const ingredientLower = ingredient.toLowerCase();
            
            // Cerca codici E
            const eCodeMatch = ingredientLower.match(/e\\d{3,4}/g);
            if (eCodeMatch) {
                eCodeMatch.forEach(code => {
                    const upperCode = code.toUpperCase();
                    if (this.additives.additives[upperCode]) {
                        foundAdditives.push({
                            code: upperCode,
                            ...this.additives.additives[upperCode]
                        });
                    }
                });
            }
            
            // Cerca nomi di additivi comuni
            Object.keys(this.additives.additives).forEach(code => {
                const additive = this.additives.additives[code];
                if (ingredientLower.includes(additive.name_it.toLowerCase())) {
                    foundAdditives.push({
                        code: code,
                        ...additive
                    });
                }
            });
        });
        
        return foundAdditives;
    }

    // Ottieni dettagli degli allergeni
    getDetailedAllergens(allergenList) {
        if (!this.allergens) return [];
        
        return allergenList.map(allergen => {
            const allergenData = this.allergens.allergens[allergen];
            return allergenData ? {
                id: allergen,
                ...allergenData
            } : { id: allergen, name_it: allergen };
        });
    }

    // Cerca additivi per codice E o nome
    searchAdditives(query) {
        if (!this.additives) return [];
        
        const searchTerm = query.toLowerCase();
        const results = [];
        
        Object.keys(this.additives.additives).forEach(code => {
            const additive = this.additives.additives[code];
            
            if (code.toLowerCase().includes(searchTerm) ||
                additive.name_it.toLowerCase().includes(searchTerm) ||
                additive.name_en.toLowerCase().includes(searchTerm)) {
                
                results.push({
                    code: code,
                    ...additive
                });
            }
        });
        
        return results;
    }

    // Cerca allergeni
    searchAllergens(query) {
        if (!this.allergens) return [];
        
        const searchTerm = query.toLowerCase();
        const results = [];
        
        Object.keys(this.allergens.allergens).forEach(allergenId => {
            const allergen = this.allergens.allergens[allergenId];
            
            if (allergen.name_it.toLowerCase().includes(searchTerm) ||
                allergen.name_en.toLowerCase().includes(searchTerm) ||
                allergenId.toLowerCase().includes(searchTerm)) {
                
                results.push({
                    id: allergenId,
                    ...allergen
                });
            }
        });
        
        return results;
    }

    // Suggerimenti intelligenti per ricerca
    getSuggestions(query, type = 'all') {
        const suggestions = [];
        const searchTerm = query.toLowerCase();
        
        if (type === 'all' || type === 'dishes') {
            // Suggerimenti piatti
            const dishSuggestions = this.searchItalianDishes(query);
            suggestions.push(...dishSuggestions.slice(0, 5).map(dish => ({
                text: dish.name_it,
                type: 'dish',
                id: dish.id,
                category: dish.category
            })));
        }
        
        if (type === 'all' || type === 'additives') {
            // Suggerimenti additivi
            const additiveSuggestions = this.searchAdditives(query);
            suggestions.push(...additiveSuggestions.slice(0, 3).map(additive => ({
                text: `${additive.code} - ${additive.name_it}`,
                type: 'additive',
                code: additive.code
            })));
        }
        
        if (type === 'all' || type === 'allergens') {
            // Suggerimenti allergeni
            const allergenSuggestions = this.searchAllergens(query);
            suggestions.push(...allergenSuggestions.slice(0, 3).map(allergen => ({
                text: allergen.name_it,
                type: 'allergen',
                id: allergen.id
            })));
        }
        
        return suggestions;
    }

    // Ottieni specialità regionali
    getRegionalSpecialties(region = null) {
        if (!this.italianDishes) return [];
        
        if (region) {
            return this.italianDishes.regional_specialties[region] || [];
        }
        
        return this.italianDishes.regional_specialties;
    }

    // Cerca per regione
    getDishesByRegion(region) {
        if (!this.italianDishes) return [];
        
        const results = [];
        
        Object.keys(this.italianDishes.traditional_dishes).forEach(category => {
            Object.keys(this.italianDishes.traditional_dishes[category]).forEach(dishKey => {
                const dish = this.italianDishes.traditional_dishes[category][dishKey];
                
                if (dish.region && dish.region.toLowerCase().includes(region.toLowerCase())) {
                    results.push({
                        ...dish,
                        id: dishKey,
                        category: category
                    });
                }
            });
        });
        
        return results;
    }

    // Filtra per allergeni
    filterByAllergens(excludeAllergens = []) {
        if (!this.italianDishes) return [];
        
        const results = [];
        
        Object.keys(this.italianDishes.traditional_dishes).forEach(category => {
            Object.keys(this.italianDishes.traditional_dishes[category]).forEach(dishKey => {
                const dish = this.italianDishes.traditional_dishes[category][dishKey];
                
                const hasExcludedAllergens = dish.allergens && 
                    dish.allergens.some(allergen => excludeAllergens.includes(allergen));
                
                if (!hasExcludedAllergens) {
                    results.push({
                        ...dish,
                        id: dishKey,
                        category: category
                    });
                }
            });
        });
        
        return results;
    }

    // Filtra per preferenze dietetiche
    filterByDiet(dietType) {
        if (!this.italianDishes) return [];
        
        const results = [];
        
        Object.keys(this.italianDishes.traditional_dishes).forEach(category => {
            Object.keys(this.italianDishes.traditional_dishes[category]).forEach(dishKey => {
                const dish = this.italianDishes.traditional_dishes[category][dishKey];
                
                let matches = false;
                
                switch (dietType.toLowerCase()) {
                    case 'vegan':
                        matches = dish.vegan === true;
                        break;
                    case 'vegetarian':
                        matches = dish.vegan === true || dish.vegetarian === true || 
                                 (!dish.allergens || !dish.allergens.includes('fish'));
                        break;
                    case 'gluten_free':
                        matches = !dish.allergens || !dish.allergens.includes('gluten');
                        break;
                    case 'dairy_free':
                        matches = !dish.allergens || !dish.allergens.includes('milk');
                        break;
                    default:
                        matches = true;
                }
                
                if (matches) {
                    results.push({
                        ...dish,
                        id: dishKey,
                        category: category
                    });
                }
            });
        });
        
        return results;
    }

    // Ottieni informazioni nutrizionali dettagliate
    getNutritionalInfo(dishId, portion = 100) {
        const dish = this.getDishDetails(dishId);
        if (!dish || !dish.nutrition_per_100g) return null;
        
        const multiplier = portion / 100;
        const nutrition = {};
        
        Object.keys(dish.nutrition_per_100g).forEach(key => {
            nutrition[key] = Math.round(dish.nutrition_per_100g[key] * multiplier * 10) / 10;
        });
        
        return {
            portion_size: portion,
            nutrition: nutrition,
            dish_name: dish.name_it,
            allergens: dish.allergen_details,
            additives: dish.additives_info
        };
    }

    // Statistiche generali
    getStats() {
        if (!this.additives || !this.allergens || !this.italianDishes) {
            return { loaded: false };
        }
        
        const dishCount = Object.keys(this.italianDishes.traditional_dishes)
            .reduce((total, category) => 
                total + Object.keys(this.italianDishes.traditional_dishes[category]).length, 0);
        
        return {
            loaded: true,
            total_dishes: dishCount,
            total_additives: Object.keys(this.additives.additives).length,
            total_allergens: Object.keys(this.allergens.allergens).length,
            categories: Object.keys(this.italianDishes.traditional_dishes),
            regions: Object.keys(this.italianDishes.regional_specialties)
        };
    }
}

module.exports = new ItalianFoodService();
