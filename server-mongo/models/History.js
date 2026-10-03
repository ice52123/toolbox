const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const historySchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  toolId: { type: String, required: true, index: true },
  toolName: { type: String, default: '' },
  summary: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('History', historySchema);
