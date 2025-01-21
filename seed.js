const mongoose = require('mongoose');
const Restaurante = require('./models/Restaurante');

mongoose.connect('TU_URI_DE_MONGO', { useNewUrlParser: true, useUnifiedTopology: true });

const seedData = [
  { nombre: 'Restaurante Uno', tipoCocina: 'Japonesa', localizacion: 'Madrid', fechasVisita: [] },
  { nombre: 'Restaurante Dos', tipoCocina: 'Italiana', localizacion: 'Barcelona', fechasVisita: [] },
];

Restaurante.insertMany(seedData)
  .then(() => {
    console.log('Datos insertados');
    mongoose.connection.close();
  })
  .catch(err => console.error('Error insertando datos:', err));
