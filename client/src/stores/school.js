import { defineStore } from 'pinia';
import request from '@/utils/request';
import FALLBACK_SCHOOLS from '@/config/schools';

// ── 校园切换（多租户）｜对应后端 routes/school.js GET /api/schools ＋ 各列表 school 隔离 ──
// 状态：学校列表 + 当前选中校区；当前校区持久化到 localStorage.tb_school，
// request.js 拦截器会自动把 school 带上下次请求，后端列表按 req.query.school 下推过滤。
export const useSchoolStore = defineStore('school', {
  state: () => ({
    // 学校列表：从 /api/schools 拉，或先用前端常量（见 fetchSchools 注释）
    schools: [],
    // 当前选中校区 id，刷新不丢。空串 = 未选（看后端是否要求必须带校区）
    currentId: localStorage.getItem('tb_school') || ''
  }),
  getters: {
    // 当前校区对象（下拉回填、顶栏显示用）
    current: (s) => s.schools.find((x) => x.id === s.currentId) || null,
    // 当前校区名（顶栏可显示，未选时给个兜底文案）
    currentName: (s) => s.schools.find((x) => x.id === s.currentId)?.name || '全部校区'
  },
  actions: {
    // 拉学校列表：后端 GET /api/schools（已写好，返回真实高校名单，支持 ?q / ?province）；
    // 后端没起/报错时回退到前端常量，下拉不至于空。data 形状：[{ id, name, province, city, region, level, logo }]
    async fetchSchools() {
      try {
        const data = await request.get('/schools'); // 响应拦截器已拆包，直接拿到 data 数组
        this.schools = data;
      } catch (e) {
        this.schools = FALLBACK_SCHOOLS; // 降级：用前端常量兜底
      }
      this.ensureValid(); // 拉完校验一下 currentId 是否还在列表里（学校下线等边界）
    },
    // 切换校区：更新 state + 持久化。request 拦截器会自动把 school 带上下次请求。
    // 注意：切换后当前页若已缓存旧校区数据，需要手动触发重新拉取（见 SchoolSwitcher onChange 注释）。
    setSchool(id) {
      this.currentId = id;
      localStorage.setItem('tb_school', id);
    },
    // 拉完列表后校验 currentId 是否还合法（学校被下线等边界），不合法则清空
    ensureValid() {
      if (this.currentId && !this.schools.some((x) => x.id === this.currentId)) {
        this.setSchool('');
      }
    }
  }
});
