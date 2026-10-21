<template>
  <div :class="s.auth">
    <!-- 背景：三层流动光斑 + 细网格，构成「华丽但不吵」的底 -->
    <div :class="[s.blob, s.b1]" />
    <div :class="[s.blob, s.b2]" />
    <div :class="[s.blob, s.b3]" />
    <div :class="s.gridBg" />

    <header :class="s.top">
      <div :class="s.brand" @click="home">
        <span :class="s.logo">校</span>
        <span :class="s.brandT">校园集<i>CampusHub</i></span>
      </div>
    </header>

    <main :class="s.stage">
      <!-- 左：品牌 narratives（手机端隐藏，别把表单挤没了） -->
      <section :class="s.intro">
        <h1 class="tb-gradient-text">校园集</h1>
        <p :class="s.introSub">校园生活一站式 · 社区 / 闲置 / 工具</p>
        <ul :class="s.feats">
          <li v-for="f in feats" :key="f.t" :class="s.feat">
            <span :class="s.fi" :style="{ background: f.bg }">
              <el-icon :size="16"><component :is="f.icon" /></el-icon>
            </span>
            <span :class="s.fx">
              <b>{{ f.t }}</b>
              <i>{{ f.d }}</i>
            </span>
          </li>
        </ul>
        <div :class="s.introStats">
          <!-- 循环变量用 st：s 是本组件的样式句柄，v-for 里写 s 会把它整个遮蔽掉 -->
          <div v-for="st in introStats" :key="st.k" :class="s.ist">
            <b>{{ st.v }}</b>
            <span>{{ st.k }}</span>
          </div>
        </div>
      </section>

      <!-- 右：玻璃面板 -->
      <section :class="s.glass">
        <!-- ————————— 一键登录（默认）：本机号免验证码，其他号码走密码 ————————— -->
        <div v-if="mode === 'quick'">
          <!-- 这里不放「返回」：一键登录是登录页的主入口，进来就是终点，
               右上角顶栏的「返回首页」已经够用了；只有从重置面板退回来的那一档才需要返回 -->
          <div :class="s.qHead">
            <b :class="s.qTitle">{{ editing ? '其他号码登录' : '本机号码一键登录' }}</b>
            <p :class="s.qSub">
              {{
                editing
                  ? '非本机号码需输入密码验证身份；改回本机号码仍可一键登录'
                  : '验证通过即登录，没注册过的手机号会自动帮你开号'
              }}
            </p>
          </div>

          <!-- 校园选择：登录时先定校区，选完持久化，全站请求自动带 ?school= -->
          <div :class="s.fld">
            <label :class="s.lb">选择校园<span :class="s.req">*</span></label>
            <SchoolSwitcher style="width: 100%" />
            <div v-if="!schoolStore.currentId" :class="s.tipLine">
              <el-icon :size="13"><InfoFilled /></el-icon>
              <span>登录前请先选择你的校园</span>
            </div>
          </div>

          <!-- 号码行：默认只显示本机号（免验证码），点号码/「换个号码」就变成可编辑 -->
          <div v-if="!editing" :class="s.phoneRow">
            <span v-if="gettingPhone" :class="s.phoneSkeleton" />
            <button
              v-else
              type="button"
              :class="s.phoneNum"
              title="点一下可以改号码"
              @click="startEdit"
            >
              {{ maskPhone }}
            </button>
            <button
              v-if="!gettingPhone"
              type="button"
              :class="s.swap"
              title="换个号码"
              @click="startEdit"
            >
              <el-icon :size="14"><EditPen /></el-icon><span>换个号码</span>
            </button>
          </div>

          <!-- 改号态：号码就地编辑，不跳面板；非本机号点「登录」再补密码框 -->
          <div v-else :class="s.editRow">
            <el-input
              v-model="lg.phone"
              size="large"
              maxlength="11"
              inputmode="numeric"
              placeholder="输入手机号"
              :prefix-icon="Phone"
              @keyup.enter="submit"
            />
            <button type="button" :class="s.miniBtn" @click="useDevicePhone">用本机号</button>
          </div>

          <!-- 非本机号：点过「登录」后才亮出密码框（needPwd），输入密码再点登录才真正提交 -->
          <div v-if="editing && needPwd" :class="s.fld">
            <label :class="s.lb">密码</label>
            <el-input
              v-model="lg.password"
              size="large"
              type="password"
              show-password
              maxlength="20"
              placeholder="输入该手机号的密码"
              :prefix-icon="Lock"
              @keyup.enter="submit"
            />
            <div :class="s.tipLine">
              <el-icon :size="13"><InfoFilled /></el-icon>
              <span>该号码不是本机号码，需密码验证身份后登录</span>
            </div>
          </div>

          <!-- 协议：自己画的圆点勾选，别用 el-checkbox（那颗方块在圆角面板里很跳） -->
          <button type="button" :class="[s.agree, { [s.agreeOn]: agreed }]" @click="agreed = !agreed">
            <span :class="s.agreeBox"><el-icon :size="12"><Check /></el-icon></span>
            <span :class="s.agreeTx">
              登录即代表同意《校园集用户协议》《隐私政策》，未注册的号码将自动创建账号
            </span>
          </button>

          <button
            type="button"
            :class="s.bigBtn"
            :disabled="loading || !canSubmit"
            @click="submit"
          >
            {{ loading ? '登录中…' : editing ? (needPwd ? '登录' : '登录 / 注册') : '一键登录' }}
          </button>

          <!-- 第三方登录位：品牌 SVG 图标（simple-icons 官方 path），演示环境点了给提示 -->
          <div :class="s.oauthRow">
            <button
              v-for="o in oauth"
              :key="o.k"
              type="button"
              :class="s.oauth"
              :style="{ '--oc': o.bg }"
              :title="o.name"
              @click="ElMessage.info(o.name + '登录暂未接入')"
            >
              <svg
                v-if="o.svg"
                viewBox="0 0 24 24"
                width="21"
                height="21"
                fill="#fff"
                aria-hidden="true"
                v-html="o.svg"
              />
              <el-icon v-else :size="20"><component :is="o.icon" /></el-icon>
            </button>
          </div>

          <!-- 重置密码入口：从底部走，别占面板右上角 -->
          <div :class="s.altRow">
            <button type="button" @click="setMode('reset')">忘记密码 · 重置密码</button>
          </div>
        </div>

        <!-- ————————— 重置密码：手机号 + 验证码 + 新密码，一步完成 ————————— -->
        <div v-else>
          <button type="button" :class="s.backLink" @click="backFromReset">
            <el-icon :size="13"><ArrowLeft /></el-icon><span>返回</span>
          </button>

          <div :class="s.paneH">
            <h3>重置密码</h3>
            <p>手机号验完直接设新密码，不用填用户名</p>
          </div>

          <sms-fields
            :phone="rs.phone"
            :code="rs.code"
            :countdown="cd.reset"
            :tip="rsTip"
            @update:phone="rs.phone = $event"
            @update:code="rs.code = $event"
            @send="sendCode('reset')"
            @submit="doReset"
            @auto="fillPhone('reset')"
          />

          <div :class="s.fld">
            <label :class="s.lb">新密码</label>
            <el-input
              v-model="rs.password"
              size="large"
              type="password"
              show-password
              maxlength="20"
              placeholder="6 位以上"
              :prefix-icon="Lock"
              @keyup.enter="doReset"
            />
            <div :class="s.meter">
              <span :class="s.mTrack"><i v-for="n in 3" :key="n" :class="s.seg" :style="{ background: level >= n ? levelColor : '' }" /></span>
              <span :class="s.mLabel" :style="{ color: levelColor }">{{ levelLabel }}</span>
            </div>
          </div>

          <button type="button" :class="s.bigBtn" :disabled="loading || !rsReady" @click="doReset">
            {{ loading ? '提交中…' : '确认重置并登录' }}
          </button>
        </div>

        <div :class="s.safe">
          <el-icon :size="14"><Lock /></el-icon>
          <span>登录全程 HTTPS · 演示环境号码为模拟获取</span>
        </div>
      </section>
    </main>

    <footer :class="s.foot">
      <span>© 2026 校园集 CampusHub</span>
    </footer>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onBeforeUnmount, useCssModule } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { Lock, Check, ArrowLeft, EditPen, Phone, Message, InfoFilled } from '@element-plus/icons-vue';
