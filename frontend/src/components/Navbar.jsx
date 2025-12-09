import React from 'react';
import '../styles/Navbar.css';

function Navbar() {
  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <span className="logo-icon">{'{ }'}</span>
        <span className="logo-text">C Practice Lab</span>
      </div>
      
      <div className="navbar-menu">
        <a href="#exercises" className="nav-item active">Ejercicios</a>
        <a href="#progress" className="nav-item">Mi Progreso</a>
        <a href="#documentation" className="nav-item">Documentación</a>
        <a href="#help" className="nav-item">Ayuda</a>
      </div>

      <div className="navbar-actions">
        <button className="btn-secondary">
          <span>⚙️</span>
        </button>
        <button className="btn-secondary">
          <span>👤</span>
        </button>
      </div>
    </nav>
  );
}

export default Navbar;