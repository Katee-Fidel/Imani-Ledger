const mongoose = require('mongoose');
const config = require('./index');

async function connectDB(uri = config.mongoUri) {
  await mongoose.connect(uri);
  return mongoose.connection;
}

const disconnectDB = () => mongoose.disconnect();

module.exports = { connectDB, disconnectDB };
