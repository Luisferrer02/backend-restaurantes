// app.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middlewares globales
app.use(express.json());
app.use(cors()); // Puedes ajustar la configuración de CORS según necesites

// Conexión a la base de datos
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('Conexión a MongoDB Atlas exitosa');
    console.log('Base de datos:', mongoose.connection.db.databaseName);
  })
  .catch(err => console.error('Error conectando a MongoDB:', err));

// Rutas (usa nombres consistentes)
app.use('/api/restaurantes', require('./routes/restaurantes.routes'));
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/googleplaces', require('./routes/googleplaces.routes'));

app.get('/', (req, res) => {
  res.send('Bienvenido al backend de restaurantes');
});

module.exports = app;
