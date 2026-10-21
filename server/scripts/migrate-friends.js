// 一次性迁移：建 friends 表 + 给 conversations 补好友私聊字段（user_a/user_b/unread_a/unread_b/last_sender）。
// 与 app.js 启动钩子里的 ensureFriendsTable / ensureChatSchema 逻辑一致，单独跑一遍只为不依赖重启旧进程。
const { exec, query } = require('../db/mysql');

async function main() {
  await exec(`CREATE TABLE IF NOT EXISTS friends (
    id         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    user_id    INT UNSIGNED    NOT NULL,
    friend_id  INT UNSIGNED    NOT NULL,
    remark     VARCHAR(50)     NOT NULL DEFAULT '',
    created_at DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_pair (user_id, friend_id),
    KEY idx_user (user_id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
  console.log('[migrate] friends 表就绪');

  const cols = await query(
    `SELECT COLUMN_NAME FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'conversations'`
  );
  const has = new Set(cols.map((c) => c.COLUMN_NAME));
  const adds = [
    ['user_a', 'INT UNSIGNED NOT NULL DEFAULT 0'],
    ['user_b', 'INT UNSIGNED NOT NULL DEFAULT 0'],
    ['unread_a', 'INT UNSIGNED NOT NULL DEFAULT 0'],
    ['unread_b', 'INT UNSIGNED NOT NULL DEFAULT 0'],
    ['last_sender', 'INT UNSIGNED NOT NULL DEFAULT 0']
  ];
  for (const [col, def] of adds) {
    if (!has.has(col)) {
      await exec(`ALTER TABLE conversations ADD COLUMN ${col} ${def}`);
      console.log('[migrate] conversations 已补列 ' + col);
    }
  }
  console.log('[migrate] 完成');
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error('[migrate] 失败：', e.message);
    process.exit(1);
  });
