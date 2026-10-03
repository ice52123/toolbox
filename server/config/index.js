// 后端配置（MySQL 版）。生产环境请用环境变量覆盖，别把密码写死在代码里。
require('dotenv').config();

const config = {
  port: process.env.PORT || 3201,
  jwtSecret: process.env.JWT_SECRET || 'toolbox-dev-secret-change-me',
  jwtExpire: '7d',
  mysql: {
    host: process.env.DB_HOST || '127.0.0.1',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'admin123',
    database: process.env.DB_NAME || 'toolbox',
    waitForConnections: true,
    connectionLimit: 10,
    charset: 'utf8mb4'
  },
  redis: {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: process.env.REDIS_PORT || 6379,
    // 没装 Redis 时自动降级（直连数据库），不影响启动
    enableOfflineQueue: false
  },
  upload: {
    // 文件处理类工具的上传目录（图片/PDF 临时落盘）
    dir: process.env.UPLOAD_DIR || require('path').join(__dirname, '..', 'uploads'),
    maxSize: 20 * 1024 * 1024 // 20MB
  }
};

module.exports = config;
