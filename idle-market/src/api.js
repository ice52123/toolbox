// 闲置子应用的后端接入层（原生 fetch，不额外引 axios）
//
// 请求一律用相对路径 /api —— 两种运行形态都能落到 3201：
//   1) 被 qiankun 嵌进主站时，子应用脚本跑在主站页面里，fetch('/api/x') 走主站的 dev proxy；
//   2) 独立访问 4200 时，由本子应用 vite.config.js 里的 proxy 兜底。
// 学校隔离跟主站一个做法：把当前校区塞进 ?school=，后端按它下推过滤。

const bridge = { token: '', userId: '', username: '', school: '' };

function ls(key) {
  try {
    return localStorage.getItem(key) || '';
  } catch {
    return '';
  }
}

// 主站 mount 子应用时把登录态透过来（MicroAppHost 的 childProps）。
// 透不过来（比如被 iframe 兜底、或没经过 MicroAppHost）就退回自己这份 localStorage。
export function setBridge(props = {}) {
  bridge.token = props.token || '';
  bridge.userId = props.userId != null ? String(props.userId) : '';
  bridge.username = props.username || '';
  bridge.school = props.school || '';
  if (props.onLogout) bridge.onLogout = props.onLogout;
  // 主站透传的路由回调：跳主站页面时用它做 SPA 切换（不整页刷新、不白屏）
  if (props.onNavigate) bridge.onNavigate = props.onNavigate;
}

// 跳回主站路由（如「聊聊」→ /chat/:convId、「返回主站」→ /）：
//   内嵌（qiankun）时走主站透传的 router.push —— SPA 切换，子应用正常卸载；
//   独立跑 4200 时退回 location.href 整页跳过去（就一次跳走，无所谓白屏）。
// 以前用 location.href，主站整个重载：白屏一瞬 + qiankun 重新初始化，观感很差。
export function goMain(path) {
  if (bridge.onNavigate) return bridge.onNavigate(path);
  window.location.href = (import.meta.env.VITE_MAIN_APP_URL || 'http://localhost:5173') + path;
}

export const isLogin = () => !!token();
const token = () => bridge.token || ls('tb_token');
const school = () => bridge.school || ls('tb_school');
export const myId = () => Number(bridge.userId || ls('tb_id') || 0);

async function req(method, path, body) {
  // school 统一挂 query（后端所有列表接口都认这一个参数）
  const url = new URL('/api' + path, location.origin);
  const sc = school();
  if (sc) url.searchParams.set('school', sc);

  const headers = {};
  const tk = token();
  if (tk) headers.Authorization = 'Bearer ' + tk;

  let payload;
  if (body instanceof FormData) {
    payload = body; // 别设 Content-Type，让浏览器自己带 boundary
  } else if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
    payload = JSON.stringify(body);
  }

  const res = await fetch(url.toString(), { method, headers, body: payload });
  const json = await res.json().catch(() => null);
  if (!json) throw new Error('后端没返回 JSON（服务没起？）');
  if (json.code === 401 && bridge.onLogout) bridge.onLogout();
  if (json.code === 0) return json.data;
  throw new Error(json.message || '请求失败');
}

export const api = {
  get: (path) => req('GET', path),
  post: (path, body) => req('POST', path, body),
  put: (path, body) => req('PUT', path, body),
  remove: (path) => req('DELETE', path),

  // 单图上传：走 /upload/raw（只落盘不压缩），返回可直接当 src 的 /files/xxx
  upload: async (file) => {
    const fd = new FormData();
    fd.append('file', file);
    const data = await req('POST', '/upload/raw', fd);
    return data.url;
  }
};

