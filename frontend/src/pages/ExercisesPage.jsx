import React, { useState } from 'react';
import { useDatabase } from '../context/DatabaseContext';
import CodeEditor from '../components/CodeEditor';
import ResultPanel from '../components/ResultPanel';
import '../styles/ExercisesPage.css';

function ExercisesPage() {
  const { 
    projects, 
    activeProject, 
    setActiveProjectById, 
    completeExercise, 
    isExerciseCompleted,
    getProjectProgress
  } = useDatabase();

  const [selectedExercise, setSelectedExercise] = useState(null);
  const [userCode, setUserCode] = useState('');
  const [compilationResult, setCompilationResult] = useState(null);
  const [isCompiling, setIsCompiling] = useState(false);
  const [userInputs, setUserInputs] = useState('');
  const [theoryCache, setTheoryCache] = useState({});
  const [loadingTheory, setLoadingTheory] = useState(false);
  const [showTheory, setShowTheory] = useState(false);



  // ===== NUEVO: Detectar si el código necesita inputs =====
  const needsInput = userCode.includes('scanf') || 
                     userCode.includes('gets') || 
                     userCode.includes('fgets') ||
                     userCode.includes('getchar') ||
                     userCode.includes('getc');

  // Manejar selección de proyecto
  const handleProjectSelect = (project) => {
    setActiveProjectById(project.id);
    setSelectedExercise(null);
    setCompilationResult(null);
    setUserInputs(''); // Limpiar inputs al cambiar de proyecto
  };

  // Manejar selección de ejercicio
  const handleExerciseSelect = (exercise) => {
    setSelectedExercise(exercise);
    setUserCode(exercise.starterCode);
    setUserInputs(''); // Limpiar inputs al cambiar de ejercicio
    setShowTheory(false);
    setLoadingTheory(false);
  };

  // Manejar cambio de código
  const handleCodeChange = (code) => {
    setUserCode(code);
  };

  // Compilar código
  const handleCompile = async () => {
    setIsCompiling(true);
    setCompilationResult(null);

    try {
      const response = await fetch('http://localhost:3001/api/compile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: userCode,
          expectedOutput: selectedExercise.expectedOutput,
          exerciseId: selectedExercise.id,
          userInputs: userInputs // Enviar inputs al backend
        }),
      });

      const result = await response.json();
      
      setCompilationResult({
        success: result.success,
        output: result.output,
        expectedOutput: selectedExercise.expectedOutput,
        isCorrect: result.isCorrect,
        error: result.error,
        aiSuggestion: result.aiSuggestion
      });

      // Si el ejercicio es correcto, marcarlo como completado
      if (result.isCorrect) {
        completeExercise(selectedExercise.id);
      }

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

  const handleGetTheory = async () => {
    if (!selectedExercise) return;

    const exerciseId = selectedExercise.id;

    // Si ya está visible, solo ocultar
    if (showTheory) {
      setShowTheory(false);
      return;
    }

    setShowTheory(true);

    // 🔥 Si ya existe teoría para este ejercicio, NO llamar a IA
    if (theoryCache[exerciseId]) return;

    setLoadingTheory(true);

    try {
      const response = await fetch('http://localhost:3001/api/theory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          materia: 'fundamentos',
          topics: selectedExercise.theoryTopics || [
            selectedExercise.title
          ]
        })
      });

      const data = await response.json();

      setTheoryCache(prev => ({
        ...prev,
        [exerciseId]: data.text || 'No se pudo generar la teoría.'
      }));

    } catch (error) {
      console.error(error);
      setTheoryCache(prev => ({
        ...prev,
        [exerciseId]: '❌ Error al conectar con el servidor.'
      }));
    } finally {
      setLoadingTheory(false);
    }
  };


  return (
    <div className="page-wrapper full-width">
      <div className="exercises-page">
        {/* Selector de Proyectos */}
        <aside className="projects-sidebar">
          <div className="sidebar-header">
            <h3>📚 Proyectos</h3>
          </div>

          <div className="projects-list">
            {projects.map(project => {
              const progress = getProjectProgress(project.id);
              const isActive = activeProject?.id === project.id;

              return (
                <div
                  key={project.id}
                  className={`project-item ${isActive ? 'active' : ''}`}
                  onClick={() => handleProjectSelect(project)}
                  style={{ '--project-color': project.color }}
                >
                  <div className="project-item-header">
                    <span className="project-icon">{project.icon}</span>
                    <div className="project-info">
                      <h4>{project.name}</h4>
                      <span className={`difficulty-tag ${project.difficulty.toLowerCase()}`}>
                        {project.difficulty}
                      </span>
                    </div>
                  </div>

                  <div className="project-progress">
                    <div className="progress-bar">
                      <div 
                        className="progress-fill" 
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <span className="progress-text">{progress}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </aside>

        {/* Área de Trabajo */}
        <div className="exercises-workspace">
          {!activeProject ? (
            <div className="empty-state">
              <span className="empty-icon">📂</span>
              <h2>Selecciona un Proyecto</h2>
              <p>Elige un proyecto de la lista para comenzar a practicar</p>
            </div>
          ) : !selectedExercise ? (
            <div className="project-overview">
              <div className="overview-header">
                <span className="overview-icon">{activeProject.icon}</span>
                <div>
                  <h1>{activeProject.name}</h1>
                  <p className="overview-description">{activeProject.description}</p>
                </div>
              </div>

              <div className="exercises-grid">
                <h3>Ejercicios</h3>
                {activeProject.exercises.map(exercise => {
                  const isCompleted = isExerciseCompleted(exercise.id);
                  
                  return (
                    <div
                      key={exercise.id}
                      className={`exercise-card ${isCompleted ? 'completed' : ''}`}
                      onClick={() => handleExerciseSelect(exercise)}
                    >
                      <div className="exercise-card-header">
                        <span className="exercise-number">#{exercise.id}</span>
                        {isCompleted && <span className="completed-badge">✓</span>}
                      </div>
                      <h4>{exercise.title}</h4>
                      <p>{exercise.description}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="exercise-workspace">
              <div className="exercise-detail">
                <button 
                  className="back-button"
                  onClick={() => setSelectedExercise(null)}
                >
                  ← Volver a Ejercicios
                </button>

                <div className="exercise-header">
                  <h2>{selectedExercise.title}</h2>
                  {isExerciseCompleted(selectedExercise.id) && (
                    <span className="completed-badge-large">✓ Completado</span>
                  )}
                </div>
                {/* ===== Botón ver teoría ===== */}
                <div className="theory-section">
                  <button
                    className="theory-button"
                    onClick={handleGetTheory}
                    disabled={loadingTheory}
                  >
                    📘 {loadingTheory ? 'Cargando teoría...' : 'Ver teoría IA'}
                  </button>

                  {showTheory && (
                    <div className="theory-box">
                      <h4>Teoría Relacionada:</h4>
                      <p>{theoryCache[selectedExercise.id]}</p>
                    </div>
                  )}

                </div>                
                <p className="exercise-description">{selectedExercise.description}</p>
                
                <div className="expected-output-box">
                  <h4>Output Esperado cambio:</h4>
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

              {/* ===== NUEVO: Input Box para scanf ===== */}
              {needsInput && (
                <div className="user-input-section">
                  <div className="input-section-header">
                    <label className="input-label">
                      📥 Inputs del programa
                    </label>
                    <span className="input-hint-badge">
                      scanf detectado
                    </span>
                  </div>
                  
                  <textarea
                    className="user-input-box"
                    value={userInputs}
                    onChange={(e) => setUserInputs(e.target.value)}
                    placeholder="Ingresa los valores que tu programa pedirá (uno por línea)&#10;&#10;Ejemplo:&#10;Juan&#10;25&#10;1.75"
                    rows={6}
                  />
                  
                  <p className="input-help-text">
                    💡 Cada línea será un valor que <code>scanf()</code> leerá en orden.
                    Asegúrate de ingresar los valores en el orden correcto.
                  </p>
                </div>
              )}

              {compilationResult && (
                <ResultPanel result={compilationResult} />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ExercisesPage;