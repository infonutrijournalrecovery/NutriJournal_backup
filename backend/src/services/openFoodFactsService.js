const axios = require('axios');
const envConfig = require('../config/environment');

class OpenFoodFactsService {
  constructor() {
    this.baseURL = envConfig.externalApis.openFoodFacts.baseUrl;
    this.userAgent = envConfig.externalApis.openFoodFacts.userAgent;
    this.timeout = envConfig.externalApis.openFoodFacts.timeout || 10000;
  }

  // Cerca prodotti per query di testo
  async searchProducts(query, options = {}) {
    try {
      const { page = 1, limit = 20, country, language } = options;
      
      const params = {
        search_terms: query,
        page,
        page_size: Math.min(limit, 100), // Massimo 100 per richiesta
        json: 1,
        fields: this.getRequiredFields(),
      };

      // Aggiungi filtri opzionali
      if (country) {
        params.countries = country;
      }
      if (language) {
        params.lc = language;
      }

      const response = await axios.get(`${this.baseURL}/cgi/search.pl`, {
        params,
        headers: {
          'User-Agent': this.userAgent,
        },
        timeout: this.timeout,
      });

      const products = response.data.products || [];
      
      // Formatta i prodotti per compatibilità
      return products.map(product => this.formatProduct(product));
      
    } catch (error) {
      console.error('Errore nella ricerca OpenFoodFacts:', error.message);
      // Ritorna array vuoto invece di lanciare errore
      return [];
    }
  }

  // Ottieni prodotto specifico per barcode
  async getProductByBarcode(barcode) {
    try {
      const response = await axios.get(`${this.baseURL}/api/v0/product/${barcode}.json`, {
        headers: {
          'User-Agent': this.userAgent,
        },
        timeout: this.timeout,
      });

      if (response.data.status === 1 && response.data.product) {
        return this.formatProduct(response.data.product);
      }

      return null;
    } catch (error) {
      console.error(`Errore nel recupero prodotto ${barcode}:`, error.message);
      return null;
    }
  }

  // Cerca prodotti per categoria
  async searchByCategory(category, page = 1, limit = 20) {
    try {
      const response = await axios.get(`${this.baseURL}/cgi/search.pl`, {
        params: {
          tagtype_0: 'categories',
          tag_contains_0: 'contains',
          tag_0: category,
          page,
          page_size: Math.min(limit, 100),
          json: 1,
          fields: this.getRequiredFields(),
        },
        headers: {
          'User-Agent': this.userAgent,
        },
        timeout: this.timeout,
      });

      return {
        products: response.data.products || [],
        count: response.data.count || 0,
        page,
        page_size: response.data.page_size || limit,
      };
    } catch (error) {
      console.error('Errore nella ricerca per categoria:', error.message);
      throw new Error('Errore durante la ricerca per categoria');
    }
  }

  // Cerca prodotti per brand
  async searchByBrand(brand, page = 1, limit = 20) {
    try {
      const response = await axios.get(`${this.baseURL}/cgi/search.pl`, {
        params: {
          tagtype_0: 'brands',
          tag_contains_0: 'contains',
          tag_0: brand,
          page,
          page_size: Math.min(limit, 100),
          json: 1,
          fields: this.getRequiredFields(),
        },
        headers: {
          'User-Agent': this.userAgent,
        },
        timeout: this.timeout,
      });

      return {
        products: response.data.products || [],
        count: response.data.count || 0,
        page,
        page_size: response.data.page_size || limit,
      };
    } catch (error) {
      console.error('Errore nella ricerca per brand:', error.message);
      throw new Error('Errore durante la ricerca per brand');
    }
  }

  // Ottieni categorie popolari
  async getPopularCategories() {
    try {
      const response = await axios.get(`${this.baseURL}/categories.json`, {
        headers: {
          'User-Agent': this.userAgent,
        },
        timeout: this.timeout,
      });

      const categories = response.data.tags || [];
      
      // Filtra e ordina le categorie più popolari
      return categories
        .filter(cat => cat.products >= 100) // Solo categorie con almeno 100 prodotti
        .sort((a, b) => b.products - a.products)
        .slice(0, 50)
        .map(cat => ({
          name: cat.name,
          id: cat.id,
          products_count: cat.products,
        }));
    } catch (error) {
      console.error('Errore nel recupero categorie:', error.message);
      return [];
    }
  }

