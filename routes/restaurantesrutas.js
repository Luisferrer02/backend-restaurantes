const express = require('express');
const Restaurante = require('../models/Restaurante');
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const restaurantes = await Restaurante.find();
    console.log('Datos encontrados:', restaurantes); // Añade este log
    res.json(restaurantes);
  } catch (err) {
    res.status(500).json({ message: 'Error al obtener los restaurantes', error: err.message });
  }
});

// Crear un nuevo restaurante
router.post('/', async (req, res) => {
  try {
    const nuevoRestaurante = new Restaurante(req.body);
    await nuevoRestaurante.save();
    res.status(201).json(nuevoRestaurante);
  } catch (err) {
    res.status(400).json({ message: 'Error al crear el restaurante', error: err.message });
  }
});

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

module.exports = router;
