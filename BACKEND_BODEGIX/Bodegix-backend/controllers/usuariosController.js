const Usuario = require('../models/Usuario');
const Empresa = require('../models/Empresa'); // ✅ necesario
const Rol = require('../models/Rol');   
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID); // Asegúrate de que esté en tu .env

exports.loginConGoogle = async (req, res) => {
  const { token } = req.body;

  if (!token) return res.status(400).json({ message: 'Token no proporcionado' });

  try {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { email, name } = payload;

    let usuario = await Usuario.findOne({ where: { correo: email } });

    const tokenJWT = jwt.sign(
      {
        id: usuario.id,
        rol_id: usuario.rol_id,
        empresa_id: usuario.empresa_id,
      },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    usuario.token = tokenJWT;
    await usuario.save();

    const { contraseña: _, ...usuarioSinContraseña } = usuario.toJSON();
    res.json({ usuario: usuarioSinContraseña, token: tokenJWT });
  } catch (error) {
    console.error('[Google Login Error]', error);
    res.status(401).json({ message: 'Token de Google inválido' });
  }
};


exports.getUsuariosAdmin = async (req, res) => {
  try {
    const { rol_id } = req.usuario;

    if (rol_id !== 1) {
      return res.status(403).json({ error: 'Acceso no autorizado' });
    }

    const usuarios = await Usuario.findAll({
      attributes: { exclude: ['contraseña'] },
      include: [
        { model: Empresa, as: 'empresa' },
        { model: Rol, as: 'rol' }
      ]
    });

    res.json(usuarios);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


exports.getUsuarios = async (req, res) => {
  try {
    const empresa_id = req.usuario?.empresa_id;

    if (!empresa_id) {
      return res.status(400).json({ error: 'empresa_id no proporcionado en el token' });
    }

    const usuarios = await Usuario.findAll({
      where: { empresa_id },
      attributes: { exclude: ['contraseña'] },
      include: [
        { model: Empresa, as: 'empresa' },
        { model: Rol, as: 'rol' }
      ]
    });

    res.json(usuarios);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createUsuario = async (req, res) => {
    try {
        const { nombre, correo, contraseña, rol_id, empresa_id } = req.body;

        if (!nombre || !correo || !contraseña || !rol_id || !empresa_id) {
            return res.status(400).json({ error: 'Todos los campos son obligatorios' });
        }

        const usuarioExistente = await Usuario.findOne({ where: { correo } });
        if (usuarioExistente) {
            return res.status(409).json({ error: 'El correo ya está registrado' });
        }

        const hash = await bcrypt.hash(contraseña, 10);

        const usuario = await Usuario.create({
            nombre,
            correo,
            contraseña: hash,
            rol_id,
            empresa_id
        });

        const { contraseña: _, ...usuarioSinContraseña } = usuario.toJSON();
        res.status(201).json(usuarioSinContraseña);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.loginUsuario = async (req, res) => {
    try {
        const { correo, contraseña } = req.body;

        if (!correo || !contraseña) {
            return res.status(400).json({ error: 'Correo y contraseña son requeridos' });
        }

        const usuario = await Usuario.findOne({ where: { correo } });
        if (!usuario) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        const match = await bcrypt.compare(contraseña, usuario.contraseña);
        if (!match) {
            return res.status(401).json({ error: 'Contraseña incorrecta' });
        }

        // Añadido empresa_id al token
        const token = jwt.sign(
            { id: usuario.id, rol_id: usuario.rol_id, empresa_id: usuario.empresa_id },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        usuario.token = token;
        await usuario.save();

        const { contraseña: _, ...usuarioSinContraseña } = usuario.toJSON();
        res.json({ usuario: usuarioSinContraseña, token });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.updateUsuario = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, correo, contraseña, rol_id, empresa_id } = req.body;

        const usuario = await Usuario.findByPk(id);
        if (!usuario) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        if (correo && correo !== usuario.correo) {
            const usuarioExistente = await Usuario.findOne({ where: { correo } });
            if (usuarioExistente) {
                return res.status(409).json({ error: 'El correo ya está registrado por otro usuario' });
            }
            usuario.correo = correo;
        }

        if (nombre) usuario.nombre = nombre;
        if (rol_id) usuario.rol_id = rol_id;
        if (empresa_id) usuario.empresa_id = empresa_id;

        if (contraseña) {
            const hash = await bcrypt.hash(contraseña, 10);
            usuario.contraseña = hash;
        }

        await usuario.save();

        const { contraseña: _, ...usuarioSinContraseña } = usuario.toJSON();
        res.json(usuarioSinContraseña);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.logoutUsuario = async (req, res) => {
    try {
        const usuarioId = req.usuario.id;
        await Usuario.update({ token: null }, { where: { id: usuarioId } });
        res.json({ message: 'Sesión cerrada correctamente' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.deleteUsuario = async (req, res) => {
    try {
        const { id } = req.params;

        const usuario = await Usuario.findByPk(id);
        if (!usuario) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        await usuario.destroy();
        res.json({ message: 'Usuario eliminado correctamente' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getUsuarioById = async (req, res) => {
    try {
        const { id } = req.params;
        const usuario = await Usuario.findByPk(id, {
            attributes: { exclude: ['contraseña'] },
            include: ['rol', 'empresa']
        });

        if (!usuario) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        res.json(usuario);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
