// controllers/eventosSensoresController.js

const EventoSensor = require('../models/EventoSensor');

exports.getEventos = async (req, res) => {
  try {
    const eventos = await EventoSensor.find().sort({ fecha: -1 });
    res.json(eventos);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener los eventos' });
  }
};

exports.createEvento = async (req, res) => {
  try {
    const { lockerId, temperatura, humedad, peso } = req.body;

    const nuevoEvento = new EventoSensor({ lockerId, temperatura, humedad, peso });
    await nuevoEvento.save();

    res.status(201).json(nuevoEvento);
  } catch (error) {
    res.status(500).json({ error: 'Error al crear el evento' });
  }
};
