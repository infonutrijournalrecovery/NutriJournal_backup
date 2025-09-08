import { promises as fs } from 'fs';
import path from 'path';
import { logger } from '../../middleware/logging';
import {
    ItalianDish,
    DishWithDetails,
    AllergenInfo,
    AdditiveInfo,
    AllergensData,
    AdditivesData,
    ItalianDishesData
} from './types';

class ItalianFoodService {
    private additives: AdditivesData | null = null;
    private allergens: AllergensData | null = null;
    private italianDishes: ItalianDishesData | null = null;

    constructor() {
        this.loadData();
    }

    private async loadData(): Promise<void> {
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
            
            logger.info('✅ Dati italiani caricati con successo');
        } catch (error) {
            logger.error('❌ Errore nel caricamento dati italiani:', { error });
        }
    }

    public searchItalianDishes(query: string): DishWithDetails[] {
        if (!this.italianDishes) return [];
        
        const searchTerm = query.toLowerCase();
        const results: DishWithDetails[] = [];
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

    public getDishDetails(dishId: string): DishWithDetails | null {
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

    private analyzeIngredients(ingredients: string[]): AdditiveInfo[] {
        if (!this.additives) return [];
        
        const foundAdditives: AdditiveInfo[] = [];
        
        ingredients.forEach(ingredient => {
            const ingredientLower = ingredient.toLowerCase();
            
            // Cerca codici E
            const eCodeMatch = ingredientLower.match(/e\\d{3,4}/g);
            if (eCodeMatch) {
                eCodeMatch.forEach(code => {
                    const upperCode = code.toUpperCase();
                    if (this.additives?.additives[upperCode]) {
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

    private getDetailedAllergens(allergenCodes: string[]): AllergenInfo[] {
        if (!this.allergens) return [];
        
        return allergenCodes
            .map(code => {
                const allergenInfo = this.allergens?.allergens[code];
                if (allergenInfo) {
                    return {
                        code,
                        ...allergenInfo
                    };
                }
                return null;
            })
            .filter((allergen): allergen is AllergenInfo => allergen !== null);
    }
}

export default ItalianFoodService;
