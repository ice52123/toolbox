const express = require('express');
const cors = require('cors');
const path = require('path');
const config = require('./config');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 接口防重（幂等）：详见 middlewares/idempotency.js。仅对写请求生效，
// 仅对「创建类」白名单接口按内容指纹去重，切换类（点赞/收藏）和聊天不受影响。
app.use(require('./middlewares/idempotency').idempotency());

// 静态托管处理完的文件，前端用 /files/xxx 下载或预览
app.use('/files', express.static(path.join(__dirname, 'uploads')));

app.get('/api/health', (req, res) => {
  res.json({ code: 0, message: 'success', data: { db: 'mysql', time: Date.now() } });
});

app.use('/api/user', require('./routes/user'));
app.use('/api/tool', require('./routes/tool'));
app.use('/api/upload', require('./routes/upload'));
app.use('/api/schools', require('./routes/school'));
app.use('/api/home', require('./routes/home'));
app.use('/api/community', require('./routes/community'));
app.use('/api/posts', require('./routes/posts'));
app.use('/api/users', require('./routes/profile'));
app.use('/api/goods', require('./routes/goods'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/messages', require('./routes/messages'));
app.use('/api/chats', require('./routes/chats'));
app.use('/api/friends', require('./routes/friends'));

app.use((req, res) => res.status(404).json({ code: 404, message: '接口不存在', data: null }));

// 全局错误兜底
app.use((err, req, res, next) => {
  console.error('[ERROR]', err.message);
  res.status(500).json({ code: 500, message: '服务器内部错误', data: null });
});

// 旧库补列：异步跑，别让一次 ALTER 卡住启动（users.phone / goods.place|cond|ways / friends / chats）
require('./routes/user').ensurePhoneColumn();
require('./routes/user').ensureUserCode();
require('./routes/goods').ensureGoodsColumns();
require('./routes/friends').ensureFriendsTable();
require('./routes/chats').ensureChatSchema();
require('./routes/chats').ensureMsgCols();

app.listen(config.port, () => {
  console.log(`[toolbox-mysql] listening on http://localhost:${config.port}`);
});

module.exports = app;
