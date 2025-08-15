// config/mongo.js
const mongoose = require('mongoose');

async function connectMongo(uri = process.env.MONGO_URI, options = {}) {
  if (!uri) throw new Error('MONGO_URI no definido');
  const clean = uri.replace(/^"|"$/g, ''); // quita comillas si las hay
  mongoose.set('strictQuery', true);
  await mongoose.connect(clean, options);
  console.log('MongoDB conectado:', mongoose.connection.host, 'db:', mongoose.connection.name);
  return mongoose.connection;
}
module.exports = { connectMongo };
