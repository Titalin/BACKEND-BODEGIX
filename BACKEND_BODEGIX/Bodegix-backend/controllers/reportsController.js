const db = require('../config/db'); // conexión MySQL

// 🔹 Ingresos totales (sin filtro)
exports.getIngresosTotales = async (req, res) => {
  try {
    const [result] = await db.query(`
      SELECT SUM(p.costo) AS ingresos_totales
      FROM suscripciones s
      JOIN planes p ON s.plan_id = p.id
      WHERE s.estado = 'activa'
    `);
    const ingresos = Number(result[0]?.ingresos_totales) || 0;
    res.json({ ingresos_totales: ingresos });
  } catch (error) {
    console.error('Error en getIngresosTotales:', error);
    res.status(500).json({ ingresos_totales: 0 });
  }
};

// 🔹 Ingresos totales filtrados por fecha
exports.getIngresosTotalesPorFecha = async (req, res) => {
  try {
    let { fecha_inicio, fecha_fin } = req.query;

    console.log("📌 Fechas recibidas para total:", fecha_inicio, fecha_fin);

    if (!fecha_inicio || !fecha_fin) {
      return res.status(400).json({ ingresos_totales: 0 });
    }

    fecha_inicio = fecha_inicio.replace(/[^0-9\-]/g, '');
    fecha_fin = fecha_fin.replace(/[^0-9\-]/g, '');

    const [result] = await db.query(`
      SELECT SUM(p.costo) AS ingresos_totales
      FROM suscripciones s
      JOIN planes p ON s.plan_id = p.id
      WHERE s.estado = 'activa'
        AND s.fecha_inicio >= '${fecha_inicio}'
        AND s.fecha_inicio <= '${fecha_fin}'
    `);

    const ingresos = Number(result[0]?.ingresos_totales) || 0;
    res.json({ ingresos_totales: ingresos });
  } catch (error) {
    console.error('Error en getIngresosTotalesPorFecha:', error);
    res.status(500).json({ ingresos_totales: 0 });
  }
};

// 🔹 Ingresos por mes
exports.getIngresosMensuales = async (req, res) => {
  try {
    const [result] = await db.query(`
      SELECT DATE_FORMAT(s.fecha_inicio, '%Y-%m') AS mes, SUM(p.costo) AS ingresos
      FROM suscripciones s
      JOIN planes p ON s.plan_id = p.id
      WHERE s.estado = 'activa'
      GROUP BY mes
      ORDER BY mes
    `);
    const data = Array.isArray(result)
      ? result.map(row => ({
          mes: row.mes,
          ingresos: Number(row.ingresos) || 0
        }))
      : [];
    res.json(data);
  } catch (error) {
    console.error('Error en getIngresosMensuales:', error);
    res.status(500).json([]);
  }
};

// 🔹 Ingresos por empresa con filtro de fechas
exports.getIngresosPorEmpresa = async (req, res) => {
  try {
    let { fecha_inicio, fecha_fin } = req.query;

    console.log("📌 Fechas recibidas:", fecha_inicio, fecha_fin);

    if (!fecha_inicio || !fecha_fin) {
      return res.status(400).json({ error: 'Debe proporcionar fecha_inicio y fecha_fin' });
    }

    fecha_inicio = fecha_inicio.replace(/[^0-9\-]/g, '');
    fecha_fin = fecha_fin.replace(/[^0-9\-]/g, '');

    const [result] = await db.query(`
      SELECT e.nombre AS empresa, SUM(p.costo) AS ingresos
      FROM suscripciones s
      JOIN planes p ON s.plan_id = p.id
      JOIN empresas e ON s.empresa_id = e.id
      WHERE s.estado = 'activa'
        AND s.fecha_inicio >= '${fecha_inicio}'
        AND s.fecha_inicio <= '${fecha_fin}'
      GROUP BY e.nombre
      ORDER BY ingresos DESC
    `);

    const data = Array.isArray(result)
      ? result.map(row => ({
          empresa: row.empresa,
          ingresos: Number(row.ingresos) || 0
        }))
      : [];

    res.json(data);
  } catch (error) {
    console.error('❌ Error en getIngresosPorEmpresa:', error);
    res.status(500).json({ error: error.message });
  }
};
