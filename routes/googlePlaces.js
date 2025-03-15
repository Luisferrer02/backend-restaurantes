// routes/googlePlaces.js
const express = require('express');
const router = express.Router();
const { searchLocation } = require('../controllers/googlePlacesController');

// Define la ruta POST para la búsqueda de localizaciones
router.post('/search', searchLocation);

module.exports = router;
