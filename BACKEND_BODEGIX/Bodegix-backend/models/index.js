const sequelize = require('../config/db');
const Plan = require('./Plan');
const Empresa = require('./Empresa');
const Rol = require('./Rol');
const Usuario = require('./Usuario');
const Locker = require('./Locker');
const Acceso = require('./Acceso');
const Suscripcion = require('./Suscripcion');
const Evento = require('./Evento');

Rol.hasMany(Usuario, { foreignKey: 'rol_id' });
Usuario.belongsTo(Rol, { foreignKey: 'rol_id', as: 'rol' });

Empresa.hasMany(Usuario, { foreignKey: 'empresa_id' });
Usuario.belongsTo(Empresa, { foreignKey: 'empresa_id', as: 'empresa' });

Empresa.hasMany(Locker, { foreignKey: 'empresa_id' });
Locker.belongsTo(Empresa, { foreignKey: 'empresa_id', as: 'empresa' });

Usuario.hasMany(Acceso, { foreignKey: 'usuario_id' });
Acceso.belongsTo(Usuario, { foreignKey: 'usuario_id', as: 'usuario' });

Empresa.hasMany(Suscripcion, { foreignKey: 'empresa_id' });
Suscripcion.belongsTo(Empresa, { foreignKey: 'empresa_id', as: 'empresa' });

Plan.hasMany(Suscripcion, { foreignKey: 'plan_id' });
Suscripcion.belongsTo(Plan, { foreignKey: 'plan_id', as: 'plan' });

module.exports = { sequelize, Plan, Empresa, Rol, Usuario, Locker, Acceso, Suscripcion, Evento };
