// backend/routes/progress.js
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { authenticate } = require('../middleware/auth');

/**
 * GET /api/progress/exercises
 * Obtener ejercicios completados
 */
router.get('/exercises', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.userId);

    res.json({
      success: true,
      data: {
        ejerciciosCompletados: user.ejerciciosCompletados,
        total: user.ejerciciosCompletados.length
      }
    });

  } catch (error) {
    console.error('Error al obtener ejercicios:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener ejercicios completados.',
      error: error.message
    });
  }
});

/**
 * POST /api/progress/exercises/:id/complete
 * Marcar ejercicio como completado
 */
router.post('/exercises/:id/complete', authenticate, async (req, res) => {
  try {
    const exerciseId = parseInt(req.params.id);

    if (isNaN(exerciseId)) {
      return res.status(400).json({
        success: false,
        message: 'ID de ejercicio inválido.'
      });
    }

    const user = await User.findById(req.userId);
    await user.completarEjercicio(exerciseId);

    res.json({
      success: true,
      message: 'Ejercicio marcado como completado.',
      data: {
        ejerciciosCompletados: user.ejerciciosCompletados
      }
    });

  } catch (error) {
    console.error('Error al completar ejercicio:', error);
    res.status(500).json({
      success: false,
      message: 'Error al marcar ejercicio como completado.',
      error: error.message
    });
  }
});

/**
 * GET /api/progress/projects
 * Obtener proyectos desbloqueados
 */
router.get('/projects', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.userId);

    res.json({
      success: true,
      data: {
        proyectosDesbloqueados: user.proyectosDesbloqueados,
        total: user.proyectosDesbloqueados.length
      }
    });

  } catch (error) {
    console.error('Error al obtener proyectos:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener proyectos desbloqueados.',
      error: error.message
    });
  }
});

/**
 * POST /api/progress/projects/:id/unlock
 * Desbloquear proyecto
 */
router.post('/projects/:id/unlock', authenticate, async (req, res) => {
  try {
    const projectId = parseInt(req.params.id);

    if (isNaN(projectId)) {
      return res.status(400).json({
        success: false,
        message: 'ID de proyecto inválido.'
      });
    }

    const user = await User.findById(req.userId);
    await user.desbloquearProyecto(projectId);

    res.json({
      success: true,
      message: 'Proyecto desbloqueado.',
      data: {
        proyectosDesbloqueados: user.proyectosDesbloqueados
      }
    });

  } catch (error) {
    console.error('Error al desbloquear proyecto:', error);
    res.status(500).json({
      success: false,
      message: 'Error al desbloquear proyecto.',
      error: error.message
    });
  }
});

/**
 * GET /api/progress/stats
 * Obtener estadísticas completas del usuario
 */
router.get('/stats', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.userId);

    const stats = {
      ejerciciosCompletados: user.ejerciciosCompletados.length,
      proyectosDesbloqueados: user.proyectosDesbloqueados.length,
      temasVistos: user.temasVistos.length,
      fechaRegistro: user.fechaRegistro,
      ultimoAcceso: user.ultimoAcceso
    };

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener estadísticas.',
      error: error.message
    });
  }
});

/**
 * POST /api/progress/themes/:materia/:temaId
 * Marcar tema como visto
 */
router.post('/themes/:materia/:temaId', authenticate, async (req, res) => {
  try {
    const { materia, temaId } = req.params;
    const { completado } = req.body;

    const user = await User.findById(req.userId);

    // Buscar si ya existe el tema
    const temaExistente = user.temasVistos.find(
      t => t.materia === materia && t.temaId === parseInt(temaId)
    );

    if (temaExistente) {
      temaExistente.completado = completado !== undefined ? completado : true;
      temaExistente.fecha = Date.now();
    } else {
      user.temasVistos.push({
        materia,
        temaId: parseInt(temaId),
        completado: completado !== undefined ? completado : true,
        fecha: Date.now()
      });
    }

    await user.save();

    res.json({
      success: true,
      message: 'Tema actualizado.',
      data: {
        temasVistos: user.temasVistos
      }
    });

  } catch (error) {
    console.error('Error al marcar tema:', error);
    res.status(500).json({
      success: false,
      message: 'Error al marcar tema.',
      error: error.message
    });
  }
});

module.exports = router;
