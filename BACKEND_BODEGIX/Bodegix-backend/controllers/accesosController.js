const Acceso = require('../models/Acceso');

exports.getAccesos = async (req, res) => {
    try {
        const accesos = await Acceso.findAll({ include: ['usuario'] });
        res.json(accesos);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.createAcceso = async (req, res) => {
    try {
        const { usuario_id, fecha, accion } = req.body;
        const acceso = await Acceso.create({ usuario_id, fecha, accion });
        res.status(201).json(acceso);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};