// 后端字段名 → 页面字段名：SQL 风格 snake_case 转前端驼峰，
// 附上渲染要的派生字段（mine / emoji）
export function mapGoods(g) {
  return {
    id: g.id,
    title: g.title,
    price: Number(g.price),
    cat: g.cat,
    desc: g.desc || '',
    images: Array.isArray(g.images) ? g.images : [],
    place: g.place || '',
    cond: g.cond || '',
    ways: Array.isArray(g.ways) ? g.ways : [],
    owner: g.owner_name || '同学',
    ownerId: g.owner_id,
    ownerCode: g.owner_code || '',
    faved: !!g.faved,
    createdAt: g.created_at,
    mine: Number(g.owner_id) === myId(),
    emoji: '📦'
  };
}

// ============ 模拟下单 + 担保交易（后续替换为真实 /api/orders 接口）============
// 二手交易最大的坑就是「买家付了钱、卖家不发货」。淘宝/闲鱼的做法是**担保交易**：
// 买家付的钱先托管在平台，等卖家发货、买家确认收货之后，平台才把钱打给卖家；
// 卖家迟迟不发货，买家可以申请退款把钱拿回来（超时还会自动退）。
// 下面这套状态机就是照着这个流程做的（纯前端模拟，字段照真实接口设计）：
//
//   unpaid（待付款）--pay--> paid（待发货，钱托管在平台）--ship--> shipped（待收货）
//        |                        |                                    |
//     cancel                   refund                              receive
//        v                        v                                    v
//   cancelled（已取消）     refunded（已退款，钱原路退回）        done（已完成，钱打给卖家）
//
// 以后接真实后端，把每个函数体换成 api.post('/orders/...') 即可，页面零改动。

const ORDERS_KEY = 'tb_idle_orders';
function loadOrders() {
  try {
    return JSON.parse(localStorage.getItem(ORDERS_KEY) || '[]');
  } catch {
    return [];
  }
}
function saveOrders(list) {
  try {
    localStorage.setItem(ORDERS_KEY, JSON.stringify(list));
  } catch {
    /* 隐私模式写不进就当内存态用，刷新即丢，模拟场景可接受 */
  }
}
function genOrderId() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  const stamp = `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}`;
  const rnd = Math.random().toString().slice(2, 6);
  return `OD${stamp}${rnd}`;
}

// 状态机：from 是允许执行该动作的前置状态，to 是目标状态，type 给物流时间线上色
const FLOW = {
  pay: {
    from: 'unpaid',
    to: 'paid',
    type: 'primary',
    text: () => '买家已付款，货款由平台托管，确认收货后才会打给卖家'
  },
  ship: {
    from: 'paid',
    to: 'shipped',
    type: 'success',
    text: (o) =>
      o.way === '快递寄送'
        ? '卖家已发货，包裹已交由校园快递，正在运输途中'
        : '卖家已发货，已和买家约好当面交易的时间地点'
  },
  receive: {
    from: 'shipped',
    to: 'done',
    type: 'success',
    text: () => '买家已确认收货，平台已把托管货款打给卖家，交易完成 🎉',
    // 当面交易是线下即时交割：付款后双方见面交货、钱货两清，没有「发货」这一环，
    // 所以允许从 paid 直接走到 done（alt 路径，页面据此显示「确认交易完成」）
    alt: {
      from: 'paid',
      way: '当面交易',
      text: () => '双方已当面交易、货款两清，平台已把托管货款打给卖家，交易完成 🎉'
    }
  },
  cancel: {
    from: 'unpaid',
    to: 'cancelled',
    type: 'info',
    text: () => '订单已取消（未付款直接撤单，无资金往来）'
  },
  refund: {
    from: 'paid',
    to: 'refunded',
    type: 'danger',
    text: () => '卖家迟迟未发货，订单已退款，货款原路退回买家账户'
  }
};

