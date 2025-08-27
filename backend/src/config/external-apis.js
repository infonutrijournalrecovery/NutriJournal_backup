const axios = require('axios');
const config = require('./environment');

class ExternalApisConfig {
  constructor() {
    this.openFoodFactsClient = this.createOpenFoodFactsClient();
    this.translationClient = this.createTranslationClient();
  }

  // Client per OpenFoodFacts API
  createOpenFoodFactsClient() {
    return axios.create({
      baseURL: config.externalApis.openFoodFacts.baseUrl,
      timeout: 10000,
      headers: {
        'User-Agent': config.externalApis.openFoodFacts.userAgent,
        'Accept': 'application/json',
      },
    });
  }

  // Client per API di traduzione (Google Translate)
  createTranslationClient() {
    if (!config.externalApis.translation.apiKey) {
      return null;
    }

    return axios.create({
      baseURL: 'https://translation.googleapis.com/language/translate/v2',
      timeout: 5000,
      headers: {
        'Content-Type': 'application/json',
      },
      params: {
        key: config.externalApis.translation.apiKey,
      },
    });
  }

  // Cerca prodotto per barcode su OpenFoodFacts
  async searchProductByBarcode(barcode) {
    try {
      const response = await this.openFoodFactsClient.get(`/product/${barcode}.json`);
      
      if (response.data.status === 1 && response.data.product) {
        return this.normalizeOpenFoodFactsProduct(response.data.product);
      }
      
      return null;
    } catch (error) {
      console.error('❌ Errore ricerca barcode OpenFoodFacts:', error.message);
      throw new Error('Errore ricerca prodotto per barcode');
    }
  }

  // Cerca prodotti per nome su OpenFoodFacts
  async searchProductsByName(query, page = 1, limit = 20) {
    try {
      const params = {
        search_terms: query,
        json: 1,
        page: page,
        page_size: limit,
        fields: 'code,product_name,brands,image_url,nutriments,categories,nutriscore_grade,nova_group',
      };

      const response = await this.openFoodFactsClient.get('/search', { params });
      
      if (response.data.products) {
        return {
          products: response.data.products.map(product => 
            this.normalizeOpenFoodFactsProduct(product)
          ),
          total: response.data.count || 0,
          page: page,
          totalPages: Math.ceil((response.data.count || 0) / limit),
        };
      }
      
      return { products: [], total: 0, page: 1, totalPages: 0 };
    } catch (error) {
      console.error('❌ Errore ricerca nome OpenFoodFacts:', error.message);
      throw new Error('Errore ricerca prodotti per nome');
    }
  }

  // Normalizza dati prodotto OpenFoodFacts per il nostro formato
  normalizeOpenFoodFactsProduct(product) {
    const nutriments = product.nutriments || {};
    
    return {
      barcode: product.code,
      name: product.product_name || 'Prodotto senza nome',
      name_it: null, // Sarà tradotto dopo
      brand: product.brands || null,
      brand_it: null, // Sarà tradotto dopo
      image_url: product.image_url,
      categories: product.categories,
      
      // Valori nutrizionali per 100g
      calories: nutriments['energy-kcal_100g'] || nutriments['energy-kcal'] || null,
      proteins: nutriments['proteins_100g'] || nutriments['proteins'] || null,
      carbs: nutriments['carbohydrates_100g'] || nutriments['carbohydrates'] || null,
      fats: nutriments['fat_100g'] || nutriments['fat'] || null,
      fiber: nutriments['fiber_100g'] || nutriments['fiber'] || null,
      sugars: nutriments['sugars_100g'] || nutriments['sugars'] || null,
      salt: nutriments['salt_100g'] || nutriments['salt'] || null,
      sodium: nutriments['sodium_100g'] || nutriments['sodium'] || null,
      
      // Acidi grassi
      saturated_fats: nutriments['saturated-fat_100g'] || nutriments['saturated-fat'] || null,
      
      // Scores
      nutriscore: product.nutriscore_grade?.toUpperCase() || null,
      nova_group: product.nova_group || null,
      
      // Metadati
      source: 'openfoodfacts',
      original_language: product.lang || 'en',
      translation_status: 'none',
    };
  }

  // Traduce testo usando Google Translate
  async translateText(text, targetLang = 'it', sourceLang = 'auto') {
    if (!this.translationClient) {
      console.warn('⚠️ API traduzione non configurata');
      return null;
    }

    try {
      const response = await this.translationClient.post('', {
        q: text,
        target: targetLang,
        source: sourceLang,
        format: 'text',
      });

      if (response.data?.data?.translations?.[0]) {
        const translation = response.data.data.translations[0];
        return {
          translatedText: translation.translatedText,
          detectedSourceLanguage: translation.detectedSourceLanguage || sourceLang,
          confidence: 0.8, // Default confidence per Google Translate
        };
      }

      return null;
    } catch (error) {
      console.error('❌ Errore traduzione testo:', error.message);
      return null;
    }
  }

  // Traduce prodotto OpenFoodFacts in italiano
  async translateProduct(product) {
    const fieldsToTranslate = ['name', 'brand'];
    const translations = {};

    for (const field of fieldsToTranslate) {
      if (product[field] && product.original_language !== 'it') {
        const translation = await this.translateText(product[field]);
        if (translation) {
          translations[`${field}_it`] = translation.translatedText;
        }
      }
    }

    return {
      ...product,
      ...translations,
      translation_status: Object.keys(translations).length > 0 ? 'auto' : 'none',
    };
  }

  // Test connessione OpenFoodFacts
  async testOpenFoodFactsConnection() {
    try {
      const response = await this.openFoodFactsClient.get('/product/3017620422003.json');
      return response.status === 200;
    } catch (error) {
      console.error('❌ Test OpenFoodFacts fallito:', error.message);
      return false;
    }
  }

  // Test connessione API traduzione
  async testTranslationConnection() {
    if (!this.translationClient) {
      return false;
    }

    try {
      const response = await this.translationClient.post('', {
        q: 'test',
        target: 'it',
        source: 'en',
      });
      return response.status === 200;
    } catch (error) {
      console.error('❌ Test API traduzione fallito:', error.message);
      return false;
    }
  }

  // Ottieni statistiche utilizzo API
  getApiStats() {
    return {
      openFoodFacts: {
        baseUrl: config.externalApis.openFoodFacts.baseUrl,
        userAgent: config.externalApis.openFoodFacts.userAgent,
        available: true,
      },
      translation: {
        available: !!this.translationClient,
        provider: 'Google Translate',
      },
    };
  }
}

module.exports = new ExternalApisConfig();
