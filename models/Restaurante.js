const mongoose = require('mongoose');

const RestauranteSchema = new mongoose.Schema({
    Nombre: { type: String, required: true },
    'Tipo de cocina': { type: String, required: true },
    Localización: { type: String, required: true },
    fechasVisita: { type: [Date], default: [] },
    /*Imagen: { type: String, default: '' },
    Coordenadas: {
        type: [Number], // [longitud, latitud]
        index: '2dsphere'
    }*/
});

module.exports = mongoose.model('Restaurante', RestauranteSchema);