// 模拟创建订单：g 是已 mapGoods 的商品，payload 是用户填的下单信息
export async function createOrder(g, payload) {
  // 真实接口：return api.post('/orders', { goodsId: g.id, way, note })
  // 幂等兜底：同一买家对同一件闲置只允许有一个进行中的订单。
  // 浏览器前进/后退可能把页面还原成「还能提交」的旧状态，所以最根本的一道
  // 防线放在这里 —— 重复提交直接把已有订单还回去，而不是又造一单。
  const dup = loadOrders().find(
    (o) =>
      o.goodsId === g.id &&
      o.buyerId === myId() &&
      o.status !== 'cancelled' &&
      o.status !== 'refunded'
  );
  if (dup) return dup;
  const now = Date.now();
  const order = {
    id: genOrderId(),
    goodsId: g.id,
    title: g.title,
    price: g.price,
    image: g.images[0] || '',
    cat: g.cat,
    owner: g.owner,
    // 记下买家：详情页用它判断「是不是我自己下的单」，给「查看我的订单」入口
    buyerId: myId(),
    // 二手闲置是单件，没有「买几件」这回事，数量固定 1，金额就是商品价
    amount: Number(Number(g.price).toFixed(2)),
    way: payload.way,
    // 只有快递寄送才有收货信息；当面交易是线下见面，不需要
    address: payload.address || null,
    note: payload.note || '',
    status: 'unpaid',
    createdAt: now,
    logistics: [{ time: now, text: '订单已提交，等待买家付款', type: 'warning' }]
  };
  const list = loadOrders();
  list.unshift(order);
  saveOrders(list);
  await new Promise((r) => setTimeout(r, 500)); // 模拟网络延迟
  return order;
}

export async function getOrder(id) {
  // 真实接口：return api.get('/orders/' + id)
  await new Promise((r) => setTimeout(r, 200));
  return loadOrders().find((o) => o.id === id) || null;
}

// 状态推进：action ∈ pay / ship / receive / cancel / refund
export async function orderAction(id, action) {
  // 真实接口：return api.post('/orders/' + id + '/' + action)
  const rule = FLOW[action];
  if (!rule) throw new Error('未知操作：' + action);
  const list = loadOrders();
  const o = list.find((x) => x.id === id);
  if (!o) throw new Error('订单不存在');
  // 主路径没匹配时，看是否有「按交易方式放宽」的 alt 路径（如当面交易付款后直接完成）
  let useAlt = false;
  if (o.status !== rule.from) {
    if (rule.alt && o.status === rule.alt.from && o.way === rule.alt.way) useAlt = true;
    else throw new Error('当前状态不能执行该操作');
  }
  o.status = rule.to;
  o.logistics.push({
    time: Date.now(),
    text: useAlt ? rule.alt.text(o) : rule.text(o),
    type: rule.type
  });
  saveOrders(list);
  await new Promise((r) => setTimeout(r, 500));
  return o;
}

// 我的订单列表（真实接口：return api.get('/orders')）
export async function listOrders() {
  await new Promise((r) => setTimeout(r, 200));
  return loadOrders();
}

// 已售出的商品 id：只要有人下过单（哪怕还没付款），这件闲置就锁定、别人不能再下，
// 防一物多卖。真实系统由后端在商品上带回 sold 状态，这里先从本地订单反推。
export function soldGoodsIds() {
  const SOLD = ['unpaid', 'paid', 'shipped', 'done'];
  return [
    ...new Set(loadOrders().filter((o) => SOLD.includes(o.status)).map((o) => o.goodsId))
  ];
}

// 当前登录用户对某件商品、尚未终态（未取消/未退款）的订单 id。
// 详情页靠它判断「是不是我自己下的单」，从而给「查看我的订单」而不是「已售出」。
// 终态（cancelled / refunded）视为释放，商品重新可买。
export function myOrderOf(goodsId) {
  const me = myId();
  const o = loadOrders().find(
    (x) =>
      x.goodsId === Number(goodsId) &&
      x.buyerId === me &&
      x.status !== 'cancelled' &&
      x.status !== 'refunded'
  );
  return o ? o.id : '';
}
