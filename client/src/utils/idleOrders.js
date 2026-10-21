// 闲置市场「模拟订单」只读桥
//
// 背景：闲置市场（idle-market 微应用）目前是模拟下单，订单只落在同源
// localStorage['tb_idle_orders'] 里（key 定义在 idle-market/src/api.js）。
// 主站订单页 / 个人中心的订单来自后端 /api/orders，两套数据互不相通，
// 所以主站看不见子应用下的单 —— 页面永远显示空态。
//
// 这里做一层只读桥：把子应用的订单映射成主站订单行的形状，混进列表里展示。
// 主站读和子应用写用的是同一个 localStorage（同源），不需要跨应用通信。
//
// ⚠️ 这是模拟阶段的临时方案。接入真实下单接口后应删除本文件：
//    到那时子应用直接调 /api/orders，主站与子应用共用同一张 orders 表，
//    不再需要任何前端桥接。

const KEY = 'tb_idle_orders';

// 子应用状态 → 主站订单状态字面量（两个页面的筛选和配色只认后者）
const STATUS_MAP = {
  unpaid: 'pending', // 待付款
  paid: 'paid', // 待发货
  shipped: 'shipping', // 待收货
  done: 'done', // 已完成
  cancelled: 'cancel', // 已取消
  refunded: 'cancel' // 已退款（并到已取消一类展示）
};

export function readIdleOrders() {
  try {
    const list = JSON.parse(localStorage.getItem(KEY) || '[]');
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

// 映射成主站订单行，字段对齐 Orders.vue 里 loadOrders 的产物；
// 额外带 local / way，供「来源标记」和「跳子应用订单详情」用。
// withTime：时间格式化函数（主站传 fromNow），避免这里再依赖 format 模块。
export function idleOrdersAsMain({ withTime = () => '' } = {}) {
  return readIdleOrders().map((o) => {
    const logistics = Array.isArray(o.logistics) ? o.logistics : [];
    const last = logistics[logistics.length - 1];
    return {
      id: o.id,
      title: o.title,
      price: o.price,
      status: STATUS_MAP[o.status] || 'pending',
      // 模拟单没有评价流程，置 true 免得列表里冒出「去评价」按钮
      reviewed: true,
      seller: o.owner || '同学',
      buyer: '我',
      isSeller: false,
      // ← 主站页面据此区分：不调后端接口，操作一律交给子应用
      local: true,
      way: o.way,
      time: withTime(o.createdAt),
      // 主站订单行的 sn 显示在「物流：」后面，这里放最新一条物流文案正合适
      sn: last ? last.text : '',
      created_at: o.createdAt
    };
  });
}
