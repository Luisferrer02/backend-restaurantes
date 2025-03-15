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

    const response = await axios.post(url, { textQuery }, {
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': googlePlacesApiKey,
        'X-Goog-FieldMask': fieldMask
      }
    });

    // Transformar la respuesta para obtener las coordenadas
    const places = (response.data.places || []).map((place, index) => {
      let coordinates = [];
      if (place.location && typeof place.location.latitude === 'number' && typeof place.location.longitude === 'number') {
        // Convertir a formato GeoJSON [longitud, latitud]
        coordinates = [place.location.longitude, place.location.latitude];
      }
      return {
        id: place.placeId || index,
        place_name: place.formattedAddress || (place.displayName && place.displayName.text) || "",
        priceLevel: place.priceLevel,
        geometry: { coordinates }
      };
    });
    

    res.json({ features: places });
  } catch (err) {
    console.error("Error fetching Google Places location:", err.response?.data || err.message);
    res.status(500).json({ message: "Error al obtener la localización", error: err.message });
  }
};

module.exports = { searchLocation };
