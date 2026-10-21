<template>
  <div :class="s.page">
    <div :class="s.bar">
      <div>
        <h2>收付款</h2>
        <p :class="s.sub">付款走平台托管，确认收货后才打给卖家；卖闲置的货款进你的收款账户。</p>
      </div>
    </div>

    <!-- 资金概览 -->
    <div :class="s.cards">
      <div :class="[s.card, s.money]">
        <span :class="s.mLabel">可用余额</span>
        <strong :class="s.mVal">¥{{ money(wallet.balance) }}</strong>
        <div :class="s.mOps">
          <el-button size="small" @click="recharge">充值 ¥100</el-button>
          <el-button
            size="small"
            type="warning"
            plain
            :disabled="wallet.balance <= 0"
            @click="showWithdraw = !showWithdraw"
          >
            {{ showWithdraw ? '收起' : '提现' }}
          </el-button>
        </div>
      </div>
      <div :class="[s.card, s.money]">
        <span :class="s.mLabel">托管中（我已付款、交易未完成）</span>
        <strong :class="s.mVal">¥{{ money(escrow) }}</strong>
        <span :class="s.mTip">确认收货后打给卖家；卖家不发货可申请退款</span>
      </div>
    </div>

    <!-- 提现：页内展开（不弹窗） -->
    <div v-if="showWithdraw" :class="[s.card, s.panel]">
      <div :class="s.pTitle">提现</div>
      <div :class="s.pHint">可提现余额 <b>¥{{ money(wallet.balance) }}</b>，到账账户：{{ wallet.receive.type }} · {{ wallet.receive.account }}</div>
      <div :class="s.pRow">
        <el-input v-model="wAmt" type="number" placeholder="提现金额" :class="s.pInput" />
        <div :class="s.pOps">
          <el-button @click="showWithdraw = false">取消</el-button>
          <el-button type="primary" @click="doWithdraw">确认提现</el-button>
        </div>
      </div>
    </div>

    <!-- 下面四块（流水 / 收款账户 / 支付方式 / 我的卡）是平级的分区，之前各挂一条
         el-divider + 一张卡依次平铺：手机端得滑过整条流水才够得着最下面的「我的卡」，
         整页被拉得老长。收成页签 —— 一屏只看一块，页签名上带条数，随时切过去。 -->
    <el-tabs v-model="tab" :class="s.tabs">
      <el-tab-pane name="flow">
        <template #label>
          <span :class="s.tabLb">流水<em v-if="flow.length">{{ flow.length }}</em></span>
        </template>
        <!-- 交易流水：钱包操作(ledger) + 订单派生，按时间倒序 -->
        <div ref="flowRef" :class="[s.card, s.flow]">
          <div v-for="(f, i) in flowShown" :key="f.id || i" :class="s.lg">
            <span :class="[s.lgIcon, lgCls(f.kind)]">{{ lgIcon(f.kind) }}</span>
            <div :class="s.lgMain">
              <div :class="s.lgTitle">{{ f.title }}</div>
              <div :class="s.lgTime">{{ fmtFlowTime(f.time) }}</div>
            </div>
            <strong :class="[s.lgAmt, amtCls(f.amount)]">
              {{ f.amount > 0 ? '+' : f.amount < 0 ? '-' : '' }}¥{{ money(Math.abs(f.amount)) }}
            </strong>
          </div>
          <el-empty v-if="!flow.length" description="还没有资金变动" :image-size="60" />
          <!-- 流水攒多了能有几十条：默认只露 FLOW_PREVIEW 条，底下给一行展开 / 收起 -->
          <button
            v-if="flow.length > FLOW_PREVIEW"
            type="button"
            :class="s.moreBtn"
            @click="flowExpanded = !flowExpanded"
          >
            {{ flowExpanded ? '收起流水' : `展开全部 ${flow.length} 条` }}
            <span :class="[s.chev, { [s.chevUp]: flowExpanded }]">›</span>
          </button>
        </div>
      </el-tab-pane>

      <el-tab-pane name="receive" label="收款账户">
        <div :class="[s.card, s.receive]">
          <el-select v-model="wallet.receive.type" :class="s.sel" @change="persist">
            <el-option v-for="m in wallet.methods" :key="m.name" :label="m.name" :value="m.name" />
          </el-select>
          <el-input
            v-model="wallet.receive.account"
            maxlength="40"
            placeholder="账号 / 一卡通号（模拟）"
            @change="persist"
          />
        </div>
      </el-tab-pane>

      <el-tab-pane name="pay" label="支付方式">
        <div :class="[s.card, s.methods]">
          <div v-for="m in wallet.methods" :key="m.name" :class="s.method">
            <el-radio v-model="wallet.payMethod" :value="m.name" :disabled="!m.on">{{ m.name }}</el-radio>
            <span :class="s.mDesc">{{ m.desc }}</span>
            <el-switch v-model="m.on" @change="persist" />
          </div>
          <div :class="s.note">
            选中的那一项就是下单付款时用的通道。把当前默认关掉后，会自动换到下一个可用的通道。
          </div>
        </div>
      </el-tab-pane>

      <el-tab-pane name="cards">
        <template #label>
          <span :class="s.tabLb">我的卡<em>{{ wallet.cards.length }}</em></span>
        </template>
        <!-- 我的卡 / 绑卡（绑定表单在区块内展开，不弹窗） -->
        <div :class="[s.card, s.cardsList]">
          <div v-for="c in wallet.cards" :key="c.id" :class="s.cRow">
            <span :class="[s.cIcon, c.bound ? s.cOn : '']">{{ cIcon(c.kind) }}</span>
            <div :class="s.cMain">
              <div :class="s.cName">{{ c.name }}</div>
              <div :class="s.cAccount">{{ c.bound ? maskAccount(c) : '未绑定' }}</div>
            </div>
            <div :class="s.cOps">
              <el-button
                v-if="c.kind === 'bank'"
                text
                type="danger"
                size="small"
                @click="unbindBank(c.id)"
              >
                解绑
              </el-button>
              <el-button v-else-if="c.bound" text type="danger" size="small" @click="unbind(c.kind)">解绑</el-button>
              <el-button v-else text type="primary" size="small" @click="openBind(c.kind)">绑定</el-button>
            </div>
          </div>

          <!-- 绑定表单：页内展开 -->
          <div v-if="bindMode" :class="s.bindForm">
            <div :class="s.pTitle">{{ bindMode === 'bank' ? '添加银行卡' : '绑定' + kindName(bindKind) }}</div>
            <template v-if="bindMode === 'channel'">
              <el-input
                v-model="bAccount"
                maxlength="40"
                :placeholder="bindKind === 'campus' ? '一卡通号' : '登录账号 / 手机号'"
                :class="s.bindInput"
              />
            </template>
            <template v-else>
              <el-input v-model="bBank" placeholder="开户行，如 建设银行" :class="s.bindInput" />
              <el-input v-model="bLast4" maxlength="4" placeholder="卡号后 4 位" :class="s.bindInput" />
              <el-input v-model="bHolder" placeholder="持卡人姓名" :class="s.bindInput" />
            </template>
            <div :class="s.pOps">
              <el-button size="small" @click="bindMode = ''">取消</el-button>
              <el-button size="small" type="primary" @click="doBind">保存</el-button>
            </div>
          </div>

          <button v-if="!bindMode" type="button" :class="s.addCard" @click="openBank">+ 添加银行卡</button>
        </div>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick, useCssModule } from 'vue';
