// Questo file può essere espanso in futuro per includere modelli più complessi.

// Tipi di attività dal backend
export type ActivityCategory = 'CARDIO' | 'STRENGTH' | 'FLEXIBILITY' | 'SPORTS';

export interface ActivityItem {
    id: string;
    name: string;
    met: number;
}

// Modello per un'attività registrata (corrisponde a ciò che viene salvato)
export interface Activity {
    id: number;
    user_id: number;
    type: ActivityCategory;
    name: string;
    duration_minutes: number;
    calories_burned: number;
    date: string;
    distance_km?: number;
}

// Tipi legacy per la pagina (da rimuovere/adattare)
export type ActivityType = 'Colazione' | 'Pranzo' | 'Spuntini' | 'Cena';
export type ProductCategory = 'Frutta' | 'Verdura' | 'Carne' | 'Pesce' | 'Latticini' | 'Cereali' | 'Bevande' | 'Dolci' | 'Condimenti';
export type QuantityUnit = 'g' | 'ml' | 'porzione' | 'pezzo' | 'tazza' | 'cucchiaio';

export interface NutritionInfo {
    calories: number;
    proteins: number;
    carbohydrates: number;
    fats: number;
    fiber?: number;
    sugar?: number;
    sodium?: number;
    saturatedFats?: number;
}
