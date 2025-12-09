import React from 'react';
import '../styles/CodeEditor.css';

function CodeEditor({ code, onChange, onCompile, isCompiling }) {
  return (
    <div className="code-editor">
      <div className="editor-header">
        <div className="editor-tabs">
          <div className="editor-tab active">
            <span className="tab-icon">📄</span>
            <span>main.c</span>
          </div>
        </div>
        
        <button 
          className="btn-compile"
          onClick={onCompile}
          disabled={isCompiling}
        >
          {isCompiling ? (
            <>
              <span className="spinner"></span>
              Compilando...
            </>
          ) : (
            <>
              <span>▶️</span>
              Compilar y Ejecutar
            </>
          )}
        </button>
      </div>

      <div className="editor-body">
        <div className="line-numbers">
          {code.split('\n').map((_, index) => (
            <div key={index} className="line-number">
              {index + 1}
            </div>
          ))}
        </div>
        
        <textarea
          className="code-textarea"
          value={code}
          onChange={(e) => onChange(e.target.value)}
          spellCheck={false}
          placeholder="Escribe tu código aquí..."
        />
      </div>

      <div className="editor-footer">
        <span className="editor-info">Lenguaje: C</span>
        <span className="editor-info">Líneas: {code.split('\n').length}</span>
        <span className="editor-info">Caracteres: {code.length}</span>
      </div>
    </div>
  );
}

export default CodeEditor;