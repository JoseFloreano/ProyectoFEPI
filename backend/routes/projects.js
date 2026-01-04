// backend/routes/projects.js - NUEVO
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { authenticate } = require('../middleware/auth');

// Proyectos base (hardcodeados) - los 3 iniciales
const BASE_PROJECTS = [
  {
    id: 1,
    name: 'Calculadora Básica',
    description: 'Aprende los fundamentos de C creando una calculadora con operaciones básicas.',
    difficulty: 'Fácil',
    icon: '🔢',
    color: '#10b981',
    exercises: [
      {
        id: 1,
        projectId: 1,
        title: 'Suma de Dos Números',
        description: 'Crea un programa que sume dos números (5 y 3) e imprima el resultado.',
        expectedOutput: '8\n',
        starterCode: `#include <stdio.h>\n\nint main() {\n    int a = 5;\n    int b = 3;\n    // Calcula la suma e imprímela\n    \n    return 0;\n}`,
        hints: ['Declara una variable para almacenar la suma', 'Usa printf() con %d para imprimir enteros'],
        theoryTopics: ['variables', 'operadores aritméticos', 'entrada/salida básica']
      },
      {
        id: 2,
        projectId: 1,
        title: 'Resta y Multiplicación',
        description: 'Programa que calcule y muestre la resta (10 - 4) y multiplicación (6 * 7).',
        expectedOutput: '6\n42\n',
        starterCode: `#include <stdio.h>\n\nint main() {\n    // Calcula 10 - 4 y 6 * 7\n    \n    return 0;\n}`,
        hints: ['Usa variables separadas para cada operación', 'Imprime cada resultado en una línea diferente'],
        theoryTopics: ['operadores aritméticos', 'variables', 'printf']
      },
      {
        id: 3,
        projectId: 1,
        title: 'División con Decimales',
        description: 'Calcula la división de 15 entre 4 con 2 decimales.',
        expectedOutput: '3.75\n',
        starterCode: `#include <stdio.h>\n\nint main() {\n    float resultado;\n    // Calcula 15 / 4.0\n    \n    return 0;\n}`,
        starterCode: `#include <stdio.h>\n\nint main() {\n    float resultado;\n    // Calcula 15 / 4.0\n    \n    return 0;\n}`,
        hints: ['Usa float para manejar decimales', 'Asegúrate de dividir entre 4.0 (float) no 4 (int)'],
        theoryTopics: ['tipos de datos', 'division_decimal', 'formato de impresión con printf']
      }
    ],
    finalProject: {
      title: 'Calculadora Completa',
      description: 'Crea una calculadora que pida dos números al usuario y muestre suma, resta, multiplicación y división.',
      starterCode: `#include <stdio.h>\n\nint main() {\n    float num1, num2;\n    \n    printf("Ingresa el primer número: ");\n    scanf("%f", &num1);\n    \n    printf("Ingresa el segundo número: ");\n    scanf("%f", &num2);\n    \n    // Realiza las 4 operaciones e imprime los resultados\n    \n    return 0;\n}`,
      theoryTopics: ['entrada de usuario con scanf', 'operaciones aritméticas', 'formato de impresión']
    }
  },
  {
    id: 2,
    name: 'Control de Flujo',
    description: 'Domina las estructuras condicionales y bucles en C.',
    difficulty: 'Media',
    icon: '🔀',
    color: '#f59e0b',
    exercises: [
      {
        id: 4,
        projectId: 2,
        title: 'Número Par o Impar',
        description: 'Determina si el número 7 es par o impar. Imprime "Par" o "Impar".',
        expectedOutput: 'Impar\n',
        starterCode: `#include <stdio.h>\n\nint main() {\n    int numero = 7;\n    // Usa el operador % (módulo) para determinar si es par o impar\n    \n    return 0;\n}`,
        hints: ['Un número es par si numero % 2 == 0', 'Usa una estructura if-else'],
        theoryTopics: ['estructuras condicionales', 'operador módulo', 'printf']
      },
      {
        id: 5,
        projectId: 2,
        title: 'Mayor de Tres Números',
        description: 'Encuentra el mayor entre 5, 12 y 8.',
        expectedOutput: '12\n',
        starterCode: `#include <stdio.h>\n\nint main() {\n    int a = 5, b = 12, c = 8;\n    // Encuentra el mayor\n    \n    return 0;\n}`,
        hints: ['Compara primero a y b', 'Luego compara el resultado con c'],
        theoryTopics: ['estructuras condicionales', 'operadores de comparación', 'printf']
      },
      {
        id: 6,
        projectId: 2,
        title: 'Números del 1 al 5',
        description: 'Imprime los números del 1 al 5, cada uno en una línea.',
        expectedOutput: '1\n2\n3\n4\n5\n',
        starterCode: `#include <stdio.h>\n\nint main() {\n    // Usa un bucle for\n    \n    return 0;\n}`,
        hints: ['for(int i = 1; i <= 5; i++)', 'Imprime i en cada iteración'],
        theoryTopics: ['bucles for', 'printf', 'incremento de variables']
      }
    ],
    finalProject: {
      title: 'Menú de Opciones',
      description: 'Crea un menú que permita al usuario elegir entre diferentes operaciones (par/impar, mayor de tres, tabla de multiplicar).',
      starterCode: `#include <stdio.h>\n\nint main() {\n    int opcion;\n    \n    printf("=== MENÚ ===\\n");\n    printf("1. Verificar par/impar\\n");\n    printf("2. Mayor de tres números\\n");\n    printf("3. Tabla de multiplicar\\n");\n    printf("Elige una opción: ");\n    scanf("%d", &opcion);\n    \n    // Implementa cada opción con switch\n    \n    return 0;\n}`,
      theoryTopics: ['estructuras switch', 'entrada de usuario', 'bucles y condicionales']
    }
  },
  {
    id: 3,
    name: 'Algoritmos Clásicos',
    description: 'Implementa algoritmos matemáticos fundamentales.',
    difficulty: 'Difícil',
    icon: '🧮',
    color: '#ef4444',
    exercises: [
      {
        id: 7,
        projectId: 3,
        title: 'Factorial de un Número',
        description: 'Calcula el factorial de 5 (5! = 5 × 4 × 3 × 2 × 1 = 120).',
        expectedOutput: '120\n',
        starterCode: `#include <stdio.h>\n\nint main() {\n    int n = 5;\n    int factorial = 1;\n    // Usa un bucle para calcular el factorial\n    \n    return 0;\n}`,
        hints: ['Usa un bucle for desde 1 hasta n', 'Multiplica factorial por cada número en el bucle'],
        theoryTopics: ['bucles', 'variables', 'operadores de asignación']
      },
      {
        id: 8,
        projectId: 3,
        title: 'Serie de Fibonacci',
        description: 'Imprime los primeros 7 números de Fibonacci en una línea, separados por espacios: 0 1 1 2 3 5 8',
        expectedOutput: '0 1 1 2 3 5 8 \n',
        starterCode: `#include <stdio.h>\n\nint main() {\n    int n = 7;\n    int a = 0, b = 1;\n    // Imprime los primeros n números de Fibonacci\n    \n    return 0;\n}`,
        hints: ['Imprime primero a y b', 'En cada iteración: siguiente = a + b, luego a = b, b = siguiente'],
        theoryTopics: ['bucles', 'variables', 'secuencias']
      },
      {
        id: 9,
        projectId: 3,
        title: 'Número Primo',
        description: 'Verifica si el número 17 es primo. Imprime "Primo" o "No primo".',
        expectedOutput: 'Primo\n',
        starterCode: `#include <stdio.h>\n\nint main() {\n    int num = 17;\n    // Verifica si es primo\n    \n    return 0;\n}`,
        hints: ['Un número es primo si solo es divisible entre 1 y sí mismo', 'Usa un bucle para verificar divisores desde 2 hasta num-1'],
        theoryTopics: ['bucles', 'estructuras condicionales', 'operadores de comparación']
      }
    ],
    finalProject: {
      title: 'Analizador de Números',
      description: 'Programa que analice un número: muestre su factorial, si es primo, y genere la serie Fibonacci hasta ese número.',
      starterCode: `#include <stdio.h>\n\nint main() {\n    int num;\n    \n    printf("Ingresa un número: ");\n    scanf("%d", &num);\n    \n    // 1. Calcula y muestra el factorial\n    // 2. Verifica si es primo\n    // 3. Genera Fibonacci hasta num\n    \n    return 0;\n}`,
      theoryTopics: ['funciones', 'bucles', 'estructuras condicionales']
    }
  }
];

