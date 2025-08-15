// controllers/alertasController.js
const Locker = require('../models/Locker');           // MySQL (Sequelize)
const Temperatura = require('../models/Temperatura'); // Mongo (Mongoose)

/**
 * GET /api/alertas/usuario/:id
 * Query options:
 *  - tipo:        "temperatura|humedad|capacidad" (uno o varios separados por coma)
 *  - severity:    "error|warning|info"           (uno o varios separados por coma)
 *  - limit:       número máximo de alertas a devolver (por defecto 100)
 *  - warnMargin:  margen (%) para warning sobre los umbrales (default 10)
 */
exports.getAlertasPorUsuario = async (req, res) => {
  try {
    // --- 1) Validación & opciones ---
    const usuarioId = Number(req.params.id);
    if (!Number.isFinite(usuarioId) || usuarioId <= 0) {
      return res.status(400).json({ error: 'Parámetro :id inválido' });
    }

    // Normaliza query
    const parseCSV = (v) =>
      String(v || '')
        .split(',')
        .map(s => s.trim().toLowerCase())
        .filter(Boolean);

    const tiposFiltro = new Set(parseCSV(req.query.tipo));       // ej: temperatura,humedad
    const sevFiltro   = new Set(parseCSV(req.query.severity));   // ej: error,warning
    const limit       = Math.min(Math.max(Number(req.query.limit || 100), 1), 1000);
    const warnMargin  = Math.min(Math.max(Number(req.query.warnMargin || 10), 0), 50); // 0–50%

    const wantTipo = (t) => (tiposFiltro.size ? tiposFiltro.has(t) : true);
    const wantSev  = (s) => (sevFiltro.size   ? sevFiltro.has(s)   : true);

    // --- 2) Lockers asignados al usuario ---
    const lockers = await Locker.findAll({
      where: { usuario_id: usuarioId },
      // si quieres evitar alertas de lockers inactivos, filtra:
      // where: { usuario_id: usuarioId, estado: 'activo' }
      raw: true,
    });

    if (!lockers.length) {
      return res.json([]); // sin lockers, sin alertas
    }

    // --- 3) Última lectura de cada locker (paralelo) ---
    const tasks = lockers.map(async (locker) => {
      const ident = String(locker.identificador).padStart(3, '0');
      const lockerIdMongo = `LOCKER_${ident}`;
      const lectura = await Temperatura.findOne({ locker_id: lockerIdMongo })
        .sort({ timestamp: -1 })
        .lean()
        .catch(() => null);

      return { locker, lectura, lockerIdMongo };
    });

    const resultados = await Promise.all(tasks);

    // --- 4) Helper severidad ---
    const near = (current, bound) => {
      if (bound == null || !Number.isFinite(bound)) return false;
      const t = Math.abs(bound) * (warnMargin / 100); // margen en valor absoluto
      return Math.abs(current - bound) <= t;
    };

    // Puntaje para orden global
    const sevWeight = { error: 2, warning: 1, info: 0 };

    // --- 5) Generación de alertas ---
    const alertas = [];

    for (const { locker, lectura } of resultados) {
      if (!lectura) continue;

      // Si no quieres alertas de lockers inactivos:
      // if (locker.estado !== 'activo') continue;

      const ident = String(locker.identificador).padStart(3, '0');
      const baseMeta = {
        lockerId: locker.id,
        identificador: locker.identificador,
        timestamp: lectura.timestamp,
        valores: {
          temperatura: lectura.temperatura,
          humedad: lectura.humedad,
          peso: lectura.peso ?? null,
        },
        umbrales: {
          temp_min: locker.temp_min ?? null,
          temp_max: locker.temp_max ?? null,
          hum_min: locker.hum_min ?? null,
          hum_max: locker.hum_max ?? null,
          peso_max: locker.peso_max ?? null,
        },
      };

      // --- Temperatura ---
      if (wantTipo('temperatura')) {
        const t = lectura.temperatura;
        const { temp_min, temp_max } = baseMeta.umbrales;

        if (temp_min != null && t < temp_min) {
          alertas.push({
            id: `${locker.id}-temp-min`,
            tipo: 'temperatura',
            severity: 'error',
            mensaje: `Locker ${locker.identificador}: temperatura baja (${t}°C < ${temp_min}°C)`,
            ...baseMeta,
          });
        } else if (temp_max != null && t > temp_max) {
          alertas.push({
            id: `${locker.id}-temp-max`,
            tipo: 'temperatura',
            severity: 'error',
            mensaje: `Locker ${locker.identificador}: temperatura alta (${t}°C > ${temp_max}°C)`,
            ...baseMeta,
          });
        } else {
          // dentro de rango -> ¿cerca de umbrales?
          if (
            (temp_min != null && near(t, temp_min)) ||
            (temp_max != null && near(t, temp_max))
          ) {
            const nearTo = near(t, temp_min) ? `mínimo ${temp_min}°C` : `máximo ${temp_max}°C`;
            alertas.push({
              id: `${locker.id}-temp-near`,
              tipo: 'temperatura',
              severity: 'warning',
              mensaje: `Locker ${locker.identificador}: temperatura cerca del ${nearTo} (${t}°C)`,
              ...baseMeta,
            });
          }
        }
      }

      // --- Humedad ---
      if (wantTipo('humedad')) {
        const h = lectura.humedad;
        const { hum_min, hum_max } = baseMeta.umbrales;

        if (hum_min != null && h < hum_min) {
          alertas.push({
            id: `${locker.id}-hum-min`,
            tipo: 'humedad',
            severity: 'error',
            mensaje: `Locker ${locker.identificador}: humedad baja (${h}% < ${hum_min}%)`,
            ...baseMeta,
          });
        } else if (hum_max != null && h > hum_max) {
          alertas.push({
            id: `${locker.id}-hum-max`,
            tipo: 'humedad',
            severity: 'error',
            mensaje: `Locker ${locker.identificador}: humedad alta (${h}% > ${hum_max}%)`,
            ...baseMeta,
          });
        } else {
          if (
            (hum_min != null && near(h, hum_min)) ||
            (hum_max != null && near(h, hum_max))
          ) {
            const nearTo = near(h, hum_min) ? `mínimo ${hum_min}%` : `máximo ${hum_max}%`;
            alertas.push({
              id: `${locker.id}-hum-near`,
              tipo: 'humedad',
              severity: 'warning',
              mensaje: `Locker ${locker.identificador}: humedad cerca del ${nearTo} (${h}%)`,
              ...baseMeta,
            });
          }
        }
      }

      // --- Peso (capacidad) ---
      if (wantTipo('capacidad')) {
        const p = lectura.peso ?? null;
        const { peso_max } = baseMeta.umbrales;

        if (peso_max != null && p != null) {
          if (p > peso_max) {
            alertas.push({
              id: `${locker.id}-capacidad-max`,
              tipo: 'capacidad',
              severity: 'error',
              mensaje: `Locker ${locker.identificador}: peso excedido (${p} kg > ${peso_max} kg)`,
              ...baseMeta,
            });
          } else if (near(p, peso_max)) {
            alertas.push({
              id: `${locker.id}-capacidad-near`,
              tipo: 'capacidad',
              severity: 'warning',
              mensaje: `Locker ${locker.identificador}: peso cerca del máximo (${p} kg / ${peso_max} kg)`,
              ...baseMeta,
            });
          }
        }
      }
    }

    // --- 6) Filtro por severidad y orden ---
    const filtradas = alertas
      .filter(a => wantSev(a.severity))
      .sort((a, b) => {
        const s = (sevWeight[b.severity] ?? 0) - (sevWeight[a.severity] ?? 0);
        if (s !== 0) return s;
        return new Date(b.timestamp) - new Date(a.timestamp);
      })
      .slice(0, limit);

    return res.json(filtradas);
  } catch (error) {
    console.error('[getAlertasPorUsuario] Error:', error);
    return res.status(500).json({ error: 'Error obteniendo alertas' });
  }
};
