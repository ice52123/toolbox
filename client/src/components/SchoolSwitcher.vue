<template>
  <!-- 校园切换器：选完写 localStorage.tb_school，request 拦截器自动带 ?school=
       filterable：73+ 所学校下拉里直接敲字按名称搜，不用滚轮翻半天 -->
  <el-select
    v-model="schoolId"
    placeholder="选择你的校园"
    class="school-switcher"
    popper-class="school-pop"
    filterable
    no-data-text="没有匹配的校园"
    @change="onChange"
  >
    <template #prefix>
      <el-icon :size="16" class="sw-ico"><School /></el-icon>
    </template>
    <el-option
      v-for="sc in schools"
      :key="sc.id"
      :label="sc.name"
      :value="sc.id"
    >
      <span class="sw-opt">
        <span class="sw-dot" />
        <span class="sw-name">{{ sc.name }}</span>
        <span v-if="sc.province" class="sw-prov">{{ sc.province }}</span>
      </span>
    </el-option>
  </el-select>
</template>

<script setup>
import { computed, onMounted } from 'vue';
import { School } from '@element-plus/icons-vue';
import { useSchoolStore } from '@/stores/school';

const store = useSchoolStore();

// 列表来自 store：当前是前端常量兜底（config/schools.js），后端 /api/schools 实现后自动换数据源
const schools = computed(() => store.schools);

// 双向绑定当前校区：读 store.currentId，写时走 setSchool（持久化到 localStorage）
const schoolId = computed({
  get: () => store.currentId,
  set: (v) => store.setSchool(v)
});

function onChange(id) {
  store.setSchool(id);
  // TODO(你来实现): 切换后是否刷新当前页？
  // 后端各列表按 req.query.school 过滤，下次请求会自动带新 school；
  // 但当前页若已缓存旧校区数据（如首页 stats / 社区列表 / 闲置列表），需要手动重拉：
  //   - 简单：location.reload() 或 router.go(0)
  //   - 优雅：刷新对应 store 的列表 action（若列表数据走 pinia store 而非组件内直接 request）
}

// 首次进入拉学校列表（store 内部：常量兜底 → 后端实现后换 request.get('/schools')）
onMounted(() => {
  if (!store.schools.length) store.fetchSchools();
});
</script>

<style scoped>
/* 触发框：和登录面板里其他输入框同高同圆角，浅底 + 聚焦渐变描边 */
.school-switcher {
  width: 100%;
}
.school-switcher :global(.el-select__wrapper) {
  min-height: 44px;
  border-radius: 12px;
  padding: 4px 14px;
  background: rgba(124, 58, 237, 0.04);
  box-shadow: 0 0 0 1px var(--tb-border, rgba(124, 58, 237, 0.18)) inset;
  transition: box-shadow 0.2s, background 0.2s;
}
.school-switcher :global(.el-select__wrapper:hover) {
  background: rgba(124, 58, 237, 0.07);
  box-shadow: 0 0 0 1px var(--tb-primary, #7c3aed) inset;
}
.school-switcher :global(.el-select__wrapper.is-focused) {
  background: #fff;
  box-shadow:
    0 0 0 1px var(--tb-primary, #7c3aed) inset,
    0 0 0 4px var(--tb-primary-ring, rgba(124, 58, 237, 0.16));
}
.school-switcher :global(.el-select__placeholder) {
  color: var(--tb-sub, #94a3b8);
  font-size: 14px;
}
.school-switcher :global(.el-select__selected-item) {
  font-weight: 600;
  color: var(--tb-text, #1e293b);
}
/* 前缀校徽图标：默认淡，选中/悬停时亮主色 */
.sw-ico {
  color: var(--tb-sub, #94a3b8);
  transition: color 0.2s;
}
.school-switcher :global(.el-select__wrapper.is-focused) .sw-ico,
.school-switcher :global(.el-select__wrapper:hover) .sw-ico {
  color: var(--tb-primary, #7c3aed);
}

/* 选项行：名称 + 右侧省份小灰字，滚动找校时更好认 */
.sw-opt {
  display: flex;
  align-items: center;
  gap: 9px;
  width: 100%;
}
.sw-dot {
  flex: 0 0 7px;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--tb-primary, #7c3aed), var(--tb-secondary, #ec4899));
  opacity: 0.55;
  transition: opacity 0.2s, transform 0.2s;
}
.sw-name {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.sw-prov {
  flex: 0 0 auto;
  font-size: 11px;
  color: var(--tb-sub, #94a3b8);
}
</style>

<!-- 下拉面板挂在 body 下（teleported），样式必须全局 -->
<style>
.school-pop .el-select-dropdown__item {
  border-radius: 9px;
  margin: 2px 8px;
  padding: 0 10px;
  height: 36px;
  transition: background 0.15s;
}
.school-pop .el-select-dropdown__item:hover {
  background: rgba(124, 58, 237, 0.08);
}
.school-pop .el-select-dropdown__item.is-selected {
  color: var(--tb-primary, #7c3aed);
  font-weight: 700;
}
.school-pop .el-select-dropdown__item.is-selected .sw-dot {
  opacity: 1;
  transform: scale(1.25);
}
.school-pop .el-popper__arrow {
  display: none;
}
.school-pop.el-popper {
  border-radius: 14px;
  border: 1px solid rgba(124, 58, 237, 0.16);
  box-shadow: 0 18px 44px rgba(40, 20, 90, 0.18);
  padding: 6px 0;
}
</style>
