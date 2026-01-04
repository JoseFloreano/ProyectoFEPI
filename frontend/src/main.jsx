import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { ThemeProvider } from './context/ThemeContext';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider } from './context/AuthContext';
import ErrorBoundary from './components/ErrorBoundary';

console.log("Iniciando main.jsx");

const env = import.meta.env;
console.log("Variables de entorno cargadas:", Object.keys(env));
console.log("VITE_GOOGLE_CLIENT_ID disponible?", !!env.VITE_GOOGLE_CLIENT_ID);
// No loguear el valor real por seguridad en logs compartidos, pero el usuario lo verá en su consola local
if (env.VITE_GOOGLE_CLIENT_ID) {
  console.log("Longitud del ID:", env.VITE_GOOGLE_CLIENT_ID.length);
}

const googleClientId = env.VITE_GOOGLE_CLIENT_ID;

if (!googleClientId) {
  console.error("Falta VITE_GOOGLE_CLIENT_ID en el archivo .env");
  console.error("Asegúrate de que el archivo .env está en: frontend/.env");
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <GoogleOAuthProvider clientId={googleClientId || "placeholder_id"}>
        <AuthProvider>
          <ThemeProvider>
            <App />
          </ThemeProvider>
        </AuthProvider>
      </GoogleOAuthProvider>
    </ErrorBoundary>
  </StrictMode>,
);
