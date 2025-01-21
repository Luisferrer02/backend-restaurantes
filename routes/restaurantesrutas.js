const express = require('express');
const Restaurante = require('../models/Restaurante');
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const restaurantes = await Restaurante.find();
    //console.log('Restaurantes encontrados:', restaurantes); // Agrega este log
    res.json(restaurantes);
  } catch (err) {
    console.error('Error al obtener restaurantes:', err.message);
    res.status(500).json({ message: 'Error al obtener los restaurantes', error: err.message });
  }
});

router.put('/:id/visita', async (req, res) => {
  try {
    const restauranteId = req.params.id;

    // Obtener la fecha actual o recibirla desde el frontend
    const nuevaFecha = new Date();

    // Actualizar el campo fechasVisita agregando la nueva fecha
    const restauranteActualizado = await Restaurante.findByIdAndUpdate(
      restauranteId,
      { $push: { fechasVisita: nuevaFecha } },
      { new: true } // Para devolver el documento actualizado
    );

    if (!restauranteActualizado) {
      return res.status(404).json({ message: 'Restaurante no encontrado' });
    }

    res.json(restauranteActualizado);
  } catch (err) {
    console.error('Error al registrar la visita:', err.message);
    res.status(500).json({ message: 'Error al registrar la visita', error: err.message });
  }
});


const { body, validationResult } = require('express-validator');

router.post(
  '/',
  [
    body('Nombre').notEmpty().withMessage('El nombre es obligatorio'),
    body('Tipo de cocina').notEmpty().withMessage('El tipo de cocina es obligatorio'),
    body('Localización').notEmpty().withMessage('La localización es obligatoria'),
    // Puedes agregar más validaciones según tus necesidades
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const nuevoRestaurante = new Restaurante(req.body);
      await nuevoRestaurante.save();
      res.status(201).json(nuevoRestaurante);
    } catch (err) {
      res.status(400).json({ message: 'Error al crear el restaurante', error: err.message });
    }
  }
);

// Actualizar un restaurante
router.put('/:id', async (req, res) => {
  try {
    const restauranteActualizado = await Restaurante.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(restauranteActualizado);
  } catch (err) {
    res.status(400).json({ message: 'Error al actualizar el restaurante', error: err.message });
  }
});

// Eliminar un restaurante
router.delete('/:id', async (req, res) => {
  try {
    await Restaurante.findByIdAndDelete(req.params.id);
    res.json({ message: 'Restaurante eliminado exitosamente' });
  } catch (err) {
    res.status(500).json({ message: 'Error al eliminar el restaurante', error: err.message });
  }
});


// Obtener los detalles de un restaurante por ID
router.get('/:id', async (req, res) => {
  try {
    const restaurante = await Restaurante.findById(req.params.id);
    if (!restaurante) {
      return res.status(404).json({ message: 'Restaurante no encontrado' });
    }
    res.json(restaurante);
  } catch (err) {
    res.status(500).json({ message: 'Error al obtener el restaurante', error: err.message });
  }
});

module.exports = router;
