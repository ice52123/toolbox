// MongoDB 连接（mongoose）
const mongoose = require('mongoose');
const config = require('../config');

async function connect() {
  try {
    await mongoose.connect(config.mongoUri, { serverSelectionTimeoutMS: 5000 });
    console.log('[toolbox-mongo] connected to MongoDB');
  } catch (e) {
    console.error('[toolbox-mongo] MongoDB 连接失败：', e.message);
    process.exit(1);
  }
}

module.exports = { connect, mongoose };