import { Shop, ChatDotRound, Tools, Bell } from '@element-plus/icons-vue';
import { useUserStore } from '@/stores/user';
import { useUiStore } from '@/stores/ui';
import { useThemeStore } from '@/stores/theme';
import { useSchoolStore } from '@/stores/school';
import SmsFields from '@/components/SmsFields.vue';
import SchoolSwitcher from '@/components/SchoolSwitcher.vue';
import shared from '@/styles/ui.module.less';

// 一个句柄拿两类样式：ui.module.css 的共享原子类 + 本组件 @import '@/styles/mixins.less';
const s = { ...shared, ...useCssModule() };

const route = useRoute();
const router = useRouter();
const user = useUserStore();
const ui = useUiStore();
const theme = useThemeStore();
const schoolStore = useSchoolStore();

const loading = ref(false);
const agreed = ref(true); // 协议默认勾上，别让人为了登录先读两千字

// 两档：quick 是主角（一键登录 + 本页改号），reset 是找回密码
const mode = ref('quick');
// 是不是从一键登录面板切到重置的：是的话返回就回那个面板，而不是退出登录页
const cameFromQuick = ref(false);
function setMode(m) {
  mode.value = m;
  cameFromQuick.value = m === 'reset';
  ui.authMode = m === 'reset' ? 'reset' : 'quick';
}

