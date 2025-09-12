// Converted from TypeScript to JavaScript for direct Node.js usage
const localMealsDatabase = [
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
            fiber: 2.2,
            sodium: 5
        },
        source: 'local'
    }
    // ...altri pasti locali...
];

module.exports = { localMealsDatabase };
