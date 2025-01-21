const mongoose = require('mongoose');

const RestauranteSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  tipoCocina: { type: String, required: true },
  localizacion: { type: String, required: true },
  fechasVisita: { type: [Date], default: [] },
}, { collection: 'Restaurantes' }); // Forzar el uso del nombre exacto de la colección

module.exports = mongoose.model('Restaurante', RestauranteSchema);
