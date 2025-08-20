const Suscripcion = require('../models/Suscripcion');
const db = require('../config/db');

// GET /api/suscripciones
exports.getSuscripciones = async (req, res) => {
  try {
    const suscripciones = await Suscripcion.findAll({
      include: ['empresa', 'plan']
    });
    res.json(suscripciones);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET /api/suscripciones/:id
exports.getSuscripcionById = async (req, res) => {
  try {
    const { id } = req.params;
    const suscripcion = await Suscripcion.findByPk(id, {
      include: ['empresa', 'plan']
    });

    if (!suscripcion) {
      return res.status(404).json({ error: 'Suscripción no encontrada' });
    }

    res.json(suscripcion);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// POST /api/suscripciones
exports.createSuscripcion = async (req, res) => {
  const t = await db.transaction();
  try {
    const { empresa_id, plan_id, fecha_inicio, fecha_fin, estado } = req.body;

    if (!empresa_id || !fecha_inicio || !fecha_fin || !estado) {
      return res.status(400).json({ error: 'Faltan campos obligatorios' });
    }

    // Crear la suscripción con el estado recibido
    const [result] = await db.query(
      `INSERT INTO suscripciones (empresa_id, plan_id, fecha_inicio, fecha_fin, estado)
       VALUES (?, ?, ?, ?, ?)`,
      [empresa_id, plan_id, fecha_inicio, fecha_fin, estado],
      { transaction: t }
    );

    const suscripcionId = result.insertId;

    // Si viene activa, activamos con SP seguro
    if (estado === 'activa') {
      await db.query(
        `CALL sp_activar_suscripcion_segura(?)`,
        [suscripcionId],
        { transaction: t }
      );
    }

    await t.commit();

    // Recuperamos la suscripción ya ajustada
    const [rows] = await db.query(
      `SELECT * FROM suscripciones WHERE id = ?`,
      [suscripcionId]
    );

    return res.status(201).json(rows[0]);
  } catch (error) {
    await t.rollback();
    console.error('Error en createSuscripcion:', error.message);
    res.status(500).json({ error: error.message });
  }
};


// PUT /api/suscripciones/:id
exports.updateSuscripcion = async (req, res) => {
  try {
    const { id } = req.params;
    const { empresa_id, plan_id, fecha_inicio, fecha_fin, estado } = req.body;

    const suscripcion = await Suscripcion.findByPk(id);
    if (!suscripcion) {
      return res.status(404).json({ error: 'Suscripción no encontrada' });
    }

    if (empresa_id !== undefined) suscripcion.empresa_id = empresa_id;
    if (plan_id !== undefined) suscripcion.plan_id = plan_id;
    if (fecha_inicio !== undefined) suscripcion.fecha_inicio = fecha_inicio;
    if (fecha_fin !== undefined) suscripcion.fecha_fin = fecha_fin;
    if (estado !== undefined) suscripcion.estado = estado;

    await suscripcion.save();
    res.json(suscripcion);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// DELETE /api/suscripciones/:id
exports.deleteSuscripcion = async (req, res) => {
  try {
    const { id } = req.params;

    const suscripcion = await Suscripcion.findByPk(id);
    if (!suscripcion) {
      return res.status(404).json({ error: 'Suscripción no encontrada' });
    }

    await suscripcion.destroy();
    res.json({ message: 'Suscripción eliminada correctamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET /api/suscripciones/reporte
exports.getReporteSuscripciones = async (req, res) => {
  try {
    const { mes, anio } = req.query;

    if (!mes || !anio) {
      return res.status(400).json({ error: 'Debe enviar mes y año' });
    }

    const [results] = await db.query(`
      SELECT 
        e.nombre AS empresa,
        p.nombre AS plan,
        CAST(p.costo AS DECIMAL(10,2)) AS costo,
        COUNT(s.id) AS total_suscripciones,
        CAST(SUM(p.costo) AS DECIMAL(10,2)) AS total_ingresos
      FROM suscripciones s
      JOIN empresas e ON s.empresa_id = e.id
      JOIN planes p ON s.plan_id = p.id
      WHERE MONTH(s.fecha_inicio) = ? AND YEAR(s.fecha_inicio) = ?
      GROUP BY e.nombre, p.nombre, p.costo
      ORDER BY total_ingresos DESC
    `, [mes, anio]);

    const parsedResults = results.map(row => ({
      ...row,
      costo: Number(row.costo),
      total_suscripciones: Number(row.total_suscripciones),
      total_ingresos: Number(row.total_ingresos)
    }));

    res.json(parsedResults);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener el reporte' });
  }
};

// GET /api/suscripciones/status?empresa_id=123
exports.getEstadoEmpresa = async (req, res) => {
  try {
    const empresa_id = Number(req.query.empresa_id);
    if (!empresa_id) return res.status(400).json({ error: 'empresa_id requerido' });

    const sus = await Suscripcion.findOne({
      where: { empresa_id, estado: 'activa' }
      // fecha_fin >= hoy si manejas expiración por fecha
    });

    if (!sus) {
      return res.status(200).json({ activa: false });
    }

    res.json({ activa: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

// GET /api/suscripciones/ultimas
exports.getUltimasPorEmpresa = async (_req, res) => {
  try {
    // Coincide con las columnas reales de la vista
    const [rows] = await db.query(`
      SELECT
        suscripcion_id,
        empresa_id,
        empresa_nombre,
        empresa_telefono,
        empresa_direccion,
        plan_id,
        plan_nombre,
        plan_costo,
        plan_lockers_incluidos,
        fecha_inicio,
        fecha_fin,
        estado
      FROM vw_panel_ultimas_suscripciones
    `);
    res.json(rows);
  } catch (err) {
    console.error('getUltimasPorEmpresa SQL error:', err.sqlMessage || err.message);
    res.status(500).json({ error: 'Error al obtener últimas suscripciones por empresa' });
  }
};

// GET /api/suscripciones/mensuales
exports.getMensuales = async (_req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT anio, mes, total_suscripciones, total_ingresos
      FROM vw_suscripciones_mensuales
      ORDER BY anio, mes
    `);
    const data = rows.map(r => ({
      anio: Number(r.anio),
      mes: Number(r.mes),
      total_suscripciones: Number(r.total_suscripciones || 0),
      total_ingresos: Number(r.total_ingresos || 0),
    }));
    res.json(data);
  } catch (err) {
    console.error('getMensuales SQL error:', err.sqlMessage || err.message);
    res.status(500).json({ error: 'Error al obtener serie mensual' });
  }
};

