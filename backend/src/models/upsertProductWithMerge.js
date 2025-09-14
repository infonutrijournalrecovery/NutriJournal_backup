// Funzione di upsert/merge prodotto: aggiorna solo i campi più completi
const Product = require('./Product');

/**
 * Upsert intelligente: crea o aggiorna un prodotto con i dati più completi
 * @param {object} productData - Dati del prodotto (id obbligatorio)
 * @returns {Promise<Product>} - Il prodotto aggiornato o creato
 */
async function upsertProductWithMerge(productData) {
  if (!productData || !productData.id) throw new Error('ID prodotto obbligatorio');
  let existing = await Product.findById(productData.id);
  if (!existing) {
    // Crea nuovo prodotto con tutti i dati disponibili
    return await Product.create(productData);
  }
  // Merge: aggiorna solo i campi che sono nulli/vuoti o più completi
  const updates = {};
  for (const key of Object.keys(productData)) {
    if (key === 'id' || key === 'created_at' || key === 'quantity' || key === 'unit') continue;
    const newVal = productData[key];
    const oldVal = existing[key];
    // Aggiorna se nuovo valore è più completo (non nullo, non vuoto, diverso da quello esistente)
    if ((newVal !== undefined && newVal !== null && newVal !== '') && (oldVal === undefined || oldVal === null || oldVal === '' || newVal !== oldVal)) {
      updates[key] = newVal;
    }
  }
  if (Object.keys(updates).length > 0) {
    await existing.update(updates);
  }
  return await Product.findById(productData.id);
}

module.exports = upsertProductWithMerge;
