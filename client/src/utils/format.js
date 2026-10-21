// 时间格式化：把后端 created_at / updated_at（MySQL datetime 或 ISO）统一成
// 「刚刚 / x 分钟前 / x 小时前 / x 天前 / 年-月-日」，全站展示时间一处实现。

export function fromNow(s) {
  if (!s) return '';
  // MySQL datetime 形如 '2026-10-01 09:10:00'，没 T，Date 解析不稳，先补成 ISO 本地时间
  const d = new Date(String(s).replace(' ', 'T'));
  if (isNaN(d.getTime())) return String(s);
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60) return '刚刚';
  if (diff < 3600) return Math.floor(diff / 60) + ' 分钟前';
  if (diff < 86400) return Math.floor(diff / 3600) + ' 小时前';
  if (diff < 86400 * 7) return Math.floor(diff / 86400) + ' 天前';
  const p = (n) => (n < 10 ? '0' + n : '' + n);
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}
