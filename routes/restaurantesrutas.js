// routes/restaurantesrutas.js
const express = require('express');
const mongoose = require('mongoose'); // Importar mongoose
const { body, validationResult } = require('express-validator');
const Restaurante = require('../models/Restaurante');
const router = express.Router();

// Obtener todos los restaurantes
router.get('/', async (req, res) => {
  try {
    console.log('Recibiendo solicitud GET para todos los restaurantes.');
    const restaurantes = await Restaurante.find();
    console.log(`Encontrados ${restaurantes.length} restaurantes.`);
    res.json(restaurantes);
  } catch (err) {
    console.error('Error al obtener restaurantes:', err.message);
    res.status(500).json({ message: 'Error al obtener los restaurantes', error: err.message });
  }
});

// Obtener los detalles de un restaurante por ID
router.get('/:id', async (req, res) => {
  console.log(`Recibiendo solicitud GET para restaurante con ID: ${req.params.id}`);
  
  // Verificar que el ID es válido
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    console.log('ID inválido.');
    return res.status(400).json({ message: 'ID inválido' });
  }

  try {
    const restaurante = await Restaurante.findById(req.params.id);
    if (!restaurante) {
      console.log('Restaurante no encontrado.');
      return res.status(404).json({ message: 'Restaurante no encontrado' });
    }
    console.log('Restaurante encontrado:', restaurante.Nombre);
    res.json(restaurante);
  } catch (err) {
    console.error('Error al obtener el restaurante:', err.message);
    res.status(500).json({ message: 'Error al obtener el restaurante', error: err.message });
  }
});

// Registrar una visita con comentario a un restaurante
router.put(
  '/:id/visita',
  [
    body('Comentario').optional().isString().withMessage('El comentario debe ser una cadena de texto'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Errores de validación en PUT /visita:', errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    // Verificar que el ID es válido
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'ID inválido' });
    }

    try {
      const restauranteId = req.params.id;
      const comentario = req.body.Comentario || '';

      // Crear la visita con comentario
      const nuevaVisita = {
        fecha: req.body.Fecha ? new Date(req.body.Fecha) : new Date(), // Usa la fecha enviada o la actual como fallback
        comentario: comentario,
      };
      

      // Actualizar el campo visitas
      const restauranteActualizado = await Restaurante.findByIdAndUpdate(
        restauranteId,
        {
          $push: { visitas: nuevaVisita },
        },
        { new: true }
      );

      if (!restauranteActualizado) {
        console.log('Restaurante no encontrado al registrar visita.');
        return res.status(404).json({ message: 'Restaurante no encontrado' });
      }

      console.log('Visita registrada:', nuevaVisita);
      res.json(restauranteActualizado);
    } catch (err) {
      console.error('Error al registrar la visita:', err.message);
      res.status(500).json({ message: 'Error al registrar la visita', error: err.message });
    }
  }
);

// Crear un nuevo restaurante con validación
router.post(
  '/',
  [
    body('Nombre').notEmpty().withMessage('El nombre es obligatorio'),
    body('Tipo de cocina').notEmpty().withMessage('El tipo de cocina es obligatorio'),
    body('Localización').notEmpty().withMessage('La localización es obligatoria'),
    body('Coordenadas.coordinates')
      .optional()
      .isArray({ min: 2, max: 2 })
      .withMessage('Coordenadas debe ser un array de dos números [longitud, latitud]')
      .custom((value) => {
        const [lng, lat] = value;
        if (typeof lng !== 'number' || typeof lat !== 'number') {
          throw new Error('Las coordenadas deben ser números');
        }
        return true;
      }),
    body('Coordenadas.type')
      .optional()
      .equals('Point')
      .withMessage('Tipo de coordenadas debe ser "Point"'),
    body('Imagen').optional().isURL().withMessage('Imagen debe ser una URL válida'),
    body('Descripcion').optional().isString().withMessage('Descripción debe ser una cadena de texto'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Errores de validación en POST:', errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const nuevoRestaurante = new Restaurante(req.body);
      await nuevoRestaurante.save();
      console.log('Nuevo restaurante creado:', nuevoRestaurante.Nombre);
      res.status(201).json(nuevoRestaurante);
    } catch (err) {
      console.error('Error al crear el restaurante:', err.message);
      res.status(400).json({ message: 'Error al crear el restaurante', error: err.message });
    }
  }
);

