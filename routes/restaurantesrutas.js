//routes/restaurantesrutas.js

const express = require('express');
const router = express.Router();
const { body } = require('express-validator');

const {
  getPublicRestaurantes,
  getUserRestaurantes,
  getRestauranteById,
  registrarVisita,
  createRestaurante,
  updateRestaurante,
  updateVisitas,
  deleteRestaurante,
} = require('../controllers/restaurantes');

const { authMiddleware } = require('../middlewares/auth');
const {
  createRestauranteValidators,
  updateRestauranteValidators,
  visitaValidators,
} = require('../validators/restaurantes');

/* --------------------------------------------------------------------
   RUTA PÚBLICA
   NO se requiere autenticación
-------------------------------------------------------------------- */
router.get('/public', getPublicRestaurantes);

/* --------------------------------------------------------------------
   RUTA PRIVADA
   Autenticación requerida
-------------------------------------------------------------------- */
router.get('/', authMiddleware, getUserRestaurantes);

/* --------------------------------------------------------------------
   RUTAS RESTO
-------------------------------------------------------------------- */

// GET: Obtener los detalles de un restaurante por ID
router.get('/:id', getRestauranteById);

// PUT: Registrar una visita con comentario a un restaurante
router.put('/:id/visita', visitaValidators, registrarVisita);

// POST: Crear un nuevo restaurante
router.post("/", authMiddleware, createRestauranteValidators, createRestaurante);

// PUT: Actualizar un restaurante
router.put('/:id', authMiddleware, updateRestauranteValidators, updateRestaurante);

// PUT: Actualizar las visitas de un restaurante
router.put('/:id/actualizar-visitas', authMiddleware, updateVisitas);

// DELETE: Eliminar un restaurante
router.delete('/:id', authMiddleware, deleteRestaurante);

module.exports = router;
