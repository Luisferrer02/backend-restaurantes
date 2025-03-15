const axios = require('axios');
const googlePlacesApiKey = process.env.GOOGLE_PLACES_API_KEY;

const searchLocation = async (req, res) => {
  try {
    const { textQuery } = req.body;
    if (!textQuery) {
      return res.status(400).json({ message: "El campo 'textQuery' es obligatorio" });
    }

    const url = 'https://places.googleapis.com/v1/places:searchText';
    const fieldMask = 'places.displayName,places.formattedAddress,places.priceLevel,places.location';

    // Llamada a la API de Google Places
    const response = await axios.post(url, { textQuery }, {
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': googlePlacesApiKey,
        'X-Goog-FieldMask': fieldMask
      }
    });

    console.log("Response from Google Places API:", JSON.stringify(response.data, null, 2));
    const rawPlaces = response.data.places || [];
    console.log(`Se recibieron ${rawPlaces.length} resultados para la query: "${textQuery}"`);

    // Transformamos los resultados asegurándonos de que cada uno tenga coordenadas válidas
    const places = rawPlaces.map((place, index) => {
      if (!place.location) {
        console.error(`Fallo insalvable: El lugar en el índice ${index} no tiene campo 'location'.`);
        throw new Error(`Fallo insalvable: La API no devolvió el campo 'location' para el resultado ${index}.`);
      }
      if (typeof place.location.latitude !== 'number' || typeof place.location.longitude !== 'number') {
        console.error(`Fallo insalvable: Coordenadas inválidas en el lugar en el índice ${index}:`, place.location);
        throw new Error(`Fallo insalvable: La API devolvió coordenadas inválidas para el resultado ${index}.`);
      }
      const coordinates = [place.location.longitude, place.location.latitude]; // Formato GeoJSON: [lng, lat]
      console.log(`Lugar ${index}: "${place.displayName?.text || place.formattedAddress}" con coordenadas ${JSON.stringify(coordinates)}`);
      return {
        id: place.placeId || index,
        place_name: place.formattedAddress || (place.displayName && place.displayName.text) || "",
        priceLevel: place.priceLevel,
        geometry: { coordinates }
      };
    });

    // Si todo está correcto, respondemos con los resultados transformados
    res.json({ features: places });
  } catch (err) {
    console.error("Error fatal al obtener la localización:", err.response?.data || err.message);
    res.status(500).json({ message: "Error fatal al obtener la localización: " + err.message });
  }
};

module.exports = { searchLocation };
