// cCompiler.js - Módulo para compilar y ejecutar código C
const { exec } = require('child_process');
const { spawn } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const EXECUTION_TIMEOUT = process.env.EXECUTION_TIMEOUT || 5;
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
    if (!str) return '';
    
    return str
      .trim()                    // Eliminar espacios al inicio/final
      .replace(/\r\n/g, '\n')    // Normalizar saltos de línea Windows
      .replace(/\r/g, '\n')      // Normalizar saltos de línea Mac
      .replace(/\s+$/gm, '')     // Eliminar espacios al final de cada línea
      .replace(/\n+/g, '\n')     // Normalizar múltiples saltos de línea a uno
      .replace(/\s+/g, ' ')      // Normalizar múltiples espacios a uno
      .trim();                   // Trim final
  };

  const normalizedActual = normalizeOutput(actual);
  const normalizedExpected = normalizeOutput(expected);

  return normalizedActual === normalizedExpected;
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

function execCommandWithInput(command, input = '', options = {}) {
  return new Promise((resolve) => {
    const { cwd, timeout = 5000 } = options;
    
    let output = '';
    let errorOutput = '';
    let timedOut = false;
    let inputWritten = false;
    
    // ===== DEBUG: Ver qué llega =====
    console.log('🔍 INPUT RECIBIDO:', input);
    console.log('🔍 TIPO:', typeof input);
    console.log('🔍 ES NULL/UNDEFINED?', input == null);
    
    // Convertir a string
    const inputStr = (input != null) ? String(input) : '';
    
    console.log('🔍 INPUT STR:', inputStr);
    console.log('🔍 INPUT STR LENGTH:', inputStr.trim().length);

    const child = spawn(command, {
      cwd,
      shell: true,
      stdio: ['pipe', 'pipe', 'pipe']
    });

    const timeoutId = setTimeout(() => {
      timedOut = true;
      child.kill();
      resolve({
        error: true,
        output: 'Timeout: El programa tardó demasiado'
      });
    }, timeout);

    child.stdout.on('data', (data) => {
  const chunk = data.toString();
  
  // Si hay inputs y no se han agregado aún
  if (inputStr && inputStr.trim().length > 0 && !inputWritten) {
    // Buscar dónde termina el prompt (buscar el último ':' o '?' antes del output)
    const promptMatch = chunk.match(/^(.+[:?]\s*)(.*)$/s);
    
    if (promptMatch) {
      // Insertar inputs justo después del prompt
      output += promptMatch[1];  // Prompt
      output += inputStr.trim() + '\n';  // Inputs del usuario
      output += promptMatch[2];  // Resto del output
      inputWritten = true;
    } else {
      // Si no se encuentra el patrón, agregar normal
      output += chunk;
    }
  } else {
    output += chunk;
  }
});

    child.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    // ===== MODIFICADO: Usar inputStr =====
    if (inputStr) {
      child.stdin.write(inputStr);
      child.stdin.end();
    }

    child.on('close', (code) => {
      clearTimeout(timeoutId);
      if (timedOut) return;

      if (code !== 0) {
        resolve({
          error: true,
          output: errorOutput || output || `Proceso terminó con código ${code}`
        });
      } else {
        resolve({
          error: false,
          output: output
        });
      }
    });

    child.on('error', (err) => {
      clearTimeout(timeoutId);
      if (!timedOut) {
        resolve({
          error: true,
          output: err.message
        });
      }
    });
  });
}


function execCommand(command, options = {}) {
  return new Promise((resolve) => {
    const { timeout = 5000, cwd, input = '' } = options;

    const child = exec(command, { 
      cwd, 
      timeout,
      maxBuffer: 1024 * 1024 // 1MB
    }, (error, stdout, stderr) => {
      if (error) {
        if (error.killed) {
          resolve({ 
            error: true, 
            output: 'Timeout: El programa tardó demasiado en ejecutarse' 
          });
        } else {
          resolve({ 
            error: true, 
            output: stderr || stdout || error.message 
          });
        }
      } else {
        resolve({ 
          error: false, 
          output: stdout 
        });
      }
    });

    // ← NUEVO: Escribir inputs al STDIN del proceso
    if (input) {
      child.stdin.write(input);
      child.stdin.end();
    }
  });
}


/**
 * Función principal para compilar y ejecutar código C
 * @param {string} code - Código fuente en C
 * @param {string} expectedOutput - Output esperado
 * @param {number} exerciseId - ID del ejercicio
 * @returns {Promise<Object>} - Resultado de la compilación y ejecución
 */
async function compileAndRun(code, expectedOutput, exerciseId, userInputs = '') {
  const workDir = path.join(__dirname, '../temp');
  const fileName = `exercise_${exerciseId}_${Date.now()}`;
  const sourceFile = path.join(workDir, `${fileName}.c`);
  const execFile = path.join(workDir, fileName);

  try {
    // Guardar código fuente
    await fs.writeFile(sourceFile, code, 'utf-8');

    // Compilar
    const compileResult = await execCommandWithInput(
      `gcc "${sourceFile}" -o "${execFile}" -Wall 2>&1`
    );

    if (compileResult.error) {
      return {
        success: false,
        error: compileResult.output,
        errorType: 'compilation',
        isCorrect: false
      };
    }

    // Ejecutar con inputs del usuario (STDIN)
    const runCommand = process.platform === 'win32' 
      ? `"${execFile}.exe"` 
      : `./"${fileName}"`;

    const runResult = await execCommandWithInput(
  runCommand,        // 1er parámetro: comando
  userInputs,        // 2do parámetro: inputs
  {                  // 3er parámetro: opciones
    cwd: workDir,
    timeout: EXECUTION_TIMEOUT * 1000
  }
);

    if (runResult.error) {
      return {
        success: false,
        error: runResult.output || runResult.error,
        errorType: 'runtime',
        isCorrect: false
      };
    }

    // Comparar output
    const actualOutput = runResult.output.trim();
const expectedOutputTrimmed = expectedOutput ? expectedOutput.trim() : '';
const isCorrect = compareOutputs(actualOutput, expectedOutputTrimmed);

    return {
      success: true,
      output: actualOutput,
      expectedOutput: expectedOutputTrimmed,
      isCorrect,
      errorType: isCorrect ? null : 'incorrect_output'
    };

  } catch (error) {
    return {
      success: false,
      error: error.message,
      errorType: 'runtime',
      isCorrect: false
    };
  } finally {
    // Limpiar archivos
    try {
      await fs.unlink(sourceFile).catch(() => {});
      if (process.platform === 'win32') {
        await fs.unlink(`${execFile}.exe`).catch(() => {});
      } else {
        await fs.unlink(execFile).catch(() => {});
      }
    } catch (e) {}
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