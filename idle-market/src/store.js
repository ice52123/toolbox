// 闲置子应用的静态字典 + 少量工具。
// 数据一律走 api.js 打后端（MySQL 版 3201），这里不再存任何 mock / localStorage 草稿。
export const cats = ['数码', '家居', '图书', '服饰', '母婴', '运动', '教材', '其他'];

export const conds = ['全新', '几乎全新', '九成新', '八成新', '七成新', '较旧'];

export const ways = ['自提', '面交', '快递'];

// 没图时给个占位图案，卡片和详情页共用一套
export const CAT_EMOJI = {
  数码: '📱',
  家居: '🪑',
  图书: '📚',
  服饰: '🧥',
  母婴: '🛒',
  运动: '🏋️',
  教材: '📖',
  其他: '📦'
};

export const emojiOf = (cat) => CAT_EMOJI[cat] || '📦';

// 订单状态字典：OrderList / OrderDetail 共用一份，别在两处各写一套。
// type 用 el-tag / el-timeline-item 都认的语义色。
//   unpaid   待付款     —— 刚提交，还没给钱
//   paid     待发货     —— 钱已付，货款托管在平台（没到卖家手里）
//   shipped  待收货     —— 卖家已发货 / 已约面交
//   done     已完成     —— 买家确认收货，平台才把钱打给卖家
//   refunded 已退款     —— 卖家未发货时买家申请退款，钱原路退回
//   cancelled 已取消    —— 未付款时自己撤单
export const ORDER_STATUS = {
  unpaid: { text: '待付款', type: 'warning' },
  paid: { text: '待发货', type: 'primary' },
  shipped: { text: '待收货', type: 'success' },
  done: { text: '已完成', type: 'info' },
  refunded: { text: '已退款', type: 'info' },
  cancelled: { text: '已取消', type: 'info' }
};

// MySQL datetime 是 '2026-10-01 09:10:00'（没有 T），补个 T 才是合法 ISO
export function timeAgo(s) {
  if (!s) return '';
  const d = new Date(String(s).replace(' ', 'T'));
  if (Number.isNaN(d.getTime())) return '';
  const min = Math.floor((Date.now() - d.getTime()) / 60000);
  if (min < 1) return '刚刚';
  if (min < 60) return `${min} 分钟前`;
  if (min < 1440) return `${Math.floor(min / 60)} 小时前`;
  if (min < 43200) return `${Math.floor(min / 1440)} 天前`;
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}
