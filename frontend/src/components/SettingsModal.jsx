import React from 'react';
import { useTheme } from '../context/ThemeContext';
import '../styles/SettingsModal.css';

function SettingsModal({ isOpen, onClose }) {
  const { theme, toggleTheme, isDark } = useTheme();

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <h2>
            <span className="modal-icon">⚙️</span>
            Configuración
          </h2>
          <button className="btn-close-modal" onClick={onClose}>
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="modal-body">
          {/* Sección de Apariencia */}
          <div className="settings-section">
            <h3 className="section-title">
              <span className="section-icon">🎨</span>
              Apariencia
            </h3>

            <div className="theme-selector">
              <div className="theme-description">
                <p>Elige el modo de visualización de tu preferencia</p>
              </div>

              <div className="theme-options">
                {/* Opción Modo Oscuro */}
                <button
                  className={`theme-option ${isDark ? 'active' : ''}`}
                  onClick={isDark ? null : toggleTheme}
                  disabled={isDark}
                >
                  <div className="theme-preview dark-preview">
                    <div className="preview-header"></div>
                    <div className="preview-content">
                      <div className="preview-card"></div>
                      <div className="preview-card"></div>
                    </div>
                  </div>
                  <div className="theme-info">
                    <span className="theme-icon">🌙</span>
                    <div>
                      <h4>Modo Oscuro</h4>
                      <p>Menos fatiga visual</p>
                    </div>
                  </div>
                  {isDark && <span className="theme-check">✓</span>}
                </button>

                {/* Opción Modo Claro */}
                <button
                  className={`theme-option ${!isDark ? 'active' : ''}`}
                  onClick={!isDark ? null : toggleTheme}
                  disabled={!isDark}
                >
                  <div className="theme-preview light-preview">
                    <div className="preview-header"></div>
                    <div className="preview-content">
                      <div className="preview-card"></div>
                      <div className="preview-card"></div>
                    </div>
                  </div>
                  <div className="theme-info">
                    <span className="theme-icon">☀️</span>
                    <div>
                      <h4>Modo Claro</h4>
                      <p>Mayor contraste</p>
                    </div>
                  </div>
                  {!isDark && <span className="theme-check">✓</span>}
                </button>
              </div>

              <div className="theme-current">
                <span className="current-badge">
                  Tema actual: {isDark ? 'Oscuro 🌙' : 'Claro ☀️'}
                </span>
              </div>
            </div>
          </div>

          {/* Sección de Preferencias de IA */}
          <div className="settings-section">
            <h3 className="section-title">
              <span className="section-icon">🧠</span>
              Motor de IA
            </h3>

            <div className="theme-selector">
              <div className="theme-description">
                <p>Selecciona qué IA generará tus proyectos</p>
              </div>

              <div className="theme-options">
                <button
                  className={`theme-option ${localStorage.getItem('preferredApi') !== 'groq' ? 'active' : ''}`}
                  onClick={() => {
                    localStorage.setItem('preferredApi', 'gemini');
                    // Forzar re-render simple (en app real usar context)
                    window.dispatchEvent(new Event('storage'));
                    // onClose(); // Comentado para permitir ver el cambio
                    this.forceUpdate && this.forceUpdate();
                  }}
                >
                  <div className="theme-info">
                    <span className="theme-icon">💎</span>
                    <div>
                      <h4>Gemini</h4>
                      <p>Google AI (Default)</p>
                    </div>
                  </div>
                  {localStorage.getItem('preferredApi') !== 'groq' && <span className="theme-check">✓</span>}
                </button>

                <button
                  className={`theme-option ${localStorage.getItem('preferredApi') === 'groq' ? 'active' : ''}`}
                  onClick={() => {
                    localStorage.setItem('preferredApi', 'groq');
                    window.dispatchEvent(new Event('storage'));
                    // onClose();
                    this.forceUpdate && this.forceUpdate();
                  }}
                >
                  <div className="theme-info">
                    <span className="theme-icon">⚡</span>
                    <div>
                      <h4>Groq</h4>
                      <p>Llama 3 (Rápido)</p>
                    </div>
                  </div>
                  {localStorage.getItem('preferredApi') === 'groq' && <span className="theme-check">✓</span>}
                </button>
              </div>
            </div>
          </div>

          {/* Sección de Información */}
          <div className="settings-section">
            <h3 className="section-title">
              <span className="section-icon">ℹ️</span>
              Acerca de
            </h3>
            <div className="info-grid">
              <div className="info-item">
                <span className="info-label">Versión:</span>
                <span className="info-value">1.0.0</span>
              </div>
              <div className="info-item">
                <span className="info-label">Desarrollado por:</span>
                <span className="info-value">C Practice Lab</span>
              </div>
              <div className="info-item">
                <span className="info-label">Materias:</span>
                <span className="info-value">3 disponibles</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button className="btn-primary" onClick={onClose}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

export default SettingsModal;