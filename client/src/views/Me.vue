<template>
  <div class="tb-page">
    <!-- 未登录：登录引导。
         卡片外观直接写全局原子类 tb-card，不走 s.card：dev 下模板读的是 $setup.s.card，
         一旦样式模块没 expose 出 s（HMR / 预览面板缓存的 stale 模块），就是
         "Cannot read properties of undefined (reading 'card')" 整页降级。全局类名是字面量，永不为空。 -->
    <section v-if="!user.isLogin" class="tb-card" :class="s.guide">
      <!-- 用图标不用 👤 emoji：emoji 靠系统字体渲染，深色模式下会变白一团，图标吃 --tb-* 跟着主题走 -->
      <div :class="s.avatar"><el-icon :size="30"><User /></el-icon></div>
      <h2>登录后即可拥有个人主页</h2>
      <p :class="s.desc">我的发布、我的收藏、我的订单，一处管理</p>
      <div class="tb-btns">
        <el-button type="primary" size="large" @click="go('/auth')">登录 / 注册</el-button>
      </div>
      <p :class="s.note">
        还没有账号？本机号码一键登录，没注册过会自动帮你开号
        <br />
        登录后点顶部的昵称就能改名
      </p>
    </section>

    <!-- 已登录：资料 + 一栏三块 -->
    <template v-if="user.isLogin">
      <div class="tb-card" :class="s.profile">
        <!-- 头像：点一下直接唤起选图，选完即传即生效，不做二次确认 -->
        <div :class="s.avatarWrap" title="点击换头像" @click="pickAvatar">
          <el-avatar :size="60" :class="s.avatar" :src="user.avatar">🙂</el-avatar>
          <span :class="s.avatarMask"><el-icon :size="22"><Camera /></el-icon></span>
        </div>
        <input ref="fileRef" type="file" accept="image/*" hidden @change="onPickAvatar" />

        <div :class="s.main">
          <div :class="s.name">
            <!-- 改名字就在这条上改：点昵称变输入框，回车保存、Esc 取消。不另开弹窗 -->
            <template v-if="editingName">
              <input
                v-model="draftName"
                :class="s.nameInput"
                maxlength="16"
                placeholder="2-16 位字母 / 数字 / 下划线"
                @keyup.enter="saveName"
                @keyup.esc="cancelName"
                @blur="onBlurName"
              />
              <button :class="s.nameBtn" @click="saveName">保存</button>
              <button :class="s.nameBtnMute" @click="cancelName">取消</button>
            </template>
            <template v-else>
              <span :class="s.nameTx" title="点一下改名字" @click="startNameEdit">
                {{ user.username }}
              </span>
              <!-- 笔本身也要能点：以前这里只是个装饰图标，只有点名字才有反应 -->
              <button type="button" :class="s.pen" title="改昵称" @click="startNameEdit">
                <el-icon :size="13"><EditPen /></el-icon>
              </button>
              <el-tag size="small" effect="plain" type="success">在校同学</el-tag>
            </template>
          </div>
          <div :class="s.sub">用户 ID：{{ user.code || '待同步' }}</div>
        </div>
        <div :class="s.act">
          <button :class="s.logoutBtn" @click="doLogout">
            <el-icon :size="13"><SwitchButton /></el-icon>
            退出
          </button>
        </div>
      </div>

      <div :class="s.grid3">
        <div v-for="bk in blocks" :key="bk.key" :class="s.cell">
          <!-- 区块头：品牌竖条 + 标题 + 右侧数量徽标 + 「全部 ›」文字链 -->
          <div :class="s.head">
            <span :class="s.headTitle">
              <i :class="s.bar" />
              {{ bk.title }}
            </span>
            <span :class="s.headRight">
              <b v-if="bk.count" :class="s.count">{{ bk.count }}</b>
              <button :class="s.headMore" @click="go(bk.moreTo)">{{ bk.more }} ›</button>
            </span>
          </div>

          <div :class="s.body">
            <div v-for="r in bk.rows" :key="r.id" :class="s.row" @click="r.to && go(r.to)">
              <div :class="s.rowIco">{{ r.emoji }}</div>
              <div :class="s.rowMain">
                <div :class="s.rowTitle">{{ r.title }}</div>
                <div :class="s.rowSub">
                  <b :class="s.price">{{ r.price }}</b>
                  <span v-if="r.side" :class="s.dot">·</span>
                  <span v-if="r.side">{{ r.side }}</span>
                </div>
              </div>
              <span :class="r.pillCls">{{ r.tag }}</span>
            </div>

            <!-- 空态：浅底槽里塞一行（图标 + 一句话 + 方角按钮），别在卡片中间挖一块空白 -->
            <div v-if="!bk.rows.length" :class="[s.inset, s.empty]">
              <span :class="s.emptyIco">{{ bk.emoji }}</span>
              <span :class="s.emptyText">{{ bk.emptyText }}</span>
              <button :class="s.btnSm" @click="go(bk.emptyTo)">{{ bk.emptyBtn }}</button>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- 设置与账户：地址 / 收付款 / 外观主题 收成紧凑入口行。
         明细都在各自页面里管，这里只露一眼概要 —— 页面不再被一堆明细块撑长。
         外观主题就地展开（不弹窗、不跳页），未登录也能试。 -->
    <div class="tb-card" :class="s.setup">
      <div :class="s.setupHead">
        <span :class="s.headTitle"><i :class="s.bar" />设置与账户</span>
      </div>

      <div v-if="user.isLogin" :class="s.setRow" @click="go('/me/address')">
        <span :class="s.setIco">📍</span>
        <span :class="s.setMain">
          <b :class="s.setName">收货地址</b>
          <em :class="s.setSub">{{ addrSummary }}</em>
        </span>
        <span :class="s.setVal">{{ addrs.length ? addrs.length + ' 个' : '去添加' }}</span>
        <span :class="s.chev">›</span>
      </div>

      <div v-if="user.isLogin" :class="s.setRow" @click="go('/me/wallet#flow')">
        <span :class="s.setIco">💳</span>
        <span :class="s.setMain">
          <b :class="s.setName">收付款</b>
          <em :class="s.setSub">托管中 ¥{{ money(escrow) }} · 默认 {{ wallet.payMethod || '未设置' }}</em>
        </span>
        <span :class="s.setVal">余额 ¥{{ money(wallet.balance) }}</span>
        <span :class="s.chev">›</span>
      </div>

      <div :class="s.setRow" @click="showTheme = !showTheme">
        <span :class="s.setIco">🎨</span>
        <span :class="s.setMain">
          <b :class="s.setName">外观主题</b>
          <em :class="s.setSub">换主色 / 亮暗，全站立即生效</em>
        </span>
        <span :class="s.setVal">{{ theme.dark ? '深色' : '浅色' }} · {{ theme.preset.name }}</span>
        <span :class="[s.chev, { [s.chevOpen]: showTheme }]">›</span>
      </div>

      <div v-if="showTheme" :class="s.themeBody">
        <div :class="s.themeRow">
          <span :class="s.chipLb">模式</span>
          <div :class="s.segWrap">
            <button
              :class="[s.segBtn, { [s.segBtnOn]: !theme.dark }]"
              @click.stop="theme.setDark(false)"
            >
              <el-icon :size="15"><Sunny /></el-icon>浅色
            </button>
            <button :class="[s.segBtn, { [s.segBtnOn]: theme.dark }]" @click.stop="theme.setDark(true)">
              <el-icon :size="15"><Moon /></el-icon>深色
            </button>
          </div>
        </div>

        <div :class="s.themeRow">
          <span :class="s.chipLb">主色</span>
          <div :class="s.accents">
            <button
              v-for="p in theme.presets"
              :key="p.key"
              :class="[s.sw, { [s.swOn]: theme.accent === p.key }]"
              :style="{ '--sw-a': p.primary, '--sw-b': p.secondary }"
              :title="p.name"
              @click.stop="theme.setAccent(p.key)"
            >
              {{ p.demo }}
            </button>
            <span :class="s.mini">当前：{{ theme.preset.name }}</span>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, useCssModule } from 'vue';
