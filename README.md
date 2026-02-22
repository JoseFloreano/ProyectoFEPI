# ESCOMentor

Plataforma interactiva de aprendizaje de programacion en C con asistencia de Inteligencia Artificial, disenada para estudiantes del Instituto Politecnico Nacional (IPN).

## Descripcion

ESCOMentor es una herramienta educativa que guia a los estudiantes a traves de **3 materias seriadas** del plan de estudios de Ingenieria en Inteligencia Artificial y carreras afines de ESCOM/UPIIC:

| Semestre | Materia | Descripcion |
|----------|---------|-------------|
| 1 | **Fundamentos de Programacion** | Sintaxis basica, sentencias de control, funciones, apuntadores y archivos |
| 2 | **Algoritmos y Estructuras de Datos** | Listas enlazadas, pilas, colas, arboles, grafos y algoritmos de ordenamiento |
| 3 | **Analisis y Diseno de Algoritmos** | Complejidad algoritmica, Divide y Venceras, Programacion Dinamica |

## Caracteristicas Principales

### Compilador Integrado
- Escribe, compila y ejecuta codigo C directamente en el navegador
- Sin necesidad de instalar herramientas adicionales
- Soporte para entrada de datos (`scanf`, `gets`, etc.)

### Asistente de IA
- **Generador de Proyectos**: Crea ejercicios personalizados basados en los temarios oficiales del IPN
- **Teoria bajo demanda**: Explicaciones generadas por IA sobre los conceptos de cada ejercicio
- **Sugerencias de errores**: Retroalimentacion inteligente cuando tu codigo no compila o da resultados incorrectos

### Sistema de Progreso
- Ejercicios estructurados por dificultad (Facil, Media, Dificil)
- Proyectos finales que se desbloquean al completar los ejercicios
- Sincronizacion automatica con tu cuenta de Google
- Visualizacion de avance en tiempo real

### Temarios Oficiales
- Acceso a los programas de estudio oficiales del IPN en formato PDF
- Ejercicios alineados con las unidades tematicas de cada materia

## Estructura del Proyecto

```
ProyectoFEPI/
├── frontend/                 # Aplicacion React + Vite
│   ├── src/
│   │   ├── components/       # Componentes reutilizables
│   │   │   ├── CodeEditor.jsx
│   │   │   ├── Navbar.jsx
│   │   │   └── ResultPanel.jsx
│   │   ├── pages/            # Paginas principales
│   │   │   ├── HomePage.jsx
│   │   │   ├── ExercisesPage.jsx
│   │   │   ├── ProjectsPage.jsx
│   │   │   ├── ChatbotPage.jsx
│   │   │   └── MateriasPage.jsx
│   │   ├── context/          # Estado global (Auth, Database, Theme)
│   │   ├── services/         # Comunicacion con API
│   │   └── styles/           # Estilos CSS
│   └── public/
│       └── pdfs/             # Temarios oficiales del IPN
│
├── backend/                  # Servidor Node.js + Express
│   ├── compiler/             # Compilador de C (GCC)
│   ├── config/               # Configuracion de MongoDB
│   ├── middleware/           # Autenticacion JWT
│   └── models/               # Esquemas de usuario
│
└── README.md
```

## Requisitos Previos

### Para el Frontend
- Node.js 18+
- npm o yarn

### Para el Backend
- Node.js 18+
- GCC (compilador de C)
- MongoDB (local o Atlas)

### Variables de Entorno

Crea un archivo `.env` en la carpeta `backend/` basandote en `.env.example`:

```env
# Servidor
PORT=3001

# MongoDB
MONGODB_URI=mongodb://localhost:27017/escomentor

# JWT
JWT_SECRET=tu_secreto_jwt

# Google OAuth
GOOGLE_CLIENT_ID=tu_client_id

# APIs de IA
GEMINI_API_KEY=tu_api_key_gemini
GROQ_API_KEY=tu_api_key_groq

# Timeout de ejecucion (segundos)
EXECUTION_TIMEOUT=5
```

## Instalacion

### 1. Clonar el repositorio
```bash
git clone https://github.com/tu-usuario/escomentor.git
cd escomentor
```

### 2. Instalar dependencias del Frontend
```bash
cd frontend
npm install
```

### 3. Instalar dependencias del Backend
```bash
cd ../backend
npm install
```

### 4. Configurar variables de entorno
```bash
cp .env.example .env
# Editar .env con tus credenciales
```

