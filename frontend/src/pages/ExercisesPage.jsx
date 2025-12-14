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

  // Manejar selección de proyecto
  const handleProjectSelect = (project) => {
    setActiveProjectById(project.id);
    setSelectedExercise(null);
    setCompilationResult(null);
  };

  // Manejar selección de ejercicio
  const handleExerciseSelect = (exercise) => {
    setSelectedExercise(exercise);
    setUserCode(exercise.starterCode);
    setCompilationResult(null);
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

  return (
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
        )}
      </div>
    </div>
  );
}

export default ExercisesPage;
