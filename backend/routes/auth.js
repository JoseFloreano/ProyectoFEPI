// backend/routes/auth.js
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { authenticate, generateToken } = require('../middleware/auth');

/**
 * POST /api/auth/register
 * Registrar nuevo usuario
 */
router.post('/register', async (req, res) => {
  try {
    const { nombre, email, password, matricula, carrera, semestre } = req.body;

    // Validar campos requeridos
    if (!nombre || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Por favor completa todos los campos obligatorios (nombre, email, password).'
      });
    }

    // Verificar si el email ya existe
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Este email ya está registrado.'
      });
    }

    // Verificar matrícula si se proporciona
    if (matricula) {
      const existingMatricula = await User.findOne({ matricula });
      if (existingMatricula) {
        return res.status(400).json({
          success: false,
          message: 'Esta matrícula ya está registrada.'
        });
      }
    }

    // Crear usuario
    const user = new User({
      nombre,
      email,
      password,
      matricula: matricula || undefined,
      carrera: carrera || 'Ingeniería en Inteligencia Artificial',
      semestre: semestre || undefined
    });

    await user.save();

    // Generar token
    const token = generateToken(user._id);

    // Actualizar último acceso
    await user.actualizarAcceso();

    res.status(201).json({
      success: true,
      message: 'Usuario registrado exitosamente.',
      data: {
        user: user.toJSON(),
        token
      }
    });

  } catch (error) {
    console.error('Error en registro:', error);

    // Manejar errores de validación de Mongoose
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Error de validación.',
        errors: messages
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error al registrar usuario.',
      error: error.message
    });
  }
});

/**
 * POST /api/auth/login
 * Iniciar sesión
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validar campos
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Por favor proporciona email y contraseña.'
      });
    }

    // Buscar usuario (incluir password que está en select: false)
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Email o contraseña incorrectos.'
      });
    }

    // Verificar contraseña
    const isPasswordValid = await user.compararPassword(password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Email o contraseña incorrectos.'
      });
    }

    // Verificar si está activo
    if (!user.activo) {
      return res.status(403).json({
        success: false,
        message: 'Esta cuenta ha sido desactivada.'
      });
    }

    // Generar token
    const token = generateToken(user._id);

    // Actualizar último acceso
    await user.actualizarAcceso();

    res.json({
      success: true,
      message: 'Inicio de sesión exitoso.',
      data: {
        user: user.toJSON(),
        token
      }
    });

  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({
      success: false,
      message: 'Error al iniciar sesión.',
      error: error.message
    });
  }
});

/**
 * GET /api/auth/me
 * Obtener información del usuario autenticado
 */
router.get('/me', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.userId);

    res.json({
      success: true,
      data: {
        user: user.toJSON(),
        progreso: user.obtenerProgreso()
      }
    });

  } catch (error) {
    console.error('Error al obtener usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener información del usuario.',
      error: error.message
    });
  }
});

/**
 * POST /api/auth/logout
 * Cerrar sesión (opcional - el cliente elimina el token)
 */
router.post('/logout', authenticate, async (req, res) => {
  try {
    // Aquí podrías invalidar el token en una blacklist si lo deseas
    // Por ahora, el cliente simplemente eliminará el token

    res.json({
      success: true,
      message: 'Sesión cerrada exitosamente.'
    });

  } catch (error) {
    console.error('Error en logout:', error);
    res.status(500).json({
      success: false,
      message: 'Error al cerrar sesión.',
      error: error.message
    });
  }
});

/**
 * PUT /api/auth/update-profile
 * Actualizar perfil del usuario
 */
router.put('/update-profile', authenticate, async (req, res) => {
  try {
    const { nombre, matricula, carrera, semestre, tema } = req.body;

    const user = await User.findById(req.userId);

    // Actualizar campos permitidos
    if (nombre) user.nombre = nombre;
    if (matricula) user.matricula = matricula;
    if (carrera) user.carrera = carrera;
    if (semestre) user.semestre = semestre;
    if (tema) user.tema = tema;

    await user.save();

    res.json({
      success: true,
      message: 'Perfil actualizado exitosamente.',
      data: {
        user: user.toJSON()
      }
    });

  } catch (error) {
    console.error('Error al actualizar perfil:', error);

    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Error de validación.',
        errors: messages
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error al actualizar perfil.',
      error: error.message
    });
  }
});

/**
 * PUT /api/auth/change-password
 * Cambiar contraseña
 */
router.put('/change-password', authenticate, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Por favor proporciona la contraseña actual y la nueva.'
      });
    }

    const user = await User.findById(req.userId).select('+password');

    // Verificar contraseña actual
    const isValid = await user.compararPassword(currentPassword);

    if (!isValid) {
      return res.status(401).json({
        success: false,
        message: 'La contraseña actual es incorrecta.'
      });
    }

    // Actualizar contraseña
    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Contraseña actualizada exitosamente.'
    });

  } catch (error) {
    console.error('Error al cambiar contraseña:', error);
    res.status(500).json({
      success: false,
      message: 'Error al cambiar contraseña.',
      error: error.message
    });
  }
});

module.exports = router;
