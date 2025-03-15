//controllers/restaurantes.js

const mongoose = require("mongoose");
const { validationResult } = require("express-validator");
const Restaurante = require("../models/restaurante");
const getPublicRestaurantes = async (req, res) => {
  try {
    // Filtra restaurantes públicos (owners: "luisferrer2002@gmail.com")
    const restaurantes = await Restaurante.find({
      owners: "luisferrer2002@gmail.com",
    });
    res.json({ total: restaurantes.length, restaurantes });
  } catch (err) {
    console.error("Error fetching public restaurants:", err);
    res.status(500).json({ message: "Error al obtener restaurantes públicos" });
  }
};

const getUserRestaurantes = async (req, res) => {
  try {
    console.log("User from token:", req.user);
    const query = { owners: req.user.email };

    // Si se envía el parámetro 'visitado'
    if (req.query.visitado === "si") {
      // Solo restaurantes que tengan visitas
      query.visitas = { $exists: true, $not: { $size: 0 } };
    } else if (req.query.visitado === "no") {
      // Restaurantes sin visitas
      query.$or = [{ visitas: { $exists: false } }, { visitas: { $size: 0 } }];
    }

    const restaurantes = await Restaurante.find(query);
    console.log(`Found ${restaurantes.length} restaurants for user`);
    res.json({ total: restaurantes.length, restaurantes });
  } catch (err) {
    console.error("Error fetching user restaurants:", err);
    res
      .status(500)
      .json({ message: "Error al obtener restaurantes", error: err.message });
  }
};

const getRestauranteById = async (req, res) => {
  console.log(
    `Recibiendo solicitud GET para restaurante con ID: ${req.params.id}`
  );
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    console.log("ID inválido.");
    return res.status(400).json({ message: "ID inválido" });
  }
  try {
    const restaurante = await Restaurante.findById(req.params.id);
    if (!restaurante) {
      console.log("Restaurante no encontrado.");
      return res.status(404).json({ message: "Restaurante no encontrado" });
    }
    console.log("Restaurante encontrado:", restaurante.Nombre);
    res.json(restaurante);
  } catch (err) {
    console.error("Error al obtener el restaurante:", err.message);
    res
      .status(500)
      .json({ message: "Error al obtener el restaurante", error: err.message });
  }
};

const registrarVisita = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log("Errores de validación en PUT /visita:", errors.array());
    return res.status(400).json({ errors: errors.array() });
  }
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ message: "ID inválido" });
  }
  try {
    const comentario = req.body.Comentario || "";
    const nuevaVisita = {
      fecha: req.body.Fecha ? new Date(req.body.Fecha) : new Date(),
      comentario: comentario,
    };
    const restauranteActualizado = await Restaurante.findByIdAndUpdate(
      req.params.id,
      { $push: { visitas: nuevaVisita } },
      { new: true }
    );
    if (!restauranteActualizado) {
      console.log("Restaurante no encontrado al registrar visita.");
      return res.status(404).json({ message: "Restaurante no encontrado" });
    }
    console.log("Visita registrada:", nuevaVisita);
    res.json(restauranteActualizado);
  } catch (err) {
    console.error("Error al registrar la visita:", err.message);
    res
      .status(500)
      .json({ message: "Error al registrar la visita", error: err.message });
  }
};

const createRestaurante = async (req, res) => {
  console.log("Contenido de req.body:", req.body);

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  try {
    const {
      Nombre,
      "Tipo de cocina": TipoCocina,
      Localización,
      location,
    } = req.body;
    const ownerEmail = req.user.email;

    // Validar si se proporcionó location y contiene coordenadas válidas
    let locationData;
    if (
      location &&
      Array.isArray(location.coordinates) &&
      location.coordinates.length === 2 &&
      typeof location.coordinates[0] === "number" &&
      typeof location.coordinates[1] === "number"
    ) {
      locationData = {
        type: "Point",
        coordinates: location.coordinates,
        place_name: location.place_name || "",
      };
    } else {
      console.warn("Objeto location inválido o incompleto:", location);
    }

    let nuevoRestaurante;
    if (
      ownerEmail === "luisferrer2002@gmail.com" ||
      ownerEmail === "catalinavichtortola@gmail.com"
    ) {
      nuevoRestaurante = new Restaurante({
        Nombre,
        "Tipo de cocina": TipoCocina,
        Localización,
        visitas: [],
        owners: ["luisferrer2002@gmail.com", "catalinavichtortola@gmail.com"],
        // Solo asignamos location si locationData tiene datos válidos
        ...(locationData ? { location: locationData } : {}),
      });
    } else {
      nuevoRestaurante = new Restaurante({
        Nombre,
        "Tipo de cocina": TipoCocina,
        Localización,
        visitas: [],
        owners: [ownerEmail],
        ...(locationData ? { location: locationData } : {}),
      });
    }
    await nuevoRestaurante.save();
    console.log("Restaurante creado exitosamente:", nuevoRestaurante);
    res.status(201).json(nuevoRestaurante);
  } catch (err) {
    console.error("Error al crear el restaurante:", err.message);
    res
      .status(500)
      .json({ message: "Error interno del servidor", error: err.message });
  }
};

const updateRestaurante = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ message: "ID inválido" });
  }
  try {
    const restauranteActualizado = await Restaurante.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!restauranteActualizado) {
      console.log("Restaurante no encontrado en PUT.");
      return res.status(404).json({ message: "Restaurante no encontrado" });
    }
    console.log("Restaurante actualizado:", restauranteActualizado.Nombre);
    res.json(restauranteActualizado);
  } catch (err) {
    console.error("Error al actualizar el restaurante:", err.message);
    res
      .status(400)
      .json({
        message: "Error al actualizar el restaurante",
        error: err.message,
      });
  }
};

const updateVisitas = async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ message: "ID inválido" });
  }
  try {
    const { visitas } = req.body;
    const restauranteActualizado = await Restaurante.findByIdAndUpdate(
      req.params.id,
      { visitas: visitas },
      { new: true }
    );
    if (!restauranteActualizado) {
      console.log("Restaurante no encontrado al actualizar visitas.");
      return res.status(404).json({ message: "Restaurante no encontrado" });
    }
    console.log("Visitas actualizadas:", restauranteActualizado.visitas);
    res.json(restauranteActualizado);
  } catch (err) {
    console.error("Error al actualizar visitas:", err.message);
    res
      .status(500)
      .json({ message: "Error al actualizar visitas", error: err.message });
  }
};

const deleteRestaurante = async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ message: "ID inválido" });
  }
  try {
    const restaurante = await Restaurante.findByIdAndDelete(req.params.id);
    if (!restaurante) {
      return res.status(404).json({ message: "Restaurante no encontrado" });
    }
    console.log("Restaurante eliminado:", restaurante.Nombre);
    res.json({ message: "Restaurante eliminado exitosamente" });
  } catch (err) {
    console.error("Error al eliminar restaurante:", err.message);
    res
      .status(500)
      .json({
        message: "Error al eliminar el restaurante",
        error: err.message,
      });
  }
};

module.exports = {
  getPublicRestaurantes,
  getUserRestaurantes,
  getRestauranteById,
  registrarVisita,
  createRestaurante,
  updateRestaurante,
  updateVisitas,
  deleteRestaurante,
};
