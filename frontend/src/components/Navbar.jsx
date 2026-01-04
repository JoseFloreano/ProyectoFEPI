import React, { useState } from 'react';
import SettingsModal from './SettingsModal';
import '../styles/Navbar.css';
import { useAuth } from '../context/AuthContext';

function Navbar({ currentPage, onNavigate }) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const { user } = useAuth();

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

        {user && (
          <div className="user-info-navbar">
            {/* Debugging: Ver qué datos tiene el usuario */}
            {console.log("Navbar user data:", user)}

            <img
              src={user.picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.nombre || user.name || 'U')}&background=random&color=fff&bold=true`}
              alt="User avatar"
            />
            <span className="user-name-nav" style={{ marginLeft: '8px', fontSize: '0.9rem' }}>
              {user.nombre || user.name}
            </span>
          </div>
        )}

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