import { useRouter } from 'vue-router';
// 共享原子类（CSS Modules）：s.card / s.row / s.head … 各页长得一样的外观都在这一份
import shared from '@/styles/ui.module.less';
import { Sunny, Moon, EditPen, SwitchButton, User } from '@element-plus/icons-vue';
import { useUserStore } from '@/stores/user';
import { useThemeStore } from '@/stores/theme';
import { ElMessage } from 'element-plus';
import request from '@/utils/request';
import { fromNow } from '@/utils/format';
import { idleOrdersAsMain, readIdleOrders } from '@/utils/idleOrders';
import { listAddresses, fmtAddress } from '@/utils/address';
import { readWallet } from '@/utils/wallet';
import { Camera } from '@element-plus/icons-vue';

// 一个句柄拿两类样式：ui.module.less 的共享原子类 + 本组件 <style module> 的局部类
const s = { ...shared, ...useCssModule() };

const user = useUserStore();
const theme = useThemeStore();
const router = useRouter();

// 昵称就地改（不再开「账号设置」弹窗）
const editingName = ref(false);
const draftName = ref('');
const myGoods = ref([]);
const orders = ref([]);
const fav = ref([]);
// 收货地址簿 / 收付款：模拟阶段都在本地（见 utils/address.js、utils/wallet.js）
const addrs = ref([]);
const wallet = ref(readWallet());
// 托管中金额：由本地订单实时算出，不单独存，免得跟订单状态对不上
const escrow = ref(0);
// 设置卡里的外观主题是就地展开的（不弹窗、不跳页）
const showTheme = ref(false);
// 金额 / 默认地址概要：设置卡那一行只露一眼，明细都在各自页面里
const money = (n) => Number(n || 0).toFixed(2);
const addrSummary = computed(() => {
  const a = addrs.value.find((x) => x.isDefault) || addrs.value[0];
  if (!a) return '还没填，快递寄送前先加一个';
  return `${a.name} · ${a.phone} · ${fmtAddress(a)}`;
});

