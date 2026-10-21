// 收付款设置（模拟）：可用余额、交易流水、提现、绑卡、支付方式、收款账户
//
// 同 address.js：模拟阶段存 localStorage，接真实后端后把函数体换掉即可。
// 「托管中资金」不在这里 —— 它由订单实时算（见 Wallet.vue），存在这里会和订单状态不同步。
const KEY = 'tb_wallet';

const KIND_NAME = { wechat: '微信支付', alipay: '支付宝', campus: '校园卡', bank: '银行卡' };

const DEFAULT = {
  balance: 0,
  // 默认支付方式：必须出现在 methods 里且开启
  payMethod: '校园卡',
  methods: [
    { name: '校园卡', desc: '一卡通余额（模拟通道）', on: true },
    { name: '微信支付', desc: '模拟通道，未接真实支付', on: true },
    { name: '支付宝', desc: '模拟通道，未接真实支付', on: false }
  ],
  // 卖闲置收到货款的地方
  receive: { type: '校园卡', account: '一卡通（默认）' },
  // 钱包自身操作的流水：充值 / 提现 / 绑卡 / 解绑（交易类流水由订单派生，见 Wallet.vue）
  ledger: [],
  // 绑定的卡：微信 / 支付宝 / 校园卡 各一条（bound 表示是否已绑），银行卡可多条
  cards: [
    { id: 'c-wechat', kind: 'wechat', name: '微信支付', account: 'wxid_demo', bound: true },
    { id: 'c-alipay', kind: 'alipay', name: '支付宝', account: '', bound: false },
    { id: 'c-campus', kind: 'campus', name: '校园卡', account: '', bound: false }
  ]
};

function clone(d) {
  return {
    ...d,
    methods: d.methods.map((m) => ({ ...m })),
    receive: { ...d.receive },
    ledger: d.ledger.map((l) => ({ ...l })),
    cards: d.cards.map((c) => ({ ...c }))
  };
}

export function readWallet() {
  const fallback = clone(DEFAULT);
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (!raw || typeof raw !== 'object') return fallback;
    const w = {
      ...fallback,
      ...raw,
      methods: Array.isArray(raw.methods) && raw.methods.length ? raw.methods : fallback.methods,
      receive: { ...fallback.receive, ...(raw.receive || {}) },
      ledger: Array.isArray(raw.ledger) ? raw.ledger : [],
      cards: Array.isArray(raw.cards) && raw.cards.length ? raw.cards : fallback.cards
    };
    // 默认支付方式被关掉或删掉了：自动落到第一个开启的通道，避免出现「默认已停用」
    const cur = w.methods.find((m) => m.name === w.payMethod);
    if (!cur || !cur.on) {
      const usable = w.methods.find((m) => m.on);
      w.payMethod = usable ? usable.name : '';
    }
    return w;
  } catch {
    return fallback;
  }
}

export function saveWallet(w) {
  try {
    localStorage.setItem(KEY, JSON.stringify(w));
  } catch {
    /* 隐私模式忽略 */
  }
  return w;
}

function entry(kind, title, amount) {
  return {
    id: 'lg' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
    time: Date.now(),
    kind,
    title,
    amount
  };
}

// 余额充值（默认演示 +¥100）
export function recharge(w, amount = 100) {
  w.balance = Number((w.balance + amount).toFixed(2));
  w.ledger.unshift(entry('recharge', `余额充值 +¥${amount}`, amount));
  return saveWallet(w);
}

// 提现：校验金额合法且不超过可用余额；到账账户用收款账户
export function withdraw(w, amount, to) {
  amount = Number(amount);
  if (!(amount > 0)) throw new Error('提现金额要大于 0');
  if (amount > w.balance) throw new Error('可提现余额不足');
  w.balance = Number((w.balance - amount).toFixed(2));
  w.ledger.unshift(entry('withdraw', `提现到 ${to}`, -amount));
  return saveWallet(w);
}

// 绑定微信 / 支付宝 / 校园卡的账号
export function bindChannel(w, kind, account) {
  let c = w.cards.find((x) => x.kind === kind);
  if (!c) {
    c = { id: 'c' + Date.now().toString(36), kind, name: KIND_NAME[kind] || kind, account: '', bound: false };
    w.cards.push(c);
  }
  c.account = account;
  c.bound = true;
  w.ledger.unshift(entry('bind', `绑定${KIND_NAME[kind] || kind} ${account}`, 0));
  return saveWallet(w);
}

export function unbindChannel(w, kind) {
  const c = w.cards.find((x) => x.kind === kind);
  if (c) {
    c.account = '';
    c.bound = false;
  }
  w.ledger.unshift(entry('unbind', `解绑${KIND_NAME[kind] || kind}`, 0));
  return saveWallet(w);
}

// 添加银行卡（只存卡号后 4 位 + 开户行 + 持卡人，模拟阶段不存完整卡号）
export function addBankCard(w, bank, last4, holder) {
  w.cards.push({
    id: 'c' + Date.now().toString(36),
    kind: 'bank',
    name: bank,
    account: last4,
    holder,
    bound: true
  });
  w.ledger.unshift(entry('bind', `添加银行卡 ${bank} (${last4})`, 0));
  return saveWallet(w);
}

export function removeBankCard(w, id) {
  w.cards = w.cards.filter((c) => c.id !== id);
  w.ledger.unshift(entry('unbind', '解绑银行卡', 0));
  return saveWallet(w);
}

export function kindName(kind) {
  return KIND_NAME[kind] || kind;
}
