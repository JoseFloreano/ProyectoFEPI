import React from 'react';
import '../styles/HomePage.css';

import GoogleLoginButton from '../components/GoogleLoginButton';
import { useAuth } from '../context/AuthContext';


function HomePage({ onNavigate }) {
  const {user, login, logout} = useAuth();


  return (
  <div className="page-wrapper">
    <div className="home-page">
      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-badge">
            <span className="badge-icon">⚡</span>
            <span>Aprende C de manera interactiva</span>
          </div>
          
          <h1 className="hero-title">
            Domina la Programación en C
            <span className="title-highlight"> Proyecto por Proyecto</span>
          </h1>
          
          <p className="hero-description">
            Una plataforma interactiva que te guía desde los fundamentos hasta algoritmos avanzados.
            Compila en tiempo real, recibe retroalimentación instantánea y construye proyectos reales.
          </p>

          <div className="hero-actions">
            {!user ? (
              <>
                {/* Google Login Button */}
                <div>
                  <GoogleLoginButton
                  />
                </div>
              </>
            ) : (
             <>
              
              {/* Usuario ya logueado */}
              <div className="user-info">
                <img 
                  src={user.picture}
                  alt="avatar"
                  style={{ width: '40px', borderRadius: '50%', marginRight: '10px' }}
                />
                <span className="user-name">Hola, {user.name}</span>
              </div>

              <button 
                className="btn-primary-large"
                onClick={() => onNavigate('exercises')}
              >
                <span>Comenzar a Practicar</span>
                <span className="btn-icon">→</span>
              </button>
              
              <button 
                className="btn-secondary-large"
                onClick={() => onNavigate('chatbot')}
              >
                <span className="btn-icon">💬</span>
                <span>Crear Proyecto con IA</span>
              </button>


              <button
                className = "btn-logout"
                onClick={logout}
              >
                🚪Cerrar Sesión
              </button>
             </>
            )}
          </div>
        </div>
        

        <div className="hero-visual">
          <div className="code-window">
            <div className="window-header">
              <div className="window-dots">
                <span className="dot red"></span>
                <span className="dot yellow"></span>
                <span className="dot green"></span>
              </div>
              <span className="window-title">main.c</span>
            </div>
            <div className="window-code">
              <pre>{`#include <stdio.h>

int main() {
    printf("Hello, World!\\n");
    return 0;
}`}</pre>
            </div>
          </div>
        </div>
      </section>

      <section className="features-section">
        <h2 className="section-title">¿Cómo Funciona?</h2>
        
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">🎯</div>
            <h3>Proyectos Estructurados</h3>
            <p>Aprende con proyectos progresivos: desde calculadoras básicas hasta algoritmos complejos.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">⚙️</div>
            <h3>Compilador Integrado</h3>
            <p>Escribe, compila y ejecuta código C directamente en el navegador. Sin configuración necesaria.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">🤖</div>
            <h3>Asistencia por IA</h3>
            <p>Crea proyectos personalizados con el chatbot y recibe sugerencias cuando tengas errores.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">📊</div>
            <h3>Sigue tu Progreso</h3>
            <p>Completa ejercicios, desbloquea proyectos finales y visualiza tu avance en tiempo real.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">💡</div>
            <h3>Pistas Inteligentes</h3>
            <p>¿Atascado? Cada ejercicio incluye pistas que te guían sin dar la solución completa.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">🚀</div>
            <h3>Proyectos Reales</h3>
            <p>Construye calculadoras, analizadores, menús interactivos y más al completar cada módulo.</p>
          </div>
        </div>
      </section>

      <section className="projects-preview">
        <h2 className="section-title">Proyectos Disponibles</h2>
        
        <div className="projects-cards">
          <div className="project-preview-card easy">
            <div className="card-header">
              <span className="card-icon">🔢</span>
              <span className="difficulty-badge">Fácil</span>
            </div>
            <h3>Calculadora Básica</h3>
            <p>Aprende operaciones aritméticas y entrada/salida de datos.</p>
            <div className="card-stats">
              <span>3 ejercicios</span>
              <span>•</span>
              <span>1 proyecto final</span>
            </div>
          </div>

          <div className="project-preview-card medium">
            <div className="card-header">
              <span className="card-icon">🔀</span>
              <span className="difficulty-badge">Media</span>
            </div>
            <h3>Control de Flujo</h3>
            <p>Domina condicionales, bucles y estructuras de control.</p>
            <div className="card-stats">
              <span>3 ejercicios</span>
              <span>•</span>
              <span>1 proyecto final</span>
            </div>
          </div>

          <div className="project-preview-card hard">
            <div className="card-header">
              <span className="card-icon">🧮</span>
              <span className="difficulty-badge">Difícil</span>
            </div>
            <h3>Algoritmos Clásicos</h3>
            <p>Implementa factorial, Fibonacci, números primos y más.</p>
            <div className="card-stats">
              <span>3 ejercicios</span>
              <span>•</span>
              <span>1 proyecto final</span>
            </div>
          </div>
        </div>

        <button 
          className="btn-view-all"
          onClick={() => onNavigate('projects')}
        >
          Ver Todos los Proyectos
        </button>
      </section>

      <section className="cta-section">
        <div className="cta-content">
          <h2>¿Listo para Empezar?</h2>
          <p>Únete a estudiantes que están aprendiendo C de manera práctica y efectiva.</p>
          <button 
            className="btn-cta"
            onClick={() => onNavigate('exercises')}
          >
            Comenzar Ahora Gratis
          </button>
        </div>
      </section>
    </div>
    </div>
  );
}

export default HomePage;