// 订单状态英文 → 中文 + 胶囊配色（订单列表 / 详情共用同一套文案）
const statusPill = {
  pending: { label: '待付款', cls: s.pillWarn },
  paid: { label: '待发货', cls: s.pillMute },
  shipping: { label: '待收货', cls: s.pill },
  done: { label: '已完成', cls: s.pillOk },
  // 已取消：后端真会写这个状态（/orders/:id/cancel），漏了会退化成「进行中」
  cancel: { label: '已取消', cls: s.pillMute }
};

// 一栏三块数据驱动：加 / 删卡片只改这里，模板不用动
const blocks = computed(() => [
  {
    key: 'publish',
    title: '我的发布',
    count: myGoods.value.length,
    emoji: '📝',
    // 「全部 ›」进自己的清单页（可下架 / 删除 / 重新上架），不是跳去闲置市场看别人的
    more: '全部',
    moreTo: '/me/list?tab=publish',
    rows: myGoods.value.slice(0, 2).map((g, i) => ({
      id: g.id ?? i,
      emoji: '🗂️',
      title: g.title,
      price: `¥${g.price}`,
      side: `${g.cat || '其他'} · ${g.created_at ? fromNow(g.created_at) : '刚刚'}`,
      tag: g.status === 'on' ? '在售' : '已下架',
      pillCls: g.status === 'on' ? s.pillOk : s.pillMute,
      to: '/m/idle/detail/' + g.id
    })),
    emptyText: '还没发布过闲置',
    emptyBtn: '去发布',
    emptyTo: '/m/idle/publish'
  },
  {
    key: 'fav',
    title: '我的收藏',
    count: fav.value.length,
    emoji: '🔖',
    // 收藏夹进自己的清单页（能取消收藏），别再跳闲置市场
    more: '全部',
    moreTo: '/me/list?tab=fav',
    // 收藏夹里现在既有社区帖子（kind=post）也有闲置（kind=goods）：
    // 帖子没有价格，那一栏改显示来源，副行放作者和时间，点进去跳帖子详情
    rows: fav.value.slice(0, 2).map((g, i) => {
      const isPost = g.kind === 'post';
      return {
        id: (isPost ? 'p' : 'g') + (g.id ?? i),
        emoji: isPost ? '📄' : '🔖',
        title: g.title,
        price: isPost ? '社区帖子' : `¥${g.price}`,
        side: isPost
          ? `${g.author_name || '同学'}${g.created_at ? ' · ' + fromNow(g.created_at) : ''}`
          : `${g.cat || '其他'} · ${g.owner_name || '同学'}`,
        tag: isPost ? '帖子' : '闲置',
        pillCls: s.pillOk,
        to: isPost ? '/post/' + g.id : '/m/idle/detail/' + g.id
      };
    }),
    emptyText: '还没收藏帖子或闲置',
    emptyBtn: '去逛逛',
    emptyTo: '/community'
  },
  {
    key: 'order',
    title: '我的订单',
    count: orders.value.length,
    emoji: '🧾',
    more: '全部',
    moreTo: '/orders',
    rows: orders.value.slice(0, 2).map((o, i) => ({
      id: o.id ?? i,
      emoji: '📦',
      title: o.title,
      price: `¥${o.price}`,
      side: o.sn || fromNow(o.created_at),
      tag: (statusPill[o.status] || { label: '进行中' }).label,
      pillCls: (statusPill[o.status] || { cls: s.pill }).cls,
      // 闲置市场的模拟单没有主站订单详情页，直接进子应用订单详情（带物流轨迹）
      to: o.local ? '/m/idle/order/detail/' + o.id : '/order/' + o.id
    })),
    emptyText: '还没有订单',
    emptyBtn: '看我的订单',
    emptyTo: '/orders'
  }
]);

