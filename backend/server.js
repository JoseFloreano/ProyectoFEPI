// server.js - Servidor Express con integración de IA
require('dotenv').config(); 
const express = require('express');
const cors = require('cors');
const cCompiler = require('./compiler/cCompiler');
const aiService = require('./services/aiService');

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
 * Endpoint principal de compilación con análisis de IA
 * POST /api/compile
 * Body: { code, expectedOutput, exerciseId, materia }
 */
app.post('/api/compile', async (req, res) => {
  const { code, expectedOutput, exerciseId, materia = 'fundamentos', userInputs = '' } = req.body;
  const inputsStr = userInputs != null ? String(userInputs) : '';

  console.log(`📝 Compilando ejercicio #${exerciseId}...`);

  try {
    // Compilar y ejecutar el código
    const result = await cCompiler.compileAndRun(code, expectedOutput, exerciseId, inputsStr);

    // Si hay error, usar IA para generar sugerencias
    if (!result.success || !result.isCorrect) {
      let aiSuggestion = null;
      
      try {
        switch (result.errorType) {
          case 'compilation':
            aiSuggestion = await aiService.analizarErrorCompilacion({
              code, 
              error: result.error, 
              materia
            });
            break;
            
          case 'runtime':
            aiSuggestion = await aiService.analizarErrorEjecucion({
              code, 
              error: result.error, 
              materia
            });
            break;
            
          case 'incorrect_output':
            aiSuggestion = await aiService.analizarOutputIncorrecto({
              code, 
              actualOutput: result.output,
              expectedOutput: result.expectedOutput, 
              materia
            });
            break;
        }
        
        // Agregar sugerencia de IA al resultado
        if (aiSuggestion) {
          result.aiSuggestion = aiSuggestion;
        }
      } catch (aiError) {
        console.error('⚠️  Error al obtener sugerencia de IA:', aiError.message);
        // Continuar sin sugerencia de IA
      }
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
      suggestion: 'Verifica que la API key de Gemini esté configurada correctamente en el archivo .env'
    });
  }
});

/**
 * Endpoint para obtener materias disponibles
 * GET /api/materias
 */
app.get('/api/materias', (req, res) => {
  try {
    const materias = aiService.obtenerMateriasDisponibles();
    res.json({ materias });
  } catch (error) {
    console.error('❌ Error al obtener materias:', error);
    res.status(500).json({
      error: 'No se pudieron cargar las materias',
      message: error.message
    });
  }
});

/**
 * Endpoint para obtener temas de una materia específica
 * GET /api/temas/:materia
 */
app.get('/api/temas/:materia', async (req, res) => {
  const { materia } = req.params;

  try {
    const temas = await aiService.obtenerTemasDisponibles(materia);
    
    // Obtener nombre legible de la materia
    const nombresMateria = {
      'fundamentos': 'Fundamentos de Programación',
      'estructuras': 'Algoritmos y Estructuras de Datos',
      'analisis': 'Análisis y Diseño de Algoritmos'
    };
    
    res.json({ 
      materia: nombresMateria[materia] || materia,
      temas 
    });
  } catch (error) {
    console.error('❌ Error al obtener temas:', error);
    res.status(500).json({
      error: 'No se pudieron cargar los temas',
      message: error.message
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
    // Verificar que existe la API key de Gemini
    if (!process.env.GEMINI_API_KEY) {
      console.warn('⚠️  ADVERTENCIA: GEMINI_API_KEY no está configurada en .env');
      console.warn('   Las funciones de IA no estarán disponibles\n');
    }

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
      console.log(`  - POST /api/compile`);
      console.log(`  - POST /api/generate-project`);
      console.log(`  - GET  /api/materias`);
      console.log(`  - GET  /api/temas/:materia\n`);
      
      if (process.env.GEMINI_API_KEY) {
        console.log('✅ Integración con Google Gemini AI activa');
      } else {
        console.log('⚠️  Integración con IA deshabilitada (falta GEMINI_API_KEY)');
      }
      console.log('');
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