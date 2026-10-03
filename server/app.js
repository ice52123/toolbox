const express = require('express');
const cors = require('cors');
const path = require('path');
const config = require('./config');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 静态托管处理完的文件，前端用 /files/xxx 下载或预览
app.use('/files', express.static(path.join(__dirname, 'uploads')));

app.get('/api/health', (req, res) => {
  res.json({ code: 0, message: 'success', data: { db: 'mysql', time: Date.now() } });
});

app.use('/api/user', require('./routes/user'));
app.use('/api/tool', require('./routes/tool'));
app.use('/api/upload', require('./routes/upload'));

app.use((req, res) => res.status(404).json({ code: 404, message: '接口不存在', data: null }));

// 全局错误兜底
app.use((err, req, res, next) => {
  console.error('[ERROR]', err.message);
  res.status(500).json({ code: 500, message: '服务器内部错误', data: null });
});

// 旧库补列：异步跑，别让一次 ALTER 卡住启动
require('./routes/user').ensurePhoneColumn();

app.listen(config.port, () => {
  console.log(`[toolbox-mysql] listening on http://localhost:${config.port}`);
});

module.exports = app;
