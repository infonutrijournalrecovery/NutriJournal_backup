"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
const path_1 = __importDefault(require("path"));
const logging_1 = require("../../middleware/logging");
class ItalianFoodService {
    constructor() {
        this.additives = null;
        this.allergens = null;
        this.italianDishes = null;
        this.loadData();
    }
    async loadData() {
        try {
            const dataPath = path_1.default.join(__dirname, '../data');
            // Carica dati additivi
            const additivesData = await fs_1.promises.readFile(path_1.default.join(dataPath, 'additives.json'), 'utf8');
            this.additives = JSON.parse(additivesData);
            // Carica dati allergeni
            const allergensData = await fs_1.promises.readFile(path_1.default.join(dataPath, 'allergens.json'), 'utf8');
            this.allergens = JSON.parse(allergensData);
            // Carica piatti italiani
            const dishesData = await fs_1.promises.readFile(path_1.default.join(dataPath, 'italian_dishes.json'), 'utf8');
            this.italianDishes = JSON.parse(dishesData);
            logging_1.logger.info('✅ Dati italiani caricati con successo');
        }
        catch (error) {
            logging_1.logger.error('❌ Errore nel caricamento dati italiani:', { error });
        }
    }
    searchItalianDishes(query) {
        if (!this.italianDishes)
            return [];
        const searchTerm = query.toLowerCase();
        const results = [];
        const dishes = this.italianDishes.traditional_dishes;
        // Cerca in tutte le categorie
        Object.keys(dishes).forEach(category => {
            const categoryDishes = dishes[category];
            Object.keys(categoryDishes).forEach(dishKey => {
                const dish = categoryDishes[dishKey];
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
    getDishDetails(dishId) {
        if (!this.italianDishes)
            return null;
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
    analyzeIngredients(ingredients) {
        if (!this.additives)
            return [];
        const foundAdditives = [];
        ingredients.forEach(ingredient => {
            const ingredientLower = ingredient.toLowerCase();
            // Cerca codici E
            const eCodeMatch = ingredientLower.match(/e\\d{3,4}/g);
            if (eCodeMatch) {
                eCodeMatch.forEach(code => {
                    var _a;
                    const upperCode = code.toUpperCase();
                    if ((_a = this.additives) === null || _a === void 0 ? void 0 : _a.additives[upperCode]) {
                        foundAdditives.push({
                            code: upperCode,
                            ...this.additives.additives[upperCode]
                        });
                    }
                });
            }
        });
        return foundAdditives;
    }
    getDetailedAllergens(allergenCodes) {
        if (!this.allergens)
            return [];
        return allergenCodes
            .map(code => {
            var _a;
            const allergenInfo = (_a = this.allergens) === null || _a === void 0 ? void 0 : _a.allergens[code];
            if (allergenInfo) {
                return {
                    code,
                    ...allergenInfo
                };
            }
            return null;
        })
            .filter((allergen) => allergen !== null);
    }
}
exports.default = ItalianFoodService;
