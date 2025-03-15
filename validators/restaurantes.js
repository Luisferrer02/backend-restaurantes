//validators/restaurantes.js

const { body } = require('express-validator');

const createRestauranteValidators = [
    body("Nombre").notEmpty().withMessage("El nombre es obligatorio"),
    body("Tipo de cocina").notEmpty().withMessage("El tipo de cocina es obligatorio"),
    body("Localización").notEmpty().withMessage("La localización es obligatoria"),
    // El campo 'location' es opcional, pero si se envía, se valida que tenga 'coordinates' y 'place_name'
    body("location").optional().custom((value) => {
      if (typeof value !== 'object' || !value.coordinates || !value.place_name) {
        throw new Error("El campo location debe ser un objeto con 'coordinates' y 'place_name'");
      }
      return true;
    }),
  ];

const updateRestauranteValidators = [
  body("Nombre")
    .optional()
    .notEmpty()
    .withMessage("El nombre no puede estar vacío"),
  body("Tipo de cocina")
    .optional()
    .notEmpty()
    .withMessage("El tipo de cocina no puede estar vacío"),
  body("Localización")
    .optional()
    .notEmpty()
    .withMessage("La localización no puede estar vacía"),
  body("Coordenadas.coordinates")
    .optional()
    .isArray({ min: 2, max: 2 })
    .withMessage("Coordenadas debe ser un array de dos números [longitud, latitud]")
    .custom((value) => {
      const [lng, lat] = value;
      if (typeof lng !== 'number' || typeof lat !== 'number') {
        throw new Error("Las coordenadas deben ser números");
      }
      return true;
    }),
  body("Coordenadas.type")
    .optional()
    .equals("Point")
    .withMessage('Tipo de coordenadas debe ser "Point"'),
  body("Imagen")
    .optional()
    .isURL()
    .withMessage("Imagen debe ser una URL válida"),
  body("Descripcion")
    .optional()
    .isString()
    .withMessage("Descripción debe ser una cadena de texto"),
];

const visitaValidators = [
  body("Comentario")
    .optional()
    .isString()
    .withMessage("El comentario debe ser una cadena de texto"),
];

module.exports = {
  createRestauranteValidators,
  updateRestauranteValidators,
  visitaValidators,
};
