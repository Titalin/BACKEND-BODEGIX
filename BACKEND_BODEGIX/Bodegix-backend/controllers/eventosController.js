const Evento = require('../models/Evento');

exports.getEventos = async (req, res) => {
    try {
        const eventos = await Evento.findAll();
        res.json(eventos);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.createEvento = async (req, res) => {
    try {
        const { datos_json } = req.body;
        const evento = await Evento.create({ datos_json });
        res.status(201).json(evento);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};