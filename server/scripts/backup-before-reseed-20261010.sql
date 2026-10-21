mysqldump: [Warning] Using a password on the command line interface can be insecure.
Warning: A partial dump from a server that has GTIDs will by default include the GTIDs of all transactions, even those that changed suppressed parts of the database. If you don't want to restore GTIDs, pass --set-gtid-purged=OFF. To make a complete dump, pass --all-databases --triggers --routines --events. 
Warning: A dump from a server that has GTIDs enabled will by default include the GTIDs of all transactions, even those that were executed during its extraction and might not be represented in the dumped data. This might result in an inconsistent data dump. 
In order to ensure a consistent backup of the database, pass --single-transaction or --lock-all-tables or --source-data. 
-- MySQL dump 10.13  Distrib 26.7.0, for Win64 (x86_64)
--
-- Host: localhost    Database: toolbox
-- ------------------------------------------------------
-- Server version	26.7.0

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;
SET @MYSQLDUMP_TEMP_LOG_BIN = @@SESSION.SQL_LOG_BIN;
SET @@SESSION.SQL_LOG_BIN= 0;

--
-- GTID state at the beginning of the backup 
--

SET @@GLOBAL.GTID_PURGED=/*!80000 '+'*/ '6bff436b-c081-11f1-bed2-4cedfb0fb2a5:1-617';

--
-- Table structure for table `chat_messages`
--

DROP TABLE IF EXISTS `chat_messages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `chat_messages` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `conv_id` bigint unsigned NOT NULL,
  `sender_id` int unsigned NOT NULL,
  `text` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `type` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'text',
  `img` varchar(512) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  PRIMARY KEY (`id`),
  KEY `idx_conv` (`conv_id`),
  KEY `idx_created` (`created_at`)
) ENGINE=InnoDB AUTO_INCREMENT=166 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `chat_messages`
--

LOCK TABLES `chat_messages` WRITE;
/*!40000 ALTER TABLE `chat_messages` DISABLE KEYS */;
INSERT INTO `chat_messages` VALUES (1,1,1,'你好','2026-10-07 13:57:13','text',''),(2,2,1,'你好','2026-10-07 14:00:09','text',''),(3,3,1,'你好','2026-10-07 15:42:01','text',''),(4,4,1,'你好','2026-10-07 16:34:23','text',''),(55,54,56,'哈喽，我是 A','2026-10-08 08:02:21','text',''),(56,54,56,'','2026-10-08 08:02:21','image','/files/test.png'),(57,55,62,'哈喽，我是 A','2026-10-08 08:08:25','text',''),(58,55,62,'','2026-10-08 08:08:26','image','/files/test.png'),(59,56,64,'哈喽，我是 A','2026-10-08 08:09:30','text',''),(60,56,64,'','2026-10-08 08:09:30','image','/files/test.png'),(159,155,161,'在吗，这个东西还在吗','2026-10-10 15:59:28','text',''),(160,157,55,'😀','2026-10-10 16:07:12','text',''),(164,159,1,'😀','2026-10-10 16:20:55','text',''),(165,159,1,'🤔💯','2026-10-10 16:21:12','text','');
/*!40000 ALTER TABLE `chat_messages` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `conversations`
--

DROP TABLE IF EXISTS `conversations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `conversations` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `type` varchar(12) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'single',
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `last_msg` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `unread` int unsigned NOT NULL DEFAULT '0',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `user_a` int unsigned NOT NULL DEFAULT '0',
  `user_b` int unsigned NOT NULL DEFAULT '0',
  `unread_a` int unsigned NOT NULL DEFAULT '0',
  `unread_b` int unsigned NOT NULL DEFAULT '0',
  `last_sender` int unsigned NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `idx_updated` (`updated_at`)
) ENGINE=InnoDB AUTO_INCREMENT=160 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `conversations`
--

