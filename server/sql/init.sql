-- 在线工具箱 MySQL 版建表脚本（全量）
-- 执行顺序：先建库，再 source 本文件
--   mysql -e "CREATE DATABASE IF NOT EXISTS toolbox CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
--   mysql toolbox --default-character-set=utf8mb4 < server/sql/init.sql
SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS users (
  id         INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  username   VARCHAR(50)  NOT NULL,
  password   VARCHAR(100) NOT NULL,
  phone      VARCHAR(20)  NULL DEFAULT NULL,
  code       CHAR(6)      NOT NULL DEFAULT '',   -- 6 位唯一用户ID（字母数字混合，去 0O1IL）
  nickname   VARCHAR(50)  NOT NULL DEFAULT '',
  avatar     VARCHAR(255) NOT NULL DEFAULT '',
  school     VARCHAR(32)  NULL DEFAULT NULL,
  created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_username (username),
  UNIQUE KEY uk_phone (phone),
  UNIQUE KEY uk_user_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS tool_history (
  id         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id    INT UNSIGNED    NOT NULL,
  tool_id    VARCHAR(50)     NOT NULL,
  tool_name  VARCHAR(100)    NOT NULL DEFAULT '',
  summary    VARCHAR(500)    NOT NULL DEFAULT '',
  created_at DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_user (user_id),
  KEY idx_tool (tool_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 学校：code 是业务主键（学校国标码/自定义码），id 字段回传时复用 code
CREATE TABLE IF NOT EXISTS schools (
  code     VARCHAR(32)  NOT NULL PRIMARY KEY,
  name     VARCHAR(100) NOT NULL,
  province VARCHAR(50)  NOT NULL DEFAULT '',
  city     VARCHAR(50)  NOT NULL DEFAULT '',
  level    VARCHAR(20)  NOT NULL DEFAULT '',
  sort     INT          NOT NULL DEFAULT 0,
  KEY idx_province (province)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 公告：school 为空 = 全站公告（对所有校区可见）
CREATE TABLE IF NOT EXISTS notices (
  id         INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  tag        VARCHAR(30)  NOT NULL DEFAULT '校园',
  title      VARCHAR(200) NOT NULL,
  content    TEXT         NOT NULL,
  date       DATE         NOT NULL DEFAULT (CURRENT_DATE),
  school     VARCHAR(32)  NULL DEFAULT NULL,
  created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_school (school)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 帖子：school 隔离；likes/collects/comments 用计数缓存，写操作原子自增
CREATE TABLE IF NOT EXISTS posts (
  id         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  board_key  VARCHAR(30)  NOT NULL DEFAULT 'general',
  title      VARCHAR(200) NOT NULL,
  body       TEXT         NOT NULL,
  author_id  INT UNSIGNED NOT NULL,
  author_name VARCHAR(50) NOT NULL DEFAULT '',
  school     VARCHAR(32)  NULL DEFAULT NULL,
  views      INT UNSIGNED NOT NULL DEFAULT 0,
  likes      INT UNSIGNED NOT NULL DEFAULT 0,
  collects   INT UNSIGNED NOT NULL DEFAULT 0,
  comments   INT UNSIGNED NOT NULL DEFAULT 0,
  created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_board (board_key),
  KEY idx_school (school),
  KEY idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS post_tags (
  id      BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  post_id BIGINT UNSIGNED NOT NULL,
  tag     VARCHAR(40) NOT NULL,
  KEY idx_post (post_id),
  KEY idx_tag (tag)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS post_comments (
  id        BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  post_id   BIGINT UNSIGNED NOT NULL,
  parent_id BIGINT UNSIGNED NULL DEFAULT NULL,
  user_id   INT UNSIGNED    NOT NULL,
  name      VARCHAR(50)    NOT NULL DEFAULT '',
  text      TEXT           NOT NULL,
  created_at DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_post (post_id),
  KEY idx_parent (parent_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 点赞 / 收藏：用户维度去重，一行搞定切换
CREATE TABLE IF NOT EXISTS post_likes (
  post_id BIGINT UNSIGNED NOT NULL,
  user_id INT UNSIGNED    NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (post_id, user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS post_collects (
  post_id BIGINT UNSIGNED NOT NULL,
  user_id INT UNSIGNED    NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (post_id, user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 闲置商品：images / ways 存 JSON 数组字符串；status: on/off 上架/下架
-- place 自提点、cond 成色、ways 交易方式：发布页这三个都在 UI 里，得有地方落库
CREATE TABLE IF NOT EXISTS goods (
  id         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  title      VARCHAR(200) NOT NULL,
  cat        VARCHAR(30)  NOT NULL DEFAULT 'other',
  price      DECIMAL(10,2) NOT NULL DEFAULT 0,
  `desc`     TEXT         NOT NULL,
  images     TEXT         NOT NULL,
  place      VARCHAR(50)  NOT NULL DEFAULT '',
  cond       VARCHAR(20)  NOT NULL DEFAULT '',
  -- ways 用带默认值的字符串而非 TEXT：TEXT 在 MySQL 里不允许有 DEFAULT，
  -- 那样凡是没显式写 ways 的 INSERT（老脚本、裸 SQL）都会被 ER_NO_DEFAULT_FOR_FIELD 挡下
  ways       VARCHAR(255) NOT NULL DEFAULT '[]',
  owner_id   INT UNSIGNED NOT NULL,
  owner_name VARCHAR(50)  NOT NULL DEFAULT '',
  school     VARCHAR(32)  NULL DEFAULT NULL,
  status     VARCHAR(10)  NOT NULL DEFAULT 'on',
  created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_cat (cat),
  KEY idx_school (school),
  KEY idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS goods_fav (
  goods_id BIGINT UNSIGNED NOT NULL,
  user_id  INT UNSIGNED    NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (goods_id, user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 订单：id 是业务单号（SO + 时间 + 随机）；status: pending/paid/shipping/done/cancel
CREATE TABLE IF NOT EXISTS orders (
  id         VARCHAR(32)  NOT NULL PRIMARY KEY,
  buyer_id   INT UNSIGNED NOT NULL,
  seller_id  INT UNSIGNED NOT NULL,
  goods_id   BIGINT UNSIGNED NOT NULL,
  title      VARCHAR(200) NOT NULL,
  price      DECIMAL(10,2) NOT NULL DEFAULT 0,
  status     VARCHAR(12)  NOT NULL DEFAULT 'pending',
  school     VARCHAR(32)  NULL DEFAULT NULL,
  created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_buyer (buyer_id),
  KEY idx_seller (seller_id),
  KEY idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS order_logs (
  id         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  order_id   VARCHAR(32) NOT NULL,
  from_status VARCHAR(12) NULL,
  to_status  VARCHAR(12) NOT NULL,
  note       VARCHAR(200) NOT NULL DEFAULT '',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_order (order_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS order_reviews (
  id         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  order_id   VARCHAR(32) NOT NULL,
  user_id    INT UNSIGNED NOT NULL,
  ratings    JSON        NOT NULL,
  tags       JSON        NOT NULL,
  text       VARCHAR(500) NOT NULL DEFAULT '',
  created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_order (order_id),
  KEY idx_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 消息中心：user_id 是收件人；type: reply/trade/system/follow
CREATE TABLE IF NOT EXISTS messages (
  id         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id    INT UNSIGNED NOT NULL,
  type       VARCHAR(12)  NOT NULL DEFAULT 'system',
  title      VARCHAR(200) NOT NULL DEFAULT '',
  content    TEXT         NOT NULL,
  from_user  VARCHAR(50)  NOT NULL DEFAULT '',
  ref_type   VARCHAR(20)  NULL DEFAULT NULL,
  ref_id     VARCHAR(32)  NULL DEFAULT NULL,
  unread     TINYINT(1)   NOT NULL DEFAULT 1,
  created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_user (user_id),
  KEY idx_unread (user_id, unread)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 会话：type 会话类型，name 显示名，last_msg 末条预览
-- 好友私聊扩展字段：user_a/user_b 锁定两人（user_a=较小id），unread_a/unread_b 各记各的未读，
-- last_sender 标记最后是谁发的（用于区分「对方发来的」未读）。旧库由 chats.ensureChatSchema 幂等补列。
CREATE TABLE IF NOT EXISTS conversations (
  id         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  type       VARCHAR(12)  NOT NULL DEFAULT 'single',
  name       VARCHAR(100) NOT NULL DEFAULT '',
  last_msg   VARCHAR(255) NOT NULL DEFAULT '',
  unread     INT UNSIGNED NOT NULL DEFAULT 0,
  updated_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  user_a     INT UNSIGNED NOT NULL DEFAULT 0,
  user_b     INT UNSIGNED NOT NULL DEFAULT 0,
  unread_a   INT UNSIGNED NOT NULL DEFAULT 0,
  unread_b   INT UNSIGNED NOT NULL DEFAULT 0,
  last_sender INT UNSIGNED NOT NULL DEFAULT 0,
  KEY idx_updated (updated_at),
  KEY idx_pair (user_a, user_b)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 聊天记录：conv_id 会话，sender_id 发送者；type 消息类型（text 文字 / image 图片），img 图片地址
CREATE TABLE IF NOT EXISTS chat_messages (
  id         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  conv_id    BIGINT UNSIGNED NOT NULL,
  sender_id  INT UNSIGNED    NOT NULL,
  type       VARCHAR(10)  NOT NULL DEFAULT 'text',
  text       TEXT          NOT NULL,
  img        VARCHAR(512) NOT NULL DEFAULT '',
  created_at DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_conv (conv_id),
  KEY idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 好友关系：双向各存一行（A 的好友里有 B，B 的好友里也有 A），删的时候成对删。
-- status: pending(申请中，待对方通过) / accepted(已是好友)；requester_id 记谁发起的申请。
CREATE TABLE IF NOT EXISTS friends (
  id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id     INT UNSIGNED    NOT NULL,   -- 这条记录挂在「谁」的好友列表下
  friend_id   INT UNSIGNED    NOT NULL,   -- 好友是谁
  remark      VARCHAR(50)     NOT NULL DEFAULT '',  -- 备注名（可选）
  status      VARCHAR(10)     NOT NULL DEFAULT 'accepted',
  requester_id INT UNSIGNED   NOT NULL DEFAULT 0,   -- 申请发起人（pending 时才有意义）
  created_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_pair (user_id, friend_id),
  KEY idx_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
