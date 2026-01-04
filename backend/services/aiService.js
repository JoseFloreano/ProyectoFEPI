// services/aiService.js - Servicio de IA con fallback Gemini → Groq
const { GoogleGenerativeAI } = require('@google/generative-ai');
const Groq = require('groq-sdk');
const fs = require('fs').promises;
const path = require('path');
const csv = require('csv-parser');
const { createReadStream } = require('fs');

// ===================================================================
// CONFIGURACIÓN DE IAs
// ===================================================================

// Inicializar Gemini AI
const genAI = process.env.GEMINI_API_KEY
  ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  : null;

// Inicializar Groq AI (Backup)
const groq = process.env.GROQ_API_KEY
  ? new Groq({ apiKey: process.env.GROQ_API_KEY })
  : null;

// Configuración de modelos
const AI_CONFIG = {
  gemini: {
    name: 'Gemini',
    model: 'gemini-2.5-flash',
    available: !!genAI,
    priority: 1
  },
  groq: {
    name: 'Groq',
    model: 'llama-3.3-70b-versatile', // Modelo rápido y potente
    available: !!groq,
    priority: 2
  }
};

// Log de IAs disponibles
if (AI_CONFIG.gemini.available) {
  console.log('✅ Gemini AI disponible (primario)');
} else {
  console.warn('⚠️  Gemini API key no configurada');
}

if (AI_CONFIG.groq.available) {
  console.log('✅ Groq AI disponible (backup)');
} else {
  console.warn('⚠️  Groq API key no configurada');
}

// ===================================================================
// FUNCIÓN PRINCIPAL DE GENERACIÓN CON FALLBACK
// ===================================================================

/**
 * Genera contenido con IA usando sistema de fallback
 * @param {string} prompt - Prompt para la IA
 * @param {Object} options - Opciones adicionales (temperature, validator)
 * @returns {Promise<string>} - Respuesta de la IA
 */
async function generateWithAI(prompt, options = {}) {
  const { temperature = 0.7, validator = null } = options;

  // Intentar con Gemini primero
  if (AI_CONFIG.gemini.available) {
    try {
      console.log('🤖 Usando Gemini AI...');
      const response = await generateWithGemini(prompt, { temperature });

      // Validación opcional de la respuesta
      if (validator) {
        try {
          // Si el validador lanza error, se captura abajo y activa el fallback
          validator(response);
        } catch (validationError) {
          throw new Error(`Validación de respuesta falló: ${validationError.message}`);
        }
      }

      console.log('✅ Respuesta generada y validada con Gemini');
      return response;
    } catch (error) {
      console.warn('⚠️  Gemini falló:', error.message);
      console.log('🔄 Intentando con Groq...');
    }
  }

  // Fallback a Groq
  if (AI_CONFIG.groq.available) {
    try {
      console.log('🤖 Usando Groq AI (backup)...');
      const response = await generateWithGroq(prompt, { temperature });

      // Validar también la respuesta de Groq
      if (validator) {
        validator(response);
      }

      console.log('✅ Respuesta generada con Groq');
      return response;
    } catch (error) {
      console.error('❌ Groq también falló:', error.message);
      throw new Error('Todos los servicios de IA están temporalmente no disponibles o devolvieron respuestas inválidas.');
    }
  }

  throw new Error('No hay servicios de IA configurados. Verifica tus API keys.');
}

/**
 * Genera contenido con Gemini
 */
async function generateWithGemini(prompt, options = {}) {
  const model = genAI.getGenerativeModel({
    model: AI_CONFIG.gemini.model,
    generationConfig: {
      temperature: options.temperature || 0.7,
      topP: 0.95,
      topK: 40,
      maxOutputTokens: 8192,
      responseMimeType: 'application/json',
    }
  });

  const result = await model.generateContent(prompt);
  const response = await result.response;
  return response.text();
}

/**
 * Genera contenido con Groq
 */
async function generateWithGroq(prompt, options = {}) {
  const chatCompletion = await groq.chat.completions.create({
    messages: [
      {
        role: 'user',
        content: prompt
      }
    ],
    model: AI_CONFIG.groq.model,
    temperature: options.temperature || 0.7,
    max_tokens: 8192,
    top_p: 0.95,
    stream: false,
    // Groq también soporta modo JSON en algunos modelos
    response_format: { type: "json_object" }
  });

  return chatCompletion.choices[0]?.message?.content || '';
}

// ===================================================================
// FUNCIONES DE TEMARIOS
// ===================================================================

const TEMARIOS_DIR = path.join(__dirname, '..', 'temarios');
const TEMARIOS = {
  fundamentos: path.join(TEMARIOS_DIR, 'fundamentos-programacion.csv'),
  estructuras: path.join(TEMARIOS_DIR, 'estructuras-datos.csv'),
  analisis: path.join(TEMARIOS_DIR, 'analisis-algoritmos.csv')
};

