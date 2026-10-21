<template>
  <div :class="s.page">
    <div :class="s.bar">
      <div>
        <h2>收货地址</h2>
        <p :class="s.sub">选「快递寄送」时按这里的地址发货，闲置市场下单页可以直接选。</p>
      </div>
      <el-button v-if="!showForm" type="primary" @click="openNew">新增地址</el-button>
    </div>

    <!-- 新增 / 编辑地址：页内展开，不弹窗（点「新增」或某条「编辑」时出现） -->
    <div v-if="showForm" :class="[s.card, s.form]">
      <div :class="s.formTitle">{{ form.id ? '编辑地址' : '新增地址' }}</div>
      <el-form label-width="88px" @submit.prevent>
        <el-form-item label="收件人">
          <el-input v-model="form.name" maxlength="20" placeholder="姓名 / 昵称" />
        </el-form-item>
        <el-form-item label="手机号">
          <el-input v-model="form.phone" maxlength="11" placeholder="11 位手机号" />
        </el-form-item>
        <!-- 省 / 市 / 区三级联动：选好存成一行，下单页直接展示，不用再手打。
             桌面端用 el-cascader 的横向多列面板（一屏能并排看三级）；
             手机端那套面板会被视口裁掉（三列约 540px 宽，390px 屏幕只看得到两列），
             所以手机端换底部抽屉逐级下钻，见页面底部 el-drawer -->
        <el-form-item label="所在地区">
          <div :class="s.pcArea">
            <el-cascader
              v-model="regionPath"
              :options="areaOptions"
              :props="{ expandTrigger: 'hover' }"
              placeholder="省 / 市 / 区"
              filterable
              clearable
              popper-class="tb-area-pop"
              :class="s.area"
            />
          </div>
          <!-- 手机端入口：只是个打开抽屉的按钮，面板本身放到页面最外层 -->
          <button type="button" :class="s.mArea" @click="openArea">
            <span :class="[s.mAreaText, { [s.mAreaPh]: !regionPath.length }]">
              {{ regionPath.length ? regionPath.join(' / ') : '省 / 市 / 区' }}
            </span>
            <span :class="s.mAreaArrow">⌄</span>
          </button>
          <div v-if="legacyRegion" :class="s.hint">
            原地址「{{ legacyRegion }}」不是标准省市区，请重新选一次
          </div>
        </el-form-item>
        <el-form-item label="详细地址">
          <el-input
            v-model="form.detail"
            type="textarea"
            :rows="2"
            maxlength="60"
            show-word-limit
            placeholder="校区 + 宿舍楼栋 / 门牌号 / 快递驿站"
          />
        </el-form-item>
        <el-form-item label="设为默认">
          <el-switch v-model="form.isDefault" />
        </el-form-item>
      </el-form>
      <div :class="s.formOps">
        <el-button @click="showForm = false">取消</el-button>
        <el-button type="primary" @click="save">保存</el-button>
      </div>
    </div>

    <div :class="s.list">
      <div v-for="a in list" :key="a.id" :class="[s.card, s.item]">
        <div :class="s.main">
          <div :class="s.line1">
            <b :class="s.name">{{ a.name }}</b>
            <span :class="s.phone">{{ a.phone }}</span>
            <span v-if="a.isDefault" :class="[s.pill, s.pillOk]">默认</span>
          </div>
          <div :class="s.addr">{{ fmtAddress(a) }}</div>
        </div>
        <div :class="s.ops">
          <el-button text size="small" @click="openEdit(a)">编辑</el-button>
          <el-button v-if="!a.isDefault" text size="small" @click="makeDefault(a)">设为默认</el-button>
          <!-- 删除是破坏性操作，就地两步确认，不弹确认框挡住列表 -->
          <button v-if="delId !== a.id" type="button" :class="s.del" @click="delId = a.id">删除</button>
          <button v-else type="button" :class="[s.del, s.delOn]" @click="remove(a)">确认删除？</button>
        </div>
      </div>

      <div v-if="!list.length" :class="[s.card, s.empty]">
        <span :class="s.emptyIco">📍</span>
        <span :class="s.emptyText">还没有收货地址，先填一个，下单时就不用每次手打了</span>
        <button type="button" :class="s.btnSm" @click="openNew">新增地址</button>
      </div>
    </div>

    <!-- 手机端省市区选择：底部抽屉，一屏一层。
         el-cascader 的多列面板天生是给宽屏的：三级并排至少 540px，手机上必然被裁，
         所以手机端不套它 —— 顶部列出已选路径（点任一级回退重选），下面单列往下钻，
         390px 里永远不用横着拖，点完区/县自动收起 -->
    <el-drawer
      v-model="areaDrawer"
      direction="btt"
      size="78%"
      :with-header="false"
      append-to-body
      class="tb-area-drawer"
    >
      <div :class="s.dwHead">
        <span :class="s.dwTitle">请选择所在地区</span>
        <button type="button" :class="s.dwClose" @click="areaDrawer = false">✕</button>
      </div>

      <!-- 已选路径：显示到当前待选那一级为止，橙色那行就是下一步 -->
      <div :class="s.dwTrail">
        <template v-for="(lab, i) in AREA_LEVELS" :key="i">
          <span v-if="regionPath[i]" :class="s.trailItem" @click="goLevel(i)">
            {{ regionPath[i] }}<i :class="s.trailArrow">›</i>
          </span>
          <span v-else-if="i === areaLevel" :class="[s.trailItem, s.trailCur]">
            请选择{{ lab }}
          </span>
        </template>
      </div>

      <div :class="s.dwBody">
        <div :class="s.dwSec">选择{{ AREA_LEVELS[areaLevel] }}</div>
        <div ref="levelBox" :class="s.dwList">
          <button
            v-for="o in levelOptions"
            :key="o.value"
            type="button"
            :class="s.dwOpt"
            @click="pickArea(o)"
          >
            {{ o.label }}
            <span v-if="o.children && o.children.length" :class="s.dwOptArrow">›</span>
          </button>
          <div v-if="!levelOptions.length" :class="s.dwNone">这一级没有可选项，回上一级重选</div>
        </div>
      </div>
    </el-drawer>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted, useCssModule } from 'vue';
