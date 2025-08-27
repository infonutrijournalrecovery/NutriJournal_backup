const Pantry = require('../models/Pantry');
const { ValidationError, NotFoundError } = require('../middleware/errorHandler');
const { validate } = require('../utils/validation');

class PantryController {
    constructor(database) {
        this.pantryModel = new Pantry(database);
    }

    // === GESTIONE DISPENSA ===

    // Aggiungi prodotto alla dispensa
    async addItem(req, res) {
        try {
            const { 
                product_id, barcode, name, brand, category, 
                quantity, unit, expiry_date, purchase_date, 
                cost, location, notes 
            } = req.body;

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
                data: { item }
            });
        } catch (error) {
            throw error;
        }
    }

    // Ottieni tutti gli elementi della dispensa
    async getItems(req, res) {
        try {
            const { 
                category, location, expired, expiring_soon,
                search, limit = 50, offset = 0,
                sort_by = 'created_at', sort_order = 'desc'
            } = req.query;

            const filters = { user_id: req.user.id };
            if (category) filters.category = category;
            if (location) filters.location = location;
            
            if (expired === 'true') {
                filters.expired = true;
            }
            if (expiring_soon === 'true') {
                filters.expiring_soon = true;
            }

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
                    }
                }
            });
        } catch (error) {
            throw error;
        }
    }

    // Ottieni elemento specifico
    async getItemById(req, res) {
        try {
            const { itemId } = req.params;
            const item = await this.pantryModel.findById(itemId);

            if (!item) {
                throw new NotFoundError('Elemento non trovato nella dispensa');
            }

            if (item.user_id !== req.user.id) {
                throw new ValidationError('Non autorizzato ad accedere a questo elemento');
            }

            res.json({
                success: true,
                data: { item }
            });
        } catch (error) {
            throw error;
        }
    }

    // Aggiorna elemento della dispensa
    async updateItem(req, res) {
        try {
            const { itemId } = req.params;
            const item = await this.pantryModel.findById(itemId);

            if (!item) {
                throw new NotFoundError('Elemento non trovato nella dispensa');
            }

            if (item.user_id !== req.user.id) {
                throw new ValidationError('Non autorizzato a modificare questo elemento');
            }

            const updatedItem = await this.pantryModel.update(itemId, req.body);

            res.json({
                success: true,
                message: 'Elemento aggiornato con successo',
                data: { item: updatedItem }
            });
        } catch (error) {
            throw error;
        }
    }

    // Elimina elemento
    async deleteItem(req, res) {
        try {
            const { itemId } = req.params;
            const item = await this.pantryModel.findById(itemId);

            if (!item) {
                throw new NotFoundError('Elemento non trovato nella dispensa');
            }

            if (item.user_id !== req.user.id) {
                throw new ValidationError('Non autorizzato a eliminare questo elemento');
            }

            await this.pantryModel.delete(itemId);

            res.json({
                success: true,
                message: 'Elemento eliminato dalla dispensa'
            });
        } catch (error) {
            throw error;
        }
    }

    // Consuma quantità prodotto
    async consumeItem(req, res) {
        try {
            const { itemId } = req.params;
            const { quantity_consumed, notes } = req.body;

            if (!quantity_consumed || quantity_consumed <= 0) {
                throw new ValidationError('Quantità consumata deve essere maggiore di 0');
            }

            const item = await this.pantryModel.findById(itemId);

            if (!item) {
                throw new NotFoundError('Elemento non trovato nella dispensa');
            }

            if (item.user_id !== req.user.id) {
                throw new ValidationError('Non autorizzato a modificare questo elemento');
            }

            if (item.quantity < quantity_consumed) {
                throw new ValidationError('Quantità consumata superiore a quella disponibile');
            }

            const newQuantity = item.quantity - quantity_consumed;
            const updatedItem = await this.pantryModel.update(itemId, { 
                quantity: newQuantity,
                last_consumed: new Date().toISOString()
            });

            // Registra il consumo
            await this.pantryModel.addConsumptionLog({
                pantry_item_id: itemId,
                user_id: req.user.id,
                quantity_consumed,
                notes,
                consumed_at: new Date().toISOString()
            });

            res.json({
                success: true,
                message: 'Consumo registrato con successo',
                data: { 
                    item: updatedItem,
                    remaining_quantity: newQuantity
                }
            });
        } catch (error) {
            throw error;
        }
    }

    // Ottieni elementi in scadenza
    async getExpiringItems(req, res) {
        try {
            const { days = 7 } = req.query;
            const items = await this.pantryModel.findExpiring(req.user.id, parseInt(days));

            res.json({
                success: true,
                data: {
                    items,
                    expiring_in_days: parseInt(days),
                    total_expiring: items.length
                }
            });
        } catch (error) {
            throw error;
        }
    }

    // Ottieni statistiche dispensa
    async getStats(req, res) {
        try {
            const stats = await this.pantryModel.getStats(req.user.id);

            res.json({
                success: true,
                data: { stats }
            });
        } catch (error) {
            throw error;
        }
    }

    // Ottieni categorie utilizzate
    async getCategories(req, res) {
        try {
            const categories = await this.pantryModel.getCategories(req.user.id);

            res.json({
                success: true,
                data: { categories }
            });
        } catch (error) {
            throw error;
        }
    }

    // Ottieni posizioni utilizzate
    async getLocations(req, res) {
        try {
            const locations = await this.pantryModel.getLocations(req.user.id);

            res.json({
                success: true,
                data: { locations }
            });
        } catch (error) {
            throw error;
        }
    }

    // Duplica elemento
    async duplicateItem(req, res) {
        try {
            const { itemId } = req.params;
            const { quantity, expiry_date } = req.body;

            const originalItem = await this.pantryModel.findById(itemId);

            if (!originalItem) {
                throw new NotFoundError('Elemento non trovato nella dispensa');
            }

            if (originalItem.user_id !== req.user.id) {
                throw new ValidationError('Non autorizzato a duplicare questo elemento');
            }

            const duplicatedItem = await this.pantryModel.addItem({
                ...originalItem,
                id: undefined,
                quantity: quantity || originalItem.quantity,
                expiry_date: expiry_date || originalItem.expiry_date,
                purchase_date: new Date().toISOString().split('T')[0],
                created_at: new Date().toISOString()
            });

            res.status(201).json({
                success: true,
                message: 'Elemento duplicato con successo',
                data: { item: duplicatedItem }
            });
        } catch (error) {
            throw error;
        }
    }

    // === LISTA DELLA SPESA ===

    // Aggiungi alla lista della spesa
    async addToShoppingList(req, res) {
        try {
            const { name, category, quantity, unit, priority, notes } = req.body;

            const item = await this.pantryModel.addToShoppingList({
                user_id: req.user.id,
                name,
                category,
                quantity,
                unit,
                priority: priority || 'medium',
                notes,
                created_at: new Date().toISOString()
            });

            res.status(201).json({
                success: true,
                message: 'Elemento aggiunto alla lista della spesa',
                data: { item }
            });
        } catch (error) {
            throw error;
        }
    }

    // Ottieni lista della spesa
    async getShoppingList(req, res) {
        try {
            const { 
                category, priority, completed,
                limit = 100, offset = 0
            } = req.query;

            const filters = { user_id: req.user.id };
            if (category) filters.category = category;
            if (priority) filters.priority = priority;
            if (completed !== undefined) filters.completed = completed === 'true';

            const items = await this.pantryModel.getShoppingList(
                req.user.id, 
                filters,
                parseInt(limit), 
                parseInt(offset)
            );

            const total = await this.pantryModel.countShoppingList(req.user.id, filters);

            res.json({
                success: true,
                data: {
                    items,
                    pagination: {
                        total,
                        limit: parseInt(limit),
                        offset: parseInt(offset),
                        hasMore: total > parseInt(offset) + items.length
                    }
                }
            });
        } catch (error) {
            throw error;
        }
    }

    // Segna come completato nella lista della spesa
    async completeShoppingItem(req, res) {
        try {
            const { itemId } = req.params;
            const { completed = true } = req.body;

            const item = await this.pantryModel.findShoppingItemById(itemId);

            if (!item) {
                throw new NotFoundError('Elemento non trovato nella lista della spesa');
            }

            if (item.user_id !== req.user.id) {
                throw new ValidationError('Non autorizzato a modificare questo elemento');
            }

            const updatedItem = await this.pantryModel.updateShoppingItem(itemId, { 
                completed,
                completed_at: completed ? new Date().toISOString() : null
            });

            res.json({
                success: true,
                message: completed ? 'Elemento completato' : 'Elemento riaperto',
                data: { item: updatedItem }
            });
        } catch (error) {
            throw error;
        }
    }

    // Elimina dalla lista della spesa
    async deleteShoppingItem(req, res) {
        try {
            const { itemId } = req.params;
            const item = await this.pantryModel.findShoppingItemById(itemId);

            if (!item) {
                throw new NotFoundError('Elemento non trovato nella lista della spesa');
            }

            if (item.user_id !== req.user.id) {
                throw new ValidationError('Non autorizzato a eliminare questo elemento');
            }

            await this.pantryModel.deleteShoppingItem(itemId);

            res.json({
                success: true,
                message: 'Elemento eliminato dalla lista della spesa'
            });
        } catch (error) {
            throw error;
        }
    }
}

module.exports = PantryController;
