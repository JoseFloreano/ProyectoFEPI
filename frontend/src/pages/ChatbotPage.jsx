import React, { useState, useEffect } from 'react';
import { useDatabase } from '../context/DatabaseContext';
import '../styles/ChatbotPage.css';

// Definición de materias disponibles
const MATERIAS = [
  {
    id: 'fundamentos',
    nombre: 'Fundamentos de Programación',
    descripcion: 'Conceptos básicos de programación en C',
    icon: '📚',
    color: '#10b981',
    nivel: 1,
    temasClave: ['Variables', 'Bucles', 'Funciones', 'Arrays', 'Punteros básicos']
  },
  {
    id: 'estructuras',
    nombre: 'Algoritmos y Estructuras de Datos',
    descripcion: 'Estructuras de datos y algoritmos fundamentales',
    icon: '🔗',
    color: '#f59e0b',
    nivel: 2,
    temasClave: ['Listas enlazadas', 'Pilas', 'Colas', 'Árboles', 'Grafos', 'Ordenamiento'],
    incluye: ['Todos los temas de Fundamentos']
  },
  {
    id: 'analisis',
    nombre: 'Análisis y Diseño de Algoritmos',
    descripcion: 'Análisis de complejidad y algoritmos avanzados',
    icon: '📊',
    color: '#ef4444',
    nivel: 3,
    temasClave: ['Complejidad', 'Divide y Conquista', 'Prog. Dinámica', 'Grafos avanzados'],
    incluye: ['Todos los temas de Fundamentos y Estructuras']
  }
];

