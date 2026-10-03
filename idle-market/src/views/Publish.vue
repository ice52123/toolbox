<template>
  <div>
    <!-- 子应用头部：与主站对齐的面包屑 -->
    <div class="sub-nav">
      <el-icon :size="20"><Shop /></el-icon>
      <span class="s1">闲置市场</span>
      <span class="sep">/</span>
      <span class="s2">发布闲置</span>
      <el-button class="cta" type="primary" plain size="small" @click="$router.push('/list')">
        逛一逛
      </el-button>
      <el-button size="small" @click="backToMain">返回主站</el-button>
    </div>

    <el-card class="tb" shadow="never">
      <h2>发布闲置</h2>
      <div class="strip">
        <el-icon :size="15"><InfoFilled /></el-icon>
        <span>实拍图 + 写清成色，同学更容易下单；第一张图会自动当封面。</span>
      </div>

      <div class="form">
        <!-- 商品图片：多选上传 + 预览 + 删除 -->
        <div class="field">
          <div class="lab"><i>*</i>商品图片</div>
          <div class="ctl">
            <div class="uploader">
              <div v-for="(img, i) in images" :key="img.uid" class="thumb">
                <el-image
                  :src="img.url"
                  :preview-src-list="images.map((x) => x.url)"
                  :initial-index="i"
                  fit="cover"
                  class="thumb-img"
                />
                <span class="del" @click="removeImg(img.uid)">
                  <el-icon :size="12"><Close /></el-icon>
                </span>
                <span v-if="i === 0" class="first">封面</span>
              </div>

              <label v-if="images.length < 6" class="add">
                <span class="plus"><el-icon :size="20"><Plus /></el-icon></span>
                <span class="t">上传图片</span>
                <span class="c">{{ images.length }}/6</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  hidden
                  @change="onPick"
                />
              </label>
            </div>
            <div class="tip">支持 JPG / PNG / WebP，单张 ≤ 5MB，最多 6 张</div>
          </div>
        </div>

        <div class="field">
          <div class="lab"><i>*</i>标题</div>
          <div class="ctl">
            <el-input
              v-model="f.title"
              maxlength="40"
              show-word-limit
              class="mi"
              placeholder="如：九成新 iPad Air 4 64G"
            />
          </div>
        </div>

        <div class="field">
          <div class="lab"><i>*</i>价格</div>
          <div class="ctl">
            <div class="price">
              <div class="stepper">
                <button class="step" type="button" :disabled="!f.price" @click="step(-10)">−</button>
                <input
                  class="num"
                  type="text"
                  inputmode="numeric"
                  :value="f.price"
                  @input="onPrice"
                  @blur="f.price = clampPrice(f.price)"
                />
                <button class="step" type="button" @click="step(10)">＋</button>
              </div>
              <span class="unit">元</span>
            </div>
          </div>
        </div>

        <div class="field">
          <div class="lab"><i>*</i>分类</div>
          <div class="ctl">
            <el-select v-model="f.cat" class="mi" placeholder="选分类">
              <el-option v-for="c in cats" :key="c" :label="c" :value="c" />
            </el-select>
          </div>
        </div>

        <div class="field">
          <div class="lab"><i>*</i>成色</div>
          <div class="ctl">
            <div class="seg">
              <button
                v-for="c in conds"
                :key="c"
                type="button"
                class="seg-i"
                :class="{ on: f.cond === c }"
                @click="f.cond = c"
              >
                {{ c }}
              </button>
            </div>
          </div>
        </div>

        <div class="field">
          <div class="lab">交易方式</div>
          <div class="ctl">
            <div class="ways">
              <button
                v-for="w in ways"
                :key="w"
                type="button"
                class="way"
                :class="{ on: f.ways[0] === w }"
                @click="pickWay(w)"
              >
                <span class="dot"></span>{{ w }}
              </button>
            </div>
          </div>
        </div>

        <div class="field">
          <div class="lab">自提点</div>
          <div class="ctl">
            <el-input
              v-model="f.place"
              maxlength="30"
              class="mi"
              :placeholder="pickup ? '如：校区3栋 / 食堂门口' : '选了自提或面交再填'"
              :disabled="!pickup"
            />
          </div>
        </div>

        <div class="field">
          <div class="lab"><i>*</i>描述</div>
          <div class="ctl">
            <el-input
              v-model="f.desc"
              type="textarea"
              :rows="4"
              maxlength="500"
              show-word-limit
              resize="none"
              placeholder="入手渠道、使用时长、成色细节、转手原因、是否可小刀…"
            />
          </div>
        </div>

        <div class="actions">
          <el-button class="btn-main" size="large" :loading="submitting" @click="submit">发布</el-button>
          <el-button class="btn-ghost" size="large" @click="reset">重置</el-button>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { Plus, Close, Shop, InfoFilled } from '@element-plus/icons-vue';
