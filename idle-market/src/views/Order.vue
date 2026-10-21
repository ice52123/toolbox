<template>
  <el-card shadow="never" v-loading="loading">
    <el-button text :icon="ArrowLeft" @click="$router.push('/detail/' + goodsId)">返回详情</el-button>

    <el-result
      v-if="err"
      icon="warning"
      title="这件闲置没拉到"
      :sub-title="err"
    >
      <template #extra>
        <el-button type="primary" @click="$router.push('/list')">回列表</el-button>
      </template>
    </el-result>

    <div v-else-if="g" class="o">
      <div class="goods">
        <div class="thumb">
          <el-image v-if="g.images.length" :src="g.images[0]" fit="cover" />
          <div v-else class="thumb ph">{{ emojiOf(g.cat) }}</div>
        </div>
        <div class="ginfo">
          <h3>{{ g.title }}</h3>
          <div class="price">¥{{ g.price }}</div>
          <div class="meta">{{ g.owner }} · {{ g.cond || '成色未填' }} · {{ g.place || '自提点待定' }}</div>
        </div>
      </div>

      <!-- 担保交易：把「付了钱卖家不发货」这个最现实的顾虑先说清楚 -->
      <div class="tip">
        <span class="tip-icon">🛡️</span>
        <div class="tip-text">
          <b>担保交易</b>
          <p>付款后货款由平台托管，卖家发货、你确认收货之后才会打款给卖家；卖家不发货可随时申请退款。</p>
        </div>
      </div>

      <el-divider content-position="left">交易方式</el-divider>

      <el-radio-group v-model="way" class="ways">
        <el-radio-button v-for="w in wayOptions" :key="w.value" :label="w.value">
          {{ w.label }}
        </el-radio-button>
      </el-radio-group>
      <div class="way-hint">{{ currentWayHint }}</div>

      <!-- 快递寄送：地址只在主站「我的 → 收货地址」里维护，这里只选不填 -->
      <div v-if="way === '快递寄送'" class="row col addr">
        <div class="addr-head">
          <span class="label">收货地址</span>
          <el-button
            v-if="addresses.length"
            text
            type="primary"
            size="small"
            @click="goMain('/me/address')"
          >
            管理地址
          </el-button>
        </div>

        <!-- 主站已经填过：选一条就行，不用在这儿重复打字 -->
        <div v-if="addresses.length" class="picks">
          <button
            v-for="a in addresses"
            :key="a.id"
            type="button"
            class="pick"
            :class="{ on: a.id === pickedId }"
            @click="pickedId = a.id"
          >
            <span class="pick-body">
              <span class="pick-top">
                <b>{{ a.name }}</b>
                <em>{{ a.phone }}</em>
                <i v-if="a.isDefault" class="pick-tag">默认</i>
              </span>
              <span class="pick-addr">{{ fmtAddress(a) }}</span>
            </span>
            <span class="pick-dot" />
          </button>
        </div>

        <!-- 主站还没填过：别让人在这儿手打，直接引导去填 -->
        <div v-else class="addr-empty">
          <span class="ae-icon">📍</span>
          <div class="ae-text">
            <b>还没有收货地址</b>
            <p>收货地址统一在主站「我的 → 收货地址」里维护，填好回来选一条就行。</p>
          </div>
          <el-button type="primary" size="small" @click="goMain('/me/address')">
            去填地址
          </el-button>
        </div>

        <div class="addr-tip">
          地址在主站「我的 → 收货地址」里统一维护；要改地址请回主站改，这里只做选择。
        </div>
      </div>

      <div class="row col">
        <span class="label">留言给卖家</span>
        <el-input
          v-model="note"
          type="textarea"
          :rows="3"
          maxlength="100"
          show-word-limit
          placeholder="约面交的时间地点，或想对卖家说的话（选填）"
        />
      </div>

      <div class="total">
        <span>合计</span>
        <strong>¥{{ total }}</strong>
      </div>

      <el-button type="success" size="large" class="submit" :loading="submitting" @click="submit">
        提交订单
      </el-button>
    </div>
  </el-card>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ArrowLeft } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import { emojiOf } from '@/store';
