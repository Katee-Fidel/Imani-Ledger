// Creates the first admin account so onboarding can proceed without public signup (CON-SEC-001).
// Usage: SEED_ADMIN_EMAIL=... SEED_ADMIN_PASSWORD=... npm run seed:admin
const bcrypt = require('bcrypt');
const config = require('../config');
const logger = require('./logger');
const { connectDB, disconnectDB } = require('../config/db');
const User = require('../models/User');

async function run() {
  const email = process.env.SEED_ADMIN_EMAIL;
  const password = process.env.SEED_ADMIN_PASSWORD;
  if (!email || !password) {
    throw new Error('SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD must be set');
  }

  await connectDB();
  const existing = await User.findOne({ email });
  if (existing) {
    logger.info(`Admin already exists for ${email}`);
    return;
  }

  const hashed = await bcrypt.hash(password, config.bcryptCost);
  await User.create({
    fullName: process.env.SEED_ADMIN_NAME || 'System Administrator',
    email,
    phoneNumber: process.env.SEED_ADMIN_PHONE || '0000000000',
    password: hashed,
    role: 'admin',
  });
  logger.info(`Admin account created for ${email}`);
}

run()
  .catch((err) => {
    logger.error(err);
    process.exitCode = 1;
  })
  .finally(() => disconnectDB());
