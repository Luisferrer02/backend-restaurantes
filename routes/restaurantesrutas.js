// routes/restaurantesrutas.js
const express = require('express');
const mongoose = require('mongoose');
const { body, validationResult } = require('express-validator');
const Restaurante = require('../models/Restaurante');
const { authMiddleware } = require('../middlewares/auth');
const router = express.Router();

// Función auxiliar para verificar permisos de modificación/eliminación
function canModifyRestaurant(req, restaurante) {
  const userEmail = req.user.email;
  // Permite si el usuario está incluido en el array owners
  if (restaurante.owners.includes(userEmail)) return true;
  // Permite modificar la "lista principal" si el restaurante pertenece a luisferrer2002@gmail.com
  // y el usuario autenticado es luisferrer2002@gmail.com o catalinavichtortola@gmail.com
  if (
    restaurante.owners.includes('luisferrer2002@gmail.com') &&
    (userEmail === 'luisferrer2002@gmail.com' || userEmail === 'catalinavichtortola@gmail.com')
  ) {
    return true;
  }
  return false;
}

// ---------------------------
// Ruta Pública: No requiere autenticación
// Devuelve la lista de restaurantes de luisferrer2002@gmail.com
// Permite filtrar por visitado y orden
router.get('/public', async (req, res) => {
  try {
    const { visitado, sort } = req.query;
    let query = { owners: "luisferrer2002@gmail.com" };

    if (visitado === 'si') {
      // Restaurantes con al menos 1 visita registrada
      query.visitas = { $exists: true, $not: { $size: 0 } };
    } else if (visitado === 'no') {
      // Restaurantes sin visitas: incluye documentos sin campo o con array vacío
      query.$or = [
        { visitas: { $exists: false } },
        { visitas: { $size: 0 } }
      ];
    }

    let restaurantes = await Restaurante.find(query);

    // Ordenación en memoria (por fecha, nombre o tipo)
    if (sort) {
      if (sort === 'fecha') {
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
    console.error('Error en ruta pública:', err.message);
    res.status(500).json({ message: 'Error al obtener los restaurantes', error: err.message });
  }
});

// ---------------------------
// Rutas protegidas: Requieren autenticación

// GET: Listar restaurantes para el usuario autenticado
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { visitado, sort, owner } = req.query;
    let query = {};

    // Si se especifica owner en query, se usará ese email, sino el del usuario autenticado
    const ownerEmail = owner ? owner : req.user.email;
    query.owners = ownerEmail;

    if (visitado === 'si') {
      query.visitas = { $exists: true, $not: { $size: 0 } };
    } else if (visitado === 'no') {
      query.$or = [
        { visitas: { $exists: false } },
        { visitas: { $size: 0 } }
      ];
    }

    let restaurantes = await Restaurante.find(query);

    if (sort) {
      if (sort === 'fecha') {
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
      const owner = req.user.email;
      const nuevoRestaurante = new Restaurante({
        Nombre,
        "Tipo de cocina": TipoCocina,
        Localización,
        visitas: [],
        owners: [owner]
      });
      await nuevoRestaurante.save();
      res.status(201).json(nuevoRestaurante);
    } catch (err) {
      console.error("Error al crear el restaurante:", err.message);
      res.status(500).json({ message: "Error interno del servidor", error: err.message });
    }
  }
);

// PUT: Actualizar un restaurante
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
      const restaurante = await Restaurante.findById(req.params.id);
      if (!restaurante) {
        return res.status(404).json({ message: 'Restaurante no encontrado' });
      }
      if (!canModifyRestaurant(req, restaurante)) {
        return res.status(403).json({ message: 'No tienes permisos para modificar este restaurante' });
      }
      const restauranteActualizado = await Restaurante.findByIdAndUpdate(req.params.id, req.body, { new: true });
      res.json(restauranteActualizado);
    } catch (err) {
      console.error('Error al actualizar el restaurante:', err.message);
      res.status(400).json({ message: 'Error al actualizar el restaurante', error: err.message });
    }
  }
);

// PUT: Actualizar visitas
router.put('/:id/actualizar-visitas', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { visitas } = req.body;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'ID inválido' });
  }
  try {
    const restaurante = await Restaurante.findById(id);
    if (!restaurante) {
      return res.status(404).json({ message: 'Restaurante no encontrado' });
    }
    if (!canModifyRestaurant(req, restaurante)) {
      return res.status(403).json({ message: 'No tienes permisos para modificar las visitas de este restaurante' });
    }
    const restauranteActualizado = await Restaurante.findByIdAndUpdate(
      id,
      { visitas: visitas },
      { new: true }
    );
    res.json(restauranteActualizado);
  } catch (err) {
    console.error('Error al actualizar visitas:', err.message);
    res.status(500).json({ message: 'Error al actualizar visitas', error: err.message });
  }
});

// DELETE: Eliminar un restaurante
router.delete('/:id', authMiddleware, async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ message: 'ID inválido' });
  }
  try {
    const restaurante = await Restaurante.findById(req.params.id);
    if (!restaurante) {
      return res.status(404).json({ message: 'Restaurante no encontrado' });
    }
    if (!canModifyRestaurant(req, restaurante)) {
      return res.status(403).json({ message: 'No tienes permisos para eliminar este restaurante' });
    }
    const restauranteEliminado = await Restaurante.findByIdAndDelete(req.params.id);
    res.json({ message: 'Restaurante eliminado exitosamente' });
  } catch (err) {
    console.error('Error al eliminar restaurante:', err.message);
    res.status(500).json({ message: 'Error al eliminar el restaurante', error: err.message });
  }
});

module.exports = router;