LOCK TABLES `conversations` WRITE;
/*!40000 ALTER TABLE `conversations` DISABLE KEYS */;
INSERT INTO `conversations` VALUES (1,'single','小喵','你好',0,'2026-10-07 13:57:13',0,0,0,0,0),(2,'single','小喵','你好',0,'2026-10-07 14:00:09',0,0,0,0,0),(3,'single','小喵','你好',0,'2026-10-07 15:42:01',0,0,0,0,0),(4,'single','小喵','你好',0,'2026-10-07 16:34:23',0,0,0,0,0),(54,'single','','[图片]',0,'2026-10-08 08:02:22',56,57,0,2,56),(55,'single','','[图片]',0,'2026-10-08 08:08:26',62,63,0,2,62),(56,'single','','[图片]',0,'2026-10-08 08:09:30',64,65,0,2,64),(103,'single','','IDEMPOTENCY_TEST_mv1yu7jl 相同消息',0,'2026-10-10 13:40:49',103,104,0,2,103),(104,'single','','IDEMPOTENCY_TEST_mv1zejvc 相同消息',0,'2026-10-10 13:56:36',105,106,0,2,105),(154,'single','','IDEMPOTENCY_TEST_mv233ddd 相同消息',0,'2026-10-10 15:39:53',154,155,0,2,154),(155,'single','','在吗，这个东西还在吗',0,'2026-10-10 15:59:28',160,161,1,0,161),(157,'single','','😀',0,'2026-10-10 16:07:12',16,55,1,0,55),(159,'single','','🤔💯',0,'2026-10-10 16:21:12',1,13,0,2,1);
/*!40000 ALTER TABLE `conversations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `friends`
--

DROP TABLE IF EXISTS `friends`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `friends` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_id` int unsigned NOT NULL,
  `friend_id` int unsigned NOT NULL,
  `remark` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `status` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'accepted',
  `requester_id` int unsigned NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_pair` (`user_id`,`friend_id`),
  KEY `idx_user` (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=111 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `friends`
--

LOCK TABLES `friends` WRITE;
/*!40000 ALTER TABLE `friends` DISABLE KEYS */;
INSERT INTO `friends` VALUES (5,56,57,'','2026-10-08 08:02:21','accepted',56),(6,57,56,'','2026-10-08 08:02:21','accepted',56),(11,62,63,'','2026-10-08 08:08:25','accepted',62),(12,63,62,'','2026-10-08 08:08:25','accepted',62),(13,64,65,'','2026-10-08 08:09:30','accepted',64),(14,65,64,'','2026-10-08 08:09:30','accepted',64),(109,1,13,'','2026-10-10 16:15:29','pending',1),(110,13,1,'','2026-10-10 16:15:29','pending',1);
/*!40000 ALTER TABLE `friends` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `goods`
--

DROP TABLE IF EXISTS `goods`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `goods` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `title` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `cat` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'other',
  `price` decimal(10,2) NOT NULL DEFAULT '0.00',
  `desc` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `images` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `owner_id` int unsigned NOT NULL,
  `owner_name` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `school` varchar(32) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'on',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `place` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `cond` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `ways` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '[]',
  PRIMARY KEY (`id`),
  KEY `idx_cat` (`cat`),
  KEY `idx_school` (`school`),
  KEY `idx_created` (`created_at`)
) ENGINE=InnoDB AUTO_INCREMENT=157 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `goods`
--

LOCK TABLES `goods` WRITE;
/*!40000 ALTER TABLE `goods` DISABLE KEYS */;
INSERT INTO `goods` VALUES (2,'测试品','other',50.00,'x','[]',2,'seller_x','sch001','on','2026-10-07 13:57:12','','',''),(3,'链路品','other',60.00,'x','[]',2,'seller_x','sch001','on','2026-10-07 13:57:13','','',''),(7,'测试品','other',50.00,'x','[]',5,'seller_1791352807825','sch001','on','2026-10-07 14:00:08','','',''),(8,'链路品','other',60.00,'x','[]',5,'seller_1791352807825','sch001','on','2026-10-07 14:00:08','','',''),(10,'测试品','other',50.00,'x','[]',6,'seller_1791358920561','sch001','on','2026-10-07 15:42:00','','',''),(11,'链路品','other',60.00,'x','[]',6,'seller_1791358920561','sch001','on','2026-10-07 15:42:01','','',''),(14,'测试品','other',50.00,'x','[]',8,'seller_1791362060914','sch001','on','2026-10-07 16:34:21','','','[]'),(15,'链路品','other',60.00,'x','[]',8,'seller_1791362060914','sch001','on','2026-10-07 16:34:22','','','[]'),(16,'前端接入验证品','数码',66.00,'自测用，描述不少于十个字符阿啊啊啊','[null]',9,'同学3047','sch001','on','2026-10-07 16:35:23','校区3栋','九成新','[\"自提\",\"面交\"]'),(17,'前端接入验证品','数码',66.00,'自测用，描述不少于十个字符阿啊啊啊','[null]',11,'同学5327','sch001','on','2026-10-07 16:36:45','校区3栋','九成新','[\"自提\",\"面交\"]'),(18,'前端接入验证品','数码',66.00,'自测用，描述不少于十个字符阿啊啊啊','[\"/files/1791362295064-185815925.png\"]',13,'同学4694','sch001','on','2026-10-07 16:38:15','校区3栋','九成新','[\"自提\",\"面交\"]'),(19,'体检商品','数码',10.00,'体检用描述十个字以上','[]',14,'同学5443','sch001','on','2026-10-07 16:41:57','A栋','九成新','[\"自提\"]'),(20,'体检商品','数码',10.00,'体检用描述十个字以上','[]',16,'同学3068','sch001','on','2026-10-07 16:42:43','A栋','九成新','[\"自提\"]'),(53,'我的发布测试商品','other',9.90,'x','[]',70,'ownr_1791420574097',NULL,'off','2026-10-08 08:49:34','','','[]'),(54,'在售测试品','other',12.00,'','[]',71,'meown_1791420810524',NULL,'on','2026-10-08 08:53:30','','','[]'),(55,'下架测试品','other',8.00,'','[]',71,'meown_1791420810524',NULL,'off','2026-10-08 08:53:31','','','[]'),(56,'订单测试品','other',66.00,'','[]',72,'slr_1791420811272',NULL,'on','2026-10-08 08:53:31','','','[]'),(57,'在售测试品','other',12.00,'','[]',73,'meown_1791420839431',NULL,'on','2026-10-08 08:53:59','','','[]'),(58,'下架测试品','other',8.00,'','[]',73,'meown_1791420839431',NULL,'off','2026-10-08 08:53:59','','','[]'),(59,'订单测试品','other',66.00,'','[]',74,'slr_1791420839835',NULL,'on','2026-10-08 08:54:00','','','[]'),(60,'九成新机械键盘 87键','数码',128.00,'宿舍自用，带原装键帽','[]',1,'同学8000',NULL,'on','2026-10-08 08:54:45','东区宿舍','九成新','[]'),(61,'清单测试品A','other',10.00,'','[]',75,'mlist_1791421522837',NULL,'on','2026-10-08 09:05:23','','','[]'),(63,'别人的品','other',1.00,'','[]',76,'other_1791421524838',NULL,'on','2026-10-08 09:05:25','','','[]'),(64,'评价测试品','other',30.00,'','[]',78,'slr2_1791421996111',NULL,'on','2026-10-08 09:13:16','','','[]'),(65,'未完成品','other',5.00,'','[]',78,'slr2_1791421996111',NULL,'on','2026-10-08 09:13:17','','','[]'),(66,'取消测试品A','other',40.00,'','[]',80,'sell_1791422203350',NULL,'on','2026-10-08 09:16:43','','','[]'),(67,'取消测试品B','other',60.00,'','[]',80,'sell_1791422203350',NULL,'on','2026-10-08 09:16:43','','','[]');
/*!40000 ALTER TABLE `goods` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `goods_fav`
--

DROP TABLE IF EXISTS `goods_fav`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `goods_fav` (
  `goods_id` bigint unsigned NOT NULL,
  `user_id` int unsigned NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`goods_id`,`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `goods_fav`
--

LOCK TABLES `goods_fav` WRITE;
/*!40000 ALTER TABLE `goods_fav` DISABLE KEYS */;
INSERT INTO `goods_fav` VALUES (1,1,'2026-10-07 13:57:12'),(4,1,'2026-10-07 13:59:09'),(5,1,'2026-10-07 13:59:36'),(6,1,'2026-10-07 14:00:07'),(9,1,'2026-10-07 15:42:00'),(12,1,'2026-10-07 16:32:50'),(13,1,'2026-10-07 16:34:20'),(18,1,'2026-10-10 16:03:16'),(19,14,'2026-10-07 16:41:57'),(20,16,'2026-10-07 16:42:43'),(20,69,'2026-10-08 08:38:55');
/*!40000 ALTER TABLE `goods_fav` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `messages`
--

DROP TABLE IF EXISTS `messages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `messages` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_id` int unsigned NOT NULL,
  `type` varchar(12) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'system',
  `title` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `content` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `from_user` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `ref_type` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ref_id` varchar(32) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `unread` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user` (`user_id`),
  KEY `idx_unread` (`user_id`,`unread`)
) ENGINE=InnoDB AUTO_INCREMENT=103 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `messages`
--

LOCK TABLES `messages` WRITE;
/*!40000 ALTER TABLE `messages` DISABLE KEYS */;
INSERT INTO `messages` VALUES (1,1,'system','系统通知','欢迎','系统',NULL,NULL,0,'2026-10-07 13:57:13'),(2,1,'system','系统通知','欢迎','系统',NULL,NULL,0,'2026-10-07 14:00:09'),(3,1,'system','系统通知','欢迎','系统',NULL,NULL,0,'2026-10-07 15:42:01'),(4,1,'system','系统通知','欢迎','系统',NULL,NULL,0,'2026-10-07 16:34:22'),(53,55,'follow','新的好友','同学0001 添加了你为好友','K8PBVN','user','同学0001',1,'2026-10-08 07:46:36');
/*!40000 ALTER TABLE `messages` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notices`
--

DROP TABLE IF EXISTS `notices`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notices` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `tag` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '校园',
  `title` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `content` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `date` date NOT NULL DEFAULT (curdate()),
  `school` varchar(32) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_school` (`school`)
) ENGINE=InnoDB AUTO_INCREMENT=52 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notices`
--

LOCK TABLES `notices` WRITE;
/*!40000 ALTER TABLE `notices` DISABLE KEYS */;
INSERT INTO `notices` VALUES (1,'活动','迎新公告','欢迎新同学','2026-10-07',NULL,'2026-10-07 13:57:11'),(2,'活动','迎新公告','欢迎新同学','2026-10-07',NULL,'2026-10-07 13:59:08'),(3,'活动','迎新公告','欢迎新同学','2026-10-07',NULL,'2026-10-07 13:59:35'),(4,'活动','迎新公告','欢迎新同学','2026-10-07',NULL,'2026-10-07 14:00:04'),(5,'活动','迎新公告','欢迎新同学','2026-10-07',NULL,'2026-10-07 15:41:59'),(6,'活动','迎新公告','欢迎新同学','2026-10-07',NULL,'2026-10-07 16:32:49'),(7,'活动','迎新公告','欢迎新同学','2026-10-07',NULL,'2026-10-07 16:34:20');
/*!40000 ALTER TABLE `notices` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `order_logs`
--

DROP TABLE IF EXISTS `order_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `order_logs` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `order_id` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL,
  `from_status` varchar(12) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `to_status` varchar(12) COLLATE utf8mb4_unicode_ci NOT NULL,
  `note` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_order` (`order_id`)
) ENGINE=InnoDB AUTO_INCREMENT=155 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `order_logs`
--

LOCK TABLES `order_logs` WRITE;
/*!40000 ALTER TABLE `order_logs` DISABLE KEYS */;
INSERT INTO `order_logs` VALUES (1,'SO20261007135712174',NULL,'pending','创建订单','2026-10-07 13:57:12'),(2,'SO20261007135712174','pending','cancel','买家取消','2026-10-07 13:57:13'),(3,'SO20261007135713476',NULL,'pending','创建订单','2026-10-07 13:57:13'),(4,'SO20261007140008844',NULL,'pending','创建订单','2026-10-07 14:00:08'),(5,'SO20261007140008844','pending','cancel','买家取消','2026-10-07 14:00:08'),(6,'SO20261007140008854',NULL,'pending','创建订单','2026-10-07 14:00:08'),(7,'SO20261007140008854','paid','shipping','发货 单号SF999','2026-10-07 14:00:08'),(8,'SO20261007140008854','shipping','done','买家确认收货','2026-10-07 14:00:08'),(9,'SO20261007154201767',NULL,'pending','创建订单','2026-10-07 15:42:01'),(10,'SO20261007154201767','pending','cancel','买家取消','2026-10-07 15:42:01'),(11,'SO20261007154201374',NULL,'pending','创建订单','2026-10-07 15:42:01'),(12,'SO20261007154201374','paid','shipping','发货 单号SF999','2026-10-07 15:42:01'),(13,'SO20261007154201374','shipping','done','买家确认收货','2026-10-07 15:42:01'),(14,'SO20261007163422691',NULL,'pending','创建订单','2026-10-07 16:34:22'),(15,'SO20261007163422691','pending','cancel','买家取消','2026-10-07 16:34:22'),(16,'SO20261007163422663',NULL,'pending','创建订单','2026-10-07 16:34:22'),(17,'SO20261007163422663','paid','shipping','发货 单号SF999','2026-10-07 16:34:22'),(18,'SO20261007163422663','shipping','done','买家确认收货','2026-10-07 16:34:22'),(19,'SO20261007164157483',NULL,'pending','创建订单','2026-10-07 16:41:57'),(20,'SO20261007164243897',NULL,'pending','创建订单','2026-10-07 16:42:43'),(52,'SO20261008085331782',NULL,'pending','创建订单','2026-10-08 08:53:31'),(53,'SO20261008085331782','pending','cancel','买家取消','2026-10-08 08:53:31'),(54,'SO20261008085400831',NULL,'pending','创建订单','2026-10-08 08:54:00'),(55,'SO20261008085400831','pending','cancel','买家取消','2026-10-08 08:54:00'),(56,'SO20261008091316682',NULL,'pending','创建订单','2026-10-08 09:13:16'),(57,'SO20261008091316682','pending','paid','买家付款','2026-10-08 09:13:16'),(58,'SO20261008091316682','paid','shipping','发货 单号SF999','2026-10-08 09:13:16'),(59,'SO20261008091316682','shipping','done','买家确认收货','2026-10-08 09:13:16'),(60,'SO20261008091317296',NULL,'pending','创建订单','2026-10-08 09:13:17'),(61,'SO20261008091643956',NULL,'pending','创建订单','2026-10-08 09:16:43'),(62,'SO20261008091643956','pending','cancel','买家取消','2026-10-08 09:16:43'),(63,'SO20261008091643860',NULL,'pending','创建订单','2026-10-08 09:16:43'),(64,'SO20261008091643860','pending','paid','买家付款','2026-10-08 09:16:44'),(65,'SO20261008091644594',NULL,'pending','创建订单','2026-10-08 09:16:44'),(66,'SO20261007135713476','paid','paid','买家提醒发货','2026-10-08 09:21:36'),(67,'SO20261007135713476','paid','paid','买家提醒发货','2026-10-08 09:21:40'),(103,'SO20261010134048774',NULL,'pending','创建订单','2026-10-10 13:40:48'),(104,'SO20261010135635187',NULL,'pending','创建订单','2026-10-10 13:56:35'),(154,'SO20261010153952375',NULL,'pending','创建订单','2026-10-10 15:39:52');
/*!40000 ALTER TABLE `order_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `order_reviews`
--

DROP TABLE IF EXISTS `order_reviews`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `order_reviews` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `order_id` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` int unsigned NOT NULL,
  `ratings` json NOT NULL,
  `tags` json NOT NULL,
  `text` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_order` (`order_id`),
  KEY `idx_user` (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=103 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `order_reviews`
--

LOCK TABLES `order_reviews` WRITE;
/*!40000 ALTER TABLE `order_reviews` DISABLE KEYS */;
INSERT INTO `order_reviews` VALUES (1,'SO20261007140008854',1,'{\"desc\": 5, \"attitude\": 5, \"logistics\": 4}','[\"发货很快\"]','好','2026-10-07 14:00:08'),(2,'SO20261007154201374',1,'{\"desc\": 5, \"attitude\": 5, \"logistics\": 4}','[\"发货很快\"]','好','2026-10-07 15:42:01'),(3,'SO20261007163422663',1,'{\"desc\": 5, \"attitude\": 5, \"logistics\": 4}','[\"发货很快\"]','好','2026-10-07 16:34:22'),(52,'SO20261008091316682',77,'{\"desc\": 5, \"attitude\": 5, \"logistics\": 4}','[\"态度超好\"]','好评','2026-10-08 09:13:17');
/*!40000 ALTER TABLE `order_reviews` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `orders`
--

DROP TABLE IF EXISTS `orders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `orders` (
  `id` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL,
  `buyer_id` int unsigned NOT NULL,
  `seller_id` int unsigned NOT NULL,
  `goods_id` bigint unsigned NOT NULL,
  `title` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `price` decimal(10,2) NOT NULL DEFAULT '0.00',
  `status` varchar(12) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `school` varchar(32) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_buyer` (`buyer_id`),
  KEY `idx_seller` (`seller_id`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `orders`
--

LOCK TABLES `orders` WRITE;
/*!40000 ALTER TABLE `orders` DISABLE KEYS */;
INSERT INTO `orders` VALUES ('SO20261007135712174',1,2,2,'测试品',50.00,'cancel','sch001','2026-10-07 13:57:12'),('SO20261007135713476',1,2,3,'链路品',60.00,'paid','sch001','2026-10-07 13:57:13'),('SO20261007140008844',1,5,7,'测试品',50.00,'cancel','sch001','2026-10-07 14:00:08'),('SO20261007140008854',1,5,8,'链路品',60.00,'done','sch001','2026-10-07 14:00:08'),('SO20261007154201374',1,6,11,'链路品',60.00,'done','sch001','2026-10-07 15:42:01'),('SO20261007154201767',1,6,10,'测试品',50.00,'cancel','sch001','2026-10-07 15:42:01'),('SO20261007163422663',1,8,15,'链路品',60.00,'done','sch001','2026-10-07 16:34:22'),('SO20261007163422691',1,8,14,'测试品',50.00,'cancel','sch001','2026-10-07 16:34:22'),('SO20261007164157483',15,14,19,'体检商品',10.00,'pending','sch001','2026-10-07 16:41:57'),('SO20261007164243897',17,16,20,'体检商品',10.00,'pending','sch001','2026-10-07 16:42:43'),('SO20261008085331782',71,72,56,'订单测试品',66.00,'cancel',NULL,'2026-10-08 08:53:31'),('SO20261008085400831',73,74,59,'订单测试品',66.00,'cancel',NULL,'2026-10-08 08:54:00'),('SO20261008091316682',77,78,64,'评价测试品',30.00,'done',NULL,'2026-10-08 09:13:16'),('SO20261008091317296',77,78,65,'未完成品',5.00,'pending',NULL,'2026-10-08 09:13:17'),('SO20261008091643860',79,80,67,'取消测试品B',60.00,'paid',NULL,'2026-10-08 09:16:43'),('SO20261008091643956',79,80,66,'取消测试品A',40.00,'cancel',NULL,'2026-10-08 09:16:43'),('SO20261008091644594',79,80,67,'取消测试品B',60.00,'pending',NULL,'2026-10-08 09:16:44');
/*!40000 ALTER TABLE `orders` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `post_collects`
--

DROP TABLE IF EXISTS `post_collects`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `post_collects` (
  `post_id` bigint unsigned NOT NULL,
  `user_id` int unsigned NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`post_id`,`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `post_collects`
--

LOCK TABLES `post_collects` WRITE;
/*!40000 ALTER TABLE `post_collects` DISABLE KEYS */;
INSERT INTO `post_collects` VALUES (1,1,'2026-10-07 13:57:11'),(2,1,'2026-10-08 08:33:19'),(3,1,'2026-10-08 08:32:44'),(4,1,'2026-10-08 08:42:52'),(5,1,'2026-10-08 08:55:17'),(6,1,'2026-10-07 16:32:50'),(7,1,'2026-10-08 08:32:13'),(8,1,'2026-10-08 08:32:01'),(8,14,'2026-10-07 16:41:57'),(9,1,'2026-10-08 08:43:38'),(9,16,'2026-10-07 16:42:43'),(52,1,'2026-10-08 08:43:40');
/*!40000 ALTER TABLE `post_collects` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `post_comments`
--

DROP TABLE IF EXISTS `post_comments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `post_comments` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `post_id` bigint unsigned NOT NULL,
  `parent_id` bigint unsigned DEFAULT NULL,
  `user_id` int unsigned NOT NULL,
  `name` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `text` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_post` (`post_id`),
  KEY `idx_parent` (`parent_id`)
) ENGINE=InnoDB AUTO_INCREMENT=103 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `post_comments`
--

LOCK TABLES `post_comments` WRITE;
/*!40000 ALTER TABLE `post_comments` DISABLE KEYS */;
INSERT INTO `post_comments` VALUES (1,1,NULL,1,'同学8000','顶','2026-10-07 13:57:11'),(2,1,1,1,'同学8000','回复','2026-10-07 13:57:11'),(3,2,NULL,1,'同学8000','顶','2026-10-07 13:59:09'),(4,2,3,1,'同学8000','回复','2026-10-07 13:59:09'),(5,3,NULL,1,'同学8000','顶','2026-10-07 13:59:36'),(6,3,5,1,'同学8000','回复','2026-10-07 13:59:36'),(7,4,NULL,1,'同学8000','顶','2026-10-07 14:00:06'),(8,4,7,1,'同学8000','回复','2026-10-07 14:00:07'),(9,5,NULL,1,'同学8000','顶','2026-10-07 15:42:00'),(10,5,9,1,'同学8000','回复','2026-10-07 15:42:00'),(11,6,NULL,1,'同学8000','顶','2026-10-07 16:32:50'),(12,6,11,1,'同学8000','回复','2026-10-07 16:32:50'),(13,7,NULL,1,'同学8000','顶','2026-10-07 16:34:20'),(14,7,13,1,'同学8000','回复','2026-10-07 16:34:20'),(52,8,NULL,1,'同学8000','111','2026-10-08 08:31:49');
/*!40000 ALTER TABLE `post_comments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `post_likes`
--

DROP TABLE IF EXISTS `post_likes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `post_likes` (
  `post_id` bigint unsigned NOT NULL,
  `user_id` int unsigned NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`post_id`,`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `post_likes`
--

LOCK TABLES `post_likes` WRITE;
/*!40000 ALTER TABLE `post_likes` DISABLE KEYS */;
INSERT INTO `post_likes` VALUES (1,1,'2026-10-07 13:57:11'),(2,1,'2026-10-07 13:59:09'),(3,1,'2026-10-07 13:59:36'),(4,1,'2026-10-07 14:00:05'),(5,1,'2026-10-07 15:42:00'),(6,1,'2026-10-07 16:32:50'),(7,1,'2026-10-07 16:34:20');
/*!40000 ALTER TABLE `post_likes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `post_tags`
--

DROP TABLE IF EXISTS `post_tags`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `post_tags` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `post_id` bigint unsigned NOT NULL,
  `tag` varchar(40) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_post` (`post_id`),
  KEY `idx_tag` (`tag`)
) ENGINE=InnoDB AUTO_INCREMENT=52 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `post_tags`
--

LOCK TABLES `post_tags` WRITE;
/*!40000 ALTER TABLE `post_tags` DISABLE KEYS */;
INSERT INTO `post_tags` VALUES (1,1,'教材'),(2,2,'教材'),(3,3,'教材'),(4,4,'教材'),(5,5,'教材'),(6,6,'教材'),(7,7,'教材');
/*!40000 ALTER TABLE `post_tags` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `posts`
--

DROP TABLE IF EXISTS `posts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `posts` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `board_key` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'general',
  `title` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `body` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `author_id` int unsigned NOT NULL,
  `author_name` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `school` varchar(32) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `views` int unsigned NOT NULL DEFAULT '0',
  `likes` int unsigned NOT NULL DEFAULT '0',
  `collects` int unsigned NOT NULL DEFAULT '0',
  `comments` int unsigned NOT NULL DEFAULT '0',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_board` (`board_key`),
  KEY `idx_school` (`school`),
  KEY `idx_created` (`created_at`)
) ENGINE=InnoDB AUTO_INCREMENT=156 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `posts`
--

LOCK TABLES `posts` WRITE;
/*!40000 ALTER TABLE `posts` DISABLE KEYS */;
INSERT INTO `posts` VALUES (1,'general','二手教材出','九成新',1,'同学8000','sch001',1,1,1,2,'2026-10-07 13:57:11'),(2,'general','二手教材出','九成新',1,'同学8000','sch001',3,1,1,2,'2026-10-07 13:59:08'),(3,'general','二手教材出','九成新',1,'同学8000','sch001',1,1,1,2,'2026-10-07 13:59:36'),(4,'general','二手教材出','九成新',1,'同学8000','sch001',3,1,1,2,'2026-10-07 14:00:04'),(5,'general','二手教材出','九成新',1,'同学8000','sch001',2,1,1,2,'2026-10-07 15:42:00'),(6,'general','二手教材出','九成新',1,'同学8000','sch001',1,1,1,2,'2026-10-07 16:32:49'),(7,'general','二手教材出','九成新',1,'同学8000','sch001',2,1,1,2,'2026-10-07 16:34:20'),(8,'help','体检帖子','内容',14,'同学5443','sch001',3,0,2,1,'2026-10-07 16:41:57'),(9,'help','体检帖子','内容',16,'同学3068','sch001',4,0,2,0,'2026-10-07 16:42:43'),(52,'general','121','121',1,'同学8000','sch001',1,0,1,0,'2026-10-08 08:37:25');
/*!40000 ALTER TABLE `posts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `schools`
--

DROP TABLE IF EXISTS `schools`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `schools` (
  `code` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `province` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `city` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `level` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `sort` int NOT NULL DEFAULT '0',
  PRIMARY KEY (`code`),
  KEY `idx_province` (`province`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `schools`
--

LOCK TABLES `schools` WRITE;
/*!40000 ALTER TABLE `schools` DISABLE KEYS */;
INSERT INTO `schools` VALUES ('sch001','北京大学','北京','北京','本科',1),('sch002','清华大学','北京','北京','本科',2),('sch003','中国人民大学','北京','北京','本科',3),('sch004','北京理工大学','北京','北京','本科',4),('sch005','北京航空航天大学','北京','北京','本科',5),('sch006','中国农业大学','北京','北京','本科',6),('sch007','北京师范大学','北京','北京','本科',7),('sch008','中央民族大学','北京','北京','本科',8),('sch009','北京邮电大学','北京','北京','本科',9),('sch010','北京科技大学','北京','北京','本科',10),('sch011','北京交通大学','北京','北京','本科',11),('sch012','对外经济贸易大学','北京','北京','本科',12),('sch013','复旦大学','上海','上海','本科',13),('sch014','上海交通大学','上海','上海','本科',14),('sch015','同济大学','上海','上海','本科',15),('sch016','华东师范大学','上海','上海','本科',16),('sch017','上海财经大学','上海','上海','本科',17),('sch018','华东理工大学','上海','上海','本科',18),('sch019','上海大学','上海','上海','本科',19),('sch020','南开大学','天津','天津','本科',20),('sch021','天津大学','天津','天津','本科',21),('sch022','河北工业大学','天津','天津','本科',22),('sch023','重庆大学','重庆','重庆','本科',23),('sch024','西南大学','重庆','重庆','本科',24),('sch025','大连理工大学','辽宁','大连','本科',25),('sch026','东北大学','辽宁','沈阳','本科',26),('sch027','大连海事大学','辽宁','大连','本科',27),('sch028','吉林大学','吉林','长春','本科',28),('sch029','东北师范大学','吉林','长春','本科',29),('sch030','哈尔滨工业大学','黑龙江','哈尔滨','本科',30),('sch031','哈尔滨工程大学','黑龙江','哈尔滨','本科',31),('sch032','南京大学','江苏','南京','本科',32),('sch033','东南大学','江苏','南京','本科',33),('sch034','南京航空航天大学','江苏','南京','本科',34),('sch035','南京理工大学','江苏','南京','本科',35),('sch036','苏州大学','江苏','苏州','本科',36),('sch037','河海大学','江苏','南京','本科',37),('sch038','浙江大学','浙江','杭州','本科',38),('sch039','浙江工业大学','浙江','杭州','本科',39),('sch040','宁波大学','浙江','宁波','本科',40),('sch041','中国科学技术大学','安徽','合肥','本科',41),('sch042','合肥工业大学','安徽','合肥','本科',42),('sch043','厦门大学','福建','厦门','本科',43),('sch044','福州大学','福建','福州','本科',44),('sch045','山东大学','山东','济南','本科',45),('sch046','中国海洋大学','山东','青岛','本科',46),('sch047','中国石油大学（华东）','山东','青岛','本科',47),('sch048','郑州大学','河南','郑州','本科',48),('sch049','武汉大学','湖北','武汉','本科',49),('sch050','华中科技大学','湖北','武汉','本科',50),('sch051','武汉理工大学','湖北','武汉','本科',51),('sch052','华中师范大学','湖北','武汉','本科',52),('sch053','中国地质大学（武汉）','湖北','武汉','本科',53),('sch054','湖南大学','湖南','长沙','本科',54),('sch055','中南大学','湖南','长沙','本科',55),('sch056','国防科技大学','湖南','长沙','本科',56),('sch057','湖南师范大学','湖南','长沙','本科',57),('sch058','中山大学','广东','广州','本科',58),('sch059','华南理工大学','广东','广州','本科',59),('sch060','暨南大学','广东','广州','本科',60),('sch061','华南师范大学','广东','广州','本科',61),('sch062','深圳大学','广东','深圳','本科',62),('sch063','南方科技大学','广东','深圳','本科',63),('sch064','四川大学','四川','成都','本科',64),('sch065','电子科技大学','四川','成都','本科',65),('sch066','西南交通大学','四川','成都','本科',66),('sch067','西南财经大学','四川','成都','本科',67),('sch068','西安交通大学','陕西','西安','本科',68),('sch069','西北工业大学','陕西','西安','本科',69),('sch070','西北农林科技大学','陕西','咸阳','本科',70),('sch071','西安电子科技大学','陕西','西安','本科',71),('sch072','陕西师范大学','陕西','西安','本科',72),('sch073','兰州大学','甘肃','兰州','本科',73);
/*!40000 ALTER TABLE `schools` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tool_history`
--

DROP TABLE IF EXISTS `tool_history`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tool_history` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_id` int unsigned NOT NULL,
  `tool_id` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tool_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `summary` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user` (`user_id`),
  KEY `idx_tool` (`tool_id`)
) ENGINE=InnoDB AUTO_INCREMENT=52 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tool_history`
--

LOCK TABLES `tool_history` WRITE;
/*!40000 ALTER TABLE `tool_history` DISABLE KEYS */;
INSERT INTO `tool_history` VALUES (1,1,'json','JSON','','2026-10-07 13:57:13'),(2,1,'json','JSON','','2026-10-07 14:00:09'),(3,1,'json','JSON','','2026-10-07 15:42:02'),(4,1,'json','JSON','','2026-10-07 16:34:23');
/*!40000 ALTER TABLE `tool_history` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `username` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `nickname` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `avatar` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `school` varchar(32) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `code` char(6) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_username` (`username`),
  UNIQUE KEY `uk_user_code` (`code`),
  UNIQUE KEY `uk_phone` (`phone`)
) ENGINE=InnoDB AUTO_INCREMENT=164 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'同学8000','$2a$10$FyVqIZmkQPe9TC/iMjC9E.l4bJEnMSi1UmknTarcrGR/7TBn2iWLu','13800138000','','','2026-10-07 13:57:10','2026-10-08 07:26:35','sch001','WAEP3G'),(2,'seller_x','x',NULL,'','','2026-10-07 13:57:12','2026-10-08 07:26:35','sch001','24757G'),(4,'seller_1791352776636','x',NULL,'','','2026-10-07 13:59:36','2026-10-08 07:26:36','sch001','8QG556'),(5,'seller_1791352807825','$2a$10$cm.Xksq749MbXvdFJ.2wNOnSbYF6xDkashzSlktEq22fmPHGIOSFi',NULL,'','','2026-10-07 14:00:07','2026-10-08 07:26:36','sch001','SUCK7U'),(6,'seller_1791358920561','$2a$10$.gARnQuyOBxyo30D7YOSteG4HTyFywGIx8U/MDe.lMB54OZc8xnuK',NULL,'','','2026-10-07 15:42:00','2026-10-08 07:26:36','sch001','YDGJKG'),(7,'seller_1791361971355','$2a$10$NiiRDgG77FHj8ABjXnJ35usMtKjuf27t6vF.CkvUCsea/gmeY9kUC',NULL,'','','2026-10-07 16:32:51','2026-10-08 07:26:36','sch001','CYJ8RX'),(8,'seller_1791362060914','$2a$10$PsFxu1hgNO77LlyyUWtxauK8Dynv4sWNqLyABr1GXY.CFGYBobotq',NULL,'','','2026-10-07 16:34:21','2026-10-08 07:26:36','sch001','JMMXDA'),(9,'同学3047','$2a$10$PZGGsn8vZe.lPoca5L6EOeY/5n/TwAH1z6OZ8mO8THn9X/rCepfGy','13962123047','','','2026-10-07 16:35:23','2026-10-08 07:26:36','sch001','U5TENB'),(10,'同学5793','$2a$10$0QQXv0r/qosEzzwfqLJTkuM6XNhDdmLuafqQDN5xICznQ/aG0VUDS','13962145793','','','2026-10-07 16:35:45','2026-10-08 07:26:36','sch001','M98R4W'),(11,'同学5327','$2a$10$CgKAuuOSKehQDH.H5VWVZe1i8DD325XMF9VMry6siFxkPIMLiBZ2y','13962205327','','','2026-10-07 16:36:45','2026-10-08 07:26:36','sch001','H6J9JM'),(12,'同学6142','$2a$10$Or03l1/bL18rOeApoJ4Yk.nDHMDx5eC7kCitIqgn3eV5xGVEPgUR2','13962246142','','','2026-10-07 16:37:26','2026-10-08 07:26:36','sch001','7H6T94'),(13,'同学4694','$2a$10$usZrxGyEaHuYOpoHxJjnp./OBhwRLiKz/K6eZOYPbNL8Loemz5kKG','13962294694','','','2026-10-07 16:38:14','2026-10-08 07:26:36','sch001','XG349Q'),(14,'同学5443','$2a$10$lDgH090XyRxyjvOXQGeqDeiT08qc9Hwh2WVlpBvwvXMP/0mehohBO','13862515443','','','2026-10-07 16:41:55','2026-10-08 07:26:36','sch001','9YBTAJ'),(15,'同学54431','$2a$10$wdrM4adIXDB9VKs3nm.84eLRNyZIqzjHMyz.KMyonhoR3.wLkRuzC','13762515443','','','2026-10-07 16:41:56','2026-10-08 07:26:36','sch001','S6WZA7'),(16,'同学3068','$2a$10$kh3BzuMK03zMykNwnKv5oecMTJH2K8kk008OVmwzcvBpcc5iAcc92','13862563068','','','2026-10-07 16:42:43','2026-10-08 07:26:36','sch001','C99SFC'),(17,'同学30681','$2a$10$sE4uM0PlN7x58aQ6W39gf.fhSJiPHUOCjd5.HhM1ppuqD8D2sAq9S','13762563068','','','2026-10-07 16:42:43','2026-10-08 07:26:36','sch001','SU33QT'),(52,'同学2624','$2a$10$S1vk8yTUPgknN2O0SH79M.9mBJPdwAAeU3Nx6LQa/3xHGnaW3uNqO','13915612624','','','2026-10-08 07:26:54','2026-10-08 07:26:54','sch001','H8EM2Q'),(53,'同学8202','$2a$10$T75GB1O4MNShcAE/yTsg4eUEKOkzZodE4cuCY6dBAn74hmvQZ2st.','13915738202','','','2026-10-08 07:28:58','2026-10-08 07:28:58','sch001','23VDDK'),(54,'同学0001','$2a$10$aIxqoDcdzB5cZuMO3xU/J.celsevd7kUjHq6L77177doTOXTExcdW','13800000001','','','2026-10-08 07:45:20','2026-10-08 07:45:20',NULL,'K8PBVN'),(55,'同学0002','$2a$10$hhST/cSRZIM8c5yiC7qP2efydUfVAX8IKwkMyGrt.iIvKekS5pApm','13800000002','','','2026-10-08 07:45:20','2026-10-08 07:45:20',NULL,'7P9AD9'),(56,'verify_a_1791417740246','$2a$10$UCR9C.ukWB99UbQn1crm4Ogi3AawUl0zy5iFMm8Q/ivoTuR.f9klC',NULL,'','','2026-10-08 08:02:20','2026-10-08 08:02:20',NULL,'MC6PMF'),(57,'verify_b_1791417740246','$2a$10$.3uS.EnxUk5hGZGdxdMYLeic5S0WuT5sLxkZaxnvhrpMInVAGl5K.',NULL,'','','2026-10-08 08:02:20','2026-10-08 08:02:20',NULL,'MBYX2T'),(58,'curl_a_1791417907936','$2a$10$7qH4A.evxtD.Yw.Z8DuGTOjlOIoM6ULejjNlLu5Boe54.GntDjARW',NULL,'','','2026-10-08 08:05:08','2026-10-08 08:05:08',NULL,'XKZ27A'),(59,'curl_b_1791417907936','$2a$10$qEbSmlEHD7h8IintJ3kz9uLCWQabiAICqu3CsHBe/VLswQVi4k0om',NULL,'','','2026-10-08 08:05:08','2026-10-08 08:05:08',NULL,'S7VYHZ'),(60,'tdel_a_1791418063003','$2a$10$yloMQOE5DPYzzKs8KXfgrON5DRGsAcwBsAcigNNvHFHH56mtBN/SK',NULL,'','','2026-10-08 08:07:43','2026-10-08 08:07:43',NULL,'RNAHJU'),(61,'tdel_b_1791418063003','$2a$10$pjLSWGJW.zHlfcci8H5vxegWC1FG6IEJnxoAg5O6oiaUsxbRS1yGC',NULL,'','','2026-10-08 08:07:43','2026-10-08 08:07:43',NULL,'WN6GTT'),(62,'verify_a_1791418104966','$2a$10$aTn8e5xsqENGmPUxgVsNz.rwF9dhzDHeI5acHZxHPv6DkViefOUoK',NULL,'','','2026-10-08 08:08:25','2026-10-08 08:08:25',NULL,'CCCKSS'),(63,'verify_b_1791418104966','$2a$10$kuea16.zAyAfqJq3cHnCJ.CMxuOfl.xvGLRm9oEcpuqFYcAJHvlLW',NULL,'','','2026-10-08 08:08:25','2026-10-08 08:08:25',NULL,'TFXM45'),(64,'verify_a_1791418169877','$2a$10$hmoobItgz9JdtQ5f7FlF7u0rjlUbef7jtx7W7tFUdhM97.jBq7U3a',NULL,'','','2026-10-08 08:09:29','2026-10-08 08:09:29',NULL,'CZZPJ5'),(65,'verify_b_1791418169877','$2a$10$XDzJ4cCl0bkmfjA6/DjQPejheFF38HL1OM1aLWHYxHBsAOPrQuJ9q',NULL,'','','2026-10-08 08:09:30','2026-10-08 08:09:30',NULL,'D86SMK'),(66,'verify_a_1791418198330','$2a$10$mvlEalFzo8bHhBB6mgwme.gMOHmoTQu3l1Nbos9if1q5088iVZJ4u',NULL,'','','2026-10-08 08:09:58','2026-10-08 08:09:58',NULL,'C4M9MB'),(67,'verify_b_1791418198330','$2a$10$wPDuYta7KiZKK/rENiCWvug/CTImBFo7GgqFFUQHA7UTzb7q6PB.y',NULL,'','','2026-10-08 08:09:58','2026-10-08 08:09:58',NULL,'YSFJUC'),(68,'favtest_1791419690361','$2a$10$1je5lKlQwUXKnXZlew8nnOvQaKFT7UoGm5Q95KBVzPCCaMR1uPSY2',NULL,'','','2026-10-08 08:34:50','2026-10-08 08:34:50',NULL,'KKJJKS'),(69,'favv_1791419934736','$2a$10$zDK6ZJV1GQ/vhK8r6mWo7u8mQ9nU3xCiCuPVr3wHtdaVDwfOlcL8m',NULL,'','','2026-10-08 08:38:55','2026-10-08 08:38:55',NULL,'GFURUT'),(70,'ownr_1791420574097','$2a$10$4hyb2DRi3KfWSR5jTzjmE.1kv8VKJiwE1PvPQ.xyrGYzZL9ipQ.1W',NULL,'','','2026-10-08 08:49:34','2026-10-08 08:49:34',NULL,'6K6Z3C'),(71,'meown_1791420810524','$2a$10$IaIanmvjpBnFFhzL.Ak9duhdqDGuCg0LtWF5Q2av5iRFBHvd.qKVi',NULL,'','','2026-10-08 08:53:30','2026-10-08 08:53:30',NULL,'UD8NQE'),(72,'slr_1791420811272','$2a$10$LRgpu5USTtlfbfLSC/Qj9u.HJKIUiBJ6bGxMqm7rSV2iFJblTubyK',NULL,'','','2026-10-08 08:53:31','2026-10-08 08:53:31',NULL,'WVF2VE'),(73,'meown_1791420839431','$2a$10$oDeLo9FTqYKj3L0RjE4oE.sRFs6910ZkSQdix1PoXoA5P6dKTQcsK',NULL,'','','2026-10-08 08:53:59','2026-10-08 08:53:59',NULL,'7ASJXW'),(74,'slr_1791420839835','$2a$10$b/fVKLWgeuLtaRVwY9lgveEmKvI8.v0d21BCSbrD984kAg4wSnASG',NULL,'','','2026-10-08 08:53:59','2026-10-08 08:53:59',NULL,'ZKT6UR'),(75,'mlist_1791421522837','$2a$10$cFXZ7V3PRMfHejFpz5XuBu.Tvo4.Ls.U7ANA7KZsIFTkb4H5/EN9W',NULL,'','','2026-10-08 09:05:23','2026-10-08 09:05:23',NULL,'45U5X7'),(76,'other_1791421524838','$2a$10$IxZV/TYLaLrtikYWN8nDlu5tKp0e6SsLtkEaIB3UYRH88n09emWJ6',NULL,'','','2026-10-08 09:05:24','2026-10-08 09:05:24',NULL,'KDQM84'),(77,'rev_1791421994989','$2a$10$UIWhpSvgDhRVphbx.qbX5OmPirR2xTcOVCwUAJk8k0M/WvIwzJ0T6',NULL,'','','2026-10-08 09:13:15','2026-10-08 09:13:15',NULL,'FECWYJ'),(78,'slr2_1791421996111','$2a$10$H/nz42F0WZgw4pmrIyxwc.rOF9jefbfKQMz/1VURmzVJLgOekt4xK',NULL,'','','2026-10-08 09:13:16','2026-10-08 09:13:16',NULL,'7FZ9K4'),(79,'buy_1791422202411','$2a$10$HBHbOU/h68gb6JY/3e5hgu/S8A.DrbBBS44nltUDd.bkpqVceTTxC',NULL,'','','2026-10-08 09:16:42','2026-10-08 09:16:42',NULL,'BCT7KZ'),(80,'sell_1791422203350','$2a$10$FPcnKyqYqCeS09FOvHhoBu7/dyqa4UxKjmKY2zOn37dR5SRfpY/FG',NULL,'','','2026-10-08 09:16:43','2026-10-08 09:16:43',NULL,'ZJRFUQ'),(156,'CHKmv23gmia','$2a$10$YQ7YaT6V3rdZQDtKiqNWZO9YoLPRUyweUAZOZIZvIOF.0mSqPVSxW',NULL,'','','2026-10-10 15:50:09','2026-10-10 15:50:09','test','X9S2TH'),(157,'BFmv23rpxd','$2a$10$8SYOExFxHNpYF9FgS0.yie6me2jtTRWGswjbAN8iWvhq.akQBFX9e',NULL,'','','2026-10-10 15:58:47','2026-10-10 15:58:47','test','DN4NDH'),(158,'SFmv23rpxd','$2a$10$cYBOm9NgsFKpn2uq0LrtFuZM1eajpgMIrAKeCb5iNzCICfGa6Y/c.',NULL,'','','2026-10-10 15:58:47','2026-10-10 15:58:47','test','PT5YUH'),(159,'BFmv23s4bs','$2a$10$Krn4ube004vFZ7CFGcKdw.4Lf/TVo/yKiWI/uIOiONUZ5HDyntRkK',NULL,'','','2026-10-10 15:59:05','2026-10-10 15:59:05','test','ASPCHC'),(160,'BFmv23skfj','$2a$10$ecjVh2U3Xaq1EDXQhsZ7sOkaf.d7SMrT6ZGH28L/KCLQaYQbfCOIe',NULL,'','','2026-10-10 15:59:26','2026-10-10 15:59:26','test','AZZAX4'),(161,'AFmv23skqs','$2a$10$E6AHnf2fJagZk5KXoL84NeQNAWcaIwu9xXaU9DO/yJiPUTTu2sR8C',NULL,'','','2026-10-10 15:59:27','2026-10-10 15:59:27','test','ZWKEE2'),(162,'SAmv24a9w2','$2a$10$r9TrY.BmuJvh37n/XQzLM.rezEN6VJsSYcdSbLFYq4plbVnGsEm9W',NULL,'','','2026-10-10 16:13:12','2026-10-10 16:13:12','test','BQ9W3A'),(163,'SBmv24aa90','$2a$10$cA6iUmjcYe04j2NbKFMn.e5/.xVME6xpsYRFkx.96u10bZiE.kT2G',NULL,'','','2026-10-10 16:13:13','2026-10-10 16:13:13','test','ZTTRA4');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
SET @@SESSION.SQL_LOG_BIN = @MYSQLDUMP_TEMP_LOG_BIN;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-10-10 19:13:01
