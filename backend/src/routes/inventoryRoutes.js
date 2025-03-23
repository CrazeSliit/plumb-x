const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventoryController');

// Get all inventory items
router.get('/', inventoryController.getAllItems);

// Get inventory item by ID
router.get('/:id', inventoryController.getItemById);

// Create new inventory item
router.post('/', inventoryController.createItem);

// Update inventory item
router.put('/:id', inventoryController.updateItem);

// Delete inventory item
router.delete('/:id', inventoryController.deleteItem);

// Get inventory by category
router.get('/category/:category', inventoryController.getItemsByCategory);

// Get low stock alerts
router.get('/alerts/low-stock', inventoryController.getLowStockAlerts);

module.exports = router; 