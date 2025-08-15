// config/mongo.js
const mongoose = require('mongoose');

async function connectMongo(uri = process.env.MONGO_URI, options = {}) {
  if (!uri) throw new Error('MONGO_URI no definido');
  const clean = uri.replace(/^"|"$/g, '');
  mongoose.set('strictQuery', true);

  const finalOpts = {
    autoIndex: process.env.NODE_ENV !== 'production', // evita recrear índices en prod
    ...options,
  };

  await mongoose.connect(clean, finalOpts);
  console.log('MongoDB conectado:', mongoose.connection.host, 'db:', mongoose.connection.name);
  return mongoose.connection;
}
module.exports = { connectMongo };
