const express = require('express');
const cors = require('cors');
const path = require('path');
const config = require('./config');
const { connect } = require('./db/mongo');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/files', express.static(path.join(__dirname, 'uploads')));

app.get('/api/health', (req, res) => {
  res.json({ code: 0, message: 'success', data: { db: 'mongo', time: Date.now() } });
});

// 首页/社区/订单/消息/闲置：骨架已挂，实现在各 routes 文件里由小喵填（见 docs/API-清单.md）
// 注意：/api/user/me 必须挂在 /api/user 之前
app.use('/api/user/me', require('./routes/favorite'));
app.use('/api/user', require('./routes/user'));
app.use('/api/tool', require('./routes/tool'));
app.use('/api/upload', require('./routes/upload'));
app.use('/api/schools', require('./routes/school'));
app.use('/api/home', require('./routes/home'));
app.use('/api/notices', require('./routes/notice'));
app.use('/api/community', require('./routes/community'));
app.use('/api/posts', require('./routes/post'));
app.use('/api/users', require('./routes/profile'));
app.use('/api/orders', require('./routes/order'));
app.use('/api/messages', require('./routes/message'));
app.use('/api/chats', require('./routes/chat'));
app.use('/api/goods', require('./routes/good'));

app.use((req, res) => res.status(404).json({ code: 404, message: '接口不存在', data: null }));

app.use((err, req, res, next) => {
  console.error('[ERROR]', err.message);
  res.status(500).json({ code: 500, message: '服务器内部错误', data: null });
});

connect().then(() => {
  app.listen(config.port, () => {
    console.log(`[toolbox-mongo] listening on http://localhost:${config.port}`);
  });
});

module.exports = app;
