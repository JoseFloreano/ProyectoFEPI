// backend/config/database.js
const mongoose = require('mongoose');

/**
 * Conectar a MongoDB
 */
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      // Opciones de conexión
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`✅ MongoDB conectado: ${conn.connection.host}`);
    console.log(`📊 Base de datos: ${conn.connection.name}`);

    // Evento: Conexión exitosa
    mongoose.connection.on('connected', () => {
      console.log('📡 Mongoose conectado a MongoDB');
    });

    // Evento: Error de conexión
    mongoose.connection.on('error', (err) => {
      console.error('❌ Error de conexión MongoDB:', err);
    });

    // Evento: Desconexión
    mongoose.connection.on('disconnected', () => {
      console.log('🔌 Mongoose desconectado de MongoDB');
    });

    // Cerrar conexión al terminar proceso
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('🛑 Conexión MongoDB cerrada por terminación de app');
      process.exit(0);
    });

    return conn;
  } catch (error) {
    console.error('❌ Error al conectar a MongoDB:', error.message);
    process.exit(1);
  }
};

/**
 * Desconectar de MongoDB
 */
const disconnectDB = async () => {
  try {
    await mongoose.connection.close();
    console.log('🔌 Desconectado de MongoDB');
  } catch (error) {
    console.error('❌ Error al desconectar de MongoDB:', error.message);
  }
};

/**
 * Verificar estado de conexión
 */
const isConnected = () => {
  return mongoose.connection.readyState === 1;
};

module.exports = {
  connectDB,
  disconnectDB,
  isConnected
};