import { useRoute } from 'vue-router';
import { ElMessage } from 'element-plus';
// 共享原子类（CSS Modules）：s.card 等外观在这份里
import shared from '@/styles/ui.module.less';
import {
  readWallet,
  saveWallet,
  recharge as doRecharge,
  withdraw as doWithdrawOp,
  bindChannel,
  unbindChannel,
  addBankCard,
  removeBankCard,
  kindName
} from '@/utils/wallet';
// 托管中 / 交易流水里的「订单派生」部分，从本地订单实时算
import { readIdleOrders } from '@/utils/idleOrders';

const s = { ...shared, ...useCssModule() };

const wallet = ref(readWallet());
const escrow = ref(0);

// 从「我的」页收付款卡片带 #flow 进来时，直接滚到交易流水区块（锚点定位，不弹窗）
const route = useRoute();
const flowRef = ref(null);
// 四块分区收进页签，流水是默认那块
const tab = ref('flow');
function scrollToFlow() {
  // 先把页签切回流水：用户可能停在别的页签上，滚过去却不是这块
  tab.value = 'flow';
  // 等流水块布局完成再滚；留一点延时避开路由切换瞬间的位置抖动
  setTimeout(() => flowRef.value?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 220);
}
// 已在该页时 hash 变化（如从其它入口带 #flow 进来）也跟着滚过去
watch(
  () => route.hash,
  (h) => {
    if (h === '#flow') scrollToFlow();
  }
);