// Actualizar un restaurante con validación
// Actualizar un restaurante con validación
router.put(
  '/:id',
  [
    body('Nombre').optional().notEmpty().withMessage('El nombre no puede estar vacío'),
    body('Tipo de cocina').optional().notEmpty().withMessage('El tipo de cocina no puede estar vacío'),
    body('Localización').optional().notEmpty().withMessage('La localización no puede estar vacía'),
    body('Coordenadas.coordinates')
      .optional()
      .isArray({ min: 2, max: 2 })
      .withMessage('Coordenadas debe ser un array de dos números [longitud, latitud]')
      .custom((value) => {
        const [lng, lat] = value;
        if (typeof lng !== 'number' || typeof lat !== 'number') {
          throw new Error('Las coordenadas deben ser números');
        }
        return true;
      }),
    body('Coordenadas.type')
      .optional()
      .equals('Point')
      .withMessage('Tipo de coordenadas debe ser "Point"'),
    body('Imagen').optional().isURL().withMessage('Imagen debe ser una URL válida'),
    body('Descripcion').optional().isString().withMessage('Descripción debe ser una cadena de texto'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Errores de validación en PUT:', errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    // Verificar que el ID es válido
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'ID inválido' });
    }

    try {
      const restauranteActualizado = await Restaurante.findByIdAndUpdate(req.params.id, req.body, { new: true });
      if (!restauranteActualizado) {
        console.log('Restaurante no encontrado en PUT.');
        return res.status(404).json({ message: 'Restaurante no encontrado' });
      }
      console.log('Restaurante actualizado:', restauranteActualizado.Nombre);
      res.json(restauranteActualizado);
    } catch (err) {
      console.error('Error al actualizar el restaurante:', err.message);
      res.status(400).json({ message: 'Error al actualizar el restaurante', error: err.message });
    }
  }
);

// Actualizar las visitas de un restaurante
router.put('/:id/actualizar-visitas', async (req, res) => {
  const { id } = req.params;
  const { visitas } = req.body;

  // Validar que el ID sea válido
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'ID inválido' });
  }

  try {
    // Actualizar el campo `visitas`
    const restauranteActualizado = await Restaurante.findByIdAndUpdate(
      id,
      { visitas: visitas },
      { new: true } // Devuelve el documento actualizado
    );

    if (!restauranteActualizado) {
      console.log('Restaurante no encontrado al actualizar visitas.');
      return res.status(404).json({ message: 'Restaurante no encontrado' });
    }

    console.log('Visitas actualizadas:', restauranteActualizado.visitas);
    res.json(restauranteActualizado);
  } catch (err) {
    console.error('Error al actualizar visitas:', err.message);
    res.status(500).json({ message: 'Error al actualizar visitas', error: err.message });
  }
});


// Eliminar un restaurante
router.delete('/:id', async (req, res) => {
  // Verificar que el ID es válido
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ message: 'ID inválido' });
  }

  try {
    const restaurante = await Restaurante.findByIdAndDelete(req.params.id);
    if (!restaurante) {
      console.log('Restaurante no encontrado en DELETE.');
      return res.status(404).json({ message: 'Restaurante no encontrado' });
    }
    console.log('Restaurante eliminado:', restaurante.Nombre);
    res.json({ message: 'Restaurante eliminado exitosamente' });
  } catch (err) {
    console.error('Error al eliminar restaurante:', err.message);
    res.status(500).json({ message: 'Error al eliminar el restaurante', error: err.message });
  }
});

module.exports = router;
