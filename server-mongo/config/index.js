// 后端配置（MongoDB 版）
require('dotenv').config();
const path = require('path');

const config = {
  port: process.env.PORT || 3202,
  jwtSecret: process.env.JWT_SECRET || 'toolbox-dev-secret-change-me',
  jwtExpire: '7d',
  mongoUri: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/toolbox',
  upload: {
    dir: process.env.UPLOAD_DIR || path.join(__dirname, '..', 'uploads'),
    maxSize: 20 * 1024 * 1024
  }
};

module.exports = config;
