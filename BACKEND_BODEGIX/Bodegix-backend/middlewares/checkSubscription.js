// middlewares/checkSubscription.js
const { Suscripcion, Locker } = require('../models');
// const { Op } = require('sequelize');

module.exports = async function checkSubscription(req, res, next) {
  try {
    // 1) Intenta token → query → body
    let empresaId =
      req.user?.empresa_id ??
      req.usuario?.empresa_id ?? // por si tu auth usa 'usuario'
      (req.query.empresa_id ? Number(req.query.empresa_id) : undefined) ??
      (req.body.empresa_id ? Number(req.body.empresa_id) : undefined);

    // 2) Si no hay, intenta deducir por :id del locker
    if (!empresaId && req.params?.id) {
      const locker = await Locker.findByPk(req.params.id);
      if (locker) empresaId = Number(locker.empresa_id);
    }

    if (!empresaId) {
      return res.status(400).json({ error: 'empresa_id requerido' });
    }

    const sus = await Suscripcion.findOne({
      where: {
        empresa_id: empresaId,
        estado: 'activa',
        // fecha_fin: { [Op.gte]: new Date() }
      }
    });

    if (!sus) {
      return res.status(402).json({
        code: 'SUBSCRIPTION_REQUIRED',
        message: 'Tu suscripción no está activa. Renueva para gestionar tus lockers.'
      });
    }

    return next();
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};
