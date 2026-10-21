-- 一次性数据改造脚本：把验证脚本灌的测试数据改成像真实校园场景的数据
-- 执行：F:/tools/mysql/bin/mysql.exe -uroot -padmin123 --default-character-set=utf8mb4 toolbox < server/scripts/reseed-realistic-demo.sql
-- 前置备份：server/scripts/backup-before-reseed-20261010.sql
-- 注意：不动 users.id=1（同学8000/WAEP3G，小喵本人登录账号）

-- ============ 1. 用户昵称（username 与 nickname 一起改，code 全部保留） ============
UPDATE users SET username='陈嘉树',   nickname='陈嘉树'   WHERE id=2;
UPDATE users SET username='林晚晴',   nickname='林晚晴'   WHERE id=4;
UPDATE users SET username='苏一鸣',   nickname='苏一鸣'   WHERE id=5;
UPDATE users SET username='周子航',   nickname='周子航'   WHERE id=6;
UPDATE users SET username='许诺言',   nickname='许诺言'   WHERE id=7;
UPDATE users SET username='韩雨欣',   nickname='韩雨欣'   WHERE id=8;
UPDATE users SET username='江晓峰',   nickname='江晓峰'   WHERE id=9;
UPDATE users SET username='沈亦可',   nickname='沈亦可'   WHERE id=10;
UPDATE users SET username='方志远',   nickname='方志远'   WHERE id=11;
UPDATE users SET username='唐乐乐',   nickname='唐乐乐'   WHERE id=12;
UPDATE users SET username='白芷若',   nickname='白芷若'   WHERE id=13;
UPDATE users SET username='罗启铭',   nickname='罗启铭'   WHERE id=14;
UPDATE users SET username='郑安琪',   nickname='郑安琪'   WHERE id=15;
UPDATE users SET username='高子墨',   nickname='高子墨'   WHERE id=16;
UPDATE users SET username='秦小微',   nickname='秦小微'   WHERE id=17;
UPDATE users SET username='陆天佑',   nickname='陆天佑'   WHERE id=52;
UPDATE users SET username='顾清欢',   nickname='顾清欢'   WHERE id=53;
UPDATE users SET username='孟繁星',   nickname='孟繁星'   WHERE id=54;
UPDATE users SET username='何静姝',   nickname='何静姝'   WHERE id=55;
UPDATE users SET username='欧阳晨曦', nickname='欧阳晨曦' WHERE id=56;
UPDATE users SET username='司徒文博', nickname='司徒文博' WHERE id=57;
UPDATE users SET username='皇甫云飞', nickname='皇甫云飞' WHERE id=58;
UPDATE users SET username='上官若雪', nickname='上官若雪' WHERE id=59;
UPDATE users SET username='令狐冲霄', nickname='令狐冲霄' WHERE id=60;
UPDATE users SET username='尉迟玉兰', nickname='尉迟玉兰' WHERE id=61;
UPDATE users SET username='长孙明轩', nickname='长孙明轩' WHERE id=62;
UPDATE users SET username='慕容紫英', nickname='慕容紫英' WHERE id=63;
UPDATE users SET username='端木清',   nickname='端木清'   WHERE id=64;
UPDATE users SET username='公孙离',   nickname='公孙离'   WHERE id=65;
UPDATE users SET username='石破天',   nickname='石破天'   WHERE id=66;
UPDATE users SET username='花无缺',   nickname='花无缺'   WHERE id=67;
UPDATE users SET username='铁凝香',   nickname='铁凝香'   WHERE id=68;
UPDATE users SET username='温言',     nickname='温言'     WHERE id=69;
UPDATE users SET username='宋知否',   nickname='宋知否'   WHERE id=70;
UPDATE users SET username='章鱼哥不吐泡', nickname='章鱼哥不吐泡' WHERE id=71;
UPDATE users SET username='电音南瓜车',   nickname='电音南瓜车'   WHERE id=72;
UPDATE users SET username='一只废柴猫',   nickname='一只废柴猫'   WHERE id=73;
UPDATE users SET username='芒果不忙',     nickname='芒果不忙'     WHERE id=74;
UPDATE users SET username='早起鸟爱学习', nickname='早起鸟爱学习' WHERE id=75;
UPDATE users SET username='深夜食堂常客', nickname='深夜食堂常客' WHERE id=76;
UPDATE users SET username='奶茶三分甜',   nickname='奶茶三分甜'   WHERE id=77;
UPDATE users SET username='图书馆钉子户', nickname='图书馆钉子户' WHERE id=78;
UPDATE users SET username='篮球场常驻选手', nickname='篮球场常驻选手' WHERE id=79;
UPDATE users SET username='二手好物收录机', nickname='二手好物收录机' WHERE id=80;
UPDATE users SET username='云边有个小卖部', nickname='云边有个小卖部' WHERE id=156;
UPDATE users SET username='阿俊不打游戏',   nickname='阿俊不打游戏'   WHERE id=157;
UPDATE users SET username='栗子妹',         nickname='栗子妹'         WHERE id=158;
UPDATE users SET username='一口一个甜甜圈', nickname='一口一个甜甜圈' WHERE id=159;
UPDATE users SET username='星河滚烫',       nickname='星河滚烫'       WHERE id=160;
UPDATE users SET username='木子李呀',       nickname='木子李呀'       WHERE id=161;
UPDATE users SET username='早八人上线',     nickname='早八人上线'     WHERE id=162;
UPDATE users SET username='阿茶不加冰',     nickname='阿茶不加冰'     WHERE id=163;