const money = (n) => Number(n || 0).toFixed(2);

function persist() {
  const w = wallet.value;
  // 当前默认通道被关掉/不存在了，自动落到第一个可用的
  const cur = w.methods.find((m) => m.name === w.payMethod);
  if (!cur || !cur.on) {
    const usable = w.methods.find((m) => m.on);
    w.payMethod = usable ? usable.name : '';
  }
  saveWallet(w);
}

function recharge() {
  doRecharge(wallet.value);
  ElMessage.success('已充值 ¥100（模拟）');
}

// —— 提现（页内展开）——
const showWithdraw = ref(false);
const wAmt = ref('');
function doWithdraw() {
  try {
    doWithdrawOp(wallet.value, wAmt.value, `${wallet.value.receive.type} · ${wallet.value.receive.account}`);
    showWithdraw.value = false;
    wAmt.value = '';
    ElMessage.success('提现申请已提交（模拟）');
  } catch (e) {
    ElMessage.warning(e.message);
  }
}

// —— 绑卡（页内展开）——
// bindMode: '' 关闭 / 'channel' 绑微信·支付宝·校园卡 / 'bank' 加银行卡
const bindMode = ref('');
const bindKind = ref('wechat');
const bAccount = ref('');
const bBank = ref('');
const bLast4 = ref('');
const bHolder = ref('');
function openBind(kind) {
  bindKind.value = kind;
  bAccount.value = (wallet.value.cards.find((c) => c.kind === kind) || {}).account || '';
  bindMode.value = 'channel';
}
function openBank() {
  bBank.value = '';
  bLast4.value = '';
  bHolder.value = '';
  bindMode.value = 'bank';
}
function doBind() {
  if (bindMode.value === 'bank') {
    if (!/^\d{4}$/.test(bLast4.value.trim())) return ElMessage.warning('卡号后 4 位填 4 位数字');
    if (!bBank.value.trim()) return ElMessage.warning('请填写开户行');
    addBankCard(wallet.value, bBank.value.trim(), bLast4.value.trim(), bHolder.value.trim());
  } else {
    if (!bAccount.value.trim()) return ElMessage.warning('请填写账号');
    bindChannel(wallet.value, bindKind.value, bAccount.value.trim());
  }
  bindMode.value = '';
  ElMessage.success('已保存');
}
function unbind(kind) {
  unbindChannel(wallet.value, kind);
}
function unbindBank(id) {
  removeBankCard(wallet.value, id);
}

