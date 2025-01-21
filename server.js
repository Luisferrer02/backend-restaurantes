const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(express.json());
app.use(cors({ origin: '*' }));

// Conexión a MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('Conexión a MongoDB Atlas exitosa');
    console.log('Base de datos:', mongoose.connection.db.databaseName);
  })
  .catch(err => console.error('Error conectando a MongoDB:', err));

// Rutas de la API
app.use('/api/restaurantes', require('./routes/restaurantesrutas'));

// Ruta principal
app.get('/', (req, res) => {
  res.send('Bienvenido al backend de restaurantes');
});

// Iniciar el servidor
const server = app.listen(PORT, () => console.log(`Servidor corriendo en http://localhost:${PORT}`));

// Manejar errores del servidor
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`El puerto ${PORT} ya está en uso. Por favor, elige otro puerto.`);
  } else {
    console.error('Error del servidor:', err);
  }
  process.exit(1);
});
