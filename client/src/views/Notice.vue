<template>
  <div :class="s.np">
    <!-- 详情模式：/notice/n1 -->
    <template v-if="cur">
      <div :class="s.backBar">
        <el-button text :icon="ArrowLeft" @click="list">返回公告列表</el-button>
      </div>
      <div :class="s.detail">
        <el-tag size="small" effect="dark">{{ cur.tag }}</el-tag>
        <h2>{{ cur.title }}</h2>
        <div :class="s.meta">{{ cur.date }} · 校园集运营团队</div>
        <div :class="s.body">{{ cur.content }}</div>
      </div>
    </template>

    <!-- 列表模式 -->
    <template v-else>
      <div :class="s.secHead">
        <h3>公告中心</h3>
        <p>版本更新 · 社区动态 · 工具箱进展，一个地方看全</p>
      </div>
      <div :class="s.list">
        <div
          v-for="n in notices"
          :key="n.id"
          :class="s.item"
          @click="open(n.id)"
        >
          <div :class="s.iMain">
            <div :class="s.iTop">
              <el-tag size="small" type="primary" effect="plain">{{ n.tag }}</el-tag>
              <b :class="s.iTitle">{{ n.title }}</b>
            </div>
            <div :class="s.iMeta">{{ n.date }} · 校园集运营团队</div>
          </div>
          <el-icon :class="s.iGo" :size="15"><ArrowRight /></el-icon>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { computed, ref, onMounted, useCssModule } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ArrowLeft, ArrowRight } from '@element-plus/icons-vue';
import request from '@/utils/request';
// 共享原子类（CSS Modules）：s.card / s.row … 各页长得一样的外观都在这份里
import shared from '@/styles/ui.module.less';

// 一个句柄拿两类样式：ui.module.css 的共享原子类 + 本组件 @import '@/styles/mixins.less';
const s = { ...shared, ...useCssModule() };

const route = useRoute();
const router = useRouter();

// 公告中心：列表 + 详情都读 MySQL 后端 /home/notices（详情按 id 在内存里取）
const notices = ref([]);
const cur = computed(() => notices.value.find((n) => n.id === route.params.id) || null);
const list = () => router.push('/notice');
const open = (id) => router.push('/notice/' + id);

onMounted(async () => {
  try {
    notices.value = await request.get('/home/notices');
  } catch (e) {
    console.error('[ Notice ] 加载公告失败：', e);
  }
});
</script>
<style lang="less" module>@import '@/styles/mixins.less';
/* 只放「本页特有」的样式；卡片外观吃 ui.module.css，别重复抄一遍 */

.np { max-width: 860px; margin: 0 auto; }

.backBar { margin-bottom: 8px; }

/* 详情卡：卡片外观 composes 自 tb-card，这里只写本页的版式 */
.detail { composes: tb-card from global; padding: 26px 28px 24px; }
.detail h2 { margin: 14px 0 8px; font-size: 21px; line-height: 1.5; }
.detail .meta { font-size: 12.5px; color: var(--tb-sub); }
.detail .body {
  margin-top: 18px; padding-top: 16px;
  border-top: 1px dashed var(--tb-border);
  font-size: 14.5px; line-height: 1.9; white-space: pre-wrap;
}

.secHead { margin-bottom: 16px; }
.secHead h3 { margin: 0; font-size: 21px; }
.secHead p { margin: 6px 0 0; font-size: 13px; color: var(--tb-sub); }

.list { display: grid; gap: 12px; }
/* 公告条目：卡片外观 composes 自 tb-card */
.item { composes: tb-card from global; display: flex; align-items: center; gap: 14px; padding: 16px 18px; cursor: pointer; transition: 0.2s; }
.item:hover { transform: translateY(-2px); border-color: var(--tb-primary); }
.iMain { flex: 1; min-width: 0; }
.iTop { display: flex; align-items: center; gap: 9px; }
.iTitle {
  font-size: 14.5px; font-weight: 600;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.iMeta { font-size: 12px; color: var(--tb-sub); margin-top: 6px; }
.iGo { color: var(--tb-sub); flex: 0 0 auto; }
.item:hover .iGo { color: var(--tb-primary); }

@media (max-width: 900px) {
  .detail { padding: 20px 18px; }
  .detail h2 { font-size: 18px; }
  .iTitle { white-space: normal; }
  .item { padding: 14px 15px; }
}
</style>