### 5. Iniciar el proyecto

**Terminal 1 - Backend:**
```bash
cd backend
npm start
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

La aplicacion estara disponible en `http://localhost:5173`

## Como Usar ESCOMentor

### 1. Crear una cuenta
- Inicia sesion con tu cuenta de Google
- Tu progreso se sincronizara automaticamente en todos tus dispositivos

### 2. Seleccionar una materia
Navega a la seccion de **Ejercicios** y selecciona un proyecto:
- **Calculadora Basica** (Facil) - Operaciones aritmeticas
- **Control de Flujo** (Media) - Condicionales y bucles
- **Algoritmos Clasicos** (Dificil) - Factorial, Fibonacci, primos

### 3. Completar ejercicios
1. Lee la descripcion y el output esperado
2. Escribe tu codigo en el editor
3. Presiona "Compilar" para verificar tu solucion
4. Si tienes errores, revisa las sugerencias de la IA

### 4. Desbloquear proyectos finales
- Completa todos los ejercicios de un proyecto
- El proyecto final se desbloqueara automaticamente

### 5. Crear proyectos personalizados con IA
1. Ve a la seccion **Chatbot**
2. Selecciona la materia que quieres practicar
3. Describe que tipo de proyecto necesitas
4. La IA generara ejercicios basados en el temario oficial

## Materias y Contenidos

### Fundamentos de Programacion (Semestre 1)
**Creditos:** TEPIC 7.5 | SATCA 6.1

| Unidad | Contenido |
|--------|-----------|
| I | Programacion Estructurada: Arquitectura Von Neumann, tipos de datos, operadores, sentencias de control, arreglos |
| II | Apuntadores, Estructuras y Funciones: Direcciones de memoria, estructuras, paso por valor/referencia, recursion |
| III | Memoria Dinamica y Archivos: malloc/free, archivos de texto y binarios |

### Algoritmos y Estructuras de Datos (Semestre 2)
**Creditos:** TEPIC 7.5 | SATCA 5.9

- Listas enlazadas (simples, dobles, circulares)
- Pilas y Colas
- Arboles binarios y de busqueda
- Grafos
- Algoritmos de ordenamiento (Bubble, Selection, Insertion, Merge, Quick)
- Algoritmos de busqueda

### Analisis y Diseno de Algoritmos (Semestre 3)
**Creditos:** TEPIC 7.5 | SATCA 6.3

- Notacion Big-O
- Divide y Venceras
- Programacion Dinamica
- Algoritmos Voraces (Greedy)
- Backtracking
- Algoritmos sobre grafos (Dijkstra, Floyd-Warshall, etc.)

## Tecnologias Utilizadas

### Frontend
- **React 18** - Biblioteca de UI
- **Vite** - Build tool
- **React Markdown** - Renderizado de contenido
- **Monaco Editor** - Editor de codigo

### Backend
- **Node.js** - Runtime
- **Express** - Framework web
- **MongoDB** - Base de datos
- **GCC** - Compilador de C
- **Google Generative AI (Gemini)** - Generacion de contenido
- **JWT** - Autenticacion

## Contribuir

Las contribuciones son bienvenidas. Por favor:

1. Haz fork del repositorio
2. Crea una rama para tu feature (`git checkout -b feature/nueva-funcionalidad`)
3. Haz commit de tus cambios (`git commit -m 'Agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abre un Pull Request

## Recursos Adicionales

- [Temario Fundamentos de Programacion (PDF)](/frontend/public/pdfs/fundamentos-programacion.pdf)
- [Temario Estructuras de Datos (PDF)](/frontend/public/pdfs/estructuras-datos.pdf)
- [Temario Analisis de Algoritmos (PDF)](/frontend/public/pdfs/analisis-algoritmos.pdf)

## Bibliografia Recomendada

- Kernighan, B. & Ritchie, D. (1991). *El lenguaje de programacion C*. Prentice-Hall.
- Joyanes, L. (2013). *Fundamentos generales de programacion*. McGraw-Hill.
- Reese, R. (2013). *Understanding and using C pointers*. O'Reilly.
- Sznajdleder, P. (2017). *Programacion estructurada a fondo*. Alfaomega.

## Licencia

Este proyecto fue desarrollado como parte del programa FEPI (Formacion en Emprendimiento e Innovacion) del Instituto Politecnico Nacional.

---

**ESCOMentor** - Aprende C de manera interactiva con IA
