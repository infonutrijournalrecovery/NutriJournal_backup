const axios = require('axios');

class TranslationService {
  constructor() {
    // Dizionario per traduzioni comuni dei nomi dei prodotti
    this.productTranslations = {
      // Categorie principali
      'beverages': 'bevande',
      'dairy': 'latticini',
      'meat': 'carne',
      'fish': 'pesce',
      'vegetables': 'verdure',
      'fruits': 'frutta',
      'cereals': 'cereali',
      'snacks': 'snack',
      'desserts': 'dolci',
      'bread': 'pane',
      'pasta': 'pasta',
      'rice': 'riso',
      
      // Termini comuni
      'organic': 'biologico',
      'natural': 'naturale',
      'whole': 'integrale',
      'fresh': 'fresco',
      'frozen': 'surgelato',
      'dried': 'secco',
      'low fat': 'magro',
      'fat free': 'senza grassi',
      'sugar free': 'senza zucchero',
      'gluten free': 'senza glutine',
      'lactose free': 'senza lattosio',
      'vegetarian': 'vegetariano',
      'vegan': 'vegano',
    };

    // Dizionario per ingredienti comuni
    this.ingredientTranslations = {
      'water': 'acqua',
      'sugar': 'zucchero',
      'salt': 'sale',
      'flour': 'farina',
      'oil': 'olio',
      'butter': 'burro',
      'milk': 'latte',
      'eggs': 'uova',
      'cheese': 'formaggio',
      'tomato': 'pomodoro',
      'onion': 'cipolla',
      'garlic': 'aglio',
      'pepper': 'pepe',
      'herbs': 'erbe',
      'spices': 'spezie',
      'vinegar': 'aceto',
      'lemon': 'limone',
      'vanilla': 'vaniglia',
      'chocolate': 'cioccolato',
      'cocoa': 'cacao',
    };

    // Dizionario per categorie
    this.categoryTranslations = {
      'en:beverages': 'Bevande',
      'en:alcoholic-beverages': 'Bevande alcoliche',
      'en:non-alcoholic-beverages': 'Bevande analcoliche',
      'en:waters': 'Acque',
      'en:fruit-juices': 'Succhi di frutta',
      'en:sodas': 'Bibite gassate',
      'en:teas': 'Tè',
      'en:coffees': 'Caffè',
      
      'en:dairies': 'Latticini',
      'en:milks': 'Latte',
      'en:yogurts': 'Yogurt',
      'en:cheeses': 'Formaggi',
      'en:creams': 'Panna',
      'en:butters': 'Burro',
      
      'en:meats': 'Carni',
      'en:fresh-meats': 'Carni fresche',
      'en:processed-meats': 'Carni lavorate',
      'en:poultry': 'Pollame',
      'en:beef': 'Manzo',
      'en:pork': 'Maiale',
      'en:lamb': 'Agnello',
      
      'en:seafood': 'Prodotti ittici',
      'en:fishes': 'Pesci',
      'en:shellfishes': 'Molluschi',
      'en:crustaceans': 'Crostacei',
      
      'en:plant-based-foods': 'Alimenti vegetali',
      'en:fruits': 'Frutta',
      'en:vegetables': 'Verdure',
      'en:legumes': 'Legumi',
      'en:nuts': 'Frutta secca',
      'en:seeds': 'Semi',
      
      'en:cereals-and-potatoes': 'Cereali e patate',
      'en:breads': 'Pane',
      'en:breakfast-cereals': 'Cereali da colazione',
      'en:pasta': 'Pasta',
      'en:rice': 'Riso',
      'en:potatoes': 'Patate',
      
      'en:snacks': 'Snack',
      'en:sweet-snacks': 'Snack dolci',
      'en:salty-snacks': 'Snack salati',
      'en:cookies': 'Biscotti',
      'en:chocolates': 'Cioccolato',
      'en:candies': 'Caramelle',
      
      'en:frozen-foods': 'Surgelati',
      'en:ice-creams': 'Gelati',
      'en:frozen-meals': 'Pasti surgelati',
      
      'en:condiments': 'Condimenti',
      'en:sauces': 'Salse',
      'en:dressings': 'Condimenti per insalata',
      'en:oils': 'Oli',
      'en:vinegars': 'Aceti',
      'en:spices': 'Spezie',
      'en:herbs': 'Erbe aromatiche',
    };

    // Dizionario per allergens
    this.allergenTranslations = {
      'en:gluten': 'glutine',
      'en:milk': 'latte',
      'en:eggs': 'uova',
      'en:nuts': 'frutta a guscio',
      'en:peanuts': 'arachidi',
      'en:soybeans': 'soia',
      'en:sesame-seeds': 'sesamo',
      'en:fish': 'pesce',
      'en:crustaceans': 'crostacei',
      'en:molluscs': 'molluschi',
      'en:celery': 'sedano',
      'en:mustard': 'senape',
      'en:sulphur-dioxide-and-sulphites': 'anidride solforosa e solfiti',
      'en:lupin': 'lupini',
    };
  }

