// cCompiler.js - Módulo para compilar y ejecutar código C
const { exec } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

// Directorio temporal para archivos C
const TEMP_DIR = path.join(__dirname, '..', 'temp');

/**
 * Asegura que el directorio temporal existe
 */
async function ensureTempDir() {
  try {
    await fs.access(TEMP_DIR);
  } catch {
    await fs.mkdir(TEMP_DIR, { recursive: true });
  }
}

/**
 * Limpia archivos temporales antiguos (más de 1 hora)
 */
async function cleanupOldFiles() {
  try {
    const files = await fs.readdir(TEMP_DIR);
    const now = Date.now();
    
    for (const file of files) {
      const filePath = path.join(TEMP_DIR, file);
      const stats = await fs.stat(filePath);
      
      // Eliminar archivos con más de 1 hora
      if (now - stats.mtimeMs > 3600000) {
        await fs.unlink(filePath);
      }
    }
  } catch (error) {
    console.error('Error al limpiar archivos:', error);
  }
}

/**
 * Elimina archivos específicos
 * @param {string} cFilePath - Ruta del archivo .c
 * @param {string} executablePath - Ruta del ejecutable
 */
async function cleanup(cFilePath, executablePath) {
  try {
    await fs.unlink(cFilePath).catch(() => {});
    await fs.unlink(executablePath).catch(() => {});
  } catch (error) {
    console.error('Error en cleanup:', error);
  }
}

/**
 * Compara dos outputs normalizando espacios y saltos de línea
 * @param {string} actual - Output actual del programa
 * @param {string} expected - Output esperado
 * @returns {boolean} - true si coinciden
 */
function compareOutputs(actual, expected) {
  const normalizeOutput = (str) => {
    return str
      .trim()
      .replace(/\r\n/g, '\n')
      .replace(/\s+$/gm, '') // Eliminar espacios al final de cada línea
      .replace(/\n+$/g, '\n'); // Normalizar saltos de línea finales
  };

  return normalizeOutput(actual) === normalizeOutput(expected);
}

/**
 * Formatea errores de compilación para hacerlos más legibles
 * @param {string} error - Mensaje de error de GCC
 * @returns {string} - Error formateado
 */
function formatCompilationError(error) {
  // Eliminar rutas completas de archivos temporales
  let formatted = error.replace(/\/.*?temp\/program_[a-f0-9]+\.c/g, 'main.c');
  
  // Resaltar las líneas con errores
  formatted = formatted
    .split('\n')
    .filter(line => line.trim()) // Eliminar líneas vacías
    .join('\n');
  
  return formatted;
}

/**
 * Compila el código C usando GCC
 * @param {string} cFilePath - Ruta del archivo .c
 * @param {string} executablePath - Ruta donde se guardará el ejecutable
 * @returns {Promise<Object>} - { success, error }
 */
function compileCode(cFilePath, executablePath) {
  return new Promise((resolve) => {
    const compileCommand = `gcc "${cFilePath}" -o "${executablePath}" -lm 2>&1`;
    
    exec(compileCommand, (error, stdout, stderr) => {
      if (error) {
        const errorMessage = stderr || stdout || error.message;
        resolve({
          success: false,
          error: formatCompilationError(errorMessage)
        });
      } else {
        resolve({ success: true });
      }
    });
  });
}

/**
 * Ejecuta el programa compilado
 * @param {string} executablePath - Ruta del ejecutable
 * @returns {Promise<Object>} - { success, output, error }
 */
function executeProgram(executablePath) {
  return new Promise((resolve) => {
    exec(`"${executablePath}"`, (error, stdout, stderr) => {
      if (error && !stdout) {
        const errorMessage = stderr || error.message;
        resolve({
          success: false,
          error: `Error de ejecución:\n${errorMessage}`
        });
      } else {
        resolve({
          success: true,
          output: stdout || ''
        });
      }
    });
  });
}

/**
 * Función principal para compilar y ejecutar código C
 * @param {string} code - Código fuente en C
 * @param {string} expectedOutput - Output esperado
 * @param {number} exerciseId - ID del ejercicio
 * @returns {Promise<Object>} - Resultado de la compilación y ejecución
 */
async function compileAndRun(code, expectedOutput, exerciseId) {
  // Validar código
  if (!code) {
    return {
      success: false,
      error: 'No se proporcionó código para compilar',
      isCorrect: false
    };
  }

  // Generar nombre único para los archivos
  const fileId = crypto.randomBytes(8).toString('hex');
  const fileName = `program_${fileId}`;
  const cFilePath = path.join(TEMP_DIR, `${fileName}.c`);
  const executablePath = path.join(TEMP_DIR, fileName);

  try {
    // Asegurar que el directorio temporal existe
    await ensureTempDir();

    // Escribir el código en un archivo .c
    await fs.writeFile(cFilePath, code, 'utf8');

    // Compilar el código
    const compileResult = await compileCode(cFilePath, executablePath);
    
    if (!compileResult.success) {
      await cleanup(cFilePath, executablePath);
      return {
        success: false,
        error: compileResult.error,
        isCorrect: false,
        errorType: 'compilation'
      };
    }

    // Ejecutar el programa
    const executeResult = await executeProgram(executablePath);
    
    if (!executeResult.success) {
      await cleanup(cFilePath, executablePath);
      return {
        success: false,
        error: executeResult.error,
        isCorrect: false,
        errorType: 'runtime'
      };
    }

    // Comparar outputs
    const actualOutput = executeResult.output;
    const isCorrect = compareOutputs(actualOutput, expectedOutput);

    // Limpiar archivos temporales
    await cleanup(cFilePath, executablePath);

    // Retornar resultado exitoso
    return {
      success: true,
      output: actualOutput,
      expectedOutput: expectedOutput,
      isCorrect: isCorrect,
      errorType: isCorrect ? null : 'incorrect_output'
    };

  } catch (error) {
    console.error('Error en el proceso de compilación:', error);
    
    // Intentar limpiar archivos en caso de error
    await cleanup(cFilePath, executablePath);
    
    return {
      success: false,
      error: 'Error interno del servidor: ' + error.message,
      isCorrect: false,
      errorType: 'internal'
    };
  }
}

/**
 * Inicializa el módulo del compilador
 */
async function initialize() {
  await ensureTempDir();
  console.log(`📁 Directorio temporal inicializado: ${TEMP_DIR}`);
  
  // Ejecutar limpieza cada 30 minutos
  setInterval(cleanupOldFiles, 1800000);
  console.log('🧹 Limpieza automática de archivos configurada (cada 30 min)');
}

/**
 * Limpia todos los archivos antes de cerrar
 */
async function shutdown() {
  console.log('🧹 Limpiando archivos temporales...');
  await cleanupOldFiles();
}

module.exports = {
  compileAndRun,
  initialize,
  shutdown,
  ensureTempDir,
  cleanupOldFiles,
  compareOutputs
};