import { ElMessage } from 'element-plus';
// 省市区三级数据：value 就是中文名（广东省 / 深圳市 / 南山区），直接存文本
import { pcaTextArr } from 'element-china-area-data';
// 共享原子类（CSS Modules）：s.card / s.pill / s.pillOk 等外观都在这份里
import shared from '@/styles/ui.module.less';
import {
  listAddresses,
  saveAddress,
  removeAddress,
  setDefaultAddress,
  fmtAddress
} from '@/utils/address';

const s = { ...shared, ...useCssModule() };

const list = ref([]);
// 表单是否展开（页内，不再用弹窗）
const showForm = ref(false);
const delId = ref(null);
const form = reactive({ id: '', name: '', phone: '', region: '', detail: '', isDefault: false });
// 省市区联动的选中路径（['广东省','深圳市','南山区']），存库时拼成一行
const areaOptions = pcaTextArr;
const regionPath = ref([]);
// 老数据里的自由文本地区（曾经存的是学校 id），选了省市区之后就被替换掉
const legacyRegion = ref('');

// —— 手机端抽屉（桌面端走 el-cascader，这里只有窄屏用）——
// 三级依次是：省级 / 市级 / 区县，标题和面包屑提示都按这个顺序
const AREA_LEVELS = ['省份 / 地区', '城市', '区 / 县'];
const areaDrawer = ref(false);
const areaLevel = ref(0); // 当前在选第几级，0 = 省
const levelBox = ref(null); // 列表滚动容器，换级时归零
// 当前这一级的可选项：顺着已选的每一级往下钻，钻不到就给空
const levelOptions = computed(() => {
  let level = areaOptions;
  for (let i = 0; i < areaLevel.value; i++) {
    const hit = level.find((o) => o.value === regionPath.value[i]);
    if (!hit) return [];
    level = hit.children || [];
  }
  return level;
});
// 换级后列表回到顶部，否则从上一级的滚动位置接着看会以为漏了选项
watch(areaLevel, () => {
  if (levelBox.value) levelBox.value.scrollTop = 0;
});
// 打开时接着上次没选完的那一级，别每次都退回省份重来
function openArea() {
  areaLevel.value = Math.min(regionPath.value.length, 2);
  areaDrawer.value = true;
}
function pickArea(o) {
  regionPath.value = regionPath.value.slice(0, areaLevel.value).concat(o.value);
  // 区县没有下一级了，选完直接收起，别让用户多点一下×
  if (o.children && o.children.length && areaLevel.value < 2) areaLevel.value += 1;
  else areaDrawer.value = false;
}
// 面包屑点已选的某一级：回退到那级的下一级重选
function goLevel(i) {
  areaLevel.value = i + 1;
}

