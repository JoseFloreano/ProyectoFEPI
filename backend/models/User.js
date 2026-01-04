// backend/models/User.js - ACTUALIZADO
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  // Información básica
  nombre: {
    type: String,
    required: [true, 'El nombre es obligatorio'],
    trim: true,
    minlength: [2, 'El nombre debe tener al menos 2 caracteres'],
    maxlength: [50, 'El nombre no puede exceder 50 caracteres']
  },

  email: {
    type: String,
    required: [true, 'El email es obligatorio'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Por favor ingresa un email válido']
  },

  password: {
    type: String,
    required: [true, 'La contraseña es obligatoria'],
    minlength: [6, 'La contraseña debe tener al menos 6 caracteres'],
    select: false
  },

  // Información adicional
  matricula: {
    type: String,
    trim: true,
    sparse: true,
    match: [/^\d{10}$/, 'La matrícula debe tener 10 dígitos']
  },

  carrera: {
    type: String,
    enum: ['Ingeniería en Inteligencia Artificial', 'Otra'],
    default: 'Ingeniería en Inteligencia Artificial'
  },

  semestre: {
    type: Number,
    min: 1,
    max: 10
  },

  // Progreso del usuario
  ejerciciosCompletados: [{
    type: Number  // IDs de ejercicios completados
  }],

  proyectosDesbloqueados: [{
    type: Number  // IDs de proyectos desbloqueados
  }],

  // ===== NUEVO: Proyectos personalizados creados con IA =====
  proyectosPersonalizados: [{
    id: Number,
    name: String,
    description: String,
    difficulty: String,
    icon: String,
    color: String,
    isCustom: { type: Boolean, default: true },
    materia: String,
    exercises: [{
      id: Number,
      projectId: Number,
      title: String,
      description: String,
      expectedOutput: String,
      starterCode: String,
      hints: [String],
      theoryTopics: [String]
    }],
    finalProject: {
      title: String,
      description: String,
      starterCode: String,
      theoryTopics: [String]
    },
    fechaCreacion: { type: Date, default: Date.now }
  }],

  temasVistos: [{
    materia: String,
    temaId: Number,
    completado: Boolean,
    fecha: Date
  }],

  // Configuración
  tema: {
    type: String,
    enum: ['dark', 'light'],
    default: 'dark'
  },

  // Metadatos
  fechaRegistro: {
    type: Date,
    default: Date.now
  },

  ultimoAcceso: {
    type: Date,
    default: Date.now
  },

  activo: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Índices
userSchema.index({ email: 1 });
userSchema.index({ matricula: 1 });

// Middleware: Hashear contraseña antes de guardar
// Middleware: Hashear contraseña antes de guardar
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Método: Comparar contraseña
userSchema.methods.compararPassword = async function (passwordIngresada) {
  try {
    return await bcrypt.compare(passwordIngresada, this.password);
  } catch (error) {
    throw new Error('Error al comparar contraseñas');
  }
};

// Método: Actualizar último acceso
userSchema.methods.actualizarAcceso = async function () {
  this.ultimoAcceso = Date.now();
  return await this.save();
};

// Método: Obtener progreso del usuario
userSchema.methods.obtenerProgreso = function () {
  return {
    ejerciciosCompletados: this.ejerciciosCompletados.length,
    proyectosDesbloqueados: this.proyectosDesbloqueados.length,
    proyectosPersonalizados: this.proyectosPersonalizados.length,
    temasVistos: this.temasVistos.length
  };
};

// Método: Marcar ejercicio como completado
userSchema.methods.completarEjercicio = async function (ejercicioId) {
  if (!this.ejerciciosCompletados.includes(ejercicioId)) {
    this.ejerciciosCompletados.push(ejercicioId);
    return await this.save();
  }
  return this;
};

// Método: Desbloquear proyecto
userSchema.methods.desbloquearProyecto = async function (proyectoId) {
  if (!this.proyectosDesbloqueados.includes(proyectoId)) {
    this.proyectosDesbloqueados.push(proyectoId);
    return await this.save();
  }
  return this;
};

// ===== NUEVO: Agregar proyecto personalizado =====
userSchema.methods.agregarProyectoPersonalizado = async function (proyectoData) {
  this.proyectosPersonalizados.push(proyectoData);
  return await this.save();
};

// ===== NUEVO: Obtener todos los proyectos (base + personalizados) =====
userSchema.methods.obtenerTodosProyectos = function (proyectosBase) {
  // proyectosBase son los 3 proyectos iniciales hardcodeados
  return [...proyectosBase, ...this.proyectosPersonalizados];
};

// Método: JSON personalizado (no enviar contraseña)
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.__v;
  return obj;
};

const User = mongoose.model('User', userSchema);

module.exports = User;