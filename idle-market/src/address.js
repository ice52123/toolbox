// 收货地址（只读）
//
// 地址由主站「我的 → 收货地址」维护，存在同源 localStorage 里；子应用与主站同源，
// 直接读同一个 key，不需要跨应用通信。
// ⚠️ key 与 client/src/utils/address.js 必须保持一致，改一边要改两边。
const KEY = 'tb_addresses';

export function listAddresses() {
  try {
    const list = JSON.parse(localStorage.getItem(KEY) || '[]');
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

export function defaultAddress() {
  const list = listAddresses();
  return list.find((a) => a.isDefault) || list[0] || null;
}

// 压成一行：校区/地区 + 详细地址
export function fmtAddress(a) {
  if (!a) return '';
  return [a.region, a.detail].filter(Boolean).join(' ');
}
