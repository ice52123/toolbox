// 闲置市场数据层（阶段一：mock + 本地草稿，接口契约与后端对齐后再换 fetch）
// 后端接入时只需把 loadGoods / saveItem 内部换成 axios 请求，页面代码不用动。
const KEY = 'campus_idle_items';

export const cats = ['数码', '家居', '图书', '服饰', '母婴', '运动', '教材', '其他'];

// 内置示例数据
export const mockGoods = [
  { id: 1, title: '九成新 iPad Air 4 64G', price: 1800, cat: '数码', place: '校区3栋', owner: '王同学', cond: '九成新', desc: '自用一年，配件齐全，无磕碰。', images: [], emoji: '📱' },
  { id: 2, title: '婴儿推车 可折叠', price: 120, cat: '母婴', place: '小区5栋', owner: '李姐', cond: '八成新', desc: '可上飞机，轮子顺滑。', images: [], emoji: '🛒' },
  { id: 3, title: '考研英语资料全套', price: 30, cat: '图书', place: '校园A区', owner: '学长', cond: '七成新', desc: '含真题与笔记，全新塑封未拆的有两本。', images: [], emoji: '📚' },
  { id: 4, title: '健身哑铃 10kg 一对', price: 80, cat: '运动', place: '小区1栋', owner: '小陈', cond: '九成新', desc: '橡胶包胶，无异味。', images: [], emoji: '🏋️' },
  { id: 5, title: '宜家书架 八成新', price: 60, cat: '家居', place: '小区2栋', owner: '张叔', cond: '八成新', desc: '两层，可拆卸。', images: [], emoji: '🪑' },
  { id: 6, title: '冬季羽绒服 M码', price: 150, cat: '服饰', place: '校园B区', owner: '小林', cond: '九成新', desc: '洗过两次，无起球。', images: [], emoji: '🧥' }
];

function readLocal() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveItem(item) {
  const list = readLocal();
  list.unshift(item);
  localStorage.setItem(KEY, JSON.stringify(list));
  return list;
}

export function loadGoods() {
  return [...mockGoods, ...readLocal()];
}

export function getGoodsById(id) {
  return loadGoods().find((g) => String(g.id) === String(id));
}

export function nextId() {
  return `local_${Date.now()}`;
}
