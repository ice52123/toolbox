// ── 校园切换器 · 学校列表（前端常量版）──
// 为什么有这份常量：后端 GET /api/schools 还是 501 占位（接口实现归小喵写），
// 先用它把下拉撑起来，联调和样式都能走通。
//
// 后端 /api/schools 实现后怎么换：
//   stores/school.js 的 fetchSchools 里把 FALLBACK_SCHOOLS 换成 request.get('/schools') 即可
//   （期望 data 形状和这里一致：[{ id, name, logo?, region? }]，id 存 localStorage.tb_school）
export const FALLBACK_SCHOOLS = [
  { id: 'sch001', name: '华南理工大学', region: '广州' },
  { id: 'sch002', name: '中山大学', region: '广州' },
  { id: 'sch003', name: '华南师范大学', region: '广州' },
  { id: 'sch004', name: '广东工业大学', region: '广州' },
  { id: 'sch005', name: '深圳大学', region: '深圳' },
  { id: 'sch006', name: '暨南大学', region: '广州' },
  { id: 'sch007', name: '华南农业大学', region: '广州' },
  { id: 'sch008', name: '南方科技大学', region: '深圳' }
];

export default FALLBACK_SCHOOLS;