import { cats, saveItem, nextId } from '@/store';

const router = useRouter();

const conds = ['全新', '几乎全新', '九成新', '八成新', '七成新', '较旧'];
const ways = ['自提', '面交', '快递'];

const f = reactive({
  title: '',
  price: 0,
  cat: '数码',
  cond: '九成新',
  ways: ['自提'],
  place: '',
  desc: ''
});

const images = ref([]);
const submitting = ref(false);

const pickup = computed(() => f.ways.includes('自提') || f.ways.includes('面交'));

const totalSize = computed(() =>
  images.value.reduce((s, i) => s + Math.round((i.url.length * 3) / 4), 0)
);

function clampPrice(v) {
  const n = Number(v);
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.min(999999, Math.floor(n));
}

function onPrice(e) {
  const raw = e.target.value.replace(/[^\d.]/g, '');
  f.price = raw === '' ? 0 : clampPrice(parseFloat(raw));
  e.target.value = f.price;
}

function step(d) {
  f.price = clampPrice(f.price + d);
}

// 交易方式：单选（自提 / 面交 / 快递 只能选一种，选新的自动顶掉旧的）
function pickWay(w) {
  f.ways = [w];
}

function onPick(e) {
  const files = Array.from(e.target.files || []);
  e.target.value = ''; // 允许重复选同一张
  if (!files.length) return;

  const room = 6 - images.value.length;
  if (room <= 0) {
    ElMessage.warning('最多上传 6 张图片');
    return;
  }

  files
    .slice(0, room)
    .forEach((raw) => {
      if (!raw.type.startsWith('image/')) {
        ElMessage.warning(`「${raw.name}」不是图片`);
        return;
      }
      if (raw.size > 5 * 1024 * 1024) {
        ElMessage.warning(`「${raw.name}」超过 5MB，换一张小点的`);
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        images.value.push({ uid: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`, url: reader.result });
      };
      reader.readAsDataURL(raw);
    });
}

function removeImg(uid) {
  images.value = images.value.filter((i) => i.uid !== uid);
}

function reset() {
  Object.assign(f, { title: '', price: 0, cat: '数码', cond: '九成新', ways: ['自提'], place: '', desc: '' });
  images.value = [];
}

function submit() {
  if (!images.value.length) return ElMessage.warning('至少上传 1 张商品图片');
  if (!f.title.trim()) return ElMessage.warning('请填写标题');
  if (!(f.price > 0)) return ElMessage.warning('请填写价格');
  if (f.desc.trim().length < 10) return ElMessage.warning('描述至少 10 个字，写清成色和入手渠道更容易卖出');
  if (totalSize.value > 4 * 1024 * 1024) return warnSize();

  submitting.value = true;
  const item = {
    id: nextId(),
    title: f.title.trim(),
    price: f.price,
    cat: f.cat,
    cond: f.cond,
    ways: f.ways,
    place: pickup.value && f.place.trim() ? f.place.trim() : '待补充',
    owner: '我（本地）',
    desc: f.desc.trim(),
    images: images.value.map((i) => i.url),
    emoji: '🗂️',
    mine: true,
    createdAt: new Date().toISOString()
  };

  // TODO(P2)：换成 await api.post('/api/items', item)
  saveItem(item);
  submitting.value = false;
  ElMessage.success('发布成功，已加入列表');
  router.push('/list');
}

function warnSize() {
  ElMessage.warning('图片总大小接近本地存储上限（约 4MB），少传几张或压缩后再试');
}

function backToMain() {
  window.location.href = import.meta.env.VITE_MAIN_APP_URL || 'http://localhost:5173';
}
</script>

<style scoped>
.sub-nav {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 2px 12px;
  font-size: 15px;
}
.sub-nav .s1 { font-weight: 700; }
.sub-nav .s2 { color: #6b6480; }
.sub-nav .sep { color: #c7c3d6; }
.sub-nav .cta { margin-left: auto; margin-right: 8px; }

.tb {
  max-width: 720px;
  --line: rgba(124, 58, 237, 0.22);
  --brand: #7c3aed;
}

h2 { font-size: 20px; margin: 4px 0 0; }

.strip {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 12px 0 20px;
  padding: 11px 13px;
  font-size: 13px;
  line-height: 1.5;
  color: #4b4560;
  background: rgba(124, 58, 237, 0.05);
  border: 1px solid rgba(124, 58, 237, 0.12);
  border-radius: 12px;
}
.strip .el-icon { color: var(--brand); flex: none; }

.form { max-width: 560px; }

/* 统一的行栅格：左标签（右对齐，必填星号统一贴控件）+ 右控件，间距全程 18px */
.field {
  display: grid;
  grid-template-columns: 62px minmax(0, 1fr);
  gap: 12px;
  align-items: start;
  margin-bottom: 18px;
}
.lab {
  padding-top: 12px;
  text-align: right;
  font-size: 13.5px;
  color: #4b4560;
  line-height: 20px;
}
.lab i { color: #f04438; font-style: normal; margin-right: 4px; }
.ctl { min-width: 0; }

/* 统一控件：44px 高、12px 圆角、紫色聚焦 */
.mi { width: 100%; max-width: 420px; }
.tb :deep(.el-input__wrapper) {
  min-height: 44px;
  border-radius: 12px;
  box-shadow: 0 0 0 1px var(--line) inset;
  transition: 0.18s;
}
.tb :deep(.el-input__wrapper:hover) { box-shadow: 0 0 0 1px rgba(124, 58, 237, 0.45) inset; }
.tb :deep(.el-input__wrapper.is-focus) { box-shadow: 0 0 0 1.5px var(--brand) inset; }
.tb :deep(.el-input.is-disabled .el-input__wrapper) { background: #f7f6fb; box-shadow: 0 0 0 1px #ece9f4 inset; }
.tb :deep(.el-textarea__inner) {
  min-height: 104px;
  line-height: 1.65;
  border-radius: 12px;
  box-shadow: 0 0 0 1px var(--line) inset;
}
.tb :deep(.el-input__count) { bottom: 8px; right: 10px; }

/* 价格步进器 */
.price { display: flex; align-items: center; gap: 8px; }
.stepper {
  display: flex;
  align-items: stretch;
  width: 152px;
  height: 44px;
  border: 1px solid var(--line);
  border-radius: 12px;
  overflow: hidden;
  background: #fff;
  transition: 0.18s;
}
.stepper:focus-within { border-color: var(--brand); }
.step {
  width: 40px;
  border: 0;
  background: #f8f7fc;
  color: #5b5480;
  font-size: 17px;
  cursor: pointer;
  transition: 0.15s;
}
.step + .step { border-left: 1px solid #efeaf9; }
.step:hover:not(:disabled) { background: rgba(124, 58, 237, 0.1); color: var(--brand); }
.step:disabled { color: #c3bed4; cursor: not-allowed; }
.num {
  flex: 1;
  min-width: 0;
  border: 0;
  border-left: 1px solid #efeaf9;
  border-right: 1px solid #efeaf9;
  outline: none;
  text-align: center;
  font-size: 15px;
  font-weight: 700;
  color: #221f33;
  background: transparent;
}
.unit { font-size: 13px; color: #8b84a3; }

/* 成色：分段选择，选中整格高亮 */
.seg {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 6px;
  max-width: 420px;
}
.seg-i {
  height: 40px;
  padding: 0 2px;
  border-radius: 10px;
  border: 1px solid var(--line);
  background: #fff;
  color: #4b4560;
  font-size: 12.5px;
  white-space: nowrap;
  cursor: pointer;
  transition: 0.16s;
}
.seg-i:hover { border-color: rgba(124, 58, 237, 0.55); color: var(--brand); }
.seg-i.on {
  border-color: transparent;
  background: linear-gradient(135deg, #7c3aed, #9333ea);
  color: #fff;
  font-weight: 600;
  box-shadow: 0 4px 12px rgba(124, 58, 237, 0.28);
}

/* 交易方式：等分卡片 */
.ways { display: flex; gap: 8px; flex-wrap: wrap; }
.way {
  flex: 1 1 92px;
  height: 44px;
  border-radius: 12px;
  border: 1px solid var(--line);
  background: #fff;
  color: #4b4560;
  font-size: 13.5px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  cursor: pointer;
  transition: 0.16s;
}
.way .dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #cfcae0;
  transition: 0.16s;
}
.way:hover { border-color: rgba(124, 58, 237, 0.5); }
.way.on {
  border-color: var(--brand);
  background: rgba(124, 58, 237, 0.08);
  color: var(--brand);
  font-weight: 600;
}
.way.on .dot { background: var(--brand); box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.16); }

/* 上传区 */
/* 固定每行 4 格：1~4 张排成一行，5~6 张自然换到第二行，不会出现「一行 3 个一行 2 个」的错行 */
.uploader {
  display: grid;
  grid-template-columns: repeat(4, 104px);
  gap: 10px;
  align-content: start;
}
.thumb {
  position: relative;
  width: 104px;
  height: 104px;
  border-radius: 14px;
  overflow: hidden;
  border: 1px solid rgba(124, 58, 237, 0.18);
}
.thumb-img { width: 100%; height: 100%; }
.thumb :deep(.el-image__inner) { display: block; }
.thumb .del {
  position: absolute;
  top: 6px;
  right: 6px;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: rgba(34, 31, 51, 0.6);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: 0.16s;
}
.thumb .del:hover { background: #ef4444; }

.add {
  width: 104px;
  height: 104px;
  border: 1.5px dashed rgba(124, 58, 237, 0.45);
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.9);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 5px;
  cursor: pointer;
  transition: 0.18s;
}
.add:hover {
  border-color: var(--brand);
  background: rgba(124, 58, 237, 0.06);
  transform: translateY(-1px);
}
.add .plus {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: rgba(124, 58, 237, 0.12);
  color: var(--brand);
  display: flex;
  align-items: center;
  justify-content: center;
}
.add .t { font-size: 13px; font-weight: 600; color: #5b3f9e; }
.add .c { font-size: 11.5px; color: #8b84a3; }
.tip { margin-top: 9px; font-size: 12px; color: #8b84a3; line-height: 1.5; }

/* 底部按钮 */
.actions { display: flex; gap: 10px; }
:deep(.el-button) { border-radius: 12px; }
.btn-main {
  flex: 0 0 132px;
  background: linear-gradient(135deg, #7c3aed, #9333ea);
  border-color: transparent;
  font-weight: 600;
}
.btn-main:hover,
.btn-main:focus { background: linear-gradient(135deg, #7338e6, #8b2fe0); border-color: transparent; }
.btn-ghost {
  flex: 0 0 100px;
  color: #5b5480;
  background: #fff;
  border-color: var(--line);
}
.btn-ghost:hover { color: #4b4560; border-color: rgba(124, 58, 237, 0.45); background: #fff; }

@media (max-width: 900px) {
  .sub-nav { font-size: 14px; flex-wrap: wrap; }
  .sub-nav .cta { margin-left: 0; margin-right: 0; }
  .sub-nav .el-button { flex: 1; }
}

@media (max-width: 620px) {
  h2 { font-size: 18px; }
  .field { grid-template-columns: minmax(0, 1fr); gap: 7px; margin-bottom: 16px; }
  .lab { padding-top: 0; text-align: left; }
  .mi { max-width: 100%; }
  .seg { grid-template-columns: repeat(3, 1fr); }
  .stepper { width: 100%; }
  .uploader { grid-template-columns: repeat(3, 1fr); }
  .thumb, .add { width: auto; height: 92px; }
  .ways { gap: 7px; }
}
</style>
