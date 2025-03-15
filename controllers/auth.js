// controllers/auth.js
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const User = require('../models/user');

const registerUser = async (req, res) => {
  const { username, email, password, role } = req.body;
  try {
    const newUser = new User({ username, email, password, role });
    await newUser.save();
    res.status(201).json({ message: 'Usuario registrado correctamente' });
  } catch (err) {
    res.status(500).json({ message: 'Error al registrar usuario', error: err.message });
  }
};

const loginUser = async (req, res) => {
  console.log("Login request received:", req.body);
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      console.log("Usuario no encontrado");
      return res.status(400).json({ message: 'Credenciales inválidas' });
    }
    const isMatch = await bcrypt.compare(req.body.password, user.password);
    if (!isMatch) {
      console.log("Contraseña incorrecta");
      return res.status(400).json({ message: 'Credenciales inválidas' });
    }
    const payload = { userId: user._id, role: user.role, email: user.email };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });
    console.log("Token generado:", token);
    res.json({ token });
  } catch (err) {
    console.error("Error en login:", err);
    res.status(500).json({ message: 'Error en el login', error: err.message });
  }
};

module.exports = {
  registerUser,
  loginUser
};
