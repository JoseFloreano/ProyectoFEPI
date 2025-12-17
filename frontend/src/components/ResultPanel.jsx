import React from 'react';
import ReactMarkdown from 'react-markdown';
import '../styles/ResultPanel.css';

function ResultPanel({ result }) {
  return (
    <div className={`result-panel ${result.isCorrect ? 'success' : 'error'}`}>
      <div className="result-header">
        <div className="result-status">
          {result.isCorrect ? (
            <>
              <span className="status-icon">✅</span>
              <h3>¡Correcto! Ejercicio completado</h3>
            </>
          ) : (
            <>
              <span className="status-icon">❌</span>
              <h3>Resultado Incorrecto</h3>
            </>
          )}
        </div>
      </div>

      <div className="result-content">
        {result.success ? (
          <div className="output-section">
            <div className="output-comparison">
              <div className="output-box">
                <h4>Tu Output:</h4>
                <pre className="output-text">{result.output || '(vacío)'}</pre>
              </div>
              
              <div className="output-box">
                <h4>Output Esperado:</h4>
                <pre className="output-text expected">{result.expectedOutput}</pre>
              </div>
            </div>

            {!result.isCorrect && result.aiSuggestion && (
              <div className="ai-suggestion">
                <h4>
                  <span className="ai-icon">🤖</span>
                  Sugerencia de IA
                </h4>
                <div className="suggestion-content">
                  <ReactMarkdown>{result.aiSuggestion}</ReactMarkdown>
                </div>
              </div>
            )}

            {!result.isCorrect && !result.aiSuggestion && (
              <div className="ai-placeholder">
                <p>
                  <span className="ai-icon">🤖</span>
                  <strong>Próximamente:</strong> Aquí aparecerá un análisis inteligente de tu código 
                  con sugerencias personalizadas para corregir el error.
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="error-section">
            <h4>Error de Compilación:</h4>
            <pre className="error-text">{result.error}</pre>
            
            {result.aiSuggestion && (
              <div className="ai-suggestion">
                <h4>
                  <span className="ai-icon">🤖</span>
                  Sugerencia de IA
                </h4>
                <div className="suggestion-content">
                  <ReactMarkdown>{result.aiSuggestion}</ReactMarkdown>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default ResultPanel;