onMounted(async () => {
  // 头像 / 6位用户ID 以服务端为准：进来拉一次全量资料同步到本地
  if (user.isLogin) {
    request
      .get('/user/me')
      .then((u) => {
        user.setAvatar(u.avatar);
        user.setCode(u.code);
      })
      .catch(() => {});
  }
  if (!user.isLogin) return;

  // 地址簿 / 收付款都在本地（模拟阶段），不依赖网络，先读好：接口挂了这两块也能显示
  addrs.value = listAddresses();
  wallet.value = readWallet();
  // 托管中 = 我已付款但交易还没完成的订单金额之和
  escrow.value = readIdleOrders()
    .filter((o) => ['paid', 'shipped'].includes(o.status))
    .reduce((sum, o) => sum + Number(o.amount || o.price || 0), 0);

  try {
    // 我的发布走后端 /user/me/goods（按 token 里的 id 查，含已下架）。
    // 以前调 /goods?owner=<localStorage 里的 tb_id>：一是那个接口只返回 status='on'，
    // 下架的自己的商品凭空消失；二是 tb_id 缺失时传 0，页面永远空着。
    myGoods.value = await request.get('/user/me/goods');
    // 我的收藏：goods_fav 关联 goods
    fav.value = await request.get('/user/me/favorites');
    // 我的订单（买家 / 卖家都看得到）
    const remoteOrders = (await request.get('/orders')) || [];
    // 再并进闲置市场的模拟订单：它们只存在同源 localStorage 里，后端不认识。
    // 接真实下单接口后删掉这一行即可（见 utils/idleOrders.js 顶部说明）
    orders.value = [...idleOrdersAsMain({ withTime: fromNow }), ...remoteOrders];
  } catch (e) {
    console.error('[ Me ] 加载个人数据失败：', e);
  }
});

