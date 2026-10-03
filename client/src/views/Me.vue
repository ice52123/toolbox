<template>
  <div class="tb-page">
    <!-- 未登录：登录引导。
         卡片外观直接写全局原子类 tb-card，不走 s.card：dev 下模板读的是 $setup.s.card，
         一旦样式模块没 expose 出 s（HMR / 预览面板缓存的 stale 模块），就是
         "Cannot read properties of undefined (reading 'card')" 整页降级。全局类名是字面量，永不为空。 -->
    <section v-if="!user.isLogin" class="tb-card" :class="s.guide">
      <div :class="s.avatar">👤</div>
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
          <span :class="s.avatarMask"><el-icon :size="16"><Camera /></el-icon></span>
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
          <div :class="s.sub">用户 ID：{{ user.id || '待同步' }} · 校园集认证学生</div>
        </div>
        <div :class="s.act">
          <button
            :class="[s.logoutBtn, { [s.logoutBtnOn]: confirmLogout }]"
            @click="doLogout"
          >
            <el-icon :size="13"><SwitchButton /></el-icon>
            {{ confirmLogout ? '确认退出？' : '退出' }}
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
            <div v-for="r in bk.rows" :key="r.id" :class="s.row">
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

    <!-- 外观主题：亮/暗 + 5 套主色（未登录也放，先看效果再决定要不要注册） -->
    <div class="tb-card" :class="s.theme">
      <div :class="s.themeHead">
        <div>
          <b>外观主题</b>
          <p :class="s.mini">换主色 / 亮暗，全站立即生效，设备和浏览器各存一套</p>
        </div>
        <el-tag size="small" effect="plain" type="info">
          {{ theme.dark ? '深色' : '浅色' }} · {{ theme.preset.name }}
        </el-tag>
      </div>

      <!-- 模式：胶囊分段控件，图标 + 文字，选中项吃品牌渐变 -->
      <div :class="s.themeRow">
        <span :class="s.chipLb">模式</span>
        <div :class="s.segWrap">
          <button :class="[s.segBtn, { [s.segBtnOn]: !theme.dark }]" @click="theme.setDark(false)">
            <el-icon :size="15"><Sunny /></el-icon>浅色
          </button>
          <button :class="[s.segBtn, { [s.segBtnOn]: theme.dark }]" @click="theme.setDark(true)">
            <el-icon :size="15"><Moon /></el-icon>深色
          </button>
        </div>
      </div>

      <!-- 主色：圆形色板，未选中的降饱和 + 半透明，别一律灰着 -->
      <div :class="s.themeRow">
        <span :class="s.chipLb">主色</span>
        <div :class="s.accents">
          <button
            v-for="p in theme.presets"
            :key="p.key"
            :class="[s.sw, { [s.swOn]: theme.accent === p.key }]"
            :style="{ '--sw-a': p.primary, '--sw-b': p.secondary }"
            :title="p.name"
            @click="theme.setAccent(p.key)"
          >
            {{ p.demo }}
          </button>
          <span :class="s.mini">当前：{{ theme.preset.name }}</span>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, useCssModule } from 'vue';
import { useRoute, useRouter } from 'vue-router';
// 共享原子类（CSS Modules）：s.card / s.row / s.head … 各页长得一样的外观都在这一份
import shared from '@/styles/ui.module.less';
import { Sunny, Moon, EditPen, SwitchButton } from '@element-plus/icons-vue';
import { useUserStore } from '@/stores/user';
import { useThemeStore } from '@/stores/theme';
import { orders as mockOrders } from '@/config/mockData';
import { ElMessage } from 'element-plus';
import request from '@/utils/request';
import { Camera } from '@element-plus/icons-vue';

// 一个句柄拿两类样式：ui.module.less 的共享原子类 + 本组件 <style module> 的局部类
const s = { ...shared, ...useCssModule() };

const user = useUserStore();
const theme = useThemeStore();
const router = useRouter();
const route = useRoute();

// 昵称就地改（不再开「账号设置」弹窗）
const editingName = ref(false);
const draftName = ref('');
// 退出登录的两步确认：停在确认态时按钮变红，离页/改名都复位，免得下次进来还是红的
const confirmLogout = ref(false);
watch(
  () => route.fullPath,
  () => {
    confirmLogout.value = false;
  }
);
const myGoods = ref([]);
const orders = ref(mockOrders);

// 订单状态英文 → 中文 + 胶囊配色（订单列表 / 详情共用同一套文案）
const statusPill = {
  pending: { label: '待付款', cls: s.pillWarn },
  paid: { label: '待发货', cls: s.pillMute },
  shipping: { label: '待收货', cls: s.pill },
  done: { label: '已完成', cls: s.pillOk }
};

// 一栏三块数据驱动：加 / 删卡片只改这里，模板不用动
const blocks = computed(() => [
  {
    key: 'publish',
    title: '我的发布',
    count: myGoods.value.length,
    emoji: '📝',
    // 有内容时右侧「全部 ›」进闲置列表，空态时「去发布 ›」直接跳发布
    more: '全部',
    moreTo: '/m/idle',
    rows: myGoods.value.slice(0, 4).map((g, i) => ({
      id: g.id ?? i,
      emoji: '🗂️',
      title: g.title,
      price: `¥${g.price}`,
      side: `${g.cat || '其他'} · ${g.createdAt ? timeAgo(g.createdAt) : '刚刚'}`,
      tag: g.online ? '在售' : '草稿',
      pillCls: g.online ? s.pillOk : s.pillMute
    })),
    emptyText: '还没发布过闲置',
    emptyBtn: '去发布',
    emptyTo: '/m/idle'
  },
  {
    key: 'fav',
    title: '我的收藏',
    count: 0,
    emoji: '🔖',
    more: '去逛逛',
    moreTo: '/m/idle',
    rows: [],
    emptyText: '收藏夹是空的',
    emptyBtn: '去逛逛',
    emptyTo: '/m/idle'
  },
  {
    key: 'order',
    title: '我的订单',
    count: orders.value.length,
    emoji: '🧾',
    more: '全部',
    moreTo: '/orders',
    rows: orders.value.slice(0, 3).map((o, i) => ({
      id: o.id ?? i,
      emoji: '📦',
      title: o.title,
      price: `¥${o.price}`,
      side: o.sn || o.time || '',
      tag: (statusPill[o.status] || { label: '进行中' }).label,
      pillCls: (statusPill[o.status] || { cls: s.pill }).cls
    })),
    emptyText: '还没有订单',
    emptyBtn: '看我的订单',
    emptyTo: '/orders'
  }
]);