function backFromReset() {
  if (cameFromQuick.value) setMode('quick');
  else goBack();
}

theme.apply();

// 模式初值：?mode=reset 直达重置密码，其余都是一键登录
mode.value = route.query.mode === 'reset' || ui.authMode === 'reset' ? 'reset' : 'quick';

const DEMO_PHONE = '13800138000';
const phone = ref('');
const gettingPhone = ref(true);

// 演示环境模拟「取本机号码」：真机这里是运营商号码认证服务回调的号码
onMounted(() => {
  const t = setTimeout(() => {
    phone.value = DEMO_PHONE;
    gettingPhone.value = false;
  }, 700);
  onBeforeUnmount(() => clearTimeout(t));
});

const maskPhone = computed(() => {
  const v = phone.value;
  if (!/^1[3-9]\d{9}$/.test(v)) return v || '获取中…';
  return `${v.slice(0, 3)}****${v.slice(7)}`;
});

// 登录面板 / 重置面板各自持有一份输入，切面板不会互相带过去。
// 登录面板不再收验证码：本机号一键进，其他号码走密码
const lg = reactive({ phone: '', password: '' });
const rs = reactive({ phone: '', code: '', password: '' });
const cd = reactive({ reset: 0 });
const demo = reactive({ reset: '' });

const rsTip = computed(() =>
  demo.reset ? `演示环境不发短信：本次验证码为 ${demo.reset}，可点上方按钮再拿一次` : ''
);

const feats = [
  { t: '闲置交易闭环', d: '发布 / 查看详情 / 订单状态全打通', icon: Shop, bg: 'linear-gradient(135deg,#7C3AED,#C026D3)' },
  { t: '校园社区', d: '互助拼单、二手教材、吐槽广场', icon: ChatDotRound, bg: 'linear-gradient(135deg,#2563EB,#06B6D4)' },
  { t: '开箱即用的工具箱', d: '编码转换、图片处理、校园查询', icon: Tools, bg: 'linear-gradient(135deg,#F97316,#FB923C)' },
  { t: '实时消息', d: '回复 / 交易提醒秒达，红点不丢', icon: Bell, bg: 'linear-gradient(135deg,#10B981,#34D399)' }
];
const introStats = [
  { k: '在线工具', v: '30+' },
  { k: '累计闲置', v: '1.2 万' },
  { k: '服务同学', v: '8 万+' }
];

// 第三方登录位：微信/QQ 用 simple-icons 官方品牌 path（白填充），邮箱用 Element 图标。
// 只做视觉占位，点了给明确提示
const oauth = [
  {
    k: 'wechat',
    name: '微信',
    bg: '#07C160',
    svg: '<path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 0 1 .213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 0 0 .167-.054l1.903-1.114a.864.864 0 0 1 .717-.098 10.16 10.16 0 0 0 2.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 1.932-6.446 1.703-1.415 3.882-1.98 5.853-1.838-.576-3.583-4.196-6.348-8.596-6.348zM5.785 5.991c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178A1.17 1.17 0 0 1 4.623 7.17c0-.651.52-1.18 1.162-1.18zm5.813 0c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178 1.17 1.17 0 0 1-1.162-1.178c0-.651.52-1.18 1.162-1.18zm5.34 2.867c-1.797-.052-3.746.512-5.28 1.786-1.72 1.428-2.687 3.72-1.78 6.22.942 2.453 3.666 4.229 6.884 4.229.826 0 1.622-.12 2.361-.336a.722.722 0 0 1 .598.082l1.584.926a.272.272 0 0 0 .14.047c.134 0 .24-.111.24-.247 0-.06-.023-.12-.038-.177l-.327-1.233a.582.582 0 0 1-.023-.156.49.49 0 0 1 .201-.398C23.024 18.48 24 16.82 24 14.98c0-3.21-2.931-5.837-6.656-6.088V8.89c-.135-.01-.27-.027-.407-.03zm-2.53 3.274c.535 0 .969.44.969.982a.976.976 0 0 1-.969.983.976.976 0 0 1-.969-.983c0-.542.434-.982.97-.982zm4.844 0c.535 0 .969.44.969.982a.976.976 0 0 1-.969.983.976.976 0 0 1-.969-.983c0-.542.434-.982.969-.982z"/>'
  },
  {
    k: 'qq',
    name: 'QQ',
    bg: '#12B7F5',
    svg: '<path d="M21.395 15.035a40 40 0 0 0-.803-2.264l-1.079-2.695c.001-.032.014-.562.014-.836C19.526 4.632 17.351 0 12 0S4.474 4.632 4.474 9.241c0 .274.013.804.014.836l-1.08 2.695a39 39 0 0 0-.802 2.264c-1.021 3.283-.69 4.643-.438 4.673.54.065 2.103-2.472 2.103-2.472 0 1.469.756 3.387 2.394 4.771-.612.188-1.363.479-1.845.835-.434.32-.379.646-.301.778.343.578 5.883.369 7.482.189 1.6.18 7.14.389 7.483-.189.078-.132.132-.458-.301-.778-.483-.356-1.233-.646-1.846-.836 1.637-1.384 2.393-3.302 2.393-4.771 0 0 1.563 2.537 2.103 2.472.251-.03.581-1.39-.438-4.673"/>'
  },
  { k: 'mail', name: '邮箱', bg: '#2DB3A6', icon: Message }
];

