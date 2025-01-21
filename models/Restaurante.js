const mongoose = require('mongoose');

const RestauranteSchema = new mongoose.Schema({
  Nombre: { type: String, required: true }, // Nombre del restaurante (obligatorio)
  'Tipo de cocina': { type: String, required: true }, // Tipo de cocina (obligatorio)
  'Localización': { type: String, required: true }, // Localización (obligatorio)
  Fecha: { type: String, default: '' }, // Fecha opcional
}, { collection: 'Restaurantes' }); // Nombre explícito de la colección

module.exports = mongoose.model('Restaurante', RestauranteSchema);
