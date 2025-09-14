const express = require('express');
const router = express.Router();
const waterWeightController = require('../controllers/waterWeightController');
console.log('DEBUG waterWeightController:', waterWeightController);
const { authenticate } = require('../middleware/auth');

// Acqua
router.post('/water', authenticate, waterWeightController.saveWater);
router.get('/water', authenticate, waterWeightController.getWater);

// Peso
router.post('/weight', authenticate, waterWeightController.saveWeight);
router.get('/weight', authenticate, waterWeightController.getWeight);

module.exports = router;
