// frontend/src/services/apiService.js
// Servicio centralizado para todas las llamadas a la API

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

/**
 * Helper para hacer requests con autenticación
 */
const apiRequest = async (endpoint, options = {}) => {
  const token = localStorage.getItem('token');
  
  const config = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers,
    },
  };

  try {
    const response = await fetch(`${API_URL}${endpoint}`, config);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Error en la petición');
    }

    return data;
  } catch (error) {
    console.error(`Error en ${endpoint}:`, error);
    throw error;
  }
};

// ===================================================================
// AUTENTICACIÓN
// ===================================================================

export const authAPI = {
  /**
   * Registrar nuevo usuario
   */
  async register(userData) {
    return apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  /**
   * Iniciar sesión
   */
  async login(email, password) {
    return apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  /**
   * Obtener usuario actual
   */
  async getMe() {
    return apiRequest('/auth/me');
  },

  /**
   * Cerrar sesión
   */
  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('lastSyncUserId');
  },

  /**
   * Actualizar perfil
   */
  async updateProfile(data) {
    return apiRequest('/auth/update-profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  /**
   * Cambiar contraseña
   */
  async changePassword(currentPassword, newPassword) {
    return apiRequest('/auth/change-password', {
      method: 'PUT',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  },
};

// ===================================================================
// PROGRESO
// ===================================================================

export const progressAPI = {
  /**
   * Obtener todos los datos del usuario (ejercicios, proyectos, stats)
   */
  async getFullProgress() {
    const [exercises, projects, stats] = await Promise.all([
      apiRequest('/progress/exercises'),
      apiRequest('/progress/projects'),
      apiRequest('/progress/stats'),
    ]);

    return {
      ejerciciosCompletados: exercises.data?.ejerciciosCompletados || [],
      proyectosDesbloqueados: projects.data?.proyectosDesbloqueados || [],
      stats: stats.data || {},
    };
  },

  /**
   * Completar ejercicio
   */
  async completeExercise(exerciseId) {
    return apiRequest(`/progress/exercises/${exerciseId}/complete`, {
      method: 'POST',
    });
  },

  /**
   * Desbloquear proyecto
   */
  async unlockProject(projectId) {
    return apiRequest(`/progress/projects/${projectId}/unlock`, {
      method: 'POST',
    });
  },

  /**
   * Marcar tema como visto
   */
  async markTheme(materia, temaId, completado = true) {
    return apiRequest(`/progress/themes/${materia}/${temaId}`, {
      method: 'POST',
      body: JSON.stringify({ completado }),
    });
  },

  /**
   * Obtener estadísticas
   */
  async getStats() {
    return apiRequest('/progress/stats');
  },
};

// ===================================================================
// COMPILACIÓN
// ===================================================================

export const compilerAPI = {
  /**
   * Compilar código
   */
  async compile(code, expectedOutput, exerciseId, userInputs = '') {
    return apiRequest('/compile', {
      method: 'POST',
      body: JSON.stringify({
        code,
        expectedOutput,
        exerciseId,
        userInputs,
      }),
    });
  },

  /**
   * Generar proyecto con IA
   */
  async generateProject(userRequest, materia, conversationHistory = []) {
    return apiRequest('/generate-project', {
      method: 'POST',
      body: JSON.stringify({
        userRequest,
        materia,
        conversationHistory,
      }),
    });
  },
};

// ===================================================================
// MATERIAS Y TEMAS
// ===================================================================

export const materiasAPI = {
  /**
   * Obtener todas las materias
   */
  async getMaterias() {
    return apiRequest('/materias');
  },

  /**
   * Obtener temas de una materia
   */
  async getTemas(materia) {
    return apiRequest(`/temas/${materia}`);
  },
};

export default {
  auth: authAPI,
  progress: progressAPI,
  compiler: compilerAPI,
  materias: materiasAPI,
};