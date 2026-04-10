const express = require('express');
const { getWeather, getPriceSuggestion, predictCropPrice } = require('../controllers/utils.controller');
const authMiddleware = require('../middlewares/auth.middleware');

const router = express.Router();

/**
 * @swagger
 * /utils/weather:
 *   get:
 *     summary: Get weather data by location
 *     tags: [Utilities]
 *     parameters:
 *       - in: query
 *         name: lat
 *         schema:
 *           type: string
 *       - in: query
 *         name: lon
 *         schema:
 *           type: string
 *       - in: query
 *         name: city
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Current weather data
 */
router.get('/weather', getWeather);

/**
 * @swagger
 * /utils/price-suggest:
 *   post:
 *     summary: Suggest fair price based on market data
 *     tags: [AI Engine]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Price suggestion generated
 */
router.post('/price-suggest', authMiddleware, getPriceSuggestion);

/**
 * @swagger
 * /utils/predict-price:
 *   post:
 *     summary: AI-powered crop price prediction
 *     tags: [AI Engine]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application_json:
 *           schema:
 *             type: object
 *             required:
 *               - crop
 *             properties:
 *               crop:
 *                 type: string
 *                 example: Tomato
 *               region:
 *                 type: string
 *                 example: Vellore
 *     responses:
 *       200:
 *         description: AI-generated price prediction
 *       400:
 *         description: Validation error
 */
router.post('/predict-price', authMiddleware, predictCropPrice);

module.exports = router;