import React from 'react';
import '../styles/ExerciseList.css';

function ExerciseList({ exercises, selectedExercise, onExerciseSelect }) {
  return (
    <aside className="exercise-list">
      <div className="exercise-list-header">
        <h3>Ejercicios</h3>
        <span className="exercise-count">{exercises.length} total</span>
      </div>

      <div className="exercise-items">
        {exercises.map((exercise) => (
          <div
            key={exercise.id}
            className={`exercise-item ${selectedExercise.id === exercise.id ? 'active' : ''}`}
            onClick={() => onExerciseSelect(exercise)}
          >
            <div className="exercise-item-header">
              <span className="exercise-number">#{exercise.id}</span>
              <span className={`exercise-badge badge-${exercise.difficulty.toLowerCase()}`}>
                {exercise.difficulty}
              </span>
            </div>
            
            <h4 className="exercise-title">{exercise.title}</h4>
            
            <p className="exercise-preview">
              {exercise.description.substring(0, 60)}...
            </p>
          </div>
        ))}
      </div>
    </aside>
  );
}

export default ExerciseList;