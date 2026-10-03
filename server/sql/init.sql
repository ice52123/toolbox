-- 在线工具箱 MySQL 版建表脚本
-- 执行顺序：先建库，再 source 本文件
--   mysql -e "CREATE DATABASE IF NOT EXISTS toolbox CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
--   mysql toolbox --default-character-set=utf8mb4 < server/sql/init.sql

SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS users (
  id         INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  username   VARCHAR(50)  NOT NULL,
  password   VARCHAR(100) NOT NULL,
  phone      VARCHAR(20)  NULL DEFAULT NULL, -- 手机号登录（一键登录 / 忘记密码都靠它）
  nickname   VARCHAR(50)  NOT NULL DEFAULT '',
  avatar     VARCHAR(255) NOT NULL DEFAULT '',
  created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_username (username),
  UNIQUE KEY uk_phone (phone)
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
