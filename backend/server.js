// server.js - Servidor Express modularizado
const express = require('express');
const cors = require('cors');
const cCompiler = require('./compiler/cCompiler');

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(cors());
app.use(express.json());

// ========================================================================
// RUTAS DE LA API
// ========================================================================

/**
 * Health check endpoint
 */
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Servidor funcionando correctamente',
    timestamp: new Date().toISOString()
  });
});

/**
 * Endpoint principal de compilación
 * POST /api/compile
 * Body: { code, expectedOutput, exerciseId }
 */
app.post('/api/compile', async (req, res) => {
  const { code, expectedOutput, exerciseId } = req.body;

  console.log(`📝 Compilando ejercicio #${exerciseId}...`);

  try {
    // Compilar y ejecutar el código
    const result = await cCompiler.compileAndRun(code, expectedOutput, exerciseId);

    // Si hay error, aquí se puede integrar la IA
    if (!result.success || !result.isCorrect) {
      // AQUÍ SE IMPLEMENTARÍA LA LLAMADA A LA IA
      // Dependiendo del tipo de error:
      
      let aiSuggestion = null;
      
      switch (result.errorType) {
        case 'compilation':
          aiSuggestion = await aiService.analizarErrorCompilacion({
            code, 
            error: result.error, 
            materia: req.body.materia || 'fundamentos'
          });
          break;
          
        case 'runtime':
          aiSuggestion = await aiService.analizarErrorEjecucion({
            code, 
            error: result.error, 
            materia: req.body.materia || 'fundamentos'
          });
          break;
          
        case 'incorrect_output':
          aiSuggestion = await aiService.analizarOutputIncorrecto({
            code, 
            actualOutput: result.output,
            expectedOutput: result.expectedOutput, 
            materia: req.body.materia || 'fundamentos'
          });
          break;
      }
      
      // Agregar sugerencia de IA al resultado
      result.aiSuggestion = aiSuggestion;
    }

    // Log del resultado
    if (result.success) {
      if (result.isCorrect) {
        console.log(`✅ Ejercicio #${exerciseId} completado correctamente`);
      } else {
        console.log(`⚠️  Ejercicio #${exerciseId} - Output incorrecto`);
      }
    } else {
      console.log(`❌ Ejercicio #${exerciseId} - Error: ${result.errorType}`);
    }

    // Enviar respuesta
    res.json(result);

  } catch (error) {
    console.error('❌ Error en el endpoint de compilación:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      isCorrect: false
    });
  }
});

// ========================================================================
// MANEJO DE ERRORES GLOBAL
// ========================================================================

// Ruta no encontrada
app.use((req, res) => {
  res.status(404).json({
    error: 'Ruta no encontrada',
    path: req.path
  });
});

// Manejo de errores generales
app.use((err, req, res, next) => {
  console.error('Error no manejado:', err);
  res.status(500).json({
    error: 'Error interno del servidor',
    message: err.message
  });
});

// ========================================================================
// INICIALIZACIÓN Y CIERRE DEL SERVIDOR
// ========================================================================

/**
 * Iniciar el servidor
 */
async function startServer() {
  try {
    // Inicializar el compilador
    await cCompiler.initialize();
    
    // Iniciar servidor Express
    app.listen(PORT, () => {
      console.log('╔════════════════════════════════════════════════════════╗');
      console.log('║         🚀 C PRACTICE LAB - Backend Server           ║');
      console.log('╚════════════════════════════════════════════════════════╝');
      console.log(`\n📡 Servidor corriendo en http://localhost:${PORT}`);
      console.log(`⚠️  Asegúrate de tener GCC instalado en tu sistema\n`);
      console.log('Endpoints disponibles:');
      console.log(`  - GET  /api/health`);
      console.log(`  - POST /api/compile\n`);
    });
  } catch (error) {
    console.error('❌ Error al iniciar el servidor:', error);
    process.exit(1);
  }
}

/**
 * Cerrar servidor de manera limpia
 */
async function shutdown() {
  console.log('\n🛑 Cerrando servidor...');
  
  // Limpiar recursos del compilador
  await cCompiler.shutdown();
  
  console.log('✅ Servidor cerrado correctamente');
  process.exit(0);
}

// Manejo de señales de cierre
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

// Manejo de errores no capturados
process.on('uncaughtException', (error) => {
  console.error('❌ Excepción no capturada:', error);
  shutdown();
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Promise rechazada no manejada:', reason);
  shutdown();
});

// ========================================================================
// INICIAR SERVIDOR
// ========================================================================

startServer();

// ========================================================================
// ENDPOINT PARA GENERAR PROYECTOS CON IA
// ========================================================================

const aiService = require('./ai/aiService');

/**
 * Endpoint para generar proyectos personalizados con IA
 * POST /api/generate-project
 * Body: { userRequest, materia, conversationHistory }
 */
app.post('/api/generate-project', async (req, res) => {
  const { userRequest, materia, conversationHistory } = req.body;

  console.log(`🤖 Generando proyecto con IA - Materia: ${materia}`);

  try {
    const result = await aiService.generarProyectoConIA({
      userRequest,
      materia,
      conversationHistory
    });

    if (result.success) {
      console.log(`✅ Proyecto "${result.project.name}" generado exitosamente`);
      res.json(result);
    } else {
      console.log(`⚠️  Error al generar proyecto: ${result.error}`);
      res.status(400).json(result);
    }

  } catch (error) {
    console.error('❌ Error en generación de proyecto:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno al generar el proyecto',
      suggestion: 'Verifica que la API key de Gemini esté configurada correctamente'
    });
  }
});

/**
 * Endpoint para obtener materias disponibles
 * GET /api/materias
 */
app.get('/api/materias', (req, res) => {
  const materias = aiService.obtenerMateriasDisponibles();
  res.json({ materias });
});

/**
 * Endpoint para obtener temas de una materia
 * GET /api/temas/:materia
 */
app.get('/api/temas/:materia', async (req, res) => {
  const { materia } = req.params;

  try {
    const temas = await aiService.obtenerTemasDisponibles(materia);
    res.json({ 
      materia: aiService.getNombreMateria(materia),
      temas 
    });
  } catch (error) {
    res.status(500).json({
      error: 'No se pudieron cargar los temas',
      message: error.message
    });
  }
});