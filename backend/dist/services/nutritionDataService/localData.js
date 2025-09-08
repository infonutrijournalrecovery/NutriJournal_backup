"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.localMealsDatabase = void 0;
/**
 * Database locale di pasti comuni italiani per fallback
 * quando l'API esterna non è disponibile
 */
exports.localMealsDatabase = [
    {
        id: 'local_001',
        name: 'Panino con Prosciutto Cotto',
        description: 'Panino classico con prosciutto cotto',
        category: 'Panini',
        portion_size: {
            amount: 100,
            unit: 'g'
        },
        nutrition: {
            calories: 270,
            proteins: 12.5,
            carbohydrates: 29.8,
            fats: 11.2,
            fiber: 1.8,
            sodium: 680
        },
        source: 'local'
    },
    {
        id: 'local_002',
        name: 'Pasta al Pomodoro',
        description: 'Pasta con salsa al pomodoro',
        category: 'Primi Piatti',
        portion_size: {
            amount: 100,
            unit: 'g'
        },
        nutrition: {
            calories: 158,
            proteins: 5.9,
            carbohydrates: 31.2,
            fats: 1.3,
            fiber: 2.5,
            sodium: 290
        },
        source: 'local'
    },
    {
        id: 'local_003',
        name: 'Pizza Margherita',
        description: 'Pizza classica con pomodoro e mozzarella',
        category: 'Pizza',
        portion_size: {
            amount: 100,
            unit: 'g'
        },
        nutrition: {
            calories: 266,
            proteins: 8.8,
            carbohydrates: 33.0,
            fats: 10.5,
            fiber: 2.0,
            sodium: 520
        },
        source: 'local'
    }
];
