require('dotenv').config();

const required = ['MONGODB_URI', 'JWT_SECRET'];
const config = {
  env: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 5000,
  mongoUri: process.env.MONGODB_URI,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '8h',
  corsOrigin: process.env.CORS_ORIGIN,
  allowPublicSignup: process.env.ALLOW_PUBLIC_SIGNUP === 'true', // CON-SEC-001: default false
  bcryptCost: 12, // FR-AUTH-004
};

config.validate = () => {
  const missing = required.filter((k) => !process.env[k]);
  if (missing.length) throw new Error(`Missing env vars: ${missing.join(', ')}`);
};

module.exports = config;
