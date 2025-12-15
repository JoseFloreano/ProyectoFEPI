import React, { useState } from 'react';
import '../styles/MateriasPage.css';

function MateriasPage() {
  const [selectedMateria, setSelectedMateria] = useState(null);

  const materias = [
    {
      id: 'fundamentos',
      nombre: 'Fundamentos de Programación',
      icon: '📚',
      color: '#6366f1',
      descripcion: 'Introducción a la programación en C, sintaxis básica, estructuras de control, funciones y manejo de memoria.',
      semestre: 1,
      creditos: 'TEPIC: 7.5 | SATCA: 6.1',
      temas: 54,
      pdfUrl: '/pdfs/fundamentos-programacion.pdf'
    },
    {
      id: 'estructuras',
      nombre: 'Algoritmos y Estructuras de Datos',
      icon: '🔗',
      color: '#8b5cf6',
      descripcion: 'Estructuras de datos fundamentales, algoritmos de ordenamiento, búsqueda, pilas, colas, listas y árboles.',
      semestre: 2,
      creditos: 'TEPIC: 7.5 | SATCA: 5.9',
      temas: 56,
      pdfUrl: '/pdfs/estructuras-datos.pdf'
    },
    {
      id: 'analisis',
      nombre: 'Análisis y Diseño de Algoritmos',
      icon: '📊',
      color: '#ec4899',
      descripcion: 'Análisis de complejidad, técnicas avanzadas como Divide y Vencerás, Programación Dinámica y Algoritmos Voraces.',
      semestre: 3,
      creditos: 'TEPIC: 7.5 | SATCA: 6.3',
      temas: 49,
      pdfUrl: '/pdfs/analisis-algoritmos.pdf'
    }
  ];

  const handleVerTemario = (materia) => {
    setSelectedMateria(materia);
  };

  const handleCerrarVisor = () => {
    setSelectedMateria(null);
  };

  return (
    <div className="page-wrapper">
      <div className="materias-page">
        {/* Header */}
        <div className="materias-header">
          <h1>
            <span className="header-icon">📖</span>
            Temarios de Materias
          </h1>
          <p>Consulta los temarios oficiales del IPN para cada materia</p>
        </div>

        {/* Grid de Materias */}
        {!selectedMateria ? (
          <div className="materias-grid">
            {materias.map((materia) => (
              <div 
                key={materia.id} 
                className="materia-card"
                style={{ '--materia-color': materia.color }}
              >
                <div className="materia-card-header">
                  <span className="materia-icon">{materia.icon}</span>
                  <div className="materia-badge">
                    Semestre {materia.semestre}
                  </div>
                </div>

                <div className="materia-card-content">
                  <h3>{materia.nombre}</h3>
                  <p className="materia-descripcion">{materia.descripcion}</p>

                  <div className="materia-stats">
                    <div className="stat-item">
                      <span className="stat-icon">📝</span>
                      <span className="stat-value">{materia.temas} temas</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-icon">⭐</span>
                      <span className="stat-value">{materia.creditos}</span>
                    </div>
                  </div>
                </div>

                <button 
                  className="btn-ver-temario"
                  onClick={() => handleVerTemario(materia)}
                >
                  📄 Ver Temario Oficial
                </button>
              </div>
            ))}
          </div>
        ) : (
          /* Visualizador de PDF */
          <div className="pdf-viewer-container">
            <div className="pdf-viewer-header">
              <button 
                className="btn-back"
                onClick={handleCerrarVisor}
              >
                ← Volver a Materias
              </button>
              <h2>
                <span className="viewer-icon">{selectedMateria.icon}</span>
                {selectedMateria.nombre}
              </h2>
              <a 
                href={selectedMateria.pdfUrl} 
                download 
                className="btn-download"
                target="_blank"
                rel="noopener noreferrer"
              >
                ⬇️ Descargar PDF
              </a>
            </div>

            <div className="pdf-viewer-content">
              <iframe
                src={selectedMateria.pdfUrl}
                title={`Temario - ${selectedMateria.nombre}`}
                className="pdf-iframe"
              />
            </div>

            <div className="pdf-viewer-info">
              <div className="info-item">
                <strong>Créditos:</strong> {selectedMateria.creditos}
              </div>
              <div className="info-item">
                <strong>Temas totales:</strong> {selectedMateria.temas}
              </div>
              <div className="info-item">
                <strong>Semestre:</strong> {selectedMateria.semestre}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default MateriasPage;