import React, { useState } from 'react';
import ExerciseList from './components/ExerciseList';
import CodeEditor from './components/CodeEditor';
import ResultPanel from './components/ResultPanel';
import Navbar from './components/Navbar';
import './App.css';

// Base de datos de ejercicios de fundamentos de C
const exercises = [
  {
    id: 1,
    title: "Hola Mundo",
    difficulty: "Fácil",
    description: "Escribe un programa que imprima 'Hola Mundo' en la consola.",
    expectedOutput: "Hola Mundo\n",
    starterCode: `#include <stdio.h>

int main() {
    // Escribe tu código aquí
    
    return 0;
}`,
    hints: [
      "Usa la función printf() para imprimir texto",
      "No olvides el \\n al final para el salto de línea"
    ]
  },
  {
    id: 2,
    title: "Suma de Dos Números",
    difficulty: "Fácil",
    description: "Crea un programa que sume dos números (5 y 3) e imprima el resultado.",
    expectedOutput: "8\n",
    starterCode: `#include <stdio.h>

int main() {
    int a = 5;
    int b = 3;
    // Calcula la suma e imprímela
    
    return 0;
}`,
    hints: [
      "Declara una variable para almacenar la suma",
      "Usa printf() con %d para imprimir enteros"
    ]
  },
  {
    id: 3,
    title: "Área de un Círculo",
    difficulty: "Media",
    description: "Calcula el área de un círculo con radio 5. Usa PI = 3.14159 y redondea a 2 decimales.",
    expectedOutput: "78.54\n",
    starterCode: `#include <stdio.h>

#define PI 3.14159

int main() {
    int radio = 5;
    // Calcula el área (PI * radio * radio)
    
    return 0;
}`,
    hints: [
      "Usa una variable float para el área",
      "La fórmula es: área = PI * radio * radio",
      "Usa %.2f en printf() para 2 decimales"
    ]
  },
  {
    id: 4,
    title: "Número Par o Impar",
    difficulty: "Media",
    description: "Determina si el número 7 es par o impar. Imprime 'Par' o 'Impar'.",
    expectedOutput: "Impar\n",
    starterCode: `#include <stdio.h>

int main() {
    int numero = 7;
    // Usa el operador % (módulo) para determinar si es par o impar
    
    return 0;
}`,
    hints: [
      "Un número es par si numero % 2 == 0",
      "Usa una estructura if-else"
    ]
  },
  {
    id: 5,
    title: "Factorial de un Número",
    difficulty: "Difícil",
    description: "Calcula el factorial de 5 (5! = 5 × 4 × 3 × 2 × 1 = 120).",
    expectedOutput: "120\n",
    starterCode: `#include <stdio.h>

int main() {
    int n = 5;
    int factorial = 1;
    // Usa un bucle para calcular el factorial
    
    return 0;
}`,
    hints: [
      "Usa un bucle for desde 1 hasta n",
      "Multiplica factorial por cada número en el bucle"
    ]
  },
  {
    id: 6,
    title: "Serie de Fibonacci",
    difficulty: "Difícil",
    description: "Imprime los primeros 7 números de Fibonacci en una línea, separados por espacios: 0 1 1 2 3 5 8",
    expectedOutput: "0 1 1 2 3 5 8 \n",
    starterCode: `#include <stdio.h>

int main() {
    int n = 7;
    int a = 0, b = 1;
    // Imprime los primeros n números de Fibonacci
    
    return 0;
}`,
    hints: [
      "Imprime primero a y b",
      "Usa un bucle para calcular los siguientes números",
      "En cada iteración: siguiente = a + b, luego a = b, b = siguiente"
    ]
  }
];

function App() {
  const [selectedExercise, setSelectedExercise] = useState(exercises[0]);
  const [userCode, setUserCode] = useState(exercises[0].starterCode);
  const [compilationResult, setCompilationResult] = useState(null);
  const [isCompiling, setIsCompiling] = useState(false);

  const handleExerciseSelect = (exercise) => {
    setSelectedExercise(exercise);
    setUserCode(exercise.starterCode);
    setCompilationResult(null);
  };

  const handleCodeChange = (code) => {
    setUserCode(code);
  };

  const handleCompile = async () => {
    setIsCompiling(true);
    setCompilationResult(null);

    try {
      // Aquí se hace la llamada al backend para compilar el código
      const response = await fetch('http://localhost:3001/api/compile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: userCode,
          expectedOutput: selectedExercise.expectedOutput,
          exerciseId: selectedExercise.id
        }),
      });

      const result = await response.json();
      
      setCompilationResult({
        success: result.success,
        output: result.output,
        expectedOutput: selectedExercise.expectedOutput,
        isCorrect: result.isCorrect,
        error: result.error,
        aiSuggestion: result.aiSuggestion // Aquí vendrá la sugerencia de la IA
      });

    } catch (error) {
      setCompilationResult({
        success: false,
        error: 'Error al conectar con el servidor: ' + error.message,
        isCorrect: false
      });
    } finally {
      setIsCompiling(false);
    }
  };

  return (
    <div className="app">
      <Navbar />
      
      <div className="main-container">
        <ExerciseList 
          exercises={exercises}
          selectedExercise={selectedExercise}
          onExerciseSelect={handleExerciseSelect}
        />
        
        <div className="workspace">
          <div className="exercise-detail">
            <div className="exercise-header">
              <h2>{selectedExercise.title}</h2>
              <span className={`difficulty difficulty-${selectedExercise.difficulty.toLowerCase()}`}>
                {selectedExercise.difficulty}
              </span>
            </div>
            
            <p className="exercise-description">{selectedExercise.description}</p>
            
            <div className="expected-output-box">
              <h4>Output Esperado:</h4>
              <pre>{selectedExercise.expectedOutput}</pre>
            </div>

            {selectedExercise.hints && selectedExercise.hints.length > 0 && (
              <details className="hints-section">
                <summary>💡 Ver Pistas</summary>
                <ul>
                  {selectedExercise.hints.map((hint, index) => (
                    <li key={index}>{hint}</li>
                  ))}
                </ul>
              </details>
            )}
          </div>

          <CodeEditor 
            code={userCode}
            onChange={handleCodeChange}
            onCompile={handleCompile}
            isCompiling={isCompiling}
          />

          {compilationResult && (
            <ResultPanel result={compilationResult} />
          )}
        </div>
      </div>
    </div>
  );
}

export default App;