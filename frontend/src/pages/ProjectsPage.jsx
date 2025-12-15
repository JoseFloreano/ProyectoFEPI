import React, { useState } from 'react';
import { useDatabase } from '../context/DatabaseContext';
import CodeEditor from '../components/CodeEditor';
import ResultPanel from '../components/ResultPanel';
import '../styles/ProjectsPage.css';

function ProjectsPage() {
  const { 
    projects, 
    isProjectCompleted, 
    getProjectProgress 
  } = useDatabase();

  const [selectedProject, setSelectedProject] = useState(null);
  const [userCode, setUserCode] = useState('');
  const [compilationResult, setCompilationResult] = useState(null);
  const [isCompiling, setIsCompiling] = useState(false);

  // Manejar selección de proyecto
  const handleProjectSelect = (project) => {
    setSelectedProject(project);
    setUserCode(project.finalProject.starterCode);
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
      const response = await fetch('http://localhost:3001/api/compile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: userCode,
          expectedOutput: '', // Los proyectos finales no tienen output esperado específico
          exerciseId: `project-${selectedProject.id}`
        }),
      });

      const result = await response.json();
      
      setCompilationResult({
        success: result.success,
        output: result.output,
        error: result.error,
        isCorrect: true, // Los proyectos finales se consideran correctos si compilan
        isFinalProject: true
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
