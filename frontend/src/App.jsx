import React, { useState } from 'react';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import ExercisesPage from './pages/ExercisesPage';
import ProjectsPage from './pages/ProjectsPage';
import ChatbotPage from './pages/ChatbotPage';
import MateriasPage from './pages/MateriasPage';
import { DatabaseProvider } from './context/DatabaseContext';
import './App.css';

function App() {
  const [currentPage, setCurrentPage] = useState('home');
  // Renderizar la página actual
  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <HomePage onNavigate={setCurrentPage} />;
      case 'exercises':
        return <ExercisesPage />;
      case 'projects':
        return <ProjectsPage />;
      case 'chatbot':
        return <ChatbotPage />;
      case 'materias':
        return <MateriasPage />;
      default:
        return <HomePage onNavigate={setCurrentPage} />;
    }
  };

  return (
    <DatabaseProvider>
      <div className="app">
        <Navbar currentPage={currentPage} onNavigate={setCurrentPage} />
        <main className="main-content">
          {renderPage()}
        </main>
      </div>
    </DatabaseProvider>
  );
}

export default App;