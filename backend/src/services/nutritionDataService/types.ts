export interface NutritionSearchResult {
    id: string;
    name: string;
    description?: string;
    category?: string;
    portion_size: {
        amount: number;
        unit: string;
    };
    nutrition: {
        calories: number;
        proteins: number;
        carbohydrates: number;
        fats: number;
        fiber?: number;
        sodium?: number;
    };
    image_url?: string;
    source: string;
}

export interface SearchOptions {
    language?: string;
    limit?: number;
    category?: string;
}

export interface EdamamResponse {
    text: string;
    parsed: any[];
    hints: Array<{
        food: {
            foodId: string;
            label: string;
            category: string;
            nutrients: {
                ENERC_KCAL: number;  // calories
                PROCNT: number;      // proteins
                CHOCDF: number;      // carbs
                FAT: number;         // fats
                FIBTG?: number;      // fiber
                NA?: number;         // sodium
            };
            image?: string;
        };
    }>;
}