-- ============ 2. 商品（标题/分类/价格/地点/成色/描述，分类只用前端枚举） ============
UPDATE goods SET title='华为 FreeBuds 5 无线耳机', cat='数码', price=199.00, place='东区快递驿站', cond='九成新', school='sch001', ways='["自提","当面交易"]', `desc`='耳机音质很好，戴着也舒服，换了新耳机所以出。配件齐全，含充电线和两副替换耳塞。' WHERE id=2;
UPDATE goods SET title='小米台灯 Pro 护眼学习灯', cat='数码', price=89.00, place='东区宿舍5栋', cond='九五新', school='sch001', ways='["自提"]', `desc`='大一囤的，基本没用几次，亮度无级调节，晚上看书很护眼。' WHERE id=3;
UPDATE goods SET title='考研数学复习全书（2026版）', cat='教材', price=25.00, place='南区教学楼', cond='八成新', school='sch001', ways='["自提","校内面交"]', `desc`='高数部分笔记写在旁边，字迹工整不影响阅读，附赠一本660题。' WHERE id=7;
UPDATE goods SET title='Kindle Paperwhite 4 阅读器', cat='数码', price=399.00, place='东区快递驿站', cond='九成新', school='sch001', ways='["当面交易"]', `desc`='墨水屏看小说很舒服，带背光。吃灰半年忍痛出，送磁吸保护套。' WHERE id=8;
UPDATE goods SET title='捷安特 ATX 660 山地车', cat='其他', price=680.00, place='南区车棚', cond='八成新', school='sch001', ways='["自提"]', `desc`='大一买的，平时骑去上课，刹车变速都正常，毕业带不走，送车锁和打气筒。' WHERE id=10;
UPDATE goods SET title='宜家懒人沙发椅', cat='家居', price=120.00, place='东区宿舍5栋', cond='九成新', school='sch001', ways='["自提"]', `desc`='宿舍囤神器，躺着打游戏看剧都舒服，已经清洗过，自提。' WHERE id=11;
UPDATE goods SET title='罗技 K380 蓝牙键盘', cat='数码', price=99.00, place='东区快递驿站', cond='九成新', school='sch001', ways='["自提","当面交易"]', `desc`='可以同时连三台设备，上课记笔记很方便，键盘膜都还在。' WHERE id=14;
UPDATE goods SET title='斯伯丁七号篮球', cat='运动', price=85.00, place='西区体育馆', cond='八成新', school='sch001', ways='["自提"]', `desc`='室外场地用了一学期，气密性完好，出手感依旧很弹。' WHERE id=15;
UPDATE goods SET title='iPad 2022 第十代 64G', cat='数码', price=1899.00, place='东区宿舍3栋', cond='九成新', school='sch001', ways='["当面交易"]', `desc`='网课神器，贴了类纸膜，屏幕无划痕，功能一切正常，可当面验机。' WHERE id=16;
UPDATE goods SET title='Apple Pencil 二代', cat='数码', price=620.00, place='东区宿舍3栋', cond='九五新', school='sch001', ways='["当面交易"]', `desc`='跟 iPad 一起出，笔尖磨损很小，可以单出，也可以和 iPad 打包优惠。' WHERE id=17;
UPDATE goods SET title='小米手环 8 NFC版', cat='数码', price=149.00, place='东区快递驿站', cond='九成新', school='sch001', ways='["自提","当面交易"]', `desc`='睡眠监测和校园卡刷卡都好用，续航两周，换了新手环所以出。' WHERE id=18;
UPDATE goods SET title='大学英语四级真题试卷', cat='教材', price=15.00, place='南区教学楼', cond='八成新', school='sch001', ways='["自提"]', `desc`='只做了前两套，答案解析齐全，附赠听力音频网盘链接。' WHERE id=19;
UPDATE goods SET title='宿舍电煮锅 一人食', cat='家居', price=45.00, place='东区宿舍5栋', cond='九成新', school='sch001', ways='["自提"]', `desc`='小功率不跳闸，煮面煮粥都行，毕业用不上了。' WHERE id=20;
UPDATE goods SET title='床上折叠小桌板', cat='家居', price=25.00, place='东区宿舍5栋', cond='七成新', school='sch001', ways='["自提"]', `desc`='床上写字吃饭都方便，可折叠收纳，不占地方。' WHERE id=53;
UPDATE goods SET title='尤克里里 23寸 初学琴', cat='其他', price=158.00, place='东区宿舍3栋', cond='八成新', school='sch001', ways='["自提","当面交易"]', `desc`='送入门教材和调音器，尼龙弦手指不疼，适合零基础入门。' WHERE id=54;
UPDATE goods SET title='过肩摄影包', cat='其他', price=60.00, place='东区快递驿站', cond='七成新', school='sch001', ways='["自提"]', `desc`='相机出掉了，包还很新，防雨罩都在，内外隔层很多。' WHERE id=55;
UPDATE goods SET title='漫画《海贼王》1-60卷', cat='图书', price=220.00, place='南区教学楼', cond='八成新', school='sch001', ways='["自提"]', `desc`='全套 60 卷无缺本，书页保存完好，适合收藏或入坑一口气看完。' WHERE id=56;
UPDATE goods SET title='迪卡侬加厚瑜伽垫', cat='运动', price=35.00, place='西区体育馆', cond='九成新', school='sch001', ways='["自提"]', `desc`='买来跟着视频练了两周，太懒吃灰了，加厚款膝盖不疼。' WHERE id=57;
UPDATE goods SET title='冬季加绒卫衣 M码', cat='服饰', price=30.00, place='东区宿舍5栋', cond='九成新', school='sch001', ways='["自提"]', `desc`='买小了只穿过一次，纯色百搭，洗过一次晾干收好的。' WHERE id=58;
UPDATE goods SET title='富士拍立得 mini7+', cat='其他', price=268.00, place='东区快递驿站', cond='九成新', school='sch001', ways='["当面交易"]', `desc`='含一盒未拆封相纸，出门拍照氛围感拉满，功能完好。' WHERE id=59;
UPDATE goods SET title='考研英语黄皮书 2010-2025', cat='教材', price=30.00, place='南区教学楼', cond='八成新', school='sch001', ways='["自提"]', `desc`='阅读精读部分做了标注，真题年份全，解析册一本不缺。' WHERE id=61;
UPDATE goods SET title='通勤款二手自行车', cat='其他', price=150.00, place='南区车棚', cond='七成新', school='sch001', ways='["自提"]', `desc`='日常代步够用，前后刹车都调过，链条上过油，骑走就能上课。' WHERE id=63;
UPDATE goods SET title='索尼 WI-1000XM2 颈挂降噪耳机', cat='数码', price=450.00, place='东区快递驿站', cond='九成新', school='sch001', ways='["当面交易"]', `desc`='图书馆自习降噪神器，降噪深度优秀，配件齐全，可当面试听。' WHERE id=64;
UPDATE goods SET title='英语六级词汇书 乱序版', cat='教材', price=12.00, place='南区教学楼', cond='九成新', school='sch001', ways='["自提"]', `desc`='基本全新，没怎么翻过，备考六级的同学拿去正好。' WHERE id=65;
UPDATE goods SET title='匡威高帮帆布鞋 42码', cat='服饰', price=99.00, place='东区快递驿站', cond='八成新', school='sch001', ways='["自提","当面交易"]', `desc`='买大了半码穿着不合脚，鞋底几乎没磨损，盒子和备用鞋带都在。' WHERE id=66;
UPDATE goods SET title='宿舍迷你USB小风扇', cat='家居', price=20.00, place='东区宿舍5栋', cond='九成新', school='sch001', ways='["自提"]', `desc`='夏天宿舍神器，三档风力，插充电宝就能用，静音。' WHERE id=67;

