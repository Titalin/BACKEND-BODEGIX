// models/associations.js

const Usuario = require('./Usuario');
const Rol = require('./Rol');

Usuario.belongsTo(Rol, { foreignKey: 'rol_id', as: 'rol' });
Rol.hasMany(Usuario, { foreignKey: 'rol_id', as: 'usuarios' });

module.exports = { Usuario, Rol };
