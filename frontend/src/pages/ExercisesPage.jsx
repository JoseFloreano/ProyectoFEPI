import React, { useState } from 'react';
import { useDatabase } from '../context/DatabaseContext';
import { compilerAPI } from '../services/apiService';
import { dualSave } from '../services/syncService';
import CodeEditor from '../components/CodeEditor';
import ResultPanel from '../components/ResultPanel';
import ReactMarkdown from 'react-markdown';
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

  const needsInput = userCode.includes('scanf') ||
    userCode.includes('gets') ||
    userCode.includes('fgets') ||
    userCode.includes('getchar') ||
    userCode.includes('getc');

  const handleProjectSelect = (project) => {
    setActiveProjectById(project.id);
    setSelectedExercise(null);
    setCompilationResult(null);
    setUserInputs('');
  };

  const handleExerciseSelect = (exercise) => {
    setSelectedExercise(exercise);
    setUserCode(exercise.starterCode);
    setUserInputs('');
    setShowTheory(false);
    setLoadingTheory(false);
    setCompilationResult(null); // Limpiar resultado anterior
  };

  const handleCodeChange = (code) => {
    setUserCode(code);
  };

  // Helper para formatear el JSON de la IA a Markdown
  const formatAiSuggestion = (suggestion) => {
    if (!suggestion) return null;
    try {
      // Intentar parsear como JSON
      const json = JSON.parse(suggestion);

      let markdown = "### 🔍 Análisis de Error\n\n";
      let hasContent = false;

      Object.entries(json).forEach(([key, value]) => {
        // Ignorar claves numéricas puras o vacías
        if (!value) return;

        // Limpiar clave: quitar números iniciales '1_' y guiones bajos
        const title = key
          .replace(/^\d+[_.]/, '') // Quita '1_', '2.', etc.
          .replace(/_/g, ' ')      // Quita guiones bajos
          .replace(/\b\w/g, l => l.toUpperCase()); // Capitaliza

        // Mapear iconos según palabras clave en el título
        let icon = '👉';
        if (title.match(/Diferencia|Output/i)) icon = '❌';
        else if (title.match(/Error|Bug/i)) icon = '🐛';
        else if (title.match(/Pista|Sugerencia/i)) icon = '💡';
        else if (title.match(/Consejo|Verific/i)) icon = '🕵️‍♂️';

        markdown += `* **${icon} ${title}:** ${value}\n`;
        hasContent = true;
      });

      return hasContent ? markdown : suggestion;
    } catch (e) {
      // No es JSON, devolver como texto plano/markdown original
      return suggestion;
    }
  };

  // ===== COMPILAR CON INTEGRACIÓN HÍBRIDA =====
  const handleCompile = async () => {
    setIsCompiling(true);
    setCompilationResult(null);

    try {
      // Usar apiService en lugar de fetch directo
      const result = await compilerAPI.compile(
        userCode,
        selectedExercise.expectedOutput,
        selectedExercise.id,
        userInputs
      );

      setCompilationResult({
        success: result.success,
        output: result.output,
        expectedOutput: selectedExercise.expectedOutput,
        isCorrect: result.isCorrect,
        error: result.error,
        aiSuggestion: formatAiSuggestion(result.aiSuggestion)
      });

      // ===== SINCRONIZACIÓN HÍBRIDA =====
      if (result.isCorrect) {
        // Guardar en LOCAL (instantáneo) Y en MONGODB (background)
        await dualSave(
          'exercise',
          selectedExercise.id,
          () => completeExercise(selectedExercise.id)
        );
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

    if (showTheory) {
      setShowTheory(false);
      return;
    }

    setShowTheory(true);

    if (theoryCache[exerciseId]) return;

    setLoadingTheory(true);

    try {
      const data = await compilerAPI.generateTheory(
        selectedExercise.theoryTopics || [selectedExercise.title],
        'fundamentos' // Podrías parametrizar esto si tienes la info de la materia del proyecto
      );

      setTheoryCache(prev => ({
        ...prev,
        [exerciseId]: formatTheory(data.text) || 'No se pudo generar la teoría.'
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

  // Helper para formatear la teoría (JSON o Texto) a Markdown
  const formatTheory = (content) => {
    if (!content) return null;
    try {
      // Intentar parsear como JSON
      const json = JSON.parse(content);

      // Convertir objeto JSON a texto formateado Markdown
      let markdown = "### 📘 Conceptos Clave\n\n";

      Object.entries(json).forEach(([key, value]) => {
        // Convertir snake_case a Título (operadores_aritmeticos -> Operadores Aritmeticos)
        const title = key
          .replace(/_/g, ' ')
          .replace(/\b\w/g, l => l.toUpperCase());

        markdown += `#### ${title}\n${value}\n\n`;
      });

      return markdown;
    } catch (e) {
      // Si no es JSON, devolver como texto plano original
      return content;
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
                      <ReactMarkdown>{theoryCache[selectedExercise.id]}</ReactMarkdown>
                    </div>
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
                    placeholder="Escribe EXACTAMENTE lo que ingresarías en la consola&#10;&#10;Ejemplos:&#10;• Un valor por línea → Juan [Enter] 25 [Enter]&#10;• Varios en una línea → 0 0 [Enter]&#10;• Mixto → María [Enter] 30 1.75 [Enter]"
                    rows={6}
                  />

                  <p className="input-help-text">
                    💡 Escribe los inputs <strong>tal como los ingresarías en la consola</strong>.
                    Si <code>scanf("%d %d", &x, &y)</code> lee dos números en una línea,
                    escribe <code>5 10</code> (con espacio). Si lee líneas separadas, usa Enter entre valores.
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