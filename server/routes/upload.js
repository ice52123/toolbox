const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const config = require('../config');
const { ok, fail } = require('../utils/response');
const { auth } = require('../middlewares/auth');

if (!fs.existsSync(config.upload.dir)) fs.mkdirSync(config.upload.dir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, config.upload.dir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + '-' + Math.round(Math.random() * 1e9) + ext);
  }
});
const upload = multer({ storage, limits: { fileSize: config.upload.maxSize } });

// 图片处理：压缩 / 格式转换 / 水印。骨架版先用 sharp 做缩放示例，完整逻辑 TODO
router.post('/image', auth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return fail(res, '请上传图片文件');
    let sharp;
    try { sharp = require('sharp'); }
    catch (e) { return fail(res, '图片处理依赖 sharp 未安装，请运行：npm i sharp'); }

    const action = req.body.action || 'resize';
    const outName = 'out-' + req.file.filename + '.png';
    const outPath = path.join(config.upload.dir, outName);

    if (action === 'resize') {
      const width = Number(req.body.width) || 800; // 前端可传目标宽度
      await sharp(req.file.path).resize(width).toFile(outPath);
    } else if (action === 'webp') {
      await sharp(req.file.path).webp({ quality: 80 }).toFile(outPath.replace(/\.png$/, '.webp'));
    } else if (action === 'watermark') {
      // TODO: 合成文字/图片水印
      await sharp(req.file.path).toFile(outPath);
    } else {
      await sharp(req.file.path).toFile(outPath);
    }

    // 处理完删原图，释放空间
    fs.unlink(req.file.path, () => {});
    return ok(res, { url: '/files/' + path.basename(outPath) }, '处理完成');
  } catch (e) {
    return fail(res, '处理失败：' + e.message);
  }
});

// PDF 处理：合并 / 拆分 / 压缩。骨架 TODO，依赖 pdf-lib
router.post('/pdf', auth, upload.array('files', 20), async (req, res) => {
  try {
    if (!req.files || !req.files.length) return fail(res, '请上传 PDF 文件');
    try { require('pdf-lib'); }
    catch (e) { return fail(res, 'PDF 处理依赖 pdf-lib 未安装，请运行：npm i pdf-lib'); }
    // TODO: 用 pdf-lib 实现合并/拆分/压缩，返回 /files/xxx
    return fail(res, 'PDF 处理功能骨架已就绪，待实现');
  } catch (e) {
    return fail(res, '处理失败：' + e.message);
  }
});

module.exports = router;
