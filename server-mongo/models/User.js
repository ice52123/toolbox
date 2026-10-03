const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Schema = mongoose.Schema;

const userSchema = new Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true, select: false }, // 默认不查出密码
  nickname: { type: String, default: '' },
  avatar: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
