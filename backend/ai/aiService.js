// services/aiService.js - Servicio de integración con Google Gemini AI
const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs').promises;
const path = require('path');
const csv = require('csv-parser');
const { createReadStream } = require('fs');

// Inicializar Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Rutas de los archivos CSV de temarios
const TEMARIOS_DIR = path.join(__dirname, '..', 'temarios');
const TEMARIOS = {
  fundamentos: path.join(TEMARIOS_DIR, 'fundamentos-programacion.csv'),
  estructuras: path.join(TEMARIOS_DIR, 'estructuras-datos.csv'),
  analisis: path.join(TEMARIOS_DIR, 'analisis-algoritmos.csv')
};

/**
 * Lee un archivo CSV y retorna los temas como array
 * @param {string} filePath - Ruta del archivo CSV
 * @returns {Promise<Array<string>>} - Array de temas
 */
async function leerTemasCSV(filePath) {
  return new Promise((resolve, reject) => {
    const temas = [];
    
    createReadStream(filePath)
      .pipe(csv())
      .on('data', (row) => {
        // Asumiendo que la columna se llama 'Tema' o 'tema'
        const tema = row.Tema || row.tema || row.TEMA || Object.values(row)[0];
        if (tema && tema.trim()) {
          temas.push(tema.trim());
        }
      })
      .on('end', () => {
        resolve(temas);
      })
      .on('error', (error) => {
        reject(error);
      });
  });
}

/**
 * Obtiene los temas disponibles según la materia seleccionada
 * Las materias son seriadas: análisis incluye todos, estructuras incluye fundamentos
 * @param {string} materia - 'fundamentos', 'estructuras', o 'analisis'
 * @returns {Promise<Array<string>>} - Array de temas disponibles
 */
async function obtenerTemasDisponibles(materia) {
  try {
    let temas = [];

    switch (materia) {
      case 'analisis':
        // Análisis incluye todos los temas (seriado completo)
        const temasAnalisis = await leerTemasCSV(TEMARIOS.analisis);
        const temasEstructuras2 = await leerTemasCSV(TEMARIOS.estructuras);
        const temasFundamentos2 = await leerTemasCSV(TEMARIOS.fundamentos);
        temas = [...temasFundamentos2, ...temasEstructuras2, ...temasAnalisis];
        break;

      case 'estructuras':
        // Estructuras incluye fundamentos + estructuras
        const temasEstructuras = await leerTemasCSV(TEMARIOS.estructuras);
        const temasFundamentos = await leerTemasCSV(TEMARIOS.fundamentos);
        temas = [...temasFundamentos, ...temasEstructuras];
        break;

      case 'fundamentos':
      default:
        // Solo fundamentos
        temas = await leerTemasCSV(TEMARIOS.fundamentos);
        break;
    }

    return temas;
  } catch (error) {
    console.error('Error al leer temarios:', error);
    throw new Error('No se pudieron cargar los temarios');
  }
}

/**
 * Genera un proyecto personalizado usando Gemini AI
 * @param {Object} params - Parámetros
 * @param {string} params.userRequest - Solicitud del usuario
 * @param {string} params.materia - Materia seleccionada
 * @param {Array} params.conversationHistory - Historial de conversación
 * @returns {Promise<Object>} - Proyecto generado
 */