/**
 * GET /api/projects
 * Obtener TODOS los proyectos (base + personalizados del usuario)
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.userId);

    // Combinar proyectos base con personalizados del usuario
    const allProjects = [
      ...BASE_PROJECTS,
      ...user.proyectosPersonalizados
    ];

    res.json({
      success: true,
      data: {
        projects: allProjects,
        total: allProjects.length,
        personalizados: user.proyectosPersonalizados.length
      }
    });

  } catch (error) {
    console.error('Error al obtener proyectos:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener proyectos.',
      error: error.message
    });
  }
});

/**
 * POST /api/projects/custom
 * Agregar proyecto personalizado creado con IA
 */
router.post('/custom', authenticate, async (req, res) => {
  try {
    const { projectData } = req.body;

    if (!projectData || !projectData.name || !projectData.exercises) {
      return res.status(400).json({
        success: false,
        message: 'Datos del proyecto incompletos.'
      });
    }

    const user = await User.findById(req.userId);

    // Asignar ID único (timestamp + cantidad de proyectos personalizados)
    // Asignar ID único (timestamp + cantidad de proyectos personalizados)
    const customProject = {
      ...projectData,
      id: Date.now() + user.proyectosPersonalizados.length,
      isCustom: true,
      fechaCreacion: Date.now()
    };

    console.log(`💾 Guardando proyecto personalizado: ${customProject.name} (${customProject.exercises.length} ejercicios)`);

    await user.agregarProyectoPersonalizado(customProject);
    console.log('✅ Proyecto guardado en usuario.');

    res.status(201).json({
      success: true,
      message: 'Proyecto personalizado agregado exitosamente.',
      data: {
        project: customProject
      }
    });

  } catch (error) {
    console.error('Error al agregar proyecto personalizado:', error);
    res.status(500).json({
      success: false,
      message: 'Error al agregar proyecto personalizado.',
      error: error.message
    });
  }
});

/**
 * GET /api/projects/custom
 * Obtener solo proyectos personalizados del usuario
 */
router.get('/custom', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.userId);

    res.json({
      success: true,
      data: {
        projects: user.proyectosPersonalizados,
        total: user.proyectosPersonalizados.length
      }
    });

  } catch (error) {
    console.error('Error al obtener proyectos personalizados:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener proyectos personalizados.',
      error: error.message
    });
  }
});

/**
 * DELETE /api/projects/custom/:id
 * Eliminar proyecto personalizado
 */
router.delete('/custom/:id', authenticate, async (req, res) => {
  try {
    const projectId = parseInt(req.params.id);

    const user = await User.findById(req.userId);

    // Filtrar el proyecto a eliminar
    user.proyectosPersonalizados = user.proyectosPersonalizados.filter(
      p => p.id !== projectId
    );

    await user.save();

    res.json({
      success: true,
      message: 'Proyecto personalizado eliminado exitosamente.'
    });

  } catch (error) {
    console.error('Error al eliminar proyecto personalizado:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar proyecto personalizado.',
      error: error.message
    });
  }
});

module.exports = router;