// config/config.js
require('dotenv').config(); // .env 로드

const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 5000,
  serviceName: process.env.SERVICE_NAME || 'knights-frontier',

  db: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    user: process.env.DB_USER || 'user',
    pass: process.env.DB_PASS || 'pass',
    name: process.env.DB_NAME || 'db',
  },
};

module.exports = config;