// 流水 = 钱包操作(ledger) + 订单派生，按时间倒序
const flow = computed(() => {
  const orderEntries = readIdleOrders()
    .filter((o) => ['paid', 'shipped', 'done', 'refunded'].includes(o.status))
    .map((o) => {
      const amt = Number(o.amount || o.price || 0);
      if (o.status === 'refunded') {
        return { time: o.createdAt, kind: 'income', title: '退款 · ' + o.title, amount: amt };
      }
      // done = 已打款给卖家（实际支出）；paid/shipped = 托管中（冻结）
      const settled = o.status === 'done';
      return {
        time: o.createdAt,
        kind: settled ? 'done' : 'hold',
        title: (settled ? '已付款 · ' : '托管中 · ') + o.title,
        amount: -amt
      };
    });
  const local = (wallet.value.ledger || []).map((l) => ({
    time: l.time,
    kind: l.kind,
    title: l.title,
    amount: l.amount
  }));
  return [...orderEntries, ...local].sort((a, b) => b.time - a.time);
});

// 流水攒多了能有几十条，全量平铺会把整页拉得老长：默认只露前 FLOW_PREVIEW 条，
// 点「展开全部」才铺开，页面高度就锁住了
const FLOW_PREVIEW = 6;
const flowExpanded = ref(false);
const flowShown = computed(() =>
  flowExpanded.value ? flow.value : flow.value.slice(0, FLOW_PREVIEW)
);

function fmtFlowTime(t) {
  const d = new Date(t);
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}
function lgIcon(kind) {
  return {
    recharge: '💰',
    withdraw: '🏦',
    bind: '🔗',
    unbind: '✂️',
    income: '↩️',
    done: '✅',
    hold: '🛡️'
  }[kind] || '•';
}
function lgCls(kind) {
  if (kind === 'income' || kind === 'recharge') return s.lgIn;
  if (kind === 'withdraw' || kind === 'done' || kind === 'hold') return s.lgOut;
  return s.lgNeutral;
}
function amtCls(amt) {
  return amt > 0 ? s.amtIn : amt < 0 ? s.amtOut : s.amtZero;
}
function cIcon(kind) {
  return { wechat: '💚', alipay: '🔵', campus: '🎓', bank: '💳' }[kind] || '💳';
}
function maskAccount(c) {
  const a = c.account || '';
  if (c.kind === 'bank') return `尾号 ${a}` + (c.holder ? ` · ${c.holder}` : '');
  if (a.length <= 4) return a || '已绑定';
  return a.slice(0, 2) + '****' + a.slice(-2);
}

function calcEscrow() {
  const HOLD = ['paid', 'shipped'];
  escrow.value = readIdleOrders()
    .filter((o) => HOLD.includes(o.status))
    .reduce((sum, o) => sum + Number(o.amount || o.price || 0), 0);
}

onMounted(() => {
  calcEscrow();
  if (route.hash === '#flow') scrollToFlow();
});
</script>

<style lang="less" module>
@import '@/styles/mixins.less';

.page { width: 100%; }
.bar { margin-bottom: 14px; }
.bar h2 { margin: 0; font-size: 22px; }
.sub { margin: 6px 0 0; color: var(--tb-sub); font-size: 13px; }