// —— 换头像：点头像 → 选图 → 直接上传 → 更新本地，三步完成，不弹确认框 ——
const fileRef = ref(null);
function pickAvatar() {
  if (!user.isLogin) return;
  fileRef.value.click();
}
async function onPickAvatar(e) {
  const file = e.target.files && e.target.files[0];
  e.target.value = ''; // 清空才能连续选同一张
  if (!file) return;
  if (!/^image\//.test(file.type)) return ElMessage.warning('只能上传图片');
  if (file.size > 5 * 1024 * 1024) return ElMessage.warning('头像不能超过 5MB');
  try {
    const fd = new FormData();
    fd.append('file', file);
    const data = await request.post('/user/avatar', fd);
    user.setAvatar(data.avatar);
    ElMessage.success('头像已更新');
  } catch (err) {
    ElMessage.error(err?.response?.data?.message || '上传失败，请重试');
  }
}

function startNameEdit() {
  draftName.value = user.username || '';
  editingName.value = true;
}
function cancelName() {
  editingName.value = false;
  draftName.value = '';
}
function saveName() {
  const v = (draftName.value || '').trim();
  if (v.length < 2) return ElMessage.warning('用户名至少 2 位');
  if (!/^[A-Za-z0-9_]{2,16}$/.test(v))
    return ElMessage.warning('只能用字母、数字、下划线，2-16 位');
  if (v !== user.username) {
    user.setUsername(v);
    ElMessage.success('昵称已更新');
  }
  editingName.value = false;
}
// 失焦保存：从输入框直接跳走也算改完；但 Esc 取消后再失焦不该又存一遍
function onBlurName() {
  if (!editingName.value) return;
  if (document.activeElement && document.activeElement.tagName === 'BUTTON') return; // 点「保存 / 取消」按钮由它们自己管
  saveName();
}

function go(p) {
  router.push(p);
}

// 退出登录：点了直接退，不做二次确认
function doLogout() {
  cancelName();
  user.logout();
  ElMessage.success('已退出');
  router.push('/auth');
}
</script>
<style lang="less" module>
@import '@/styles/mixins.less';

/* 只放「本页特有」的样式；卡片 / 列表行 / 空态那部分吃 ui.module.less，别重复抄一遍 */

.guide {
  text-align: center;

  h2 {
    margin: 14px 0 6px;
    font-size: 20px;
  }
}
.desc { margin: 0 0 20px; color: var(--tb-sub); }
.note { margin: 18px 0 0; font-size: 12px; color: var(--tb-sub); line-height: 1.8; }
.avatar {
  .flex-center();
  width: 60px;
  height: 60px;
  /* 未登录引导里头像要跟下面的文案同一条中轴线；块级元素不吃 text-align，得自己 margin 居中 */
  margin: 0 auto 6px;
  border-radius: 50%;
  /* 底和图标都取自主题变量：换主色 / 切深色时一起变，不要再写死浅色渐变了 */
  background: var(--tb-primary-soft);
  color: var(--tb-primary);
}
/* 头像 + 悬浮换头像蒙层：整块可点，蒙层盖在头像上，hover 才浮现。
   坑：wrap 必须给 display:inline-flex —— 默认块级容器里 el-avatar 属于 inline 级，
   按基线排会让行盒比头像高出 descender 那几 px，inset:0 的蒙层就成了竖椭圆
   （深色背景上下各比头像大一圈，看着和头像对不上）。显式定宽高后 inset:0 才严格等大。 */
.avatarWrap {
  --ava-size: 60px;
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  width: var(--ava-size);
  height: var(--ava-size);
  cursor: pointer;
  line-height: 0;
}
/* wrap 内的头像：抹掉 .avatar 自带的 auto 外边距（否则 flex item 会被顶偏），
   图标字号跟着头像尺寸走，别在 60px 圆里缩成一个小点 */
.avatarWrap .avatar {
  margin: 0;
  font-size: calc(var(--ava-size) * 0.42);
}
.avatarMask {
  .flex-center();
  position: absolute;
  inset: 0; /* 与 wrap 等大：wrap 本身就等于头像尺寸 */
  border-radius: 50%;
  background: rgba(13, 10, 32, 0.42);
  color: #fff;
  opacity: 0;
  transition: opacity 0.2s;
}
.avatarWrap:hover .avatarMask { opacity: 1; }

.profile {
  /* 手机端把「退出」吊到卡片右上角，绝对定位需要一个定位父级 */
  position: relative;
  .flex-center();
  gap: 14px;
  margin-bottom: var(--tb-gap);
  flex-wrap: wrap;

  .m-sm({
    padding: var(--tb-pad);
    gap: 12px;
    /* 头像与右侧文字块垂直居中：之前顶对齐，文字块比头像矮一截，看着偏上（用户反馈） */
    align-items: center;
  });
}
.main { flex: 1; min-width: 170px; }
/* 名字行必须左对齐：.main 是 flex:1 占满剩余宽度，用 .flex-center() 会把
   手机号 / 笔 / 徽标整行推到中间，跟下面「用户 ID」那行的左边缘对不上。
   wrap 是给手机端让位的 —— 右上角悬着退出按钮时这行放不下，徽标换行而不是压过去。 */
.name {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  flex-wrap: wrap;
  gap: 8px;
  font-size: 18px;
  font-weight: 800;

  /* 让位给右上角的退出按钮：按钮右距 6 + 按钮宽 ~70 + 间隙，取 80 兜住 */
  .m-sm({
    padding-right: 80px;
  });
}
.sub { font-size: 12.5px; color: var(--tb-sub); margin-top: 4px; }

/* 每块是一张卡：并排时各自成块，边界清楚，不再靠页面底色硬撑 */
.cell {
  .card-surface();
  padding: var(--tb-pad-sm);
}
/* 高度交给内容 / 空态，别留一块空白把卡片和整页撑长 */
.body { min-height: 0; }

/* —— 区块头：品牌竖条 + 标题 + 右侧数量徽标 + 「全部 ›」 —— */
.headTitle {
  .flex-center();
  gap: 8px;
  font-size: 15px;
}
.bar {
  width: 3px;
  height: 15px;
  border-radius: 3px;
  .grad-brand();
}
.headRight { .flex-center(); gap: 8px; }
.count {
  min-width: 22px;
  height: 20px;
  padding: 0 7px;
  .flex-center();
  border-radius: @r-pill;
  background: var(--tb-primary-soft);
  color: var(--tb-primary);
  font-size: 12px;
  font-weight: 700;
}

/* —— 设置与账户：一行一个入口，明细进各自页面 —— */
.setup { margin-bottom: var(--tb-gap); }
.setupHead { .flex-between(); margin-bottom: 2px; }
.setRow {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 11px 0;
  cursor: pointer;

  & + & {
    border-top: 1px solid var(--tb-line-soft);
  }

  &:hover .setName {
    color: var(--tb-primary);
  }
}
.setIco { flex: none; width: 22px; text-align: center; font-size: 16px; }
.setMain { flex: 1; min-width: 0; display: flex; flex-direction: column; }
.setName { font-size: 13.5px; font-weight: 600; transition: color 0.18s; }
.setSub {
  margin-top: 2px;
  font-size: 11.5px;
  font-style: normal;
  color: var(--tb-sub);
  .ellipsis-one();
}
.setVal { flex: none; font-size: 12.5px; color: var(--tb-sub); }
.chev { flex: none; color: var(--tb-mute); font-size: 15px; transition: transform 0.2s; }
.chevOpen { transform: rotate(90deg); }
/* 主题设置就地展开的那块 */
.themeBody { padding: 12px 0 2px; border-top: 1px dashed var(--tb-line); }

.themeRow {
  /* 不能用 .flex-center()：它带 justify-content:center，两行内容宽度不同就各自居中、左边缘对不齐 */
  display: flex;
  align-items: center;
  gap: 14px;
  flex-wrap: wrap;

  & + & {
    margin-top: 14px;
  }

  .m-md({
    gap: 10px;
  });
}
/* ⚠️ 跨选择器的断点规则必须写在顶层：detached ruleset 里的选择器会
   「相对父级拼接」，写在 .themeRow 内部会变成 .themeRow .chipLb */
.m-md({
  .chipLb { flex-basis: 100%; }
});
.chipLb { flex: 0 0 44px; font-size: 12.5px; color: var(--tb-sub); font-weight: 600; }

.modes { display: flex; gap: 8px; flex-wrap: wrap; }
.accents { .flex-center(); gap: 10px; flex-wrap: wrap; }

/* 模式选择（浅 / 深 / 对调）：胶囊分段控件，未选中的压在淡底里，别做成灰方块 */
.segWrap {
  display: inline-flex;
  gap: 4px;
  padding: 4px;
  background: var(--tb-primary-soft-2, rgba(124, 58, 237, 0.08));
  border: 1px solid var(--tb-border, rgba(124, 58, 237, 0.14));
  border-radius: @r-pill;
}
.segBtn {
  .flex-center();
  gap: 6px;
  padding: 8px 15px;
  border: 0;
  border-radius: @r-pill;
  cursor: pointer;
  background: transparent;
  color: var(--tb-sub);
  font-size: 13px;
  font-weight: 600;
  transition: color 0.22s, background 0.22s, box-shadow 0.22s, transform 0.22s;

  &:hover {
    color: var(--tb-text);
    background: rgba(124, 58, 237, 0.1);
  }
}
.segBtnOn {
  color: @c-white;
  .grad-brand();
  box-shadow: 0 6px 16px var(--tb-primary-ring);

  &:hover {
    transform: translateY(-1px);
  }
}

/* 列表行：整行可点，hover 给一层品牌淡底（负 margin + 同量 padding 让底铺到卡片边缘）。
   紧凑化：单块只露 2 行，行内边距从 7px 收到 5px（见下方 .m-sm 手机端再收到 4px），
   整块更收、不再把卡片撑高。横向仍用 --tb-gap-sm，留出负 margin 让 hover 底贴边 */
.row {
  composes: tb-row from global;
  margin: 0 calc(var(--tb-gap-sm) * -1);
  padding: 5px var(--tb-gap-sm);
  border-radius: @r-sm;
  cursor: pointer;
  transition: background 0.2s;

  &:hover {
    background: var(--tb-primary-soft);

    .rowIco {
      transform: scale(1.08);
    }
  }
}
.rowIco {
  composes: tb-ico from global;
  transition: transform 0.2s;
}
/* 副行只留一行：订单那句「卖家迟迟未发货…」原来会折两行把卡片顶高 */
.rowSub {
  composes: tb-row-sub from global;
  .ellipsis-one();
}

/* 副行：价格提亮加粗，跟在它后面的补充说明压成小字 */
.price { color: var(--tb-primary); font-size: 12.5px; }
.dot { margin: 0 5px; color: var(--tb-sub); font-size: 11px; }

/* 空态：浅底槽（.inset）里一行搞定（图标 + 一句话 + 方角按钮），不再单独占一整块。
   padding 交给 .inset，这里只管内容和高度，免得两个类的内边距互相覆盖。
   紧凑化：min-height 44→36，和「2 行内容」的常态更近，空着也不显空旷 */
.empty {
  .flex-center();
  gap: 8px;
  min-height: 36px;
}
.emptyIco { font-size: 14px; opacity: 0.68; }
.emptyText { font-size: 12px; color: var(--tb-sub); }

/* 主色：圆形色板。未选中用「降饱和 + 半透明」表达，不是一律压成灰块 */
.sw {
  width: 42px;
  height: 42px;
  padding: 0;
  border: 0;
  border-radius: 50%;
  cursor: pointer;
  background-image: linear-gradient(135deg, var(--sw-a, @c-brand), var(--sw-b, @c-brand-2));
  color: @c-white;
  font-size: 15px;
  font-weight: 800;
  .flex-center();
  opacity: 0.5;
  filter: saturate(0.7);
  transition: opacity 0.22s, filter 0.22s, transform 0.22s, box-shadow 0.22s;

  &:hover {
    opacity: 0.9;
    filter: saturate(1);
    transform: translateY(-2px);
  }
}
.swOn {
  opacity: 1;
  filter: saturate(1);
  box-shadow: 0 0 0 3px var(--tb-card, @c-white), 0 0 0 5px var(--tb-primary),
    0 10px 22px rgba(0, 0, 0, 0.18);
}

/* —— 昵称就地编辑 —— */
.nameTx {
  cursor: pointer;
  border-bottom: 1px dashed transparent;
  transition: 0.2s;

  &:hover {
    border-bottom-color: var(--tb-primary);
    color: var(--tb-primary);
  }
}
/* 笔：做成一枚看得见松开的手感的小圆钮，hover/active 都要有反馈 */
.pen {
  .flex-center();
  width: 24px;
  height: 24px;
  padding: 0;
  border: 1px solid transparent;
  border-radius: 50%;
  background: transparent;
  cursor: pointer;
  color: var(--tb-sub);
  transition: 0.18s;

  &:hover {
    color: var(--tb-primary);
    border-color: var(--tb-primary);
    background: var(--tb-primary-soft, rgba(124, 58, 237, 0.1));
  }
  &:active {
    transform: scale(0.92);
  }
}
.nameInput {
  width: 190px;
  height: 34px;
  padding: 0 10px;
  border: 1px solid var(--tb-primary);
  border-radius: 9px;
  background: var(--tb-card);
  color: var(--tb-text);
  font-size: 17px;
  font-weight: 800;
  outline: none;
}
.nameBtn {
  height: 34px;
  padding: 0 14px;
  border: 0;
  border-radius: 9px;
  cursor: pointer;
  .grad-brand();
  color: @c-white;
  font-size: 12.5px;
  font-weight: 700;
}
.nameBtnMute {
  height: 34px;
  padding: 0 12px;
  border: 1px solid var(--tb-line);
  border-radius: 9px;
  cursor: pointer;
  background: transparent;
  color: var(--tb-sub);
  font-size: 12.5px;

  &:hover {
    color: var(--tb-text);
  }
}

/* —— 个人卡右侧动作区 —— */
.act {
  .flex-center();
  flex: 0 0 auto;
  margin-left: auto;

  /* 手机端吊到卡片右上角并跟着内容垂直居中（头像与文字已居中，按钮同样居中才齐） */
  .m-sm({
    position: absolute;
    top: 50%;
    right: 6px;
    transform: translateY(-50%);
    z-index: 1;
    flex-basis: auto;
    margin-left: 0;
    justify-content: flex-end;
  });
}
/* 退出：小一号，别跟头像抢视线（40px 高时整张卡会被它撑成一条） */
.logoutBtn {
  .flex-center();
  gap: 5px;
  height: @h-btn-mini;
  padding: 0 12px;
  border: 1px solid rgba(244, 63, 94, 0.35);
  border-radius: @r-pill;
  background: transparent;
  cursor: pointer;
  color: var(--tb-danger);
  font-size: 12.5px;
  font-weight: 600;
  transition: 0.2s;

  &:hover {
    background: rgba(244, 63, 94, 0.08);
    border-color: var(--tb-danger);
  }
}

/* 窄屏：一栏三块变成三张竖卡，行内容量小，卡片别撑太高。
   行内边距再收到 4px：竖卡更窄，每行更要贴紧，两行连起来才不显松散 */
.m-sm({
  .cell { padding: var(--tb-pad); }
  .body { min-height: 0; }
  .row { padding: 4px var(--tb-gap-sm); }
  .name { font-size: 17px; }
  .act { width: auto; }
});
</style>
