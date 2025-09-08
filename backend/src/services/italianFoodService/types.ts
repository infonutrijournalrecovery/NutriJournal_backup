interface ItalianDish {
    name_it: string;
    description?: string;
    ingredients?: string[];
    allergens?: string[];
    nutrition?: {
        calories?: number;
        proteins?: number;
        carbohydrates?: number;
        fats?: number;
        fiber?: number;
        sodium?: number;
    };
}

interface DishWithDetails extends ItalianDish {
    id: string;
    category: string;
    allergen_details?: AllergenInfo[];
    additives_info?: AdditiveInfo[];
    source: 'traditional_italian';
}

interface AllergenInfo {
    code: string;
    name: string;
    description: string;
}

interface AdditiveInfo {
    code: string;
    name: string;
    category: string;
    effects?: string[];
}

interface AllergensData {
    allergens: {
        [code: string]: {
            name: string;
            description: string;
        };
    };
}

interface AdditivesData {
    additives: {
        [code: string]: {
            name: string;
            category: string;
            effects?: string[];
        };
    };
}

interface ItalianDishesData {
    traditional_dishes: {
        [category: string]: {
            [id: string]: ItalianDish;
        };
    };
}

export type {
    ItalianDish,
    DishWithDetails,
    AllergenInfo,
    AdditiveInfo,
    AllergensData,
    AdditivesData,
    ItalianDishesData
};