function reload() {
  list.value = listAddresses();
}

// 存的地区文本还原成联动路径：逐级校验，认不出来（如老的「sch001」）就返回空
function parseRegion(text) {
  const parts = String(text || '')
    .split(/\s*[\/·、,，>]\s*/)
    .filter(Boolean);
  const path = [];
  let level = areaOptions;
  for (const p of parts) {
    const hit = level.find((o) => o.value === p);
    if (!hit) return [];
    path.push(hit.value);
    level = hit.children || [];
  }
  return path;
}

function openNew() {
  Object.assign(form, {
    id: '',
    name: '',
    phone: '',
    region: '',
    detail: '',
    // 第一条地址自动成为默认
    isDefault: !list.value.length
  });
  regionPath.value = [];
  legacyRegion.value = '';
  showForm.value = true;
}

function openEdit(a) {
  Object.assign(form, a);
  regionPath.value = parseRegion(a.region);
  legacyRegion.value = a.region && !regionPath.value.length ? a.region : '';
  showForm.value = true;
}

function save() {
  if (!form.name.trim()) return ElMessage.warning('请填写收件人');
  if (!/^1\d{10}$/.test(form.phone.trim())) return ElMessage.warning('手机号要是 11 位数字');
  if (!regionPath.value.length) return ElMessage.warning('请选择所在地区（省 / 市 / 区）');
  if (!form.detail.trim()) return ElMessage.warning('请填写详细地址');
  saveAddress({
    ...form,
    name: form.name.trim(),
    phone: form.phone.trim(),
    // 三级拼成一行，列表和下单页直接展示
    region: regionPath.value.join(' / '),
    detail: form.detail.trim()
  });
  showForm.value = false;
  reload();
  ElMessage.success('已保存');
}

function makeDefault(a) {
  setDefaultAddress(a.id);
  reload();
  ElMessage.success('已设为默认地址');
}

function remove(a) {
  removeAddress(a.id);
  delId.value = null;
  reload();
  ElMessage.success('已删除');
}

onMounted(reload);
</script>

<style lang="less" module>
@import '@/styles/mixins.less';

.page { width: 100%; }
.bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 14px;
  flex-wrap: wrap;
}
.bar h2 { margin: 0; font-size: 22px; }
.sub { margin: 6px 0 0; color: var(--tb-sub); font-size: 13px; }

/* 页内地址表单（替代原来的弹窗） */
.form { padding: 18px; margin-bottom: 14px; }
.formTitle { font-size: 15px; font-weight: 700; margin-bottom: 14px; }
.formOps { display: flex; justify-content: flex-end; gap: 10px; }
/* 省市区联动撑满表单宽度 */
.area { width: 100%; }
.hint {
  width: 100%;
  margin-top: 6px;
  color: var(--tb-sub);
  font-size: 12px;
  line-height: 1.5;
}

