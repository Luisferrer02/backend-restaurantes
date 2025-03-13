const mongoose = require('mongoose');

const VisitaSchema = new mongoose.Schema({
  fecha: { type: Date, default: Date.now },
  comentario: { type: String, default: '' },
});

const RestauranteSchema = new mongoose.Schema({
  Nombre: { type: String, required: true },
  "Tipo de cocina": { type: String, required: true },
  Localización: { type: String, required: true },
  visitas: { type: Array, default: [] },
  Descripcion: { type: String, default: "" },
  Imagen: { type: String, default: "" },
  Coordenadas: {
    type: {
      type: String,
      enum: ["Point"],
      required: false, // Opcional
    },
    coordinates: {
      type: [Number],
      required: false,
    },
  },
  // New field to store owner(s) email(s)
  owners: { type: [String], required: true },
}, {
  collection: 'Restaurantes',
});

// Crear un índice 2dsphere para Coordenadas
RestauranteSchema.index({ Coordenadas: '2dsphere' });

module.exports = mongoose.model('Restaurante', RestauranteSchema);
