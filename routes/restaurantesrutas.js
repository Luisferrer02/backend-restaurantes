const express = require('express');
const mongoose = require('mongoose');
const { body, validationResult } = require('express-validator');
const Restaurante = require('../models/Restaurante');
const { authMiddleware, adminMiddleware } = require('../middlewares/auth');

const router = express.Router();

/* --------------------------------------------------------------------
   RUTA PÚBLICA
   NO se requiere autenticación
-------------------------------------------------------------------- */
router.get('/public', async (req, res) => {
  try {
    // Filter for public restaurants (owned by luisferrer2002@gmail.com)
    const restaurantes = await Restaurante.find({ owners: "luisferrer2002@gmail.com" });
    res.json({ total: restaurantes.length, restaurantes });
  } catch (err) {
    console.error('Error fetching public restaurants:', err);
    res.status(500).json({ message: 'Error al obtener restaurantes públicos' });
  }
});

/* --------------------------------------------------------------------
   RUTA PRIVADA
   Autenticación requerida
-------------------------------------------------------------------- */
router.get('/', authMiddleware, async (req, res) => {
  try {
    // Log for debugging
    console.log('User from token:', req.user);
    
    // Get user-specific restaurants using the email from the token
    const userId = req.user.userId;
    console.log('Looking for restaurants with owner ID:', userId);
    
    // Debug: total restaurant count
    const allCount = await Restaurante.countDocuments();
    console.log(`Total restaurant count: ${allCount}`);
    
    // Query for user's restaurants (assuming owners contains the user's email)
    const restaurantes = await Restaurante.find({ owners: req.user.email });
    console.log(`Found ${restaurantes.length} restaurants for user`);
    
    res.json({ total: restaurantes.length, restaurantes });
  } catch (err) {
    console.error('Error fetching user restaurants:', err);
    res.status(500).json({ message: 'Error al obtener restaurantes', error: err.message });
  }
});

/* --------------------------------------------------------------------
   RUTAS RESTO (sin cambios)
-------------------------------------------------------------------- */

// GET: Obtener los detalles de un restaurante por ID
router.get('/:id', async (req, res) => {
  console.log(`Recibiendo solicitud GET para restaurante con ID: ${req.params.id}`);
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

// PUT: Registrar una visita con comentario a un restaurante
router.put(
  '/:id/visita',
  [body('Comentario').optional().isString().withMessage('El comentario debe ser una cadena de texto')],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Errores de validación en PUT /visita:', errors.array());
      return res.status(400).json({ errors: errors.array() });
    }
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'ID inválido' });
    }
    try {
      const restauranteId = req.params.id;
      const comentario = req.body.Comentario || '';
      const nuevaVisita = {
        fecha: req.body.Fecha ? new Date(req.body.Fecha) : new Date(),
        comentario: comentario,
      };
      const restauranteActualizado = await Restaurante.findByIdAndUpdate(
        restauranteId,
        { $push: { visitas: nuevaVisita } },
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

// POST: Crear un nuevo restaurante
router.post(
  "/",
  authMiddleware,
  [
    body("Nombre").notEmpty().withMessage("El nombre es obligatorio"),
    body("Tipo de cocina").notEmpty().withMessage("El tipo de cocina es obligatorio"),
    body("Localización").notEmpty().withMessage("La localización es obligatoria"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const { Nombre, "Tipo de cocina": TipoCocina, Localización } = req.body;
      // Retrieve the email of the user from the token
      const ownerEmail = req.user.email;
      let nuevoRestaurante;
      if (ownerEmail === "luisferrer2002@gmail.com" || ownerEmail === "catalinavichtortola@gmail.com") {
        nuevoRestaurante = new Restaurante({
          Nombre,
          "Tipo de cocina": TipoCocina,
          Localización,
          visitas: [],
          owners: ["luisferrer2002@gmail.com", "catalinavichtortola@gmail.com"]
        });
      }
      else{
        nuevoRestaurante = new Restaurante({
          Nombre,
          "Tipo de cocina": TipoCocina,
          Localización,
          visitas: [],
          owners: [ownerEmail]
        });
      }
      await nuevoRestaurante.save();
      console.log("Restaurante creado exitosamente:", nuevoRestaurante);
      res.status(201).json(nuevoRestaurante);
    } catch (err) {
      console.error("Error al crear el restaurante:", err.message);
      res.status(500).json({ message: "Error interno del servidor", error: err.message });
    }
  }
);

// PUT: Actualizar un restaurante (solo para usuarios con rol admin)
router.put(
  '/:id',
  authMiddleware,
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
      return res.status(400).json({ errors: errors.array() });
    }
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

// PUT: Actualizar las visitas de un restaurante (solo para admin)
router.put('/:id/actualizar-visitas', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { visitas } = req.body;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'ID inválido' });
  }
  try {
    const restauranteActualizado = await Restaurante.findByIdAndUpdate(
      id,
      { visitas: visitas },
      { new: true }
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

// DELETE: Eliminar un restaurante (solo para admin)
router.delete('/:id', authMiddleware, async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ message: 'ID inválido' });
  }
  try {
    const restaurante = await Restaurante.findByIdAndDelete(req.params.id);
    if (!restaurante) {
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
