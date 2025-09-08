const Pantry = require('../models/Pantry');
const { ValidationError, NotFoundError, UnauthorizedError } = require('../middleware/errorHandler');
const { logger } = require('../middleware/logging');
const { validate } = require('../utils/validation');
const { startTransaction } = require('../utils/database');

/**
 * Controller per la gestione della dispensa digitale
 * @class PantryController
 */
class PantryController {
    /**
     * Crea una nuova istanza del controller
     * @param {Object} database - Istanza del database
     */
    constructor(database) {
        this.pantryModel = new Pantry(database);
    }

    /**
     * Cerca prodotti nella dispensa dell'utente
     */
    static async searchPantryProducts(req, res, next) {
        try {
            const { query = '', page = 1, limit = 20 } = req.query;
            const userId = req.user.id;
            
            // Validazione
            const sanitizedQuery = query.trim();
            const sanitizedPage = Math.max(1, parseInt(page));
            const sanitizedLimit = Math.min(50, Math.max(1, parseInt(limit)));

            const products = await this.pantryModel.search(userId, sanitizedQuery, sanitizedPage, sanitizedLimit);
            
            res.json({
                success: true,
                data: {
                    products: products.items,
                    pagination: {
                        page: sanitizedPage,
                        limit: sanitizedLimit,
                        total: products.total,
                        hasMore: products.total > sanitizedPage * sanitizedLimit
                    }
                }
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Aggiunge un prodotto alla dispensa dell'utente
     */
    static async addToPantry(req, res, next) {
        try {
            const { productId } = req.params;
            const { quantity = 1, expirationDate = null } = req.body;
            const userId = req.user.id;

            // Validazione
            if (!productId) {
                throw new ValidationError('ID prodotto richiesto');
            }

            if (quantity <= 0) {
                throw new ValidationError('La quantità deve essere maggiore di zero');
            }

            await this.pantryModel.addProduct(userId, productId, quantity, expirationDate);

            res.json({
                success: true,
                message: 'Prodotto aggiunto alla dispensa'
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Rimuove un prodotto dalla dispensa dell'utente
     */
    static async removeFromPantry(req, res, next) {
        try {
            const { productId } = req.params;
            const userId = req.user.id;

            if (!productId) {
                throw new ValidationError('ID prodotto richiesto');
            }

            await this.pantryModel.removeProduct(userId, productId);

            res.json({
                success: true,
                message: 'Prodotto rimosso dalla dispensa'
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Aggiunge un nuovo prodotto alla dispensa
     * @param {Object} req - Request object
     * @param {Object} res - Response object
     * @param {Function} next - Next middleware function
     */
    async addItem(req, res, next) {
        try {
            const { 
                product_id, barcode, name, brand, category, 
                quantity, unit, expiry_date, purchase_date, 
                cost, location, notes 
            } = req.body;

            // Validazione campi obbligatori
            if (!name || !quantity || !unit) {
                throw new ValidationError('Nome, quantità e unità di misura sono obbligatori');
            }

            // Validazione quantità
            if (isNaN(quantity) || quantity <= 0) {
                throw new ValidationError('La quantità deve essere un numero positivo');
            }

            // Validazione date
            if (expiry_date && !/^\d{4}-\d{2}-\d{2}$/.test(expiry_date)) {
                throw new ValidationError('Data di scadenza non valida (formato richiesto: YYYY-MM-DD)');
            }
            if (purchase_date && !/^\d{4}-\d{2}-\d{2}$/.test(purchase_date)) {
                throw new ValidationError('Data di acquisto non valida (formato richiesto: YYYY-MM-DD)');
            }

            logger.info('Aggiunta nuovo prodotto alla dispensa', {
                userId: req.user.id,
                productName: name,
                category
            });

            const item = await this.pantryModel.addItem({
                user_id: req.user.id,
                product_id,
                barcode,
                name,
                brand,
                category,
                quantity,
                unit,
                expiry_date,
                purchase_date,
                cost,
                location,
                notes,
                created_at: new Date().toISOString()
            });

            res.status(201).json({
                success: true,
                message: 'Prodotto aggiunto alla dispensa',
                data: { 
                    item,
                    timestamp: new Date().toISOString()
                }
            });

            logger.info('Prodotto aggiunto con successo', {
                userId: req.user.id,
                itemId: item.id
            });
        } catch (error) {
            logger.error('Errore aggiunta prodotto', {
                userId: req.user.id,
                error: error.message,
                data: req.body
            });
            next(error);
        }
    }

    /**
     * Recupera gli elementi della dispensa con filtri e paginazione
     * @param {Object} req - Request object
     * @param {Object} res - Response object
     * @param {Function} next - Next middleware function
     */
    async getItems(req, res, next) {
        try {
            const { 
                category, location, expired, expiring_soon,
                search, limit = 50, offset = 0,
                sort_by = 'created_at', sort_order = 'desc'
            } = req.query;

            // Validazione parametri
            if (limit && (isNaN(limit) || limit < 1 || limit > 100)) {
                throw new ValidationError('Limite non valido (deve essere tra 1 e 100)');
            }
            if (offset && (isNaN(offset) || offset < 0)) {
                throw new ValidationError('Offset non valido');
            }

            const filters = { user_id: req.user.id };
            if (category) filters.category = category;
            if (location) filters.location = location;
            
            if (expired === 'true') {
                filters.expired = true;
            }
            if (expiring_soon === 'true') {
                filters.expiring_soon = true;
            }

            logger.info('Richiesta elementi dispensa', {
                userId: req.user.id,
                filters,
                search,
                pagination: { limit, offset }
            });

            const items = await this.pantryModel.findByUser(
                req.user.id, 
                filters, 
                search,
                parseInt(limit), 
                parseInt(offset),
                sort_by,
                sort_order
            );

            const total = await this.pantryModel.countByUser(req.user.id, filters, search);

            res.json({
                success: true,
                data: {
                    items,
                    pagination: {
                        total,
                        limit: parseInt(limit),
                        offset: parseInt(offset),
                        hasMore: total > parseInt(offset) + items.length
                    },
                    timestamp: new Date().toISOString()
                }
            });

            logger.info('Elementi dispensa recuperati', {
                userId: req.user.id,
                itemCount: items.length,
                total
            });
        } catch (error) {
            logger.error('Errore recupero elementi dispensa', {
                userId: req.user.id,
                error: error.message,
                query: req.query
            });
            next(error);
        }
    }

    /**
     * Recupera un elemento specifico della dispensa
     * @param {Object} req - Request object
     * @param {Object} res - Response object
     * @param {Function} next - Next middleware function
     */
    async getItemById(req, res, next) {
        try {
            const { itemId } = req.params;

            if (!itemId || !/^\d+$/.test(itemId)) {
                throw new ValidationError('ID elemento non valido');
            }

            logger.info('Richiesta dettagli elemento dispensa', {
                userId: req.user.id,
                itemId
            });

            const item = await this.pantryModel.findById(itemId);

            if (!item) {
                throw new NotFoundError('Elemento non trovato nella dispensa');
            }

            if (item.user_id !== req.user.id) {
                logger.warn('Tentativo di accesso non autorizzato', {
                    userId: req.user.id,
                    itemId,
                    ownerUserId: item.user_id
                });
                throw new UnauthorizedError('Non autorizzato ad accedere a questo elemento');
            }

            res.json({
                success: true,
                data: { 
                    item,
                    timestamp: new Date().toISOString()
                }
            });

            logger.info('Dettagli elemento recuperati', {
                userId: req.user.id,
                itemId
            });
        } catch (error) {
            logger.error('Errore recupero dettagli elemento', {
                userId: req.user.id,
                itemId: req.params.itemId,
                error: error.message
            });
            next(error);
        }
    }

    /**
     * Aggiorna un elemento della dispensa
     * @param {Object} req - Request object
     * @param {Object} res - Response object
     * @param {Function} next - Next middleware function
     */
    async updateItem(req, res, next) {
        try {
            const { itemId } = req.params;

            if (!itemId || !/^\d+$/.test(itemId)) {
                throw new ValidationError('ID elemento non valido');
            }

            logger.info('Richiesta aggiornamento elemento dispensa', {
                userId: req.user.id,
                itemId,
                updateFields: Object.keys(req.body)
            });

            const item = await this.pantryModel.findById(itemId);

            if (!item) {
                throw new NotFoundError('Elemento non trovato nella dispensa');
            }

            if (item.user_id !== req.user.id) {
                logger.warn('Tentativo di modifica non autorizzato', {
                    userId: req.user.id,
                    itemId,
                    ownerUserId: item.user_id
                });
                throw new UnauthorizedError('Non autorizzato a modificare questo elemento');
            }

            // Validazione date
            if (req.body.expiry_date && !/^\d{4}-\d{2}-\d{2}$/.test(req.body.expiry_date)) {
                throw new ValidationError('Data di scadenza non valida (formato richiesto: YYYY-MM-DD)');
            }
            if (req.body.purchase_date && !/^\d{4}-\d{2}-\d{2}$/.test(req.body.purchase_date)) {
                throw new ValidationError('Data di acquisto non valida (formato richiesto: YYYY-MM-DD)');
            }

            // Validazione quantità
            if (req.body.quantity !== undefined) {
                if (isNaN(req.body.quantity) || req.body.quantity < 0) {
                    throw new ValidationError('La quantità deve essere un numero non negativo');
                }
            }

            const updatedItem = await this.pantryModel.update(itemId, {
                ...req.body,
                updated_at: new Date().toISOString()
            });

            res.json({
                success: true,
                message: 'Elemento aggiornato con successo',
                data: { 
                    item: updatedItem,
                    timestamp: new Date().toISOString()
                }
            });

            logger.info('Elemento aggiornato con successo', {
                userId: req.user.id,
                itemId
            });
        } catch (error) {
            logger.error('Errore aggiornamento elemento', {
                userId: req.user.id,
                itemId: req.params.itemId,
                error: error.message,
                data: req.body
            });
            next(error);
        }
    }

    /**
     * Elimina un elemento dalla dispensa
     * @param {Object} req - Request object
     * @param {Object} res - Response object
     * @param {Function} next - Next middleware function
     */
    async deleteItem(req, res, next) {
        try {
            const { itemId } = req.params;

            if (!itemId || !/^\d+$/.test(itemId)) {
                throw new ValidationError('ID elemento non valido');
            }

            logger.info('Richiesta eliminazione elemento dispensa', {
                userId: req.user.id,
                itemId
            });

            const item = await this.pantryModel.findById(itemId);

            if (!item) {
                throw new NotFoundError('Elemento non trovato nella dispensa');
            }

            if (item.user_id !== req.user.id) {
                logger.warn('Tentativo di eliminazione non autorizzato', {
                    userId: req.user.id,
                    itemId,
                    ownerUserId: item.user_id
                });
                throw new UnauthorizedError('Non autorizzato a eliminare questo elemento');
            }

            await this.pantryModel.delete(itemId);

            res.json({
                success: true,
                message: 'Elemento eliminato dalla dispensa',
                data: {
                    timestamp: new Date().toISOString()
                }
            });

            logger.info('Elemento eliminato con successo', {
                userId: req.user.id,
                itemId
            });
        } catch (error) {
            logger.error('Errore eliminazione elemento', {
                userId: req.user.id,
                itemId: req.params.itemId,
                error: error.message
            });
            next(error);
        }
    }

    /**
     * Consuma una quantità di un prodotto dalla dispensa
     * @param {Object} req - Request object
     * @param {Object} res - Response object
     * @param {Function} next - Next middleware function
     */
    async consumeItem(req, res, next) {
        const transaction = await startTransaction();
        try {
            const { itemId } = req.params;
            const { quantity_consumed, notes } = req.body;

            if (!itemId || !/^\d+$/.test(itemId)) {
                throw new ValidationError('ID elemento non valido');
            }

            if (!quantity_consumed || isNaN(quantity_consumed) || quantity_consumed <= 0) {
                throw new ValidationError('Quantità consumata deve essere maggiore di 0');
            }

            logger.info('Richiesta consumo prodotto', {
                userId: req.user.id,
                itemId,
                quantity: quantity_consumed
            });

            const item = await this.pantryModel.findById(itemId, transaction);

            if (!item) {
                throw new NotFoundError('Elemento non trovato nella dispensa');
            }

            if (item.user_id !== req.user.id) {
                logger.warn('Tentativo di consumo non autorizzato', {
                    userId: req.user.id,
                    itemId,
                    ownerUserId: item.user_id
                });
                throw new UnauthorizedError('Non autorizzato a modificare questo elemento');
            }

            if (item.quantity < quantity_consumed) {
                throw new ValidationError('Quantità consumata superiore a quella disponibile');
            }

            const newQuantity = item.quantity - quantity_consumed;
            const updatedItem = await this.pantryModel.update(itemId, { 
                quantity: newQuantity,
                last_consumed: new Date().toISOString(),
                notes: notes ? `${item.notes ? item.notes + '\n' : ''}${new Date().toISOString()}: Consumati ${quantity_consumed} ${item.unit}` : item.notes
            }, transaction);

            await transaction.commit();

            res.json({
                success: true,
                message: 'Quantità consumata con successo',
                data: { 
                    item: updatedItem,
                    consumed: quantity_consumed,
                    timestamp: new Date().toISOString()
                }
            });

            logger.info('Prodotto consumato con successo', {
                userId: req.user.id,
                itemId,
                quantityConsumed: quantity_consumed,
                remainingQuantity: newQuantity
            });
        } catch (error) {
            await transaction.rollback();
            logger.error('Errore consumo prodotto', {
                userId: req.user.id,
                itemId: req.params.itemId,
                error: error.message,
                data: req.body
            });
            next(error);
        }
    }

    /**
     * Aggiunge più prodotti alla dispensa in un'unica operazione
     * @param {Object} req - Request object
     * @param {Object} res - Response object
     * @param {Function} next - Next middleware function
     */
    async addBulkItems(req, res, next) {
        const transaction = await startTransaction();
        try {
            const { items } = req.body;

            if (!Array.isArray(items) || items.length === 0) {
                throw new ValidationError('La richiesta deve contenere un array di elementi');
            }

            if (items.length > 50) {
                throw new ValidationError('Massimo 50 elementi per volta');
            }

            logger.info('Richiesta aggiunta bulk prodotti', {
                userId: req.user.id,
                itemCount: items.length
            });

            const results = [];
            const errors = [];

            for (const [index, itemData] of items.entries()) {
                try {
                    // Validazione singolo elemento
                    if (!itemData.name || !itemData.quantity || !itemData.unit) {
                        throw new ValidationError('Nome, quantità e unità di misura sono obbligatori');
                    }

                    if (isNaN(itemData.quantity) || itemData.quantity <= 0) {
                        throw new ValidationError('La quantità deve essere un numero positivo');
                    }

                    const item = await this.pantryModel.addItem({
                        ...itemData,
                        user_id: req.user.id,
                        created_at: new Date().toISOString()
                    }, transaction);

                    results.push(item);
                } catch (error) {
                    errors.push({
                        index,
                        item: itemData,
                        error: error.message
                    });
                }
            }

            if (errors.length === items.length) {
                // Se tutti gli elementi hanno fallito, rollback
                await transaction.rollback();
                throw new ValidationError('Nessun elemento aggiunto - tutti gli elementi non sono validi');
            }

            await transaction.commit();

            res.status(201).json({
                success: true,
                message: `${results.length} prodotti aggiunti alla dispensa${errors.length > 0 ? `, ${errors.length} falliti` : ''}`,
                data: { 
                    items: results,
                    errors: errors.length > 0 ? errors : undefined,
                    timestamp: new Date().toISOString()
                }
            });

            logger.info('Operazione bulk completata', {
                userId: req.user.id,
                successCount: results.length,
                errorCount: errors.length
            });
        } catch (error) {
            await transaction.rollback();
            logger.error('Errore operazione bulk', {
                userId: req.user.id,
                error: error.message,
                data: req.body
            });
            next(error);
        }
    }
}

module.exports = PantryController;