async function generarProyectoConIA({ userRequest, materia, conversationHistory = [] }) {
  try {
    // Obtener temas disponibles según la materia
    const temasDisponibles = await obtenerTemasDisponibles(materia);

    // Construir el prompt
    const prompt = `
Eres un experto profesor de programación en C. Tu tarea es crear un proyecto educativo completo basado en la solicitud del estudiante.

MATERIA SELECCIONADA: ${getNombreMateria(materia)}

TEMAS DISPONIBLES PARA ESTA MATERIA:
${temasDisponibles.map((tema, idx) => `${idx + 1}. ${tema}`).join('\n')}

IMPORTANTE: 
- Solo puedes usar temas de la lista anterior
- Los ejercicios deben estar dentro del alcance de "${getNombreMateria(materia)}"
- Si el estudiante pide algo fuera del temario, sugiere la alternativa más cercana

SOLICITUD DEL ESTUDIANTE: ${userRequest}

FORMATO DE RESPUESTA (DEBES RESPONDER SOLO CON UN JSON VÁLIDO):
{
  "name": "Nombre descriptivo del proyecto",
  "description": "Descripción clara del proyecto (1-2 oraciones)",
  "difficulty": "Fácil|Media|Difícil",
  "icon": "emoji apropiado (un solo emoji)",
  "color": "código hex de color apropiado",
  "temasUsados": ["tema1", "tema2"],
  "exercises": [
    {
      "title": "Título del ejercicio 1",
      "description": "Descripción clara y específica del ejercicio",
      "expectedOutput": "Output exacto esperado (incluye \\n para saltos de línea)",
      "starterCode": "Código de inicio en C con comentarios guía",
      "hints": ["Pista 1", "Pista 2", "Pista 3"]
    },
    // Incluir 3-5 ejercicios progresivos
  ],
  "finalProject": {
    "title": "Título del proyecto final",
    "description": "Descripción del proyecto integrador",
    "starterCode": "Código base para el proyecto final"
  }
}

REGLAS IMPORTANTES:
1. Los ejercicios deben ser progresivos (de fácil a complejo)
2. El expectedOutput debe ser EXACTO (incluye saltos de línea \\n)
3. El starterCode debe incluir #include necesarios y main()
4. Los hints deben guiar sin dar la solución completa
5. El proyecto final debe integrar lo aprendido en los ejercicios
6. RESPONDE SOLO CON EL JSON, SIN TEXTO ADICIONAL
7. Asegúrate de que el JSON sea válido y parseable
`;

    // Llamar a Gemini
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Limpiar y parsear la respuesta
    let jsonText = text.trim();
    
    // Remover markdown code blocks si existen
    jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    
    // Intentar parsear el JSON
    const projectData = JSON.parse(jsonText);

    // Agregar IDs y validar estructura
    const validatedProject = validarYCompletarProyecto(projectData, materia);

    return {
      success: true,
      project: validatedProject
    };

  } catch (error) {
    console.error('Error al generar proyecto con IA:', error);
    
    return {
      success: false,
      error: error.message,
      suggestion: 'Intenta reformular tu solicitud o sé más específico sobre qué quieres aprender.'
    };
  }
}

/**
 * Valida y completa los datos del proyecto generado
 * @param {Object} projectData - Datos del proyecto
 * @param {string} materia - Materia seleccionada
 * @returns {Object} - Proyecto validado
 */
function validarYCompletarProyecto(projectData, materia) {
  const timestamp = Date.now();
  
  // Validar campos requeridos
  if (!projectData.name || !projectData.exercises || !projectData.finalProject) {
    throw new Error('El proyecto generado no tiene la estructura correcta');
  }

  // Completar con valores predeterminados si faltan
  const proyecto = {
    id: timestamp,
    name: projectData.name,
    description: projectData.description || 'Proyecto generado con IA',
    difficulty: projectData.difficulty || 'Media',
    icon: projectData.icon || '🎯',
    color: projectData.color || '#6366f1',
    materia: materia,
    temasUsados: projectData.temasUsados || [],
    isCustom: true,
    createdAt: new Date().toISOString(),
    exercises: [],
    finalProject: projectData.finalProject
  };

  // Procesar ejercicios
  projectData.exercises.forEach((exercise, index) => {
    proyecto.exercises.push({
      id: timestamp + index + 1,
      projectId: timestamp,
      title: exercise.title,
      description: exercise.description,
      expectedOutput: exercise.expectedOutput,
      starterCode: exercise.starterCode,
      hints: exercise.hints || []
    });
  });

  return proyecto;
}

/**
 * Obtiene el nombre completo de la materia
 * @param {string} materia - Código de la materia
 * @returns {string} - Nombre completo
 */
function getNombreMateria(materia) {
  const nombres = {
    fundamentos: 'Fundamentos de Programación',
    estructuras: 'Algoritmos y Estructuras de Datos',
    analisis: 'Análisis y Diseño de Algoritmos'
  };
  return nombres[materia] || materia;
}

/**
 * Obtiene información sobre las materias disponibles
 * @returns {Array<Object>} - Array de materias con metadata
 */