import { api, mapGoods, isLogin, createOrder, myOrderOf, goMain } from '@/api';
// 收货地址由主站「我的 → 收货地址」维护，子应用只读（同一个 localStorage）
import { listAddresses, defaultAddress, fmtAddress } from '@/address';

const route = useRoute();
const router = useRouter();
const goodsId = route.params.goodsId;

const loading = ref(true);
const err = ref('');
const g = ref(null);

const way = ref('当面交易');
const note = ref('');
const submitting = ref(false);

// 收货地址：只有「快递寄送」用得上。地址簿来自主站（我的 → 收货地址），这里只选不填
const addresses = ref([]);
const pickedId = ref('');
const picked = computed(() => addresses.value.find((a) => a.id === pickedId.value) || null);

// 闲置是单件商品，只有「怎么交货」这一个选择：当面交易 or 快递寄送
const wayOptions = [
  { value: '当面交易', label: '当面交易' },
  { value: '快递寄送', label: '快递寄送' }
];
const WAY_HINT = {
  当面交易: '和卖家约好时间地点线下验货、当面付款交货',
  快递寄送: '卖家发货到你填的地址，收到货再确认收货'
};
const currentWayHint = computed(() => WAY_HINT[way.value] || '');

const total = computed(() => (g.value ? Number(Number(g.value.price).toFixed(2)) : 0));

async function load() {
  loading.value = true;
  err.value = '';
  try {
    g.value = mapGoods(await api.get('/goods/' + goodsId));
    // 已经下过单（未取消/未退款）就别让人下第二次，直接带去订单详情。
    // 用 replace 而不是 push：把下单页从历史里顶掉，之后返回不会再回到这里。
    const exist = myOrderOf(g.value.id);
    if (exist) {
      ElMessage.info('你已经下过单了，带你去订单详情');
      router.replace('/order/detail/' + exist);
      return;
    }
    // 卖家只标了「快递」这一种方式时默认选快递，否则默认当面交易
    const ws = g.value.ways || [];
    const onlyExpress = ws.includes('快递') && !ws.includes('面交') && !ws.includes('自提');
    way.value = onlyExpress ? '快递寄送' : '当面交易';
    // 地址簿非空就默认选上默认地址，省得每次手点
    addresses.value = listAddresses();
    const def = defaultAddress();
    if (def) pickedId.value = def.id;
  } catch (e) {
    err.value = e.message || '加载失败';
  } finally {
    loading.value = false;
  }
}

async function submit() {
  if (!isLogin()) return ElMessage.warning('登录后才能下单');
  if (g.value.mine) return ElMessage.warning('不能购买自己发布的闲置');
  // 双保险：页面被前进/后退还原成旧状态时，仍可能停在「还能提交」的画面上
  const exist = myOrderOf(g.value.id);
  if (exist) {
    ElMessage.warning('你已经下过单了');
    router.replace('/order/detail/' + exist);
    return;
  }
  // 快递寄送必须选一条收货地址，否则卖家不知道寄给谁
  let address = null;
  if (way.value === '快递寄送') {
    if (!addresses.value.length) {
      return ElMessage.warning('先去主站「我的 → 收货地址」填一个收货地址');
    }
    if (!picked.value) return ElMessage.warning('请选择一个收货地址');
    address = {
      name: picked.value.name,
      phone: picked.value.phone,
      detail: fmtAddress(picked.value)
    };
  }
  submitting.value = true;
  try {
    const order = await createOrder(g.value, { way: way.value, note: note.value, address });
    ElMessage.success('订单已提交，请尽快付款');
    // 下完单跳订单详情页，在那里付款 / 看物流
    router.push('/order/detail/' + order.id);
  } catch (e) {
    ElMessage.error(e.message || '下单失败');
  } finally {
    submitting.value = false;
  }
}

onMounted(load);
</script>

