// server.js
const app = require('./app');
const PORT = process.env.PORT || 5001;

const server = app.listen(PORT, '0.0.0.0', () => 
  console.log(`Servidor corriendo en puerto ${PORT}`)
);

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`El puerto ${PORT} ya está en uso. Por favor, elige otro puerto.`);
  } else {
    console.error('Error del servidor:', err);
  }
  process.exit(1);
});
