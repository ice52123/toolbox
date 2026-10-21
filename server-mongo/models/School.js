const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// 学校（多租户切校区的数据源）
// 说明：切换器在前端存的是学校「code」（如 sch001），不是 MongoDB 的 _id。
// 所以这里用 code 作业务主键，返回时把它映射成前端要的 id 字段，
// 这样 req.query.school 过滤（各列表接口）和下拉回填能对得上。
// province/city/level 来自真实名单（教育部高校名单），region 等同 province（前端分组用）。
const schoolSchema = new Schema({
  code: { type: String, required: true, unique: true }, // 业务 id，如 sch001
  name: { type: String, required: true },               // 学校名
  province: { type: String, default: '' },              // 省/直辖市
  city: { type: String, default: '' },                 // 城市
  region: { type: String, default: '' },               // 分组用（= province），前端切换器可按这个分
  level: { type: String, default: '' },                // 办学层次：本科 / 专科
  logo: { type: String, default: '' },                 // 校徽/logo（可选）
  sort: { type: Number, default: 0 }                   // 排序，越小越靠前
}, { timestamps: true });

// 把 _id 转成字符串 id（同时保留 code），剔除 __v，和前端口径一致
schoolSchema.set('toJSON', {
  transform: (doc, ret) => {
    ret.id = ret.code;
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model('School', schoolSchema);