function home() {
  router.push('/');
}
function backTo(to) {
  router.push(to);
}
function redirect() {
  const r = route.query.redirect;
  return typeof r === 'string' && r.startsWith('/') ? r : '/';
}

// —— 验证码（只剩重置密码面板用）：演示环境直接出码，真实环境发短信 ——
let timer = null;
function rollCode() {
  demo.reset = String(Math.floor(1000 + Math.random() * 9000));
}
function startCountdown() {
  if (timer) clearInterval(timer);
  timer = setInterval(() => {
    if (cd.reset > 0) cd.reset -= 1;
    // 归零就停表，别留个空转的定时器
    if (cd.reset <= 0 && timer) {
      clearInterval(timer);
      timer = null;
    }
  }, 1000);
}
const phoneOk = (v) => /^1[3-9]\d{9}$/.test(v || '');

function sendCode() {
  if (!phoneOk(rs.phone)) return ElMessage.warning('请先填写正确的手机号（11 位数字）');
  rollCode();
  cd.reset = 60;
  startCountdown();
  ElMessage.success(`验证码已发送（演示：${demo.reset}）`);
}

function fillPhone(which) {
  const f = which === 'login' ? lg : rs;
  f.phone = DEMO_PHONE;
  ElMessage.info(`已代入本机号码（演示号 ${DEMO_PHONE}）`);
}

// —— 本页改号：点号码/「换个号码」就地编辑；
//     填本机号仍一键登录，填其他号点「登录」才亮出密码框 ——
const editing = ref(false);
const needPwd = ref(false);

function startEdit() {
  if (gettingPhone.value) return;
  editing.value = true;
  needPwd.value = false; // 重新选号，密码框先收回去，点了「登录」再按号码决定
  lg.phone = phone.value || '';
  lg.password = '';
}

function useDevicePhone() {
  editing.value = false;
  needPwd.value = false;
  lg.phone = '';
  lg.password = '';
}

// 本机号没动 → 一键进；改过号 → 没出密码框先出框，出了就要求密码填好。
// 两条路都必须先选好校园（登录时定校区，没选不让登录）
const canSubmit = computed(() => {
  const schooled = !!schoolStore.currentId;
  if (!schooled) return false;
  return editing.value
    ? phoneOk(lg.phone) && (!needPwd.value || lg.password.length >= 6)
    : !!phoneOk(phone.value) && !gettingPhone.value;
});

// 一个入口走三条路，模板/回车键都调它：
// 非编辑态 → 一键；编辑态填本机号 → 收回密码框仍走一键；
// 编辑态填其他号 → 第一次点只亮密码框，再点才带密码登录
function submit() {
  if (!editing.value) return doQuick();
  if (!phoneOk(lg.phone)) return ElMessage.warning('请填写正确的手机号（11 位数字）');
  if (lg.phone === phone.value) {
    needPwd.value = false;
    return doQuick();
  }
  if (!needPwd.value) {
    needPwd.value = true;
    return;
  }
  doPwdLogin();
}

const rsReady = computed(() => phoneOk(rs.phone) && !!rs.code && rs.password.length >= 6);

