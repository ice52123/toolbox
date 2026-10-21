// 收货地址簿（模拟阶段存本地，接真实后端后把函数体换成 /api/addresses 即可）
//
// 为什么放 localStorage：闲置市场目前是模拟下单，收货信息跟着订单走本地。
// 主站（本页管理地址）和闲置市场（下单时选地址）同源，读同一个 key，天然共享。
// 数据结构刻意照真实接口的形状设计：
//   { id, name, phone, region, detail, isDefault }
const KEY = 'tb_addresses';

export function listAddresses() {
  try {
    const list = JSON.parse(localStorage.getItem(KEY) || '[]');
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

function persist(list) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    /* 隐私模式写不进去，当内存态用，刷新即丢，模拟场景可接受 */
  }
  return list;
}

function genId() {
  return 'ad' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

// 默认地址全局唯一：设了新的就把旧的摘掉
function markDefault(list, id) {
  list.forEach((a) => {
    a.isDefault = a.id === id;
  });
}

// 新增 / 更新：带 id 就是更新
export function saveAddress(addr) {
  const list = listAddresses();
  const item = { ...addr };
  if (!item.id) item.id = genId();
  const i = list.findIndex((a) => a.id === item.id);
  if (i >= 0) list[i] = { ...list[i], ...item };
  else list.push(item);
  if (item.isDefault) markDefault(list, item.id);
  // 一条默认都没有（第一条地址，或用户把默认开关关掉了）：兜一条上来。
  // 否则「默认地址」凭空消失，下单页也带不出地址
  else if (!list.some((a) => a.isDefault)) list[0].isDefault = true;
  return persist(list);
}

export function removeAddress(id) {
  const list = listAddresses().filter((a) => a.id !== id);
  // 删掉的是默认地址：把剩下的第一条顶上来，别让「默认」凭空消失
  if (list.length && !list.some((a) => a.isDefault)) list[0].isDefault = true;
  return persist(list);
}

export function setDefaultAddress(id) {
  const list = listAddresses();
  markDefault(list, id);
  return persist(list);
}

export function defaultAddress() {
  const list = listAddresses();
  return list.find((a) => a.isDefault) || list[0] || null;
}

// 一个地址压成一行：省市区（校区）+ 详细地址
export function fmtAddress(a) {
  if (!a) return '';
  return [a.region, a.detail].filter(Boolean).join(' ');
}
