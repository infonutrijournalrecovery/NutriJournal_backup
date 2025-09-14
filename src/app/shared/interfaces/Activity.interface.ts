export interface NutritionInfo {
  calories?: number;
  proteins?: number;
  carbohydrates?: number;
  fats?: number;
  fiber?: number;
  sugar?: number;
  sodium?: number;
  saturatedFats?: number;
  vitaminC?: number;
  calcium?: number;
  iron?: number;
}
export interface Activity {
  id?: string | number;
  userId?: string | number;
  date?: string;
  type?: ActivityType | string;
  items?: ActivityItem[];
  totalNutrition?: NutritionInfo;
  createdAt?: string;
  updatedAt?: string;
  name?: string;
  duration_minutes?: number;
  calories_burned?: number;
  duration?: number;
  calories?: number;
}

export interface ActivityItem {
  id?: string | number;
  productId?: string | number;
  name?: string;
  productBrand?: string;
  quantity?: number;
  unit?: QuantityUnit;
  nutritionPer100g?: NutritionInfo;
  totalNutrition?: NutritionInfo;
  category?: ProductCategory;
  ean?: string;
  imageUrl?: string;
}

export interface PantryItem {
  id?: string;
  userId: string;
  productId: string;
  name: string;
  productBrand?: string;
  category: ProductCategory;
  nutritionPer100g: NutritionInfo;
  ean?: string;
  imageUrl?: string;
  expirationDate?: string;
  addedAt: string;
}

export interface RecentProduct {
  productId: string;
  name: string;
  productBrand?: string;
  lastUsed: string;
  timesUsed: number;
  averageQuantity: number;
  averageUnit: QuantityUnit;
  nutritionPer100g: NutritionInfo;
  category?: ProductCategory;
}

export type ActivityType =
  | 'Camminata'
  | 'Corsa'
  | 'Ciclismo'
  | 'Nuoto'
  | 'Palestra'
  | 'Corpo libero'
  | 'Sollevamento pesi'
  | 'Yoga'
  | 'Stretching'
  | 'Pilates'
  | 'Calcio'
  | 'Basket'
  | 'Tennis'
  | 'Pallavolo';

export type QuantityUnit = 'g' | 'ml' | 'porzione' | 'pezzo' | 'tazza' | 'cucchiaio';

export type ProductCategory = 
  | 'Verdura'
  | 'Frutta' 
  | 'Dolci'
  | 'Bibite'
  | 'Carne'
  | 'Pesce'
  | 'Latticini'
  | 'Cereali'
  | 'Legumi'
  | 'Snack'
  | 'Condimenti'
  | 'Bevande Alcoliche'
  | 'Surgelati'
  | 'Conserve'
  | 'Spezie'
  | 'Altro';

export interface ActivitySearchResult {
  id: string;
  name: string;
  brand?: string;
  category?: ProductCategory;
  nutritionPer100g: NutritionInfo;
  averageServing?: number; // Average serving size in grams/ml
  servingUnit?: QuantityUnit;
  imageUrl?: string;
  ean?: string;
  source: 'openfoodfacts' | 'custom' | 'pantry' | 'recent';
}

export interface AddActivityRequest {
  date: string;
  type: ActivityType;
  items: Omit<ActivityItem, 'id' | 'totalNutrition'>[];
}

export interface UpdateActivityRequest {
  id: string;
  items: Omit<ActivityItem, 'id' | 'totalNutrition'>[];
}

export interface DailyNutritionSummary {
  date: string;
  totalCalories: number;
  totalProteins: number;
  totalCarbohydrates: number;
  totalFats: number;
  ActivityBreakdown: {
    [K in ActivityType]?: {
      calories: number;
      proteins: number;
      carbohydrates: number;
      fats: number;
      itemCount: number;
    }
  };
  goalProgress: {
    caloriesPercent: number;
    proteinsPercent: number;
    carbohydratesPercent: number;
    fatsPercent: number;
  };
}
