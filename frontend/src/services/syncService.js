// frontend/src/services/syncService.js - ACTUALIZADO
import { authAPI, progressAPI } from './apiService';

/**
 * Sincronizar progreso Y proyectos desde MongoDB a DatabaseContext local
 */
export const syncFromMongo = async (databaseContext) => {
  try {
    console.log('🔄 Sincronizando desde MongoDB...');

    // Obtener progreso completo
    const mongoProgress = await progressAPI.getFullProgress();

    // Obtener proyectos personalizados
    const projectsResponse = await fetch('http://localhost:3001/api/projects', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    const projectsData = await projectsResponse.json();

    // Obtener funciones del DatabaseContext
    const { 
      completeExercise, 
      unlockProject,
      clearAllProgress,
      setProjects
    } = databaseContext;

    // Limpiar progreso local
    clearAllProgress();

    // Sincronizar ejercicios completados
    mongoProgress.ejerciciosCompletados.forEach(exerciseId => {
      completeExercise(exerciseId);
    });

    // Sincronizar proyectos desbloqueados
    mongoProgress.proyectosDesbloqueados.forEach(projectId => {
      unlockProject(projectId);
    });

    // ===== NUEVO: Sincronizar proyectos personalizados =====
    if (projectsData.success && projectsData.data.projects) {
      // Guardar todos los proyectos (base + personalizados) en local
      localStorage.setItem('c-practice-projects', JSON.stringify(projectsData.data.projects));
    }

    console.log('✅ Sincronización completada desde MongoDB');
    console.log(`📊 Ejercicios: ${mongoProgress.ejerciciosCompletados.length}`);
    console.log(`🚀 Proyectos: ${mongoProgress.proyectosDesbloqueados.length}`);
    console.log(`✨ Proyectos personalizados: ${projectsData.data?.personalizados || 0}`);

    // Forzar recarga de proyectos en el contexto
    window.location.reload();

    return mongoProgress;
  } catch (error) {
    console.error('❌ Error en sincronización desde MongoDB:', error);
    throw error;
  }
};

/**
 * Verificar si necesita sincronización completa
 */
export const needsFullSync = async (databaseContext) => {
  try {
    const { getCompletedExercises, getUnlockedProjects } = databaseContext;
    
    const mongoProgress = await progressAPI.getFullProgress();

    const localExercises = getCompletedExercises();
    const localProjects = getUnlockedProjects();

    const exercisesMatch = localExercises.length === mongoProgress.ejerciciosCompletados.length;
    const projectsMatch = localProjects.length === mongoProgress.proyectosDesbloqueados.length;

    if (!exercisesMatch || !projectsMatch) {
      console.log('⚠️ Progreso local y MongoDB no coinciden');
      return true;
    }

    const localExerciseIds = new Set(localExercises);
    const mongoExerciseIds = new Set(mongoProgress.ejerciciosCompletados);
    
    for (const id of mongoExerciseIds) {
      if (!localExerciseIds.has(id)) {
        console.log('⚠️ Ejercicio en MongoDB no está en local:', id);
        return true;
      }
    }

    // ===== NUEVO: Verificar proyectos personalizados =====
    try {
      const projectsResponse = await fetch('http://localhost:3001/api/projects', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const projectsData = await projectsResponse.json();

      const localProjects = JSON.parse(localStorage.getItem('c-practice-projects') || '[]');
      
      if (projectsData.data.projects.length !== localProjects.length) {
        console.log('⚠️ Cantidad de proyectos no coincide');
        return true;
      }
    } catch (error) {
      console.error('Error verificando proyectos:', error);
      return true;
    }

    console.log('✅ Progreso local y MongoDB están sincronizados');
    return false;
  } catch (error) {
    console.error('❌ Error verificando sincronización:', error);
    return true;
  }
};

/**
 * Guardar progreso en MongoDB
 */
export const saveToMongo = async (type, id) => {
  try {
    if (type === 'exercise') {
      await progressAPI.completeExercise(id);
      console.log(`✅ Ejercicio ${id} guardado en MongoDB`);
    } else if (type === 'project') {
      await progressAPI.unlockProject(id);
      console.log(`✅ Proyecto ${id} guardado en MongoDB`);
    }
    return true;
  } catch (error) {
    console.error(`❌ Error guardando ${type} ${id} en MongoDB:`, error);
    return false;
  }
};

/**
 * ===== NUEVO: Guardar proyecto personalizado en MongoDB =====
 */
export const saveCustomProjectToMongo = async (projectData) => {
  try {
    const token = localStorage.getItem('token');
    
    const response = await fetch('http://localhost:3001/api/projects/custom', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ projectData })
    });

    const data = await response.json();

    if (data.success) {
      console.log('✅ Proyecto personalizado guardado en MongoDB');
      return true;
    }

    return false;
  } catch (error) {
    console.error('❌ Error guardando proyecto personalizado en MongoDB:', error);
    return false;
  }
};

/**
 * Sincronización inicial al login
 */
export const initialSync = async (userId, databaseContext) => {
  try {
    const lastSyncUserId = localStorage.getItem('lastSyncUserId');

    if (lastSyncUserId === userId) {
      const needsSync = await needsFullSync(databaseContext);
      
      if (!needsSync) {
        console.log('✅ Usuario ya sincronizado, no se requiere sync');
        return 'already-synced';
      }
    }

    await syncFromMongo(databaseContext);

    localStorage.setItem('lastSyncUserId', userId);

    return 'synced';
  } catch (error) {
    console.error('❌ Error en sincronización inicial:', error);
    throw error;
  }
};

/**
 * Sincronización dual: guardar en local Y en MongoDB
 */
export const dualSave = async (type, id, localSaveFunction) => {
  // 1. Guardar en local primero (instantáneo)
  localSaveFunction();

  // 2. Guardar en MongoDB (en background)
  saveToMongo(type, id).catch(err => {
    console.error('⚠️ Error guardando en MongoDB, pero local guardado:', err);
  });
};

export default {
  syncFromMongo,
  needsFullSync,
  saveToMongo,
  saveCustomProjectToMongo,  // ← NUEVO
  initialSync,
  dualSave,
};