-- 商品冗余字段 owner_name 跟着昵称走
UPDATE goods g JOIN users u ON g.owner_id=u.id SET g.owner_name=u.nickname WHERE g.owner_id<>1;

-- ============ 3. 帖子（板块/标题/正文/作者，作者分散到不同同学） ============
UPDATE posts SET board_key='general', title='大二上学期总结：从挂科边缘到绩点3.8，我做对了这几件事', author_id=1, author_name='同学8000', views=286, likes=32, comments=2,
  body='上学期期中被辅导员约谈，痛定思痛调整了学习方法：\n1. 课前一定要过一遍PPT，不用精读，混个眼熟就行；\n2. 作业别抄，不会的当场问助教；\n3. 期末提前三周开始刷往年题。\n亲测有效，这学期继续坚持，也希望帮到还在挣扎的同学！' WHERE id=1;
UPDATE posts SET board_key='secondhand', title='毕业学长清仓出教材，全部5元起，先到先得', author_id=80, author_name='二手好物收录机', views=154, likes=18, comments=2,
  body='高数、线代、大物、C语言教材都有，还有四六级真题和单词书。\n东区宿舍5栋，晚上7点后都在，可以翻翻再决定，图省事的可以直接打包带走，价格都好说。' WHERE id=2;
UPDATE posts SET board_key='study', title='高数下册自整理笔记分享（含期末划重点）', author_id=78, author_name='图书馆钉子户', views=203, likes=27, comments=2,
  body='整理了一个学期的手写笔记，公式推导和典型例题都标了重点，期末周直接照着复习就完事。\n需要的同学评论区扣1，我统一发网盘链接，祝大家期末都不挂！' WHERE id=3;