// 返回：有来路就退一步，直接跳进来的退到首页/指定页，别把人扔在登录页
function goBack() {
  const canBack = window.history.state && window.history.state.back;
  if (canBack) router.back();
  else backTo(redirect());
}

// —— 一键登录：后端只要号码，注册过直接进，没注册过自动开号 ——
async function doQuick() {
  if (!schoolStore.currentId) return ElMessage.warning('请先选择你的校园');
  if (!phoneOk(phone.value)) return ElMessage.warning('号码还没拿到，稍等一下或点右侧换号');
  if (!agreed.value) return ElMessage.warning('请先勾选同意《校园集用户协议》与《隐私政策》');

  loading.value = true;
  try {
    const data = await user.quickLogin(phone.value);
    ElMessage.success(data.isNew ? '已开通校园集账号并登录' : '登录成功');
    backTo(redirect());
  } catch (e) {
    const msg = (e && e.message) || '';
    if (/手机号|格式/.test(msg)) return ElMessage.error(msg);
    // 后端还没接上（演示环境）：落一个本地会话，保证整条链路能点通
    user.setSession(
      'demo-' + Date.now(),
      '同学' + phone.value.slice(-4),
      'demo-' + Math.random().toString(36).slice(2, 8)
    );
    ElMessage.success('已用演示账号登录（P2 接后端后走真实接口）');
    backTo(redirect());
  } finally {
    loading.value = false;
  }
}
// —— 手机号 + 密码登录（非本机号走这条）——
// P2 对齐后端契约：现在先打 /user/login（username 位置传手机号），
// 后端定稿「手机号+密码」接口后这里只改 user store 里的一个方法
async function doPwdLogin() {
  if (!schoolStore.currentId) return ElMessage.warning('请先选择你的校园');
  if (lg.password.length < 6) return ElMessage.warning('请输入密码（至少 6 位）');

  loading.value = true;
  try {
    await user.login(lg.phone, lg.password);
    ElMessage.success('登录成功');
    backTo(redirect());
  } catch (e) {
    const msg = (e && e.message) || '';
    if (/密码|不存在|手机号|格式/.test(msg)) return ElMessage.error(msg);
    // 后端还没接上（演示环境）：落一个本地会话，保证整条链路能点通
    user.setSession(
      'demo-' + Date.now(),
      '同学' + lg.phone.slice(-4),
      'demo-' + Math.random().toString(36).slice(2, 8)
    );
    ElMessage.success('已用演示账号登录（P2 接后端后走真实接口）');
    backTo(redirect());
  } finally {
    loading.value = false;
  }
}

// —— 找回账号：手机号 + 验证码 + 新密码，一次提交 ——
const level = computed(() => {
  const v = rs.password || '';
  if (!v) return 0;
  let n = v.length >= 6 ? 1 : 0;
  if (/[A-Za-z]/.test(v) && /\d/.test(v)) n += 1;
  if (v.length >= 10 || /[^A-Za-z0-9]/.test(v)) n += 1;
  return n;
});
const levelLabel = computed(() => ['', '一般', '不错', '很强'][level.value] || '');
const levelColor = computed(() => ['#cbd5e1', '#f59e0b', '#22c55e', '#10b981'][level.value] || '#cbd5e1');

async function doReset() {
  if (!phoneOk(rs.phone)) return ElMessage.warning('请填写正确的手机号（11 位数字）');
  if (!rs.code) return ElMessage.warning('请输入验证码');
  if (rs.code !== demo.reset) return ElMessage.warning('验证码不对，点「获取验证码」再拿一个');
  if (rs.password.length < 6) return ElMessage.warning('新密码至少 6 位');

  loading.value = true;
  try {
    await user.resetPassword(rs.phone, rs.code, rs.password);
    await user.smsLogin(rs.phone, demo.reset);
    ElMessage.success('密码已重置并自动登录');
    backTo(redirect());
  } catch (e) {
    const msg = (e && e.message) || '';
    if (/验证码|手机号|不存在|格式/.test(msg)) return ElMessage.error(msg);
    user.setSession(
      'demo-' + Date.now(),
      '同学' + rs.phone.slice(-4),
      'demo-' + Math.random().toString(36).slice(2, 8)
    );
    ElMessage.success('已用演示账号登录（P2 接后端后走真实接口）');
    backTo(redirect());
  } finally {
    loading.value = false;
  }
}

onBeforeUnmount(() => {
  if (timer) clearInterval(timer);
});
</script>
<style lang="less" module>@import '@/styles/mixins.less';
/* 只放「本页特有」的样式；卡片/按钮外观吃 ui.module.css，别重复抄一遍 */