onMounted(() => {
  // 读子应用发布的本地草稿（同源时即真实数据；不同源就为空，属预期）
  try {
    const raw = localStorage.getItem('campus_idle_items');
    if (raw) myGoods.value = JSON.parse(raw);
  } catch {
    myGoods.value = [];
  }
  // 头像以服务端为准：本地没缓存过就拉一次（演示会话 / 换过头像再进来都能显示）
  if (user.isLogin && !user.avatar) {
    request
      .get('/user/me')
      .then((u) => user.setAvatar(u.avatar))
      .catch(() => {});
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

function timeAgo(iso) {
  const d = new Date(iso);
  return `${d.getMonth() + 1}月${d.getDate()}日 ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

// 退出登录：两步确认（点一下按钮变「确认退出？」，再点才真的退）。
// 不用 ElMessageBox —— 这页已经没有弹窗了，破坏性操作就地二次确认更轻。
function doLogout() {
  if (!confirmLogout.value) {
    confirmLogout.value = true;
    ElMessage.info('再点一次「确认退出」就会退出登录');
    return;
  }
  cancelName();
  user.logout();
  ElMessage.success('已退出');
  router.push('/');
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
  background: linear-gradient(135deg, #ede9fe, #e0f2fe);
  font-size: 30px;
}
/* 头像 + 悬浮换头像蒙层：整块可点，蒙层盖在头像上，hover 才浮现 */
.avatarWrap {
  position: relative;
  flex: 0 0 auto;
  cursor: pointer;
  line-height: 0;
}
.avatarMask {
  .flex-center();
  position: absolute;
  inset: 0;
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
    /* 顶对齐是第一行的关键：垂直居中时 .main 会被算上「用户 ID」那行的高度往下挪，
       昵称输入框的顶边就不是一个能写死的固定值，对不上右上角的退出按钮。
       顶对齐后第一行（昵称 / 输入框）永远贴着卡片内容顶边（= --tb-pad 的纵向值） */
    align-items: flex-start;
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

  /* 让位给右上角的退出按钮：按钮右距 6 + 确认态最宽 105 + 间隙 ≈ 115，取 112 兜住 */
  .m-sm({
    padding-right: 112px;
  });
}
.sub { font-size: 12.5px; color: var(--tb-sub); margin-top: 4px; }

.cell { padding: var(--tb-pad-sm); }
/* 空态时别把卡片撑成一块空白（原来 120px + 空态自身留白，两个空块连着中间就空了） */
.body { min-height: 72px; }

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

.theme { margin-bottom: var(--tb-gap); }
.themeHead {
  .flex-between();
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 16px;

  b { font-size: 16px; }
  p { margin: 5px 0 0; }
}

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

/* 列表行：整行可点，hover 给一层品牌淡底（负 margin + 同量 padding 让底铺到卡片边缘） */
.row {
  composes: tb-row from global;
  margin: 0 calc(var(--tb-gap-sm) * -1);
  padding: 9px var(--tb-gap-sm);
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

/* 副行：价格提亮加粗，跟在它后面的补充说明压成小字 */
.price { color: var(--tb-primary); font-size: 12.5px; }
.dot { margin: 0 5px; color: var(--tb-sub); font-size: 11px; }

/* 空态：浅底槽（.inset）里一行搞定（图标 + 一句话 + 方角按钮），不再单独占一整块。
   padding 交给 .inset，这里只管内容和高度，免得两个类的内边距互相覆盖 */
.empty {
  .flex-center();
  gap: 8px;
  min-height: 60px;
}
.emptyIco { font-size: 16px; opacity: 0.72; }
.emptyText { font-size: 12.5px; color: var(--tb-sub); }

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

  /* 手机端不再单独占一横行（原来换行到头像下方、左对齐），改吊到卡片右上角。
     top 取 --tb-pad 在 ≤900px 时的纵向值 14px：绝对定位是相对「内边距盒」算的，
     14px 正好等于卡片内容顶边，也等于昵称输入框的顶边 —— 两者顶边对齐 */
  .m-sm({
    position: absolute;
    top: 14px;
    right: 6px;
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
  color: #f43f5e;
  font-size: 12.5px;
  font-weight: 600;
  transition: 0.2s;

  &:hover {
    background: rgba(244, 63, 94, 0.08);
    border-color: #f43f5e;
  }
}
/* 确认态：文字从「退出登录」变「确认退出？」会跳动，定个最小宽度顶住 */
.logoutBtnOn {
  background: rgba(244, 63, 94, 0.1);
  border-color: #f43f5e;
  color: #f43f5e;
  min-width: 92px;
}

/* 窄屏：一栏三块变成三张竖卡，行内容量小，卡片别撑太高 */
.m-sm({
  .cell { padding: var(--tb-pad); }
  .body { min-height: 0; }
  .name { font-size: 17px; }
  .act { width: auto; }
});
</style>
