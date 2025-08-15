const Empresa = require('../models/Empresa');

// ✅ GET /api/empresas
exports.getEmpresas = async (req, res) => {
    try {
        const empresas = await Empresa.findAll();
        res.json(empresas);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// ✅ GET /api/empresas/:id
exports.getEmpresaById = async (req, res) => {
    try {
        const { id } = req.params;
        const empresa = await Empresa.findByPk(id);

        if (!empresa) {
            return res.status(404).json({ error: 'Empresa no encontrada' });
        }

        res.json(empresa);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// ✅ POST /api/empresas
exports.createEmpresa = async (req, res) => {
    try {
        const { nombre, telefono, direccion } = req.body;

        if (!nombre) {
            return res.status(400).json({ error: 'El nombre es obligatorio' });
        }

        const empresaExistente = await Empresa.findOne({ where: { nombre } });
        if (empresaExistente) {
            return res.status(409).json({ error: 'La empresa ya está registrada' });
        }

        const empresa = await Empresa.create({ nombre, telefono, direccion });
        res.status(201).json(empresa);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// ✅ PUT /api/empresas/:id
exports.updateEmpresa = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, telefono, direccion } = req.body;

        const empresa = await Empresa.findByPk(id);
        if (!empresa) {
            return res.status(404).json({ error: 'Empresa no encontrada' });
        }

        if (nombre) empresa.nombre = nombre;
        if (telefono) empresa.telefono = telefono;
        if (direccion) empresa.direccion = direccion;

        await empresa.save();
        res.json(empresa);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// ✅ DELETE /api/empresas/:id
exports.deleteEmpresa = async (req, res) => {
    try {
        const { id } = req.params;

        const empresa = await Empresa.findByPk(id);
        if (!empresa) {
            return res.status(404).json({ error: 'Empresa no encontrada' });
        }

        await empresa.destroy();
        res.json({ message: 'Empresa eliminada correctamente' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
