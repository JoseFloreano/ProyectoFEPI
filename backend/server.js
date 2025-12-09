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
          // aiSuggestion = await analyzeCompilationError({
          //   code, 
          //   error: result.error, 
          //   exerciseId
          // });
          break;
          
        case 'runtime':
          // aiSuggestion = await analyzeRuntimeError({
          //   code, 
          //   error: result.error, 
          //   exerciseId
          // });
          break;
          
        case 'incorrect_output':
          // aiSuggestion = await analyzeIncorrectOutput({
          //   code, 
          //   actualOutput: result.output,
          //   expectedOutput: result.expectedOutput, 
          //   exerciseId
          // });
          aiSuggestion = "La IA analizará tu código y te dará sugerencias personalizadas.";
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