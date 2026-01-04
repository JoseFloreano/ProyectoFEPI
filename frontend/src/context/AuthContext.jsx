import { createContext, useContext, useEffect, useState } from "react";
import { authAPI } from "../services/apiService";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  /* 
    Función de limpieza centralizada 
    Elimina TODOS los datos de sesión y progreso local
  */
  const clearSessionData = () => {
    console.log("🧹 Limpiando datos de sesión local...");
    setUser(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("lastSyncUserId");
    localStorage.removeItem("c-practice-projects");
    localStorage.removeItem("c-practice-completed");
    localStorage.removeItem("c-practice-unlocked");
    localStorage.removeItem("c-practice-active-project");
  };

  const logout = () => {
    console.log("🚪 AuthContext: Ejecutando logout explicitamente.");
    clearSessionData();
    window.location.href = '/login';
  };

  useEffect(() => {
    const initAuth = async () => {
      console.log("🔒 AuthContext: Iniciando verificación de sesión...");
      const token = localStorage.getItem("token");
      if (token) {
        console.log("🔒 Token encontrado en localStorage. Verificando con backend...");
        try {
          // Verificar token con backend
          const response = await authAPI.getMe();
          if (response.success && response.user) {
            console.log("✅ Sesión válida. Usuario:", response.user.email);
            setUser(response.user);
          } else {
            console.warn("⚠️ Sesión inválida según backend. Cerrando sesión.", response);
            clearSessionData(); // Usar limpieza completa
          }
        } catch (error) {
          console.error("❌ Error verificando sesión al recargar:", error);
          // IMPORTANTE: Si es error de red (servidor apagado), NO cerrar sesión automáticamente
          // Solo cerrar si es 401 o token inválido

          if (error.message && (error.message.includes('401') || error.message.includes('token'))) {
            console.warn("❌ Token expirado o inválido. Limpiando sesión.");
            clearSessionData();
          } else {
            console.warn("⚠️ Error de conexión con backend. Manteniendo sesión local temporalmente.");
            // Opcional: Podríamos mantener el user del localStorage si queremos "offline mode"
            const localUser = localStorage.getItem("user");
            if (localUser) {
              setUser(JSON.parse(localUser));
            }
          }
        }
      } else {
        console.log("ℹ️ No hay token almacenado.");
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email, password) => {
    console.log("🔑 AuthContext: Intentando login...");
    try {
      // Casos:
      // 1. Google Login (objeto con uid/email)
      if (typeof email === 'object' && email.email) {
        console.log("🔑 Intentando Google Login para:", email.email);
        const googleData = {
          email: email.email,
          name: email.name,
          googleId: email.uid,
          picture: email.picture
        };

        const response = await authAPI.googleLogin(googleData);

        if (response.success) {
          // Fusionar datos del backend con la foto de Google si el backend no la tiene
          const userWithPic = { ...response.data.user, picture: email.picture };

          setUser(userWithPic);
          localStorage.setItem("token", response.data.token);
          localStorage.setItem("user", JSON.stringify(userWithPic));
          console.log("✅ Google Login exitoso. Usuario:", userWithPic.email);
          return { success: true };
        } else {
          console.warn("❌ Google Login fallido:", response.message);
          return { success: false, error: response.message };
        }
      }

      // 2. Normal Login (email string, password string)
      const response = await authAPI.login(email, password);

      if (response.success) {
        setUser(response.data.user); // data.user según estructura de respuesta del login normal
        localStorage.setItem("token", response.data.token); // data.token
        localStorage.setItem("user", JSON.stringify(response.data.user));
        return { success: true };
      }
      return { success: false, error: response.message };
    } catch (error) {
      console.error("Login error:", error);
      return { success: false, error: error.message };
    }
  };

  const register = async (name, email, password) => {
    try {
      // Backend espera 'nombre', no 'name'
      const response = await authAPI.register({ nombre: name, email, password });

      if (response.success) {
        setUser(response.user);
        localStorage.setItem("token", response.token);
        localStorage.setItem("user", JSON.stringify(response.user));
        return { success: true };
      }
      return { success: false, error: response.message };
    } catch (error) {
      console.error("Register error:", error);
      return { success: false, error: error.message };
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
