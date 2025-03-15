// routes/auth.js
const express = require('express');
const router = express.Router();
const { validationResult } = require('express-validator');

const { registerUser, loginUser } = require('../controllers/auth');
const { registerValidators, loginValidators } = require('../validators/auth');

// Registro de usuario
router.post('/register', registerValidators, (req, res) => {
  // Verifica si hay errores de validación
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  // Si no hay errores, llama al controlador
  registerUser(req, res);
});

// Login de usuario
router.post('/login', loginValidators, (req, res) => {
  // Verifica si hay errores de validación
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  // Si no hay errores, llama al controlador
  loginUser(req, res);
});

module.exports = router;
