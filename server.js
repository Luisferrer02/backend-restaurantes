// server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5001;

app.use(express.json());
const allowedOrigins = ['https://webapp-restaurantes.netlify.app', 'http://localhost:3000'];
app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      return callback(new Error(`El origen ${origin} no está permitido por CORS`), false);
    }
    return callback(null, true);
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('Conexión a MongoDB Atlas exitosa');
    console.log('Base de datos:', mongoose.connection.db.databaseName);
  })
  .catch(err => console.error('Error conectando a MongoDB:', err));

app.use('/api/restaurantes', require('./routes/restaurantesrutas'));
app.use('/api/auth', require('./routes/auth'));

app.get('/', (req, res) => {
  res.send('Bienvenido al backend de restaurantes');
});

const server = app.listen(PORT, () => console.log(`Servidor corriendo en http://localhost:${PORT}`));
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`El puerto ${PORT} ya está en uso. Por favor, elige otro puerto.`);
  } else {
    console.error('Error del servidor:', err);
  }
  process.exit(1);
});
