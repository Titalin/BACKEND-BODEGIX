const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const Evento = sequelize.define('Evento', {
    fecha: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    datos_json: { type: DataTypes.JSON },
}, { tableName: 'eventos', timestamps: false });
module.exports = Evento;