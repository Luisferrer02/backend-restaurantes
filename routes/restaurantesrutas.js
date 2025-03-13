// routes/restaurantesrutas.js
const express = require('express');
const mongoose = require('mongoose');
const { body, validationResult } = require('express-validator');
const Restaurante = require('../models/Restaurante');

// Importar middlewares de autenticación y autorización
const { authMiddleware, adminMiddleware } = require('../middlewares/auth');

const router = express.Router();

// --------------------------------------------------------------------
// GET: Listar todos los restaurantes con filtrado y ordenación
// Parámetros opcionales en query:
//  - visitado: 'si' para los que tienen visitas, 'no' para los que no tienen visitas
//  - sort: 'fecha', 'nombre' o 'tipo'
// Se devuelve además el número total de resultados en el campo "total"
router.get('/', async (req, res) => {
  try {
    const { visitado, sort } = req.query;
    let query = {};

    if (visitado === 'si') {
      // Restaurantes con al menos 1 visita registrada
      query.visitas = { $exists: true, $not: { $size: 0 } };
    } else if (visitado === 'no') {
      // Restaurantes sin visitas: que no tengan el campo o que esté vacío
      query.$or = [
        { visitas: { $exists: false } },
        { visitas: { $size: 0 } }
      ];
    }

    let restaurantes = await Restaurante.find(query);

    // Aplicar ordenación según el criterio seleccionado
    if (sort) {
      if (sort === 'fecha') {
        // Ordenar: si el restaurante tiene visitas se usa la fecha de la última visita;
        // si no, se ordena alfabéticamente por el nombre.
        restaurantes = restaurantes.sort((a, b) => {
          const aLastDate = (a.visitas && a.visitas.length > 0)
            ? new Date(a.visitas[a.visitas.length - 1].fecha)
            : null;
          const bLastDate = (b.visitas && b.visitas.length > 0)
            ? new Date(b.visitas[b.visitas.length - 1].fecha)
            : null;
          if (aLastDate && bLastDate) {
            return aLastDate - bLastDate;
          } else if (aLastDate && !bLastDate) {
            return -1;
          } else if (!aLastDate && bLastDate) {
            return 1;
          } else {
            return a.Nombre.localeCompare(b.Nombre);
          }
        });
      } else if (sort === 'nombre') {
        restaurantes = restaurantes.sort((a, b) =>
          a.Nombre.localeCompare(b.Nombre)
        );
      } else if (sort === 'tipo') {
        restaurantes = restaurantes.sort((a, b) =>
          a["Tipo de cocina"].localeCompare(b["Tipo de cocina"])
        );
      }
    }

    res.json({ total: restaurantes.length, restaurantes });
  } catch (err) {
    console.error('Error al obtener restaurantes:', err.message);
    res.status(500).json({ message: 'Error al obtener los restaurantes', error: err.message });
  }
});

// --------------------------------------------------------------------
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

// --------------------------------------------------------------------
// PUT: Registrar una visita con comentario a un restaurante
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

// --------------------------------------------------------------------
// POST: Crear un nuevo restaurante
// Solo pueden crear nuevos restaurantes los usuarios autenticados con rol "admin"
router.post(
  "/",
  authMiddleware,
  /*adminMiddleware,*/
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

      const nuevoRestaurante = new Restaurante({
        Nombre,
        "Tipo de cocina": TipoCocina,
        Localización,
        visitas: [],
      });
      await nuevoRestaurante.save();

      console.log("Restaurante creado exitosamente:", nuevoRestaurante);
      res.status(201).json(nuevoRestaurante);
    } catch (err) {
      console.error("Error al crear el restaurante:", err.message);
      res.status(500).json({ message: "Error interno del servidor", error: err.message });
    }
  }
);

// --------------------------------------------------------------------
// PUT: Actualizar un restaurante con validación
// Solo usuarios con rol "admin" pueden actualizar
router.put(
  '/:id',
  authMiddleware,
  adminMiddleware,
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

// --------------------------------------------------------------------
// PUT: Actualizar las visitas de un restaurante
// Solo usuarios admin pueden modificar la lista de visitas manualmente
router.put('/:id/actualizar-visitas', authMiddleware, adminMiddleware, async (req, res) => {
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

// --------------------------------------------------------------------
// DELETE: Eliminar un restaurante
// Solo usuarios admin pueden eliminar restaurantes
router.delete('/:id', authMiddleware, adminMiddleware, async (req, res) => {
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