.auth {
  position: relative;
  min-height: 100vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  padding: 18px 24px 22px;
  color: var(--tb-text);
}

/* —— 背景：三团流动光斑 + 网格 —— */
.blob {
  position: absolute;
  border-radius: 50%;
  filter: blur(90px);
  opacity: 0.55;
  pointer-events: none;
  z-index: 0;
}
.b1 {
  width: 520px; height: 520px;
  background: radial-gradient(circle, var(--tb-aurora, rgba(124, 58, 237, 0.5)), transparent 68%);
  top: -160px; left: -120px;
  animation: float1 18s ease-in-out infinite;
}
.b2 {
  width: 460px; height: 460px;
  background: radial-gradient(circle, rgba(236, 72, 153, 0.42), transparent 68%);
  bottom: -180px; right: -80px;
  animation: float2 22s ease-in-out infinite;
}
.b3 {
  width: 420px; height: 420px;
  background: radial-gradient(circle, rgba(14, 165, 233, 0.36), transparent 68%);
  top: 40%; left: 45%;
  animation: float3 26s ease-in-out infinite;
}
.gridBg {
  position: absolute; inset: 0; z-index: 0; pointer-events: none; opacity: 0.5;
  background-image:
    linear-gradient(rgba(124, 58, 237, 0.07) 1px, transparent 1px),
    linear-gradient(90deg, rgba(124, 58, 237, 0.07) 1px, transparent 1px);
  background-size: 46px 46px;
  mask-image: radial-gradient(ellipse at 50% 40%, #000 30%, transparent 78%);
}
@keyframes float1 {
  0%, 100% { transform: translate(0, 0) scale(1); }
  50% { transform: translate(60px, 50px) scale(1.12); }
}
@keyframes float2 {
  0%, 100% { transform: translate(0, 0) scale(1.05); }
  50% { transform: translate(-70px, -40px) scale(0.95); }
}
@keyframes float3 {
  0%, 100% { transform: translate(0, 0); }
  50% { transform: translate(-50px, 60px) scale(1.08); }
}

/* —— 顶栏 —— */
.top {
  position: relative; z-index: 2;
  display: flex; align-items: center; justify-content: space-between;
  max-width: 1180px; width: 100%; margin: 0 auto;
}
.brand { display: flex; align-items: center; gap: 10px; cursor: pointer; }
.logo {
  width: 38px; height: 38px; flex: 0 0 38px;
  border-radius: 12px;
  background: linear-gradient(135deg, var(--tb-primary, #7c3aed), var(--tb-secondary, #ec4899));
  color: #fff; font-weight: 800; font-size: 19px;
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 10px 22px var(--tb-primary-ring, rgba(124, 58, 237, 0.35));
  transform: rotate(-4deg);
}
.brandT {
  display: flex; flex-direction: column; line-height: 1.15;
  font-weight: 800; font-size: 19px;
}
.brandT i { font-style: normal; font-size: 10px; letter-spacing: 2px; color: var(--tb-sub); font-weight: 600; }

/* —— 主体两栏 —— */
.stage {
  position: relative; z-index: 2;
  flex: 1;
  display: grid;
  grid-template-columns: 1fr 420px;
  gap: 56px;
  align-items: center;
  max-width: 1180px; width: 100%; margin: 0 auto;
  padding: 34px 0 20px;
}
.intro { max-width: 520px; }
.intro h1 { margin: 0 0 10px; font-size: 54px; font-weight: 900; letter-spacing: 2px; }
.introSub { margin: 0 0 26px; color: var(--tb-sub); font-size: 15.5px; }
.feats { list-style: none; margin: 0 0 28px; padding: 0; display: grid; gap: 14px; }
.feat { display: flex; align-items: center; gap: 13px; }
.fi {
  width: 38px; height: 38px; flex: 0 0 38px; border-radius: 12px;
  color: #fff; display: flex; align-items: center; justify-content: center;
  box-shadow: 0 8px 18px rgba(0, 0, 0, 0.16);
}
.fx { display: flex; flex-direction: column; }
.fx b { font-size: 14.5px; }
.fx i { font-style: normal; font-size: 12.5px; color: var(--tb-sub); margin-top: 2px; }
.introStats { display: flex; gap: 34px; }
.ist { display: flex; flex-direction: column; }
.ist b { font-size: 25px; font-weight: 800; color: var(--tb-primary); }
.ist span { font-size: 12px; color: var(--tb-sub); margin-top: 3px; }

/* —— 玻璃面板 —— */
.glass {
  position: relative;
  background: var(--tb-card, rgba(255, 255, 255, 0.78));
  border: 1px solid var(--tb-border, rgba(124, 58, 237, 0.16));
  border-radius: 26px;
  padding: 30px 30px 22px;
  box-shadow: 0 26px 70px rgba(40, 20, 90, 0.22);
  backdrop-filter: blur(22px);
  -webkit-backdrop-filter: blur(22px);
  animation: rise 0.5s ease both;
}
@keyframes rise {
  from { opacity: 0; transform: translateY(18px); }
  to { opacity: 1; transform: none; }
}

/* 返回：两档面板共用，永远待在标题左上角 */
.backLink {
  display: inline-flex; align-items: center; gap: 3px;
  border: 0; background: transparent; cursor: pointer;
  font-size: 13px; color: var(--tb-sub);
  padding: 0 0 12px; transition: 0.2s;
}
.backLink:hover { color: var(--tb-primary); }

.paneH { margin-bottom: 18px; }
.paneH h3 { margin: 0 0 5px; font-size: 20px; font-weight: 800; }
.paneH p { margin: 0; font-size: 12.5px; color: var(--tb-sub); }

/* —— 一键登录：号码 + 大按钮 —— */
/* 上一版这里压着一行「返回」，去掉后标题会贴着面板顶边，补一点上间距补回原来的节奏 */
.qHead { margin: 12px 0 20px; }
.qTitle { display: block; font-size: 22px; font-weight: 800; letter-spacing: 0.5px; }
.qSub { margin: 6px 0 0; font-size: 12.5px; color: var(--tb-sub); line-height: 1.6; }

.phoneRow {
  display: flex; align-items: center; gap: 10px;
  padding: 14px 0 16px;
  border-bottom: 1px solid var(--tb-border, rgba(124, 58, 237, 0.14));
}
.phoneNum {
  flex: 1; min-width: 0;
  border: 0; background: transparent; cursor: pointer; padding: 0;
  font-size: 26px; font-weight: 800; letter-spacing: 1px;
  color: var(--tb-text); text-align: left;
  transition: color 0.2s;
}
.phoneNum:hover { color: var(--tb-primary); }
/* 号码还没拿到时的占位，别让整行空着 */
.phoneSkeleton {
  flex: 1; height: 26px; min-width: 120px; border-radius: 8px;
  background: linear-gradient(90deg, rgba(124, 58, 237, 0.08), rgba(124, 58, 237, 0.16), rgba(124, 58, 237, 0.08));
  background-size: 200% 100%;
  animation: shimmer 1.4s ease-in-out infinite;
}
.swap {
  flex: 0 0 auto;
  display: inline-flex; align-items: center; gap: 4px;
  border: 0; background: transparent; cursor: pointer; padding: 0;
  font-size: 12.5px; color: var(--tb-sub); transition: 0.2s;
}
.swap:hover { color: var(--tb-primary); }

/* 改号态：号码输入框 + 「用本机号」，高度跟 el-input large 拉平 */
.editRow { display: flex; align-items: center; gap: 8px; }
.editRow > :global(.el-input) { flex: 1; min-width: 0; }
.editRow :global(.el-input__wrapper) { min-height: 44px; }
/* 次要按钮（用本机号 / 获取验证码）统一吃共享的方角款 .tb-btn，
   高度、圆角、配色跟邻排输入框、跟「我的」页的空态按钮都是同一套 */
.miniBtn { composes: tb-btn from global; }

/* 验证码行：输入框与「获取验证码」等高等重，差几像素整行就歪 */
.codeRow { display: flex; align-items: stretch; gap: 8px; }
.codeRow > :global(.el-input) { flex: 1; min-width: 0; }
.codeRow :global(.el-input__wrapper) { min-height: 44px; }
.codeBtn { composes: tb-btn from global; }

.tipLine {
  display: flex; align-items: center; gap: 6px;
  margin-top: 9px; padding: 8px 10px;
  border-radius: 10px; background: rgba(124, 58, 237, 0.08);
  font-size: 11.5px; color: var(--tb-sub); line-height: 1.5;
}
.tipLine b { color: var(--tb-primary); letter-spacing: 2px; }

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* 协议行：自己做勾选圆点，别用 el-checkbox 那颗方角 */
.agree {
  display: flex; align-items: flex-start; gap: 9px;
  margin: 16px 0 18px; padding: 0; border: 0; background: transparent;
  cursor: pointer; text-align: left; width: 100%;
}
.agreeBox {
  flex: 0 0 18px; width: 18px; height: 18px; margin-top: 1px;
  border-radius: 50%;
  border: 1.5px solid var(--tb-border, rgba(124, 58, 237, 0.3));
  background: transparent;
  display: flex; align-items: center; justify-content: center;
  color: transparent;
  transition: 0.2s;
}
.agreeOn .agreeBox {
  border-color: transparent;
  background: linear-gradient(135deg, var(--tb-primary), var(--tb-secondary));
  color: #fff;
  box-shadow: 0 4px 10px var(--tb-primary-ring, rgba(124, 58, 237, 0.3));
}
.agreeTx { font-size: 11.5px; color: var(--tb-sub); line-height: 1.65; }

/* 主按钮：整条胶囊，TapTap 那种「一眼就知道点哪」的尺寸 */
.bigBtn {
  width: 100%; height: 52px;
  border: 0; border-radius: 26px; cursor: pointer;
  font-size: 16px; font-weight: 700; letter-spacing: 2px;
  color: #fff;
  background: linear-gradient(135deg, var(--tb-primary, #7c3aed), var(--tb-secondary, #ec4899));
  box-shadow: 0 12px 28px var(--tb-primary-ring, rgba(124, 58, 237, 0.34));
  transition: transform 0.2s, box-shadow 0.2s, filter 0.2s;
}
.bigBtn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 18px 36px var(--tb-primary-ring, rgba(124, 58, 237, 0.44));
}
.bigBtn:active:not(:disabled) { transform: translateY(0); filter: brightness(0.96); }
.bigBtn:disabled { opacity: 0.6; cursor: not-allowed; }

/* 第三方登录位 */
.oauthRow { display: flex; align-items: center; justify-content: center; gap: 18px; margin-top: 20px; }
.oauth {
  width: 44px; height: 44px; padding: 0;
  border: 1.5px solid var(--tb-border, rgba(124, 58, 237, 0.16));
  border-radius: 50%; cursor: pointer;
  background: var(--oc, #7c3aed);
  color: #fff; font-size: 17px; font-weight: 700;
  box-shadow: 0 8px 18px rgba(0, 0, 0, 0.14);
  transition: transform 0.2s, box-shadow 0.2s;
}
.oauth:hover { transform: translateY(-3px) scale(1.06); box-shadow: 0 14px 26px rgba(0, 0, 0, 0.22); }

.altRow { margin-top: 16px; text-align: center; }
.altRow button {
  border: 0; background: transparent; cursor: pointer; padding: 2px;
  font-size: 12.5px; color: var(--tb-sub); transition: 0.2s;
}
.altRow button:hover { color: var(--tb-primary); }

/* 密码强度条：三段独立圆角条居中排，右侧留固定宽度的文案，别让条随文字抖 */
.fld { margin-bottom: 15px; }
.lb {
  display: block; font-size: 12.5px; font-weight: 600;
  color: var(--tb-sub); margin-bottom: 7px;
}
.req {
  color: #ef4444;
  margin-left: 3px;
  font-weight: 700;
}
.meter { display: flex; align-items: center; gap: 8px; margin-top: 10px; }
.mTrack { flex: 1; display: flex; align-items: center; gap: 5px; }
.mTrack .seg {
  height: 5px; flex: 1; border-radius: 999px;
  background: rgba(124, 58, 237, 0.14);
  transition: 0.3s;
}
.mLabel { font-size: 11.5px; font-weight: 700; min-width: 34px; text-align: right; }

.safe {
  display: flex; align-items: center; gap: 6px;
  margin-top: 18px; padding-top: 13px;
  border-top: 1px dashed var(--tb-border);
  font-size: 11px; color: var(--tb-sub); line-height: 1.5;
}

.foot {
  position: relative; z-index: 2;
  display: flex; align-items: center; justify-content: center; gap: 14px;
  font-size: 12px; color: var(--tb-sub); padding-top: 6px;
}

/* —— 暗色 —— */
:global(html.dark) .glass { box-shadow: 0 26px 70px rgba(0, 0, 0, 0.6); }
:global(html.dark) .intro h1 { color: #fff; }

/* —— 响应式 —— */
@media (max-width: 1000px) {
  .stage { grid-template-columns: 1fr; gap: 24px; padding-top: 20px; }
  .intro { display: none; }
  .glass { max-width: 440px; width: 100%; margin: 0 auto; }
}
@media (max-width: 520px) {
  .auth { padding: 14px 14px 18px; }
  .brandT { font-size: 17px; }
  .glass { padding: 26px 20px 18px; border-radius: 22px; }
  .introStats { gap: 20px; }
  .phoneNum { font-size: 23px; }
  .qTitle { font-size: 20px; }
  .foot { flex-direction: column; gap: 4px; }
}
</style>