async function leerTemasCSV(filePath) {
  return new Promise((resolve, reject) => {
    const temas = [];

    createReadStream(filePath)
      .pipe(csv())
      .on('data', (row) => {
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

async function obtenerTemasDisponibles(materia) {
  try {
    let temas = [];

    switch (materia) {
      case 'analisis':
        const temasAnalisis = await leerTemasCSV(TEMARIOS.analisis);
        const temasEstructuras2 = await leerTemasCSV(TEMARIOS.estructuras);
        const temasFundamentos2 = await leerTemasCSV(TEMARIOS.fundamentos);
        temas = [...temasFundamentos2, ...temasEstructuras2, ...temasAnalisis];
        break;

      case 'estructuras':
        const temasEstructuras = await leerTemasCSV(TEMARIOS.estructuras);
        const temasFundamentos = await leerTemasCSV(TEMARIOS.fundamentos);
        temas = [...temasFundamentos, ...temasEstructuras];
        break;

      case 'fundamentos':
      default:
        temas = await leerTemasCSV(TEMARIOS.fundamentos);
        break;
    }

    return temas;
  } catch (error) {
    console.error('Error al leer temarios:', error);
    throw new Error('No se pudieron cargar los temarios');
  }
}

function getNombreMateria(materia) {
  const nombres = {
    fundamentos: 'Fundamentos de Programación',
    estructuras: 'Algoritmos y Estructuras de Datos',
    analisis: 'Análisis y Diseño de Algoritmos'
  };
  return nombres[materia] || materia;
}

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

// ===================================================================
// FUNCIONES DE GENERACIÓN CON IA (ACTUALIZADAS CON FALLBACK)
// ===================================================================

/**
 * Genera un proyecto personalizado usando IA con fallback
 */
async function generarProyectoConIA({ userRequest, materia, conversationHistory = [] }) {
  try {
    const temasDisponibles = await obtenerTemasDisponibles(materia);

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
    }
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

    // Validador de JSON simple para activar el fallback
    const jsonValidator = (text) => {
      let clean = text.trim();
      clean = clean.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      const firstBrace = clean.indexOf('{');
      const lastBrace = clean.lastIndexOf('}');
      if (firstBrace === -1 || lastBrace === -1) throw new Error("No se encontró estructura JSON");
      // Intentar parsear para verificar integridad
      const jsonStr = clean.substring(firstBrace, lastBrace + 1);
      JSON.parse(jsonStr);
    };

    // ===== USAR SISTEMA DE FALLBACK CON VALIDACIÓN =====
    const text = await generateWithAI(prompt, {
      temperature: 0.7,
      validator: jsonValidator
    });

    // Limpieza robusta de JSON (ya sabemos que es válido gracias al validador)
    let jsonText = text.trim();
    jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');

    const firstBrace = jsonText.indexOf('{');
    const lastBrace = jsonText.lastIndexOf('}');

    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      jsonText = jsonText.substring(firstBrace, lastBrace + 1);
    }

    // 3. Intentar parsear
    let projectData;
    try {
      projectData = JSON.parse(jsonText);
    } catch (parseError) {
      console.error('Error parseando JSON de IA. Texto recibido:', jsonText);
      // Intento de recuperación básica: escapar saltos de linea no escapados en strings
      try {
        const sanitized = jsonText.replace(/\n/g, '\\n');
        projectData = JSON.parse(sanitized);
      } catch (retryError) {
        throw new Error(`Respuesta de IA no es un JSON válido: ${parseError.message}`);
      }
    }

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
 * Analiza un error de compilación usando IA con fallback
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

Proporciona una explicación clara, sencilla y educativa que incluya:
- Qué significa el error
- Cómo corregirlo (sin dar la solución completa)
- Un consejo para evitar este error en el futuro

Sé breve (máximo 50 palabras), amable y educativo. Usa emojis ocasionalmente.
`;

    // ===== USAR SISTEMA DE FALLBACK =====
    return await generateWithAI(prompt, { temperature: 0.7 });

  } catch (error) {
    console.error('Error al analizar con IA:', error);
    return 'No se pudo obtener sugerencia de la IA en este momento.';
  }
}

/**
 * Analiza un error de ejecución usando IA con fallback
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
- Qué causó el error
- Posibles causas en el código
- Una pista para corregirlo

Máximo 50 palabras, amable y con emojis ocasionales.
`;

    // ===== USAR SISTEMA DE FALLBACK =====
    return await generateWithAI(prompt, { temperature: 0.7 });

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

NO des la solución completa. Máximo 50 palabras con emojis ocasionales.
`;

    // ===== USAR SISTEMA DE FALLBACK =====
    return await generateWithAI(prompt, { temperature: 0.7 });

  } catch (error) {
    console.error('Error al analizar con IA:', error);
    return 'No se pudo obtener sugerencia de la IA en este momento.';
  }
}

/**
 * Genera teoría educativa a partir de topics específicos
 */
async function generarTeoriaPorTemas({ topics, materia }) {
  try {
    const prompt = `
Eres un profesor experto en programación en C para ${getNombreMateria(materia)}.

Explica de forma clara, breve y educativa los siguientes temas:

TEMAS:
${topics.map(t => `- ${t}`).join('\n')}

REGLAS:
- Explica como para estudiante universitario
- Usa ejemplos pequeños en C si es necesario
- No más de 120 palabras
- Tono claro, didáctico y amigable
- NO uses markdown ni títulos
- Todo debe ser texto plano
`;

    // ===== USAR SISTEMA DE FALLBACK =====
    return await generateWithAI(prompt, { temperature: 0.7 });

  } catch (error) {
    console.error('Error al generar teoría:', error);
    return 'No se pudo generar la teoría en este momento.';
  }
}

/**
 * Valida y completa los datos del proyecto generado
 */
function validarYCompletarProyecto(projectData, materia) {
  const timestamp = Date.now();

  if (!projectData.name || !projectData.exercises || !projectData.finalProject) {
    throw new Error('El proyecto generado no tiene la estructura correcta');
  }

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

// ===================================================================
// EXPORTS
// ===================================================================

module.exports = {
  generarProyectoConIA,
  obtenerTemasDisponibles,
  obtenerMateriasDisponibles,
  analizarErrorCompilacion,
  analizarErrorEjecucion,
  analizarOutputIncorrecto,
  generarTeoriaPorTemas,
  getNombreMateria,
  // Exportar configuración para diagnóstico
  AI_CONFIG
};