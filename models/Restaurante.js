// models/Restaurante.js
const mongoose = require('mongoose');

// Esquema para los comentarios de visitas
const ComentarioVisitaSchema = new mongoose.Schema({
  fecha: { type: Date, default: Date.now },
  comentario: { type: String, default: '' },
});

// Esquema principal del Restaurante
const RestauranteSchema = new mongoose.Schema({
  Nombre: { type: String, required: true },
  'Tipo de cocina': { type: String, required: true },
  Localización: { type: String, required: true },
  fechasVisita: { type: [Date], default: [] },
  Descripcion: { type: String, default: '' }, // Campo opcional
  Imagen: { type: String, default: '' }, // Campo opcional
  Coordenadas: {
    type: [Number], // [longitud, latitud]
    index: '2dsphere', // Índice para consultas geoespaciales
    validate: {
      validator: function (v) {
        return v.length === 2 && v.every(num => typeof num === 'number');
      },
      message: props => `${props.value} no es un arreglo válido de [longitud, latitud].`,
    },
  },
  comentariosVisita: { type: [ComentarioVisitaSchema], default: [] }, // Campo para comentarios de visitas
}, {
  collection: 'Restaurantes', // Nombre de la colección en MongoDB
});


module.exports = mongoose.model('Restaurante', RestauranteSchema);
