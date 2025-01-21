const mongoose = require('mongoose');
const Restaurante = require('./models/Restaurante'); // Asegúrate de que la ruta sea correcta

// Conexión a MongoDB
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Conexión a MongoDB exitosa'))
  .catch(err => console.error('Error al conectar a MongoDB:', err));

const normalizeData = async () => {
  try {
    const restaurantes = await Restaurante.find();
    for (const restaurante of restaurantes) {
      const updates = {
        nombre: restaurante.Nombre || restaurante.nombre,
        tipoCocina: restaurante['Tipo de cocina'] || restaurante.tipoCocina,
        localizacion: restaurante['Localización'] || restaurante.localizacion,
        fechasVisita: restaurante.fechasVisita || [],
      };

      // Elimina las propiedades antiguas si existen
      delete updates['Tipo de cocina'];
      delete updates['Localización'];
      delete updates.Nombre;

      await Restaurante.findByIdAndUpdate(restaurante._id, updates, { new: true });
    }
    console.log('Normalización completada');
    mongoose.connection.close();
  } catch (err) {
    console.error('Error durante la normalización:', err);
    mongoose.connection.close();
  }
};

normalizeData();