.cards { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.money {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
  padding: 18px;
}
.mLabel { color: var(--tb-sub); font-size: 13px; }
.mVal { font-size: 26px; color: var(--tb-primary); }
.mOps { display: flex; gap: 8px; margin-top: 4px; }
.mTip { color: var(--tb-mute); font-size: 12px; line-height: 1.5; }

/* 页内展开面板（提现 / 绑卡共用外壳，替代原弹窗） */
.panel { padding: 18px; margin-top: 14px; }
.pTitle { font-size: 15px; font-weight: 700; margin-bottom: 12px; }
.pHint { color: var(--tb-sub); font-size: 13px; margin-bottom: 12px; line-height: 1.6; }
.pRow { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
.pInput { max-width: 240px; }
.pOps { display: flex; gap: 10px; }

/* 页签：把四条平铺的分区收成一屏一块 */
.tabs {
  margin-top: 6px;

  :deep(.el-tabs__header) {
    margin-bottom: 12px;
  }
  /* Element 默认那条底线偏灰，和卡片分隔线不是一个色，收回主题线色 */
  :deep(.el-tabs__nav-wrap::after) {
    background: var(--tb-line);
  }
}
/* 页签名 + 条数：条数只是提示，压小压淡，别跟标签抢视线 */
.tabLb {
  .flex-center();
  gap: 5px;

  em {
    font-style: normal;
    font-size: 11.5px;
    color: var(--tb-sub);
  }
}

/* 交易流水 */
.flow { padding: 6px 18px; }
.lg {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid rgba(124, 58, 237, 0.1);
}
.lg:last-child { border-bottom: 0; }
.lgIcon { font-size: 18px; width: 28px; text-align: center; }
.lgMain { flex: 1; min-width: 0; }
.lgTitle { font-size: 13.5px; color: var(--tb-fg); }
.lgTime { font-size: 12px; color: var(--tb-mute); margin-top: 2px; }
.lgAmt { font-size: 14px; font-weight: 700; white-space: nowrap; }
.lgIn { color: #16a34a; }
.lgOut { color: #dc2626; }
.lgNeutral { color: var(--tb-sub); }
.amtIn { color: #16a34a; }
.amtOut { color: #dc2626; }
.amtZero { color: var(--tb-sub); }

/* 展开 / 收起全部流水：贴在列表底下的一条，不另占一张卡 */
.moreBtn {
  .flex-center();
  gap: 5px;
  width: 100%;
  height: 38px;
  border: 0;
  border-top: 1px dashed var(--tb-line-soft);
  background: transparent;
  cursor: pointer;
  color: var(--tb-primary);
  font-family: inherit; /* button 默认不继承中文字体，不写会变默认衬线 */
  font-size: 12.5px;
  font-weight: 600;

  &:hover { background: var(--tb-primary-soft); }
}
.chev {
  display: inline-block;
  transform: rotate(90deg); /* 收着时朝下，暗示「下面还有」 */
  transition: transform 0.2s;
}
.chevUp { transform: rotate(-90deg); }

.methods { padding: 6px 18px; }
.method {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 12px 0;
  border-bottom: 1px solid rgba(124, 58, 237, 0.1);
}
.method:last-of-type { border-bottom: 0; }
.mDesc { flex: 1; color: var(--tb-sub); font-size: 13px; }
.note { color: var(--tb-mute); font-size: 12px; line-height: 1.6; padding: 10px 0 14px; }

.receive { display: flex; gap: 12px; padding: 18px; }
.sel { width: 170px; flex: none; }

/* 我的卡 */
.cardsList { padding: 6px 18px; display: flex; flex-direction: column; }
.cRow {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid rgba(124, 58, 237, 0.1);
}
.cRow:last-child { border-bottom: 0; }
.cIcon { font-size: 20px; width: 30px; text-align: center; filter: grayscale(1); opacity: 0.5; }
.cIcon.cOn { filter: none; opacity: 1; }
.cMain { flex: 1; min-width: 0; }
.cName { font-size: 14px; }
.cAccount { font-size: 12.5px; color: var(--tb-sub); margin-top: 2px; }
.cOps { display: flex; gap: 4px; }
.bindForm { padding: 12px 0; border-top: 1px dashed var(--tb-line); margin-top: 6px; }
.bindInput { margin-bottom: 10px; max-width: 320px; }
.addCard {
  margin-top: 10px;
  align-self: flex-start;
  height: 34px;
  padding: 0 16px;
  border: 1px dashed var(--tb-line);
  border-radius: @r-sm;
  background: transparent;
  color: var(--tb-primary);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}

@media (max-width: 900px) {
  .cards { grid-template-columns: 1fr; }
  .receive { flex-direction: column; }
  .sel { width: 100%; }
  .method { flex-wrap: wrap; }
  /* 四个页签要在 390px 里排得下：收紧左右留白，字号压一档 */
  .tabs {
    :deep(.el-tabs__item) {
      padding: 0 10px;
      font-size: 13px;
    }
  }
  .lg { padding: 10px 0; }
}
</style>
