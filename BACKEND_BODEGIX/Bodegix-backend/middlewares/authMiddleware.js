// middlewares/authMiddleware.js
const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({ error: 'Token no proporcionado' });
        }
        const token = authHeader.split(' ')[1];
        if (!token) {
            return res.status(401).json({ error: 'Token inválido' });
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.usuario = decoded; 
        next();
    } catch (error) {
        res.status(401).json({ error: 'Token inválido o expirado' });
    }
};
