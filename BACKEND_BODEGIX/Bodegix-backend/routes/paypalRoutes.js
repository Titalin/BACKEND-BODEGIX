// C:\Integradora\Bodegix-backend\routes\paypalRoutes.js
const express = require("express");
const router = express.Router();
const paypal = require("@paypal/checkout-server-sdk");
const { client } = require("../config/paypal");

const db = require("../models");
const { Suscripcion, sequelize } = db;

// ============ Crear orden ============
router.post("/create-order", async (req, res) => {
  try {
    const { amount } = req.body;
    const request = new paypal.orders.OrdersCreateRequest();
    request.prefer("return=representation");
    request.requestBody({
      intent: "CAPTURE",
      purchase_units: [
        {
          amount: {
            currency_code: "USD",
            value: amount || "10.00",
          },
        },
      ],
    });

    const order = await client().execute(request);
    return res.json({ id: order.result.id });
  } catch (err) {
    console.error("Error creando orden:", err);
    return res.status(500).json({ error: "Error creando orden" });
  }
});

// ============ Capturar pago y activar suscripción ============
router.post("/capture-order/:orderID", async (req, res) => {
  const { orderID } = req.params;
  const { empresa_id, suscripcion_id, plan_id } = req.body;

  if (!empresa_id) {
    return res.status(400).json({ error: "empresa_id es requerido" });
  }
  if (!suscripcion_id && !plan_id) {
    return res.status(400).json({ error: "Debes enviar suscripcion_id o plan_id" });
  }

  try {
    // 1) Capturar en PayPal
    const request = new paypal.orders.OrdersCaptureRequest(orderID);
    request.requestBody({});
    const capture = await client().execute(request);

    const status = capture?.result?.status;
    if (status !== "COMPLETED") {
      return res.status(400).json({ error: `Pago no completado (${status})` });
    }

    // 2) Obtener o crear suscripción
    let suscripcion = null;
    let planRow = null;

    if (!suscripcion_id) {
      const [rows] = await sequelize.query(
        "SELECT id FROM planes WHERE id = :id LIMIT 1",
        { replacements: { id: plan_id } }
      );
      planRow = rows && rows[0];
      if (!planRow) return res.status(404).json({ error: "Plan no encontrado" });

      // Fechas
      const fechaInicio = new Date();
      const fechaFin = new Date();
      fechaFin.setDate(fechaFin.getDate() + 30); // 30 días

      suscripcion = await Suscripcion.create({
        empresa_id,
        plan_id: planRow.id,
        estado: "inactiva", // antes estaba "pendiente"
        fecha_inicio: fechaInicio,
        fecha_fin: fechaFin
      });
    } else {
      suscripcion = await Suscripcion.findOne({
        where: { id: suscripcion_id, empresa_id },
      });
      if (!suscripcion) {
        return res.status(404).json({ error: "Suscripción no encontrada para activar" });
      }

      const [rows] = await sequelize.query(
        "SELECT id FROM planes WHERE id = :id LIMIT 1",
        { replacements: { id: suscripcion.plan_id } }
      );
      planRow = rows && rows[0];
      if (!planRow) return res.status(404).json({ error: "Plan de la suscripción no encontrado" });
    }

    const planIdParaAjuste = suscripcion.plan_id || planRow.id;

    // 3) Activar suscripción
    await Suscripcion.update(
      {
        estado: "activa",
        fecha_inicio: sequelize.literal("NOW()"),
        fecha_fin: sequelize.literal(`DATE_ADD(NOW(), INTERVAL 30 DAY)`),
      },
      { where: { id: suscripcion.id, empresa_id } }
    );

    // 4) Ajustar lockers
    await sequelize.query("CALL ajustar_lockers_por_plan(:empresaId, :planId)", {
      replacements: { empresaId: empresa_id, planId: planIdParaAjuste },
    });

    return res.json({
      ok: true,
      message: "Pago capturado, suscripción activada y lockers ajustados.",
      paypal_status: status,
      suscripcion_id: suscripcion.id,
      empresa_id,
      plan_id: planIdParaAjuste,
    });
  } catch (err) {
    console.error("Error capturando orden:", err);
    return res.status(500).json({ error: "Error capturando orden" });
  }
});

module.exports = router;
