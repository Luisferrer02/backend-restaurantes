//models/Restaurante.js
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
  // Nuevo campo para almacenar los emails de los owners
  owners: { type: [String], required: true },
  // Nuevo campo para almacenar la localización detallada (obtenida de Mapbox)
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number] // [longitude, latitude]
    },
    place_name: String
  }
}, {
  collection: 'Restaurantes',
});

// Crear un índice 2dsphere para Coordenadas y location
RestauranteSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Restaurante', RestauranteSchema);
