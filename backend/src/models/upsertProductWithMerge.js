// Funzione di upsert/merge prodotto: aggiorna solo i campi più completi
const Product = require('./Product');

/**
 * Upsert intelligente: crea o aggiorna un prodotto con i dati più completi
 * @param {object} productData - Dati del prodotto (id obbligatorio)
 * @returns {Promise<Product>} - Il prodotto aggiornato o creato
 */
async function upsertProductWithMerge(productData) {
  const { logger } = require('../middleware/logging');
  logger.info('[DEBUG][upsertProductWithMerge] productData ricevuto', productData);
  if (!productData || !productData.id) throw new Error('ID prodotto obbligatorio');
  // Estrai nutrienti base da nutritionPer100g o totalNutrition se presenti
  const nutrition = productData.nutritionPer100g || productData.totalNutrition || {};
  // Lista dei campi base supportati dal modello Product
  const baseFields = [
    'calories','proteins','carbs','carbohydrates','fats','fiber','sugars','sugar','salt','sodium','saturated_fats','saturatedFats','monounsaturated_fats','polyunsaturated_fats','trans_fats','cholesterol',
    'vitamin_a','vitamin_c','vitamin_d','vitamin_e','vitamin_k','thiamin','riboflavin','niacin','vitamin_b6','folate','vitamin_b12','biotin','pantothenic_acid',
    'calcium','iron','magnesium','phosphorus','potassium','zinc','copper','manganese','selenium','iodine','chromium','molybdenum',
    'alcohol','caffeine','water'
  ];
  // Mappa i nutrienti base sulle colonne corrette
  const mappedNutrition = {};
  for (const key of baseFields) {
    if (nutrition[key] !== undefined) {
      // Mappa alias
      if (key === 'carbohydrates') mappedNutrition['carbs'] = nutrition[key];
      else if (key === 'sugar') mappedNutrition['sugars'] = nutrition[key];
      else if (key === 'saturatedFats') mappedNutrition['saturated_fats'] = nutrition[key];
      else mappedNutrition[key] = nutrition[key];
    }
  }
  // Tutti i nutrienti extra (non base) vengono salvati in extra_nutrients
  const extraNutrients = {};
  for (const [k, v] of Object.entries(nutrition)) {
    if (!baseFields.includes(k)) {
      extraNutrients[k] = v;
    }
  }
  // Prepara il payload finale per il prodotto
  const finalProductData = {
    ...productData,
    ...mappedNutrition,
    extra_nutrients: Object.keys(extraNutrients).length > 0 ? JSON.stringify(extraNutrients) : null
  };
  // Rimuovi i campi non validi per il DB
  delete finalProductData.nutritionPer100g;
  delete finalProductData.totalNutrition;
  let existing = await Product.findById(finalProductData.id);
  if (!existing) {
    // Crea nuovo prodotto con i dati mappati
    return await Product.create(finalProductData);
  }
  // Merge: aggiorna solo i campi che sono nulli/vuoti o più completi
  const updates = {};
  for (const key of Object.keys(finalProductData)) {
    if (key === 'id' || key === 'created_at' || key === 'quantity' || key === 'unit') continue;
    const newVal = finalProductData[key];
    const oldVal = existing[key];
    if ((newVal !== undefined && newVal !== null && newVal !== '') && (oldVal === undefined || oldVal === null || oldVal === '' || newVal !== oldVal)) {
      updates[key] = newVal;
    }
  }
  if (Object.keys(updates).length > 0) {
    await existing.update(updates);
  }
  return await Product.findById(finalProductData.id);
}

module.exports = upsertProductWithMerge;
