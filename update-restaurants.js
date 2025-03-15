// update-restaurants.js
require('dotenv').config();
const mongoose = require('mongoose');
const axios = require('axios');
const readline = require('readline');

// Asegúrate de que la ruta del modelo sea correcta según tu proyecto
const Restaurante = require('./models/Restaurantes');

// Configuramos readline para leer de la terminal
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Función para hacer preguntas de forma asíncrona
function askQuestion(query) {
  return new Promise(resolve => {
    rl.question(query, answer => {
      resolve(answer);
    });
  });
}

async function main() {
  try {
    // Conexión a MongoDB
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('Conectado a MongoDB');

    // Buscar restaurantes sin el campo "location"
    const restaurants = await Restaurante.find({ location: { $exists: false } });
    console.log(`Encontrados ${restaurants.length} restaurantes sin ubicación`);

    for (const restaurant of restaurants) {
      console.log(`\nProcesando: ${restaurant.Nombre} (${restaurant['Localización']})`);

      // Construir el query para Google Places
      const textQuery = `${restaurant.Nombre} ${restaurant['Localización']}`;
      let places = [];
      try {
        const response = await axios.post(
          'https://places.googleapis.com/v1/places:searchText',
          { textQuery },
          {
            headers: {
              'Content-Type': 'application/json',
              'X-Goog-Api-Key': process.env.GOOGLE_PLACES_API_KEY,
              'X-Goog-FieldMask': 'places.displayName,places.formattedAddress,places.priceLevel,places.location'
            }
          }
        );
        // La API devuelve los resultados en response.data.places
        places = response.data.places || [];
        if (places.length === 0) {
          console.log('  -> No se encontraron resultados.');
          continue;
        }
      } catch (err) {
        console.error('  -> Error al consultar Google Places:', err.message);
        continue;
      }

      // Mostrar las opciones en la terminal
      console.log('Opciones:');
      places.forEach((place, index) => {
        const displayName = (place.displayName && place.displayName.text) || '';
        const formattedAddress = place.formattedAddress || '';
        console.log(`${index}: ${displayName} - ${formattedAddress}`);
      });

      let selectedPlace;
      
      
      // Descomenta este bloque para aplicar automáticamente la única opción disponible
      if (places.length === 1) {
        console.log('Solo se encontró una opción. Aplicándola automáticamente.');
        selectedPlace = places[0];
      } else {
        const answer = await askQuestion(`Selecciona la opción correcta para "${restaurant.Nombre}" (ingresa el número, o presiona Enter para saltar): `);
        const option = answer.trim();
        if (option === '') {
          console.log('Saltando este restaurante.');
          continue;
        }
        const selectedIndex = parseInt(option);
        if (isNaN(selectedIndex) || selectedIndex < 0 || selectedIndex >= places.length) {
          console.log('Opción inválida, saltando este restaurante.');
          continue;
        }
        selectedPlace = places[selectedIndex];
      }
      
      
      // Bloque sin la selección automática (si prefieres seleccionar manualmente, usa este)
      if (!selectedPlace) {
        const answer = await askQuestion(`Selecciona la opción correcta para "${restaurant.Nombre}" (ingresa el número, o presiona Enter para saltar): `);
        const option = answer.trim();
        if (option === '') {
          console.log('Saltando este restaurante.');
          continue;
        }
        const selectedIndex = parseInt(option);
        if (isNaN(selectedIndex) || selectedIndex < 0 || selectedIndex >= places.length) {
          console.log('Opción inválida, saltando este restaurante.');
          continue;
        }
        selectedPlace = places[selectedIndex];
      }

      // Extraer las coordenadas (formato GeoJSON: [longitud, latitud])
      let coordinates = [];
      if (
        selectedPlace.location &&
        typeof selectedPlace.location.latitude === 'number' &&
        typeof selectedPlace.location.longitude === 'number'
      ) {
        coordinates = [selectedPlace.location.longitude, selectedPlace.location.latitude];
      } else {
        console.warn('  -> No se pudieron extraer las coordenadas de la opción seleccionada.');
        continue;
      }

      const locationData = {
        type: 'Point',
        coordinates,
        place_name: selectedPlace.formattedAddress || ''
      };

      // Actualizar el documento en MongoDB
      restaurant.location = locationData;
      await restaurant.save();
      console.log(`  -> Restaurante "${restaurant.Nombre}" actualizado.`);
    }

    console.log('\nProceso completado.');
  } catch (err) {
    console.error('Error en el script:', err);
  } finally {
    mongoose.disconnect();
    rl.close();
  }
}

main();
