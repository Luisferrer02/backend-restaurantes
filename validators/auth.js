// validators/auth.js
const { body } = require('express-validator');

const registerValidators = [
  body('username').notEmpty().withMessage('El username es obligatorio'),
  body('email').isEmail().withMessage('Email inválido'),
  body('password').notEmpty().withMessage('La contraseña es obligatoria'),
  body('role')
    .optional()
    .isIn(['admin', 'user'])
    .withMessage('El rol debe ser "admin" o "user"'),
];

const loginValidators = [
  body('email').isEmail().withMessage('Email inválido'),
  body('password').notEmpty().withMessage('La contraseña es obligatoria'),
];

module.exports = {
  registerValidators,
  loginValidators
};