function obtenerMateriasDisponibles() {
  return [
    {
      id: 'fundamentos',
      nombre: 'Fundamentos de Programación',
      descripcion: 'Conceptos básicos de programación en C',
      icon: '📚',
      color: '#10b981',
      nivel: 1,
      prerequisitos: []
    },
    {
      id: 'estructuras',
      nombre: 'Algoritmos y Estructuras de Datos',
      descripcion: 'Estructuras de datos y algoritmos fundamentales',
      icon: '🔗',
      color: '#f59e0b',
      nivel: 2,
      prerequisitos: ['fundamentos'],
      incluye: ['fundamentos']
    },
    {
      id: 'analisis',
      nombre: 'Análisis y Diseño de Algoritmos',
      descripcion: 'Análisis de complejidad y diseño de algoritmos avanzados',
      icon: '📊',
      color: '#ef4444',
      nivel: 3,
      prerequisitos: ['fundamentos', 'estructuras'],
      incluye: ['fundamentos', 'estructuras']
    }
  ];
}

/**
 * Analiza un error de compilación usando Gemini
 * @param {Object} params - Parámetros
 * @param {string} params.code - Código fuente
 * @param {string} params.error - Mensaje de error
 * @param {string} params.materia - Materia del ejercicio
 * @returns {Promise<string>} - Sugerencia de la IA
 */
async function analizarErrorCompilacion({ code, error, materia }) {
  try {
    const prompt = `
Eres un tutor experto de programación en C para estudiantes de ${getNombreMateria(materia)}.

Un estudiante tiene el siguiente error de compilación:

CÓDIGO:
\`\`\`c
${code}
\`\`\`

ERROR:
${error}

Proporciona una explicación clara y educativa que incluya:
1. Qué significa el error en términos simples
2. Por qué ocurrió (causa raíz)
3. Cómo corregirlo (sin dar la solución completa)
4. Un consejo para evitar este error en el futuro

Sé breve (máximo 200 palabras), amable y educativo. Usa emojis ocasionalmente.
`;

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    
    return response.text();
  } catch (error) {
    console.error('Error al analizar con IA:', error);
    return 'No se pudo obtener sugerencia de la IA en este momento.';
  }
}

/**
 * Analiza un error de ejecución usando Gemini
 */
async function analizarErrorEjecucion({ code, error, materia }) {
  try {
    const prompt = `
Eres un tutor experto de C para ${getNombreMateria(materia)}.

Un estudiante tiene un error de ejecución:

CÓDIGO:
\`\`\`c
${code}
\`\`\`

ERROR:
${error}

Explica brevemente:
1. Qué tipo de error de ejecución es
2. Posibles causas en el código
3. Cómo debuggearlo
4. Una pista para corregirlo

Máximo 200 palabras, amable y con emojis ocasionales.
`;

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    
    return response.text();
  } catch (error) {
    console.error('Error al analizar con IA:', error);
    return 'No se pudo obtener sugerencia de la IA en este momento.';
  }
}

/**
 * Analiza por qué el output no coincide con el esperado
 */
async function analizarOutputIncorrecto({ code, actualOutput, expectedOutput, materia }) {
  try {
    const prompt = `
Eres un tutor de C para ${getNombreMateria(materia)}.

El código compila pero el output no es el esperado:

CÓDIGO:
\`\`\`c
${code}
\`\`\`

OUTPUT OBTENIDO:
${actualOutput}

OUTPUT ESPERADO:
${expectedOutput}

Analiza brevemente:
1. Qué diferencias hay entre ambos outputs
2. Posibles errores lógicos o de formato
3. Pistas específicas sobre qué revisar
4. Un consejo para verificar el output

NO des la solución completa. Máximo 200 palabras con emojis ocasionales.
`;

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    
    return response.text();
  } catch (error) {
    console.error('Error al analizar con IA:', error);
    return 'No se pudo obtener sugerencia de la IA en este momento.';
  }
}

module.exports = {
  generarProyectoConIA,
  obtenerTemasDisponibles,
  obtenerMateriasDisponibles,
  analizarErrorCompilacion,
  analizarErrorEjecucion,
  analizarOutputIncorrecto,
  getNombreMateria
};