UPDATE posts SET board_key='help', title='求推荐学校周边好吃的火锅店，周末想和室友搓一顿', author_id=12, author_name='唐乐乐', views=98, likes=6, comments=2,
  body='预算人均60左右，最好离东门近一点，走路能到的。\n有没有吃过觉得不踩雷的店？求真实评价，广告勿扰～' WHERE id=4;
UPDATE posts SET board_key='general', title='食堂二楼新开的麻辣香锅窗口真的绝了', author_id=76, author_name='深夜食堂常客', views=176, likes=21, comments=2,
  body='今天中午终于排队吃上了，加了一份虾滑和午餐肉，分量很实在，微辣刚刚好。\n强烈建议错峰去，12点排队要20分钟起步，11点半之前到基本不用等。' WHERE id=5;
UPDATE posts SET board_key='lost', title='在图书馆三楼自习区捡到一张校园卡', author_id=55, author_name='何静姝', views=67, likes=9, comments=2,
  body='中午吃饭时在三楼靠窗的位置捡到的，卡上的名字我看到就擦掉了，失主带学生证来302值班台认领。\n帮转一下，谢谢大家！' WHERE id=6;
UPDATE posts SET board_key='job', title='东门奶茶店招周末兼职，时薪15，可排班', author_id=157, author_name='阿俊不打游戏', views=132, likes=11, comments=2,
  body='店里人手不够招周末班，主要做点单和封口，有培训不难上手。\n一天8小时包一顿饭，时间可以和店长商量排班，感兴趣的直接评论区留言或者私聊我。' WHERE id=7;