  // Formatta prodotto OpenFoodFacts nel formato del nostro database
  formatProduct(offProduct) {
    const nutrition = offProduct.nutriments || {};
    
    return {
      barcode: offProduct.code,
      name: offProduct.product_name || offProduct.generic_name || 'Prodotto senza nome',
      name_it: offProduct.product_name_it || null,
      brand: offProduct.brands || null,
      categories: offProduct.categories || null,
      categories_it: offProduct.categories_hierarchy || null,
      image_url: offProduct.image_url || null,
      image_nutrition_url: offProduct.image_nutrition_url || null,
      
      // Informazioni nutrizionali per 100g
      nutrition_per_100g: {
        // Macronutrienti
        calories: this.getNutrientValue(nutrition, 'energy-kcal'),
        protein: this.getNutrientValue(nutrition, 'proteins'),
        carbs: this.getNutrientValue(nutrition, 'carbohydrates'),
        sugars: this.getNutrientValue(nutrition, 'sugars'),
        fat: this.getNutrientValue(nutrition, 'fat'),
        saturated_fat: this.getNutrientValue(nutrition, 'saturated-fat'),
        fiber: this.getNutrientValue(nutrition, 'fiber'),
        salt: this.getNutrientValue(nutrition, 'salt'),
        sodium: this.getNutrientValue(nutrition, 'sodium'),

        // Vitamine
        vitamin_a: this.getNutrientValue(nutrition, 'vitamin-a'),
        vitamin_c: this.getNutrientValue(nutrition, 'vitamin-c'),
        vitamin_d: this.getNutrientValue(nutrition, 'vitamin-d'),
        vitamin_e: this.getNutrientValue(nutrition, 'vitamin-e'),
        vitamin_k: this.getNutrientValue(nutrition, 'vitamin-k'),
        vitamin_b1: this.getNutrientValue(nutrition, 'vitamin-b1'),
        vitamin_b2: this.getNutrientValue(nutrition, 'vitamin-b2'),
        vitamin_b3: this.getNutrientValue(nutrition, 'vitamin-b3'),
        vitamin_b6: this.getNutrientValue(nutrition, 'vitamin-b6'),
        vitamin_b9: this.getNutrientValue(nutrition, 'vitamin-b9'),
        vitamin_b12: this.getNutrientValue(nutrition, 'vitamin-b12'),

        // Minerali
        calcium: this.getNutrientValue(nutrition, 'calcium'),
        iron: this.getNutrientValue(nutrition, 'iron'),
        magnesium: this.getNutrientValue(nutrition, 'magnesium'),
        phosphorus: this.getNutrientValue(nutrition, 'phosphorus'),
        potassium: this.getNutrientValue(nutrition, 'potassium'),
        zinc: this.getNutrientValue(nutrition, 'zinc'),
        selenium: this.getNutrientValue(nutrition, 'selenium'),
      },

      // Informazioni aggiuntive
      ingredients: offProduct.ingredients_text || null,
      ingredients_it: offProduct.ingredients_text_it || null,
      allergens: offProduct.allergens || null,
      traces: offProduct.traces || null,
      
      // Score e valutazioni
      nutriscore_grade: offProduct.nutriscore_grade || null,
      nova_group: offProduct.nova_group || null,
      ecoscore_grade: offProduct.ecoscore_grade || null,
      
      // Metadati
      source: 'openfoodfacts',
      source_id: offProduct._id || offProduct.code,
      last_modified: offProduct.last_modified_t ? new Date(offProduct.last_modified_t * 1000).toISOString() : null,
      data_quality: this.calculateDataQuality(offProduct),
      
      // Informazioni produttore
      countries: offProduct.countries || null,
      packaging: offProduct.packaging || null,
      labels: offProduct.labels || null,
      
      is_custom: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }

  // Estrae valore nutrizionale con gestione unità
  getNutrientValue(nutrition, key) {
    const value = nutrition[`${key}_100g`] || nutrition[key];
    
    if (value === undefined || value === null || value === '') {
      return null;
    }

    const numValue = parseFloat(value);
    return isNaN(numValue) ? null : numValue;
  }

  // Calcola qualità dei dati del prodotto
  calculateDataQuality(product) {
    let score = 0;
    let maxScore = 0;

    // Nome prodotto
    maxScore += 10;
    if (product.product_name) score += 10;

    // Ingredienti
    maxScore += 15;
    if (product.ingredients_text) score += 15;

    // Valori nutrizionali
    maxScore += 25;
    const nutrition = product.nutriments || {};
    const essentialNutrients = ['energy-kcal', 'proteins', 'carbohydrates', 'fat'];
    const availableNutrients = essentialNutrients.filter(n => 
      nutrition[`${n}_100g`] !== undefined || nutrition[n] !== undefined
    );
    score += (availableNutrients.length / essentialNutrients.length) * 25;

    // Immagini
    maxScore += 20;
    if (product.image_url) score += 10;
    if (product.image_nutrition_url) score += 10;

    // Categorie e brand
    maxScore += 15;
    if (product.categories) score += 8;
    if (product.brands) score += 7;

    // Allergens e labels
    maxScore += 15;
    if (product.allergens) score += 8;
    if (product.labels) score += 7;

    return Math.round((score / maxScore) * 100);
  }

  // Campi richiesti per le query
  getRequiredFields() {
    return [
      'code',
      'product_name',
      'product_name_it',
      'generic_name',
      'brands',
      'categories',
      'categories_hierarchy',
      'image_url',
      'image_nutrition_url',
      'ingredients_text',
      'ingredients_text_it',
      'allergens',
      'traces',
      'nutriments',
      'nutriscore_grade',
      'nova_group',
      'ecoscore_grade',
      'countries',
      'packaging',
      'labels',
      'last_modified_t',
      '_id',
    ].join(',');
  }

  // Verifica disponibilità servizio
  async healthCheck() {
    try {
      const response = await axios.get(`${this.baseURL}/api/v0/product/3017620422003.json`, {
        headers: {
          'User-Agent': this.userAgent,
        },
        timeout: 5000,
      });

      return {
        status: 'healthy',
        response_time: response.config.timeout,
        available: true,
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        available: false,
      };
    }
  }

  // Ottieni statistiche utilizzo API
  getUsageStats() {
    // TODO: Implementare tracking delle chiamate API
    return {
      daily_requests: 0,
      monthly_requests: 0,
      rate_limit_remaining: 1000,
      last_request_at: null,
    };
  }
}

module.exports = new OpenFoodFactsService();
