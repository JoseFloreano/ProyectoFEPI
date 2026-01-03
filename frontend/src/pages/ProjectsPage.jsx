import React, { useState } from 'react';
import { useDatabase } from '../context/DatabaseContext';
import CodeEditor from '../components/CodeEditor';
import ResultPanel from '../components/ResultPanel';
import { compilerAPI } from '../services/apiService';
import { dualSave } from '../services/syncService';
import '../styles/ProjectsPage.css';

function ProjectsPage() {
  const { 
    projects, 
    isProjectCompleted, 
    getProjectProgress,
    unlockProject  // ← Necesario para dualSave
  } = useDatabase();

  const [selectedProject, setSelectedProject] = useState(null);
  const [userCode, setUserCode] = useState('');
  const [userInputs, setUserInputs] = useState('');
  const [compilationResult, setCompilationResult] = useState(null);
  const [isCompiling, setIsCompiling] = useState(false);

  // ===== Detectar si el código necesita inputs =====
  const needsInput = userCode.includes('scanf') || 
                     userCode.includes('gets') || 
                     userCode.includes('fgets') ||
                     userCode.includes('getchar') ||
                     userCode.includes('getc');

  // Manejar selección de proyecto
  const handleProjectSelect = (project) => {
    setSelectedProject(project);
    setUserCode(project.finalProject.starterCode);
    setUserInputs(''); // Limpiar inputs
    setCompilationResult(null);
  };

  // Manejar cambio de código
  const handleCodeChange = (code) => {
    setUserCode(code);
  };

  // Compilar código del proyecto final
  const handleCompile = async () => {
    // Verificar que todos los ejercicios estén completados
    if (!isProjectCompleted(selectedProject.id)) {
      alert('⚠️ Debes completar todos los ejercicios del proyecto antes de compilar el proyecto final.');
      return;
    }

    setIsCompiling(true);
    setCompilationResult(null);
    
    try {
      // Usar apiService en lugar de fetch directo
      const result = await compilerAPI.compile(
        userCode,
        '', // Los proyectos finales no tienen expectedOutput específico
        `project-${selectedProject.id}`,
        userInputs
      );
      
      setCompilationResult({
        success: result.success,
        output: result.output,
        error: result.error,
        isCorrect: result.success, // Proyecto correcto si compila sin errores
        isFinalProject: true
      });

      // ===== SINCRONIZACIÓN HÍBRIDA: Desbloquear proyecto =====
      if (result.success) {
        // Guardar en LOCAL (instantáneo) Y en MONGODB (background)
        await dualSave(
          'project',
          selectedProject.id,
          () => unlockProject(selectedProject.id)
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

  return (
    <div className="page-wrapper">
      <div className="projects-page">
        <div className="projects-header">
          <h1>🚀 Proyectos Finales</h1>
          <p>Construye proyectos reales aplicando todo lo aprendido en los ejercicios.</p>
        </div>

        {!selectedProject ? (
          <div className="projects-gallery">
            {projects.map(project => {
              const progress = getProjectProgress(project.id);
              const isCompleted = isProjectCompleted(project.id);
              const isLocked = !isCompleted;

              return (
                <div
                  key={project.id}
                  className={`project-card ${isLocked ? 'locked' : ''}`}
                  onClick={() => !isLocked && handleProjectSelect(project)}
                  style={{ '--project-color': project.color }}
                >
                  {isLocked && (
                    <div className="lock-overlay">
                      <span className="lock-icon">🔒</span>
                      <p>Completa todos los ejercicios para desbloquear</p>
                    </div>
                  )}

                  <div className="project-card-header">
                    <span className="project-card-icon">{project.icon}</span>
                    <span className={`difficulty-badge ${project.difficulty.toLowerCase()}`}>
                      {project.difficulty}
                    </span>
                  </div>

                  <h3>{project.name}</h3>
                  <p className="project-card-description">{project.description}</p>

                  <div className="project-card-footer">
                    <div className="progress-section">
                      <div className="progress-bar">
                        <div 
                          className="progress-fill" 
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <span className="progress-text">
                        {progress}% Completado
                      </span>
                    </div>

                    {isCompleted && (
                      <div className="completed-indicator">
                        <span className="check-icon">✓</span>
                        <span>Desbloqueado</span>
                      </div>
                    )}
                  </div>

                  {project.finalProject && (
                    <div className="final-project-preview">
                      <h4>📦 Proyecto Final:</h4>
                      <p>{project.finalProject.title}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="project-workspace">
            <button 
              className="back-button"
              onClick={() => {
                setSelectedProject(null);
                setCompilationResult(null);
                setUserInputs(''); // Limpiar inputs
              }}
            >
              ← Volver a Proyectos
            </button>

            <div className="project-detail">
              <div className="project-detail-header">
                <span className="project-detail-icon">{selectedProject.icon}</span>
                <div>
                  <h2>{selectedProject.finalProject.title}</h2>
                  <p className="project-subtitle">{selectedProject.name}</p>
                </div>
              </div>

              <p className="project-detail-description">
                {selectedProject.finalProject.description}
              </p>

              <div className="project-requirements">
                <h4>📋 Requisitos:</h4>
                <ul>
                  <li>✓ Todos los ejercicios de "{selectedProject.name}" completados</li>
                  <li>El código debe compilar sin errores</li>
                  <li>Implementa todas las funcionalidades descritas</li>
                </ul>
              </div>
            </div>

            <CodeEditor 
              code={userCode}
              onChange={handleCodeChange}
              onCompile={handleCompile}
              isCompiling={isCompiling}
              isProjectMode={true}
            />

            {/* ===== Input Box para scanf ===== */}
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
              <div className="project-result">
                {compilationResult.success ? (
                  <div className="success-result">
                    <div className="result-header">
                      <span className="success-icon">🎉</span>
                      <h3>¡Proyecto Compilado Exitosamente!</h3>
                    </div>
                    
                    <div className="output-section">
                      <h4>Output del Programa:</h4>
                      <pre className="output-text">{compilationResult.output || '(programa ejecutado correctamente)'}</pre>
                    </div>

                    <div className="congratulations">
                      <p>¡Excelente trabajo! Has completado el proyecto <strong>{selectedProject.finalProject.title}</strong>.</p>
                      <p className="sync-info">✅ Progreso guardado en tu cuenta</p>
                    </div>
                  </div>
                ) : (
                  <ResultPanel result={compilationResult} />
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default ProjectsPage;