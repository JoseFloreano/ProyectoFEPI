// backend/middleware/auth.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Middleware de autenticación
 * Verifica que el usuario tenga un token JWT válido
 */
const authenticate = async (req, res, next) => {
  try {
    // Obtener token del header Authorization
    const authHeader = req.header('Authorization');
    
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: 'Acceso denegado. No se proporcionó token de autenticación.'
      });
    }

    // Extraer el token (formato: "Bearer TOKEN")
    const token = authHeader.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Acceso denegado. Token inválido.'
      });
    }

    // Verificar que JWT_SECRET esté configurado
    if (!process.env.JWT_SECRET) {
      console.error('❌ JWT_SECRET no está configurado en .env');
      return res.status(500).json({
        success: false,
        message: 'Error de configuración del servidor.'
      });
    }

    // Verificar y decodificar el token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Buscar usuario en la base de datos
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no encontrado.'
      });
    }

    // Verificar si el usuario está activo
    if (!user.activo) {
      return res.status(403).json({
        success: false,
        message: 'Esta cuenta ha sido desactivada.'
      });
    }

    // Agregar información del usuario a la request
    req.user = user;
    req.userId = decoded.userId;
    req.token = token;

    // Continuar con el siguiente middleware o ruta
    next();

  } catch (error) {
    // Manejar errores específicos de JWT
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Token inválido.'
      });
    }

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expirado. Por favor inicia sesión nuevamente.'
      });
    }

    // Error genérico
    console.error('Error en autenticación:', error);
    res.status(500).json({
      success: false,
      message: 'Error en autenticación.',
      error: error.message
    });
  }
};

/**
 * Middleware opcional de autenticación
 * No bloquea la petición si no hay token, pero agrega user si existe
 * Útil para endpoints que funcionan con o sin autenticación
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');

    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');

      if (token && process.env.JWT_SECRET) {
        try {
          const decoded = jwt.verify(token, process.env.JWT_SECRET);
          const user = await User.findById(decoded.userId);

          if (user && user.activo) {
            req.user = user;
            req.userId = decoded.userId;
            req.token = token;
          }
        } catch (error) {
          // Ignorar errores en autenticación opcional
          console.warn('Token inválido en autenticación opcional:', error.message);
        }
      }
    }

    // Continuar sin importar si hay usuario o no
    next();

  } catch (error) {
    // En caso de error, continuar sin usuario autenticado
    console.error('Error en autenticación opcional:', error);
    next();
  }
};

/**
 * Generar token JWT
 * @param {string} userId - ID del usuario
 * @returns {string} - Token JWT
 */
const generateToken = (userId) => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET no está configurado en las variables de entorno');
  }

  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';

  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn }
  );
};

/**
 * Verificar token JWT sin hacer query a la base de datos
 * Útil para validaciones rápidas
 * @param {string} token - Token a verificar
 * @returns {Object|null} - Payload del token o null si es inválido
 */
const verifyToken = (token) => {
  try {
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET no configurado');
    }

    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    console.error('Error al verificar token:', error.message);
    return null;
  }
};

/**
 * Decodificar token sin verificar (útil para debugging)
 * NO usar para autenticación, solo para inspección
 * @param {string} token - Token a decodificar
 * @returns {Object|null} - Payload del token
 */
const decodeToken = (token) => {
  try {
    return jwt.decode(token);
  } catch (error) {
    console.error('Error al decodificar token:', error.message);
    return null;
  }
};

/**
 * Middleware para verificar roles (ejemplo de extensión futura)
 * @param {Array<string>} roles - Roles permitidos
 */
const requireRole = (roles = []) => {
  return async (req, res, next) => {
    try {
      // Primero autenticar
      await authenticate(req, res, () => {});

      // Verificar si el usuario tiene el rol requerido
      if (!req.user.role || !roles.includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          message: 'No tienes permisos para acceder a este recurso.'
        });
      }

      next();
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al verificar permisos.',
        error: error.message
      });
    }
  };
};

module.exports = {
  authenticate,
  optionalAuth,
  generateToken,
  verifyToken,
  decodeToken,
  requireRole
};