// Interfacce per i dati del backend NutriJournal

export interface User {
  id: number;
  name?: string; // Per compatibilità
  firstName?: string;
  lastName?: string;
  email: string;
  birth_date?: string;
  birthDate?: string; // Per compatibilità frontend
  dateOfBirth?: Date; // Per compatibilità frontend
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  height?: number;
  weight?: number;
  activity_level?: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
  nutritionGoals?: NutritionGoals;
  avatar?: string | null;
  preferences?: UserPreferences;
  allergies?: UserAllergy[];
  additives_sensitivity?: UserAdditiveSensitivity[];
  totalMeals?: number;
  currentStreak?: number;
  joinDate?: Date;
  age?: number; // Età calcolata dal backend
  dailyCalories?: number; // Kcal giornaliere obiettivo dal backend
  created_at: string;
  updated_at: string;
}

export interface UserPreferences {
  notifications: boolean;
  darkMode: boolean;
  language?: string;
}

export interface UserAllergy {
  id?: number;
  user_id?: number;
  allergen_code: string;
  allergen_name: string;
  severity: 'mild' | 'moderate' | 'severe';
  notes?: string;
  created_at?: string;
}

export interface UserAdditiveSensitivity {
  id?: number;
  user_id?: number;
  additive_code: string;
  additive_name: string;
  sensitivity_level: 'low' | 'medium' | 'high';
  notes?: string;
  created_at?: string;
}

export interface Allergen {
  code: string;
  name: string;
  category: string;
  description?: string;
}

export interface Additive {
  code: string;
  name: string;
  category: string;
  description?: string;
}

export interface Allergen {
  code: string;
  name: string;
  description?: string;
  common_sources?: string[];
  category: string;
}

export interface Additive {
  code: string;
  name: string;
  e_number?: string;
  description?: string;
  purpose?: string;
  safety_level?: 'safe' | 'caution' | 'avoid';
  category: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data?: {
    user: User;
    tokens: {
      accessToken: string;
      refreshToken: string;
    };
  };
  errors?: any[];
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  birth_date: string;
  gender: 'male' | 'female' | 'other';
  height: number;
  weight: number;
  activity_level?: string;
}

export interface Product {
  id?: number;
  barcode?: string;
  name: string;
  brand?: string;
  category?: string;
  image_url?: string;
  calories_per_100g: number;
  proteins_per_100g: number;
  carbs_per_100g: number;
  fats_per_100g: number;
  fiber_per_100g?: number;
  sugars_per_100g?: number;
  sodium_per_100g?: number;
  allergens?: string[];
  additives?: string[];
  nutriscore?: string;
  ecoscore?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Meal {
  id?: number;
  user_id?: number;
  name: string;
  type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  consumed_at: string;
  total_calories: number;
  total_proteins: number;
  total_carbs: number;
  total_fats: number;
  notes?: string;
  items?: MealItem[];
  created_at?: string;
  updated_at?: string;
}

export interface MealItem {
  id?: number;
  meal_id?: number;
  product_id: number;
  product?: Product;
  quantity: number;
  unit: 'g' | 'ml' | 'pieces';
  calories: number;
  proteins: number;
  carbs: number;
  fats: number;
}

export interface Activity {
  id?: number;
  user_id?: number;
  name: string;
  type: 'cardio' | 'strength' | 'flexibility' | 'sports' | 'other';
  duration_minutes: number;
  calories_burned: number;
  intensity: 'low' | 'moderate' | 'high';
  notes?: string;
  date: string;
  performed_at: string;
  created_at?: string;
  updated_at?: string;
}

export interface NutritionGoals {
  id?: number;
  user_id?: number;
  daily_calories: number;
  dailyCalories?: number; // Per compatibilità frontend
  calories_target?: number; // Per compatibilità backend/template
  daily_proteins: number;
  daily_carbs: number;
  daily_fats: number;
  daily_fiber?: number;
  daily_water?: number;
  weight_goal?: number;
  goal_type: 'maintain' | 'lose' | 'gain';
  goal?: 'maintain' | 'lose' | 'gain'; // Per compatibilità frontend
  activityLevel?: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
  created_at?: string;
  updated_at?: string;
}

export interface Analytics {
  period: 'week' | 'month' | 'year';
  calories: {
    consumed: number;
    burned: number;
    goal: number;
    trend: number[];
  };
  macros: {
    proteins: { consumed: number; goal: number };
    carbs: { consumed: number; goal: number };
    fats: { consumed: number; goal: number };
  };
  weight: {
    current: number;
    goal: number;
    trend: number[];
  };
  activities: {
    total_duration: number;
    total_calories_burned: number;
    most_frequent: string;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  errors?: any[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface PantryItem {
  id?: number;
  user_id?: number;
  product_id: number;
  product?: Product;
  quantity: number;
  unit: string;
  purchase_date?: string;
  expiry_date?: string;
  location?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ItalianDish {
  id: number;
  name: string;
  description: string;
  region: string;
  category: string;
  ingredients: string[];
  calories_per_100g: number;
  proteins_per_100g: number;
  carbs_per_100g: number;
  fats_per_100g: number;
  preparation_time?: number;
  difficulty?: 'easy' | 'medium' | 'hard';
  image_url?: string;
}

// Interfaccia per i dati nutrizionali giornalieri
export interface DailyNutrition {
  date: string;
  totalCalories: number;
  totalProteins: number;
  totalCarbohydrates: number;
  totalFats: number;
  totalFiber?: number;
  mealCount: number;
  waterIntake?: number;
}

// Estensione dell'interfaccia User con gli obiettivi nutrizionali
export interface UserWithGoals extends User {
  nutritionGoals?: NutritionGoals;
}

// Interfaccia per le analisi
export interface DailyAnalytics {
  date: string;
  calories_consumed: number;
  calories_burned: number;
  net_calories: number;
  meals_count: number;
  activities_count: number;
  weight?: number;
  steps?: number;
  water_intake?: number;
}