UPDATE posts SET board_key='help', title='有人考过软考中级吗？想问问备考经验', author_id=14, author_name='罗启铭', views=88, likes=7, comments=1,
  body='软件工程专业的，打算下学期考软考中级（系统集成项目管理工程师），不知道难度怎么样、需要准备多久？\n有没有上岸的学长学姐分享下经验和资料，万分感谢！' WHERE id=8;
UPDATE posts SET board_key='help', title='宿舍热水器坏了三天了，报修到底多久能来啊', author_id=73, author_name='一只废柴猫', views=45, likes=3, comments=0,
  body='一周前就在后勤系统报修了，进度一直是"已派单"，天天洗冷水澡真的顶不住了。\n有没有懂流程的同学说说怎么催比较有用？在线等，挺急的。' WHERE id=9;
UPDATE posts SET board_key='general', title='秋天一到就想去操场夜跑，有一起的吗', author_id=1, author_name='同学8000', views=64, likes=12, comments=0,
  body='之前一个人跑总觉得没动力，想凑个跑步小队互相监督。\n速度不重要，能坚持下来就行，晚上9点西区操场见，跑完一起去买冰豆浆！' WHERE id=52;

-- ============ 4. 评论（内容对应新帖子） ============
UPDATE post_comments SET text='学霸！求带 😭' WHERE id=1;
UPDATE post_comments SET text='可以呀，下次晚自习一起' WHERE id=2;
UPDATE post_comments SET text='已私聊，C语言那本给我留一下' WHERE id=3;
UPDATE post_comments SET text='好的，晚上等你来拿～' WHERE id=4;
UPDATE post_comments SET text='扣1！救命笔记来得太及时了' WHERE id=5;
UPDATE post_comments SET text='已发你网盘啦，记得给个好评哈哈' WHERE id=6;
UPDATE post_comments SET text='东门那家蜀大侠不错，人均55' WHERE id=7;
UPDATE post_comments SET text='楼上推荐的店我也吃过，确实稳' WHERE id=8;
UPDATE post_comments SET text='今天也去吃了，虾滑真的好吃' WHERE id=9;
UPDATE post_comments SET text='明天打算试试他家的火锅底料锅' WHERE id=10;
UPDATE post_comments SET text='失主找到了吗？帮忙顶一下' WHERE id=11;
UPDATE post_comments SET text='已经领走啦，好心同学好暖' WHERE id=12;
UPDATE post_comments SET text='想去！周末可以排周日吗' WHERE id=13;
UPDATE post_comments SET text='可以，跟店长说一声就行' WHERE id=14;
UPDATE post_comments SET text='我上学期刚过，把真题刷两遍就够了' WHERE id=52;

-- 评论冗余昵称同步
UPDATE post_comments c JOIN users u ON c.user_id=u.id SET c.name=u.nickname WHERE c.user_id<>1;

-- ============ 5. 订单（标题/价格跟着新商品走） ============
UPDATE orders o JOIN goods g ON o.goods_id=g.id SET o.title=g.title, o.price=g.price;

-- ============ 6. 会话与聊天记录（清掉 IDEMPOTENCY 测试痕迹、会话名改真实昵称） ============
UPDATE conversations SET name='何静姝' WHERE id=1;
UPDATE conversations SET name='阿俊不打游戏' WHERE id=2;
UPDATE conversations SET name='奶茶三分甜' WHERE id=3;
UPDATE conversations SET name='芒果不忙' WHERE id=4;
UPDATE chat_messages SET text='同学你好，请问东西还在吗？' WHERE text='哈喽，我是 A';
UPDATE chat_messages SET text='在的，你什么时候方便过来自取？' WHERE text LIKE 'IDEMPOTENCY_TEST_%相同消息';
UPDATE conversations SET last_msg='在的，你什么时候方便过来自取？' WHERE last_msg LIKE 'IDEMPOTENCY_TEST_%相同消息';
