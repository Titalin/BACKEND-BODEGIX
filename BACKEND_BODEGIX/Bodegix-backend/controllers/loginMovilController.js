const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const Usuario = require('../models/Usuario'); // Usa minúsculas si tu archivo es usuario.js
const Rol = require('../models/Rol');

// LOGIN PARA MÓVIL
exports.loginEmpleadoMovil = async (req, res) => {
    try {
        const { correo, contraseña } = req.body;

        if (!correo || !contraseña) {
            return res.status(400).json({ error: 'Correo y contraseña son requeridos' });
        }

        // Busca al usuario y su rol
        const usuario = await Usuario.findOne({
            where: { correo },
            include: [{
                model: Rol,
                as: 'rol',
                where: { rol: 'cliente' }, // Cambia a 'empleado' si es necesario
                attributes: ['id', 'rol']
            }]
        });

        if (!usuario) {
            return res.status(403).json({ error: 'Acceso denegado: Solo empleados pueden ingresar a la app móvil.' });
        }

        // Verifica contraseña
        const match = await bcrypt.compare(contraseña, usuario.contraseña);
        if (!match) {
            return res.status(401).json({ error: 'Contraseña incorrecta.' });
        }

        // Genera JWT
        const token = jwt.sign(
            { id: usuario.id, rol: usuario.rol },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        // Guarda el token en la base de datos
        await Usuario.update(
            { token },
            { where: { id: usuario.id } }
        );

        // Obtén el usuario actualizado (ya con el token guardado)
        const usuarioActualizado = await Usuario.findByPk(usuario.id, {
            include: [{
                model: Rol,
                as: 'rol',
                attributes: ['id', 'rol']
            }]
        });

        // Quita la contraseña antes de enviar
        const { contraseña: _, ...usuarioSinContraseña } = usuarioActualizado.toJSON();

        res.json({
            message: 'Login móvil exitoso',
            token,
            usuario: usuarioSinContraseña
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};