<style scoped>
.o { padding: 10px 0; }
/* 收货信息：三个输入框竖排，间距跟留言框保持一致 */
.addr { gap: 10px; }
.addr-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
/* 地址选择：整条可点，右侧圆点标选中，比下拉框一眼看得清 */
.picks { display: flex; flex-direction: column; gap: 8px; }
.pick {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  text-align: left;
  padding: 10px 12px;
  background: var(--im-surface);
  border: 1px solid var(--im-line);
  border-radius: 12px;
  font: inherit;
  cursor: pointer;
  transition: border-color 0.18s, background 0.18s;
}
.pick:hover { border-color: var(--im-brand); }
.pick.on { border-color: var(--im-brand); background: var(--im-tint); }
.pick-body { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 3px; }
.pick-top { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.pick-top b { color: var(--im-fg); font-size: 14px; }
.pick-top em { color: var(--im-fg-soft); font-size: 13px; font-style: normal; }
.pick-tag {
  font-style: normal;
  font-size: 11px;
  color: var(--im-brand);
  border: 1px solid currentColor;
  border-radius: 4px;
  padding: 0 4px;
}
.pick-addr { color: var(--im-fg-soft); font-size: 12.5px; line-height: 1.5; }
.pick-dot {
  flex: none;
  position: relative;
  width: 16px;
  height: 16px;
  border: 1.5px solid var(--im-line);
  border-radius: 50%;
}
.pick.on .pick-dot { border-color: var(--im-brand); }
.pick.on .pick-dot::after {
  content: '';
  position: absolute;
  inset: 3px;
  border-radius: 50%;
  background: var(--im-brand);
}
/* 主站没填地址：把人引过去填，不在这儿手打 */
.addr-empty {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px;
  background: var(--im-tint);
  border: 1px dashed var(--im-line);
  border-radius: 12px;
}
.ae-icon { font-size: 18px; }
.ae-text { flex: 1; min-width: 0; }
.ae-text b { color: var(--im-fg); font-size: 13.5px; }
.ae-text p { margin: 3px 0 0; color: var(--im-fg-mute); font-size: 12px; line-height: 1.5; }
.addr-tip { color: var(--im-fg-mute); font-size: 12px; line-height: 1.5; }
.goods {
  display: flex;
  gap: 14px;
  align-items: center;
  background: var(--im-surface);
  border: 1px solid var(--im-line);
  border-radius: 14px;
  padding: 14px;
}
.thumb {
  width: 84px;
  height: 84px;
  flex: none;
  border-radius: 12px;
  overflow: hidden;
  background: var(--im-tint);
}
.thumb :deep(img) { width: 100%; height: 100%; }
.thumb.ph {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 40px;
}
.ginfo { min-width: 0; }
.ginfo h3 { margin: 0 0 6px; font-size: 16px; color: var(--im-fg); }
.price { color: var(--im-brand); font-weight: 800; font-size: 20px; }
.meta { color: var(--im-fg-soft); font-size: 13px; margin-top: 4px; }

/* 担保交易说明条 */
.tip {
  display: flex;
  gap: 10px;
  align-items: flex-start;
  margin-top: 14px;
  padding: 12px 14px;
  background: var(--im-tint);
  border: 1px solid var(--im-line);
  border-radius: 12px;
}
.tip-icon { font-size: 18px; line-height: 1.4; }
.tip-text b { color: var(--im-fg); font-size: 14px; }
.tip-text p {
  margin: 4px 0 0;
  color: var(--im-fg-soft);
  font-size: 12.5px;
  line-height: 1.6;
}

.ways { margin-top: 4px; }
.way-hint {
  margin-top: 8px;
  color: var(--im-fg-mute);
  font-size: 12.5px;
}
.row { margin-top: 16px; }
.row.col { display: flex; flex-direction: column; gap: 8px; }
.label { color: var(--im-fg-soft); font-size: 14px; }
.total {
  display: flex;
  align-items: baseline;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 20px;
  color: var(--im-fg-soft);
}
.total strong { color: var(--im-brand); font-size: 26px; }
.submit { width: 100%; margin-top: 18px; }

@media (max-width: 900px) {
  .ginfo h3 { font-size: 15px; }
  .price { font-size: 18px; }
  .label { font-size: 13px; }
  .total strong { font-size: 22px; }
}
</style>