  // Traduce un prodotto OpenFoodFacts in italiano
  async translateProduct(product) {
    const translated = { ...product };

    // Traduce nome prodotto
    if (product.name && !product.name_it) {
      translated.name_it = await this.translateProductName(product.name);
    }

    // Traduce categorie
    if (product.categories) {
      translated.categories_it = this.translateCategories(product.categories);
    }

    // Traduce ingredienti
    if (product.ingredients && !product.ingredients_it) {
      translated.ingredients_it = await this.translateIngredients(product.ingredients);
    }

    // Traduce allergens
    if (product.allergens) {
      translated.allergens_it = this.translateAllergens(product.allergens);
    }

    // Traduce etichette/labels
    if (product.labels) {
      translated.labels_it = this.translateLabels(product.labels);
    }

    return translated;
  }

  // Traduce il nome di un prodotto
  async translateProductName(name) {
    if (!name) return null;

    const lowerName = name.toLowerCase();

    // Cerca traduzioni dirette nel dizionario
    for (const [english, italian] of Object.entries(this.productTranslations)) {
      if (lowerName.includes(english.toLowerCase())) {
        return name.replace(new RegExp(english, 'gi'), italian);
      }
    }

    // Se non trovata traduzione diretta, mantieni il nome originale
    // In una implementazione futura, si potrebbe integrare un servizio di traduzione automatica
    return name;
  }

  // Traduce lista di categorie
  translateCategories(categories) {
    if (!categories) return null;

    const categoryList = categories.split(',').map(cat => cat.trim());
    const translatedCategories = categoryList.map(category => {
      const normalizedCat = category.toLowerCase().replace(/^en:/, 'en:');
      return this.categoryTranslations[normalizedCat] || category;
    });

    return translatedCategories.join(', ');
  }

  // Traduce lista di ingredienti
  async translateIngredients(ingredients) {
    if (!ingredients) return null;

    let translated = ingredients;

    // Applica traduzioni dal dizionario
    for (const [english, italian] of Object.entries(this.ingredientTranslations)) {
      const regex = new RegExp(`\\b${english}\\b`, 'gi');
      translated = translated.replace(regex, italian);
    }

    return translated;
  }

  // Traduce allergeni
  translateAllergens(allergens) {
    if (!allergens) return null;

    const allergenList = allergens.split(',').map(all => all.trim());
    const translatedAllergens = allergenList.map(allergen => {
      const normalizedAllergen = allergen.toLowerCase().replace(/^en:/, 'en:');
      return this.allergenTranslations[normalizedAllergen] || allergen;
    });

    return translatedAllergens.join(', ');
  }

  // Traduce etichette
  translateLabels(labels) {
    if (!labels) return null;

    const labelTranslations = {
      'en:organic': 'biologico',
      'en:fair-trade': 'commercio equo',
      'en:gluten-free': 'senza glutine',
      'en:lactose-free': 'senza lattosio',
      'en:vegan': 'vegano',
      'en:vegetarian': 'vegetariano',
      'en:kosher': 'kosher',
      'en:halal': 'halal',
      'en:no-preservatives': 'senza conservanti',
      'en:no-artificial-flavors': 'senza aromi artificiali',
      'en:no-artificial-colors': 'senza coloranti artificiali',
      'en:natural': 'naturale',
      'en:recyclable-packaging': 'imballaggio riciclabile',
    };

    const labelList = labels.split(',').map(label => label.trim());
    const translatedLabels = labelList.map(label => {
      const normalizedLabel = label.toLowerCase().replace(/^en:/, 'en:');
      return labelTranslations[normalizedLabel] || label;
    });

    return translatedLabels.join(', ');
  }

  // Traduce unità di misura
  translateUnit(unit) {
    const unitTranslations = {
      'g': 'g',
      'kg': 'kg',
      'mg': 'mg',
      'μg': 'μg',
      'ml': 'ml',
      'l': 'l',
      'cl': 'cl',
      'dl': 'dl',
      'oz': 'oz',
      'lb': 'lb',
      'cup': 'tazza',
      'tablespoon': 'cucchiaio',
      'teaspoon': 'cucchiaino',
      'piece': 'pezzo',
      'slice': 'fetta',
      'serving': 'porzione',
    };

    return unitTranslations[unit?.toLowerCase()] || unit;
  }