.list { display: flex; flex-direction: column; gap: 12px; }
.item { display: flex; align-items: center; gap: 14px; padding: 14px 18px; }
.main { flex: 1; min-width: 0; }
.line1 { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.name { font-size: 15px; }
.phone { color: var(--tb-sub); font-size: 13px; }
.addr { margin-top: 6px; color: var(--tb-sub); font-size: 13px; line-height: 1.5; }
.ops { display: flex; align-items: center; gap: 4px; flex: none; }
/* 删除按钮与 el-button text size="small" 同高，并排才不参差 */
.del {
  height: 32px;
  padding: 0 12px;
  border: 1px solid var(--tb-line);
  border-radius: @r-sm;
  background: transparent;
  color: var(--tb-sub);
  font-size: 12.5px;
  font-weight: 600;
  cursor: pointer;
  transition: 0.18s;
}
.del:hover { color: var(--tb-danger); border-color: rgba(244, 63, 94, 0.45); }
.delOn {
  color: var(--tb-danger);
  border-color: var(--tb-danger);
  background: rgba(244, 63, 94, 0.08);
}

.empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 34px 18px;
}
.emptyIco { font-size: 34px; }
.emptyText { color: var(--tb-sub); font-size: 13px; text-align: center; }
.btnSm {
  height: 32px;
  padding: 0 16px;
  border: 0;
  border-radius: @r-sm;
  background: var(--tb-primary);
  color: #fff;
  font-size: 12.5px;
  font-weight: 600;
  cursor: pointer;
}

/* 省市区：桌面是 el-cascader 的多列面板，手机换成底部抽屉（模板里两个入口互斥显示） */
.pcArea { width: 100%; }
.mArea { display: none; }
/* 桌面端面板保护：整体不许超出视口，超长地名（如「内蒙古自治区」）省略，别把面板撑出屏幕。
   必须写 :global —— popper 被 teleport 到 body，不在组件的模块作用域里 */
:global(.tb-area-pop.el-cascader__dropdown) {
  max-width: calc(100vw - 24px);
}
:global(.tb-area-pop .el-cascader-menu) { min-width: 0; flex: 1 1 0; }
:global(.tb-area-pop .el-cascader-node__label) {
  padding: 0 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.m-sm({
  .pcArea { display: none; }
  /* 手机端入口：长得像 el-input，点开是抽屉，不是 cascader */
  .mArea {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    width: 100%;
    height: 40px;
    padding: 0 12px;
    border: 1px solid var(--tb-line);
    border-radius: @r-sm;
    background: var(--tb-surface, transparent);
    color: var(--tb-text);
    font-family: inherit;
    font-size: 14px;
    text-align: left;
    cursor: pointer;
  }
  .mAreaText {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .mAreaPh { color: var(--tb-sub); }
  .mAreaArrow { flex: none; color: var(--tb-sub); font-size: 13px; }
});

/* —— 手机端抽屉：一屏一层，列表自己滚 —— */
.dwHead {
  flex: none;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px 10px;
}
.dwTitle { font-size: 16px; font-weight: 700; }
.dwClose {
  width: 30px;
  height: 30px;
  border: 0;
  background: transparent;
  color: var(--tb-sub);
  font-size: 15px;
  cursor: pointer;
}

/* 已选路径：竖排三格，选中的可点回去改，下一级用主题色提示「该我了」 */
.dwTrail {
  flex: none;
  display: flex;
  flex-direction: column;
  padding: 4px 16px 12px;
  border-bottom: 1px solid var(--tb-line-soft);
}
.trailItem {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 9px 0;
  font-size: 14.5px;
  cursor: pointer;
}
.trailArrow { color: var(--tb-sub); font-style: normal; }
.trailCur { color: var(--tb-primary); cursor: default; }

.dwBody { flex: 1; min-height: 0; display: flex; flex-direction: column; }
.dwSec {
  flex: none;
  padding: 12px 16px 6px;
  font-size: 13px;
  font-weight: 700;
}
.dwList {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  padding: 0 16px 16px;
}
.dwOpt {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  width: 100%;
  padding: 12px 4px;
  border: 0;
  border-bottom: 1px solid var(--tb-line-soft);
  background: transparent;
  color: var(--tb-text);
  font-family: inherit;
  font-size: 14.5px;
  text-align: left;
  cursor: pointer;
}
.dwOpt:active { background: var(--tb-primary-soft); }
.dwOptArrow { flex: none; color: var(--tb-sub); }
.dwNone { padding: 18px 4px; color: var(--tb-sub); font-size: 13px; }

/* 抽屉默认给了一身 padding / 滚动，这里换成头部 + 列表两段固定布局 */
:global(.tb-area-drawer .el-drawer__body) {
  display: flex;
  flex-direction: column;
  padding: 0;
  overflow: hidden;
}
</style>
