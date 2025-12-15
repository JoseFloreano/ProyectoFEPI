import React, { useState } from 'react';
import SettingsModal from './SettingsModal';
import '../styles/Navbar.css';

function Navbar({ currentPage, onNavigate }) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const navItems = [
    { id: 'home', label: 'Inicio', icon: '🏠' },
    { id: 'exercises', label: 'Ejercicios', icon: '📝' },
    { id: 'projects', label: 'Proyectos', icon: '🚀' },
    { id: 'chatbot', label: 'Crear con IA', icon: '💬' },
    { id: 'materias', label: 'Temarios', icon: '📖' }
  ];

  return (
    <>
      <nav className="navbar">
        <div className="navbar-brand" onClick={() => onNavigate('home')}>
          <span className="logo-icon">{'{ }'}</span>
          <span className="logo-text">ESCOMENTOR</span>
        </div>
        
        <div className="navbar-menu">
          {navItems.map(item => (
            <button
              key={item.id}
              className={`nav-item ${currentPage === item.id ? 'active' : ''}`}
              onClick={() => onNavigate(item.id)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </div>

        <div className="navbar-actions">
          <button 
            className="btn-secondary"
            onClick={() => setIsSettingsOpen(true)}
            title="Configuración"
          >
            <span>⚙️</span>
          </button>
        </div>
      </nav>

      {/* Modal de Configuración */}
      <SettingsModal 
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </>
  );
}

export default Navbar;