  // Traduce valori nutrizionali
  translateNutritionLabel(nutrient) {
    const nutritionTranslations = {
      // Macronutrienti
      'calories': 'calorie',
      'energy': 'energia',
      'protein': 'proteine',
      'proteins': 'proteine',
      'carbohydrates': 'carboidrati',
      'carbs': 'carboidrati',
      'sugars': 'zuccheri',
      'fat': 'grassi',
      'saturated-fat': 'grassi saturi',
      'trans-fat': 'grassi trans',
      'fiber': 'fibre',
      'salt': 'sale',
      'sodium': 'sodio',

      // Vitamine
      'vitamin-a': 'vitamina A',
      'vitamin-c': 'vitamina C',
      'vitamin-d': 'vitamina D',
      'vitamin-e': 'vitamina E',
      'vitamin-k': 'vitamina K',
      'vitamin-b1': 'vitamina B1 (tiamina)',
      'vitamin-b2': 'vitamina B2 (riboflavina)',
      'vitamin-b3': 'vitamina B3 (niacina)',
      'vitamin-b6': 'vitamina B6',
      'vitamin-b9': 'vitamina B9 (acido folico)',
      'vitamin-b12': 'vitamina B12',

      // Minerali
      'calcium': 'calcio',
      'iron': 'ferro',
      'magnesium': 'magnesio',
      'phosphorus': 'fosforo',
      'potassium': 'potassio',
      'zinc': 'zinco',
      'selenium': 'selenio',
      'iodine': 'iodio',
      'manganese': 'manganese',
      'copper': 'rame',
      'chromium': 'cromo',
    };

    return nutritionTranslations[nutrient?.toLowerCase()] || nutrient;
  }

  // Traduce messaggi di errore comuni
  translateError(errorKey) {
    const errorTranslations = {
      'product_not_found': 'Prodotto non trovato',
      'barcode_invalid': 'Codice a barre non valido',
      'api_error': 'Errore del servizio',
      'network_error': 'Errore di connessione',
      'timeout_error': 'Timeout della richiesta',
      'rate_limit_exceeded': 'Limite di richieste superato',
      'server_error': 'Errore del server',
    };

    return errorTranslations[errorKey] || 'Errore sconosciuto';
  }

  // Aggiunge nuove traduzioni al dizionario
  addTranslation(category, english, italian) {
    switch (category) {
      case 'product':
        this.productTranslations[english.toLowerCase()] = italian;
        break;
      case 'ingredient':
        this.ingredientTranslations[english.toLowerCase()] = italian;
        break;
      case 'category':
        this.categoryTranslations[`en:${english.toLowerCase()}`] = italian;
        break;
      case 'allergen':
        this.allergenTranslations[`en:${english.toLowerCase()}`] = italian;
        break;
    }
  }

  // Ottieni tutte le traduzioni disponibili
  getAllTranslations() {
    return {
      products: this.productTranslations,
      ingredients: this.ingredientTranslations,
      categories: this.categoryTranslations,
      allergens: this.allergenTranslations,
    };
  }

  // Verifica se una traduzione esiste
  hasTranslation(category, term) {
    switch (category) {
      case 'product':
        return this.productTranslations.hasOwnProperty(term.toLowerCase());
      case 'ingredient':
        return this.ingredientTranslations.hasOwnProperty(term.toLowerCase());
      case 'category':
        return this.categoryTranslations.hasOwnProperty(`en:${term.toLowerCase()}`);
      case 'allergen':
        return this.allergenTranslations.hasOwnProperty(`en:${term.toLowerCase()}`);
      default:
        return false;
    }
  }

  // Ottieni statistiche sulle traduzioni
  getTranslationStats() {
    return {
      product_translations: Object.keys(this.productTranslations).length,
      ingredient_translations: Object.keys(this.ingredientTranslations).length,
      category_translations: Object.keys(this.categoryTranslations).length,
      allergen_translations: Object.keys(this.allergenTranslations).length,
      total_translations: 
        Object.keys(this.productTranslations).length +
        Object.keys(this.ingredientTranslations).length +
        Object.keys(this.categoryTranslations).length +
        Object.keys(this.allergenTranslations).length,
    };
  }
}

module.exports = new TranslationService();