function ChatbotPage() {
  const { addCustomProject } = useDatabase();
  
  const [selectedMateria, setSelectedMateria] = useState(null);
  const [messages, setMessages] = useState([]);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Inicializar mensaje de bienvenida
  useEffect(() => {
    setMessages([
      {
        role: 'assistant',
        content: '¡Hola! 👋 Soy tu asistente de IA para crear proyectos de C personalizados.\n\n📚 **Primero, selecciona una materia** de las opciones disponibles para comenzar.\n\nLas materias están organizadas de forma seriada:\n• Fundamentos → Estructuras → Análisis\n\n¿Qué materia te gustaría practicar hoy?'
      }
    ]);
  }, []);

  // Manejar selección de materia
  const handleMateriaSelect = (materia) => {
    setSelectedMateria(materia);
    
    const materiaInfo = MATERIAS.find(m => m.id === materia);
    
    const confirmMessage = {
      role: 'assistant',
      content: `Perfecto! Has seleccionado **${materiaInfo.nombre}** ${materiaInfo.icon}\n\n${materiaInfo.descripcion}\n\n${materiaInfo.incluye ? `✨ Esta materia incluye: ${materiaInfo.incluye.join(', ')}\n\n` : ''}Ahora dime: ¿qué proyecto te gustaría crear?\n\nEjemplos:\n• "Quiero practicar ${materiaInfo.temasClave[0]}"\n• "Crea ejercicios de ${materiaInfo.temasClave[1]}"\n• "Proyecto sobre ${materiaInfo.temasClave[2]}"`
    };
    
    setMessages(prev => [...prev, confirmMessage]);
  };

  // Manejar envío de mensaje
  const handleSendMessage = async () => {
    if (!userInput.trim() || isLoading) return;

    if (!selectedMateria) {
      alert('⚠️ Por favor, selecciona una materia primero');
      return;
    }

    const userMessage = {
      role: 'user',
      content: userInput
    };

    setMessages(prev => [...prev, userMessage]);
    setUserInput('');
    setIsLoading(true);

    try {
      // Llamar al backend para generar el proyecto
      const response = await fetch('http://localhost:3001/api/generate-project', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userRequest: userInput,
          materia: selectedMateria,
          conversationHistory: messages
        })
      });

      const data = await response.json();

      if (data.success && data.project) {
        // Agregar proyecto a la base de datos
        addCustomProject(data.project);

        const successMessage = {
          role: 'assistant',
          content: `¡Proyecto creado exitosamente! 🎉\n\n**${data.project.name}** ${data.project.icon}\n${data.project.description}\n\n📝 **Ejercicios incluidos:** ${data.project.exercises.length}\n🎯 **Dificultad:** ${data.project.difficulty}\n📚 **Temas:** ${data.project.temasUsados?.join(', ') || 'Varios'}\n\n✅ El proyecto ya está disponible en la sección de **Ejercicios**.\n\n¿Quieres crear otro proyecto?`
        };

        setMessages(prev => [...prev, successMessage]);
      } else {
        const errorMessage = {
          role: 'assistant',
          content: `❌ No pude generar el proyecto: ${data.error || 'Error desconocido'}\n\n${data.suggestion || 'Intenta reformular tu solicitud.'}`
        };

        setMessages(prev => [...prev, errorMessage]);
      }

    } catch (error) {
      const errorMessage = {
        role: 'assistant',
        content: `❌ Error al conectar con el servidor: ${error.message}\n\nAsegúrate de que:\n1. El servidor backend esté corriendo\n2. La API key de Gemini esté configurada\n3. Los archivos CSV de temarios existan`
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Manejar tecla Enter
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="chatbot-page">
      <div className="chatbot-container">
        <div className="chatbot-header">
          <div className="header-content">
            <span className="ai-icon">🤖</span>
            <div>
              <h2>Generador de Proyectos con IA</h2>
              <p>
                {selectedMateria 
                  ? `Materia: ${MATERIAS.find(m => m.id === selectedMateria)?.nombre}` 
                  : 'Selecciona una materia para comenzar'}
              </p>
            </div>
          </div>
        </div>

        {/* Selector de Materias */}
        {!selectedMateria && (
          <div className="materia-selector">
            <h3>Selecciona tu Materia</h3>
            <p className="selector-description">
              Las materias son seriadas. Las más avanzadas incluyen temas de las anteriores.
            </p>
            
            <div className="materias-grid">
              {MATERIAS.map(materia => (
                <div
                  key={materia.id}
                  className="materia-card"
                  onClick={() => handleMateriaSelect(materia.id)}
                  style={{ '--materia-color': materia.color }}
                >
                  <div className="materia-card-header">
                    <span className="materia-icon">{materia.icon}</span>
                    <span className="materia-nivel">Nivel {materia.nivel}</span>
                  </div>
                  
                  <h4>{materia.nombre}</h4>
                  <p className="materia-descripcion">{materia.descripcion}</p>
                  
                  <div className="temas-preview">
                    <strong>Temas clave:</strong>
                    <div className="temas-tags">
                      {materia.temasClave.slice(0, 3).map((tema, idx) => (
                        <span key={idx} className="tema-tag">{tema}</span>
                      ))}
                      {materia.temasClave.length > 3 && (
                        <span className="tema-tag">+{materia.temasClave.length - 3} más</span>
                      )}
                    </div>
                  </div>

                  {materia.incluye && (
                    <div className="materia-incluye">
                      ✨ {materia.incluye}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Cambiar Materia */}
        {selectedMateria && (
          <div className="materia-selected">
            <div className="selected-info">
              <span className="selected-icon">
                {MATERIAS.find(m => m.id === selectedMateria)?.icon}
              </span>
              <span className="selected-name">
                {MATERIAS.find(m => m.id === selectedMateria)?.nombre}
              </span>
            </div>
            <button 
              className="btn-change-materia"
              onClick={() => {
                setSelectedMateria(null);
                setMessages([messages[0]]); // Mantener solo el mensaje de bienvenida
              }}
            >
              Cambiar Materia
            </button>
          </div>
        )}

        <div className="messages-container">
          {messages.map((message, index) => (
            <div 
              key={index} 
              className={`message ${message.role}`}
            >
              <div className="message-avatar">
                {message.role === 'assistant' ? '🤖' : '👤'}
              </div>
              <div className="message-content">
                <pre>{message.content}</pre>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="message assistant">
              <div className="message-avatar">🤖</div>
              <div className="message-content">
                <div className="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
                <p className="loading-text">Generando tu proyecto personalizado...</p>
              </div>
            </div>
          )}
        </div>

        <div className="input-container">
          <textarea
            className="chat-input"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={
              selectedMateria 
                ? "Describe qué proyecto quieres crear..." 
                : "Primero selecciona una materia arriba ☝️"
            }
            rows={3}
            disabled={isLoading || !selectedMateria}
          />
          <button
            className="send-button"
            onClick={handleSendMessage}
            disabled={!userInput.trim() || isLoading || !selectedMateria}
          >
            {isLoading ? '⏳' : '📤'}
          </button>
        </div>

        <div className="chatbot-footer">
          <div className="integration-notice">
            <span className="notice-icon">✅</span>
            <p>
              <strong>IA Integrada:</strong> Este chatbot está conectado con Google Gemini AI y 
              usa los temarios de <code>{selectedMateria ? MATERIAS.find(m => m.id === selectedMateria)?.nombre : 'la materia seleccionada'}</code> para generar proyectos relevantes.
            </p>
          </div>
        </div>
      </div>

      <div className="chatbot-info">
        <div className="info-card">
          <h3>¿Cómo funciona?</h3>
          <ol>
            <li>
              <strong>Selecciona una materia:</strong> Elige entre Fundamentos, Estructuras o Análisis.
            </li>
            <li>
              <strong>Describe tu proyecto:</strong> Dile a la IA qué temas quieres practicar.
            </li>
            <li>
              <strong>Genera y practica:</strong> La IA crea ejercicios basados en el temario oficial.
            </li>
          </ol>
        </div>

        <div className="info-card">
          <h3>Materias Seriadas</h3>
          <div className="seriacion-visual">
            <div className="seriacion-item">
              <span className="seriacion-icon">📚</span>
              <span className="seriacion-text">Fundamentos</span>
            </div>
            <span className="seriacion-arrow">→</span>
            <div className="seriacion-item">
              <span className="seriacion-icon">🔗</span>
              <span className="seriacion-text">Estructuras</span>
            </div>
            <span className="seriacion-arrow">→</span>
            <div className="seriacion-item">
              <span className="seriacion-icon">📊</span>
              <span className="seriacion-text">Análisis</span>
            </div>
          </div>
          <p className="seriacion-note">
            Las materias avanzadas incluyen todos los temas de las anteriores
          </p>
        </div>

        <div className="info-card">
          <h3>Ejemplos de Solicitudes</h3>
          <ul>
            <li><strong>Fundamentos:</strong> "Quiero practicar bucles y arrays"</li>
            <li><strong>Estructuras:</strong> "Crea ejercicios de pilas y colas"</li>
            <li><strong>Análisis:</strong> "Proyecto sobre programación dinámica"</li>
          </ul>
        </div>

        <div className="info-card">
          <h3>Temarios Oficiales</h3>
          <p>
            Los ejercicios generados se basan en los temarios oficiales de cada materia,
            guardados en archivos CSV. La IA solo usa temas apropiados para el nivel seleccionado.
          </p>
          <div className="temarios-list">
            <div className="temario-item">
              <span>📚</span> fundamentos-programacion.csv
            </div>
            <div className="temario-item">
              <span>🔗</span> estructuras-datos.csv
            </div>
            <div className="temario-item">
              <span>📊</span> analisis-algoritmos.csv
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ChatbotPage;