// src/repositories/mongoose/connection.js
//
// Maneja la conexión a MongoDB vía Mongoose. La conexión es perezosa y única
// (singleton): se abre la primera vez que se piden los repositorios Mongoose y
// se reutiliza después. Solo se ejecuta si DB_DRIVER=mongoose.

import mongoose from 'mongoose';

let connection = null;

export async function connectMongoose() {
  if (connection) return connection;

  const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/bar';
  connection = await mongoose.connect(uri);
  console.log(`MongoDB conectado: ${uri}`);
  return connection;
}

export function getMongooseConnection() {
  return connection;
}

export default mongoose;
