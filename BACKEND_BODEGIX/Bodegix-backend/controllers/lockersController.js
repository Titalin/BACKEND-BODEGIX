const Locker = require('../models/Locker');
const { Usuario } = require('../models');
const { UniqueConstraintError } = require('sequelize');

exports.getLockers = async (req, res) => {
  try {
    const lockers = await Locker.findAll({ include: ['empresa'] });
    res.json(lockers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createLocker = async (req, res) => {
  const {
    ubicacion,
    estado = 'activo',
    tipo = 'no_perecederos',
    empresa_id,
    usuario_id = null,
    temp_min = null,
    temp_max = null,
    hum_min = null,
    hum_max = null,
    peso_max = null
  } = req.body;

  const sequelize = Locker.sequelize;

  try {
    const result = await sequelize.transaction(async (t) => {
      const [rows] = await sequelize.query(
        `
          SELECT COALESCE(MAX(CAST(identificador AS UNSIGNED)), 0) AS max_n
          FROM lockers
          WHERE empresa_id = ?
        `,
        { replacements: [empresa_id], transaction: t }
      );

      const maxN = rows?.[0]?.max_n ?? 0;
      const siguienteN = Number(maxN) + 1;
      const identificador = String(siguienteN).padStart(3, '0');

      const locker = await Locker.create({
        identificador,
        ubicacion,
        estado,
        tipo,
        empresa_id,
        usuario_id,
        temp_min,
        temp_max,
        hum_min,
        hum_max,
        peso_max
      }, { transaction: t });

      return locker;
    });

    return res.status(201).json(result);
  } catch (error) {
    if (error instanceof UniqueConstraintError) {
      try {
        const retry = await Locker.sequelize.transaction(async (t) => {
          const [rows] = await Locker.sequelize.query(
            `
              SELECT COALESCE(MAX(CAST(identificador AS UNSIGNED)), 0) AS max_n
              FROM lockers
              WHERE empresa_id = ?
            `,
            { replacements: [req.body.empresa_id], transaction: t }
          );
          const maxN = rows?.[0]?.max_n ?? 0;
          const siguienteN = Number(maxN) + 1;
          const identificador = String(siguienteN).padStart(3, '0');

          const locker = await Locker.create({
            identificador,
            ubicacion,
            estado,
            tipo,
            empresa_id,
            usuario_id,
            temp_min,
            temp_max,
            hum_min,
            hum_max,
            peso_max
          }, { transaction: t });

          return locker;
        });

        return res.status(201).json(retry);
      } catch (e2) {
        return res.status(500).json({ error: e2.message });
      }
    }
    return res.status(500).json({ error: error.message });
  }
};

exports.updateLocker = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      // OJO: NO permitimos cambiar 'identificador' desde el body
      ubicacion,
      estado,
      tipo,
      empresa_id,
      usuario_id,
      temp_min,
      temp_max,
      hum_min,
      hum_max,
      peso_max
    } = req.body;

    const [updated] = await Locker.update({
      ubicacion,
      estado,
      tipo,
      empresa_id,
      usuario_id,
      temp_min,
      temp_max,
      hum_min,
      hum_max,
      peso_max
    }, {
      where: { id }
    });

    if (!updated) {
      return res.status(404).json({ error: 'Locker no encontrado' });
    }

    const updatedLocker = await Locker.findByPk(id);
    res.json(updatedLocker);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteLocker = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Locker.destroy({ where: { id } });
    if (!deleted) {
      return res.status(404).json({ error: 'Locker no encontrado' });
    }
    res.json({ message: 'Locker eliminado correctamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getLockersPorUsuario = async (req, res) => {
  try {
    const usuarioId = req.params.id;

    const usuario = await Usuario.findByPk(usuarioId);
    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const lockers = await Locker.findAll({
      where: {
        empresa_id: usuario.empresa_id,
        usuario_id: usuarioId,   // <- aquí filtramos por el dueño
        estado: 'activo',        // <- opcional
      },
      include: ['empresa'],
    });

    res.json(lockers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


exports.getLockerById = async (req, res) => {
  try {
    const locker = await Locker.findByPk(req.params.id);
    if (!locker) {
      return res.status(404).json({ error: 'Locker no encontrado' });
    }
    res.json(locker);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getLockersPorEmpresa = async (req, res) => {
  try {
    const { empresa_id } = req.params;
    const lockers = await Locker.findAll({
      where: { empresa_id },
      include: ['empresa']
    });
    res.json(lockers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
