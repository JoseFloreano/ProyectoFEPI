import React, { useState } from 'react';
import { useDatabase } from '../context/DatabaseContext';
import '../styles/ChatbotPage.css';

function ChatbotPage() {
  const { addCustomProject } = useDatabase();
  
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: '¡Hola! 👋 Soy tu asistente para crear proyectos de C personalizados. \n\nPuedes pedirme que cree un proyecto sobre cualquier tema, por ejemplo:\n• "Quiero un proyecto sobre manejo de strings"\n• "Crea ejercicios sobre punteros"\n• "Proyecto de estructuras de datos básicas"\n\n¿Qué te gustaría aprender?'
    }
  ]);
  
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Manejar envío de mensaje
  const handleSendMessage = async () => {
    if (!userInput.trim() || isLoading) return;

    const userMessage = {
      role: 'user',
      content: userInput
    };

    setMessages(prev => [...prev, userMessage]);
    setUserInput('');
    setIsLoading(true);

    try {
      // AQUÍ SE IMPLEMENTARÍA LA LLAMADA A LA IA PARA GENERAR EL PROYECTO
      // Por ahora, simulamos una respuesta
      
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simular delay

      const assistantMessage = {
        role: 'assistant',
        content: `He entendido tu petición: "${userInput}"\n\n🤖 La integración con IA está lista para implementarse. Cuando se conecte con Claude, OpenAI o Gemini, podré:\n\n1. Analizar tu solicitud\n2. Generar un proyecto completo con:\n   • Nombre y descripción\n   • 3-5 ejercicios progresivos\n   • Proyecto final integrador\n   • Código de inicio y hints\n3. Guardarlo automáticamente en tu lista de proyectos\n\n📝 Para implementar esto, sigue las instrucciones en el archivo ai-integration-example.js del backend.`
      };

      setMessages(prev => [...prev, assistantMessage]);

      // EJEMPLO DE CÓMO SE VERÍA LA INTEGRACIÓN REAL:
      /*
      const response = await fetch('http://localhost:3001/api/generate-project', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userRequest: userInput,
          conversationHistory: messages
        })
      });

      const generatedProject = await response.json();
      
      // Agregar proyecto generado a la base de datos
      addCustomProject(generatedProject);
      
      const assistantMessage = {
        role: 'assistant',
        content: `¡Proyecto creado! 🎉\n\n**${generatedProject.name}**\n${generatedProject.description}\n\nIncluye ${generatedProject.exercises.length} ejercicios y un proyecto final.\n\nYa está disponible en tu lista de proyectos. ¡Ve a la sección de Ejercicios para empezar!`
      };

      setMessages(prev => [...prev, assistantMessage]);
      */

    } catch (error) {
      const errorMessage = {
        role: 'assistant',
        content: `❌ Error: ${error.message}\n\nAsegúrate de que el servidor esté corriendo y la integración con IA esté configurada.`
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

  // Sugerencias rápidas
  const quickSuggestions = [
    'Proyecto sobre arrays en C',
    'Ejercicios de punteros básicos',
    'Crear un proyecto de strings',
    'Algoritmos de ordenamiento'
  ];

  const handleSuggestionClick = (suggestion) => {
    setUserInput(suggestion);
  };

  return (
    <div className="chatbot-page">
      <div className="chatbot-container">
        <div className="chatbot-header">
          <div className="header-content">
            <span className="ai-icon">🤖</span>
            <div>
              <h2>Asistente de Proyectos</h2>
              <p>Crea proyectos personalizados con IA</p>
            </div>
          </div>
        </div>

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
              </div>
            </div>
          )}
        </div>

        {messages.length === 1 && (
          <div className="quick-suggestions">
            <p>Sugerencias rápidas:</p>
            <div className="suggestions-grid">
              {quickSuggestions.map((suggestion, index) => (
                <button
                  key={index}
                  className="suggestion-chip"
                  onClick={() => handleSuggestionClick(suggestion)}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="input-container">
          <textarea
            className="chat-input"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Describe qué proyecto quieres crear..."
            rows={3}
            disabled={isLoading}
          />
          <button
            className="send-button"
            onClick={handleSendMessage}
            disabled={!userInput.trim() || isLoading}
          >
            {isLoading ? '⏳' : '📤'}
          </button>
        </div>

        <div className="chatbot-footer">
          <div className="integration-notice">
            <span className="notice-icon">💡</span>
            <p>
              <strong>Nota:</strong> La integración con IA está lista para implementarse. 
              Consulta <code>ai-integration-example.js</code> para conectar con Claude, OpenAI o Gemini.
            </p>
          </div>
        </div>
      </div>

      <div className="chatbot-info">
        <div className="info-card">
          <h3>¿Cómo funciona?</h3>
          <ol>
            <li>
              <strong>Describe tu proyecto:</strong> Dile al asistente qué tema te gustaría aprender.
            </li>
            <li>
              <strong>La IA genera ejercicios:</strong> Crea un proyecto completo con ejercicios progresivos.
            </li>
            <li>
              <strong>Guarda y practica:</strong> El proyecto se agrega automáticamente a tu lista.
            </li>
          </ol>
        </div>

        <div className="info-card">
          <h3>Ejemplos de proyectos</h3>
          <ul>
            <li>📝 Manejo de Strings en C</li>
            <li>🔗 Introducción a Punteros</li>
            <li>📊 Arrays y Matrices</li>
            <li>🗂️ Estructuras (struct)</li>
            <li>📁 Manejo de Archivos</li>
            <li>🔄 Recursividad</li>
          </ul>
        </div>

        <div className="info-card">
          <h3>Implementación IA</h3>
          <p>
            Para activar la generación de proyectos con IA, necesitas:
          </p>
          <ul>
            <li>Configurar una API key (Claude, OpenAI, etc.)</li>
            <li>Crear endpoint <code>/api/generate-project</code></li>
            <li>Implementar la lógica en el backend</li>
          </ul>
          <a href="#" className="docs-link">Ver documentación →</a>
        </div>
      </div>
    </div>
  );
}

export default ChatbotPage;
