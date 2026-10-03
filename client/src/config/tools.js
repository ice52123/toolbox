// 工具注册表：新增工具 = 写一个 Vue 组件 + 在这里加一条。
// 这是整个项目最核心的扩展点，照着 json/timestamp/base64 三个示例填即可。

export const categories = [
  { key: 'all', name: '全部工具', icon: 'Grid' },
  { key: 'text', name: '文本/编码', icon: 'Document' },
  { key: 'image', name: '图片处理', icon: 'Picture' },
  { key: 'doc', name: '文档', icon: 'Files' },
  { key: 'util', name: '实用工具', icon: 'Tools' },
  { key: 'life', name: '生活便民', icon: 'House' }
];

// comp 用动态 import 懒加载，避免一次性打包所有工具
export const tools = [
  // —— 已完成的示例（纯前端，零后端依赖）——
  { id: 'json', name: 'JSON 格式化', cat: 'text', icon: 'MagicStick', desc: '格式化 / 压缩 / 校验 JSON', comp: () => import('@/tools/JsonFormat.vue') },
  { id: 'timestamp', name: '时间戳转换', cat: 'text', icon: 'Clock', desc: '时间戳与日期互转', comp: () => import('@/tools/Timestamp.vue') },
  { id: 'base64', name: 'Base64 编解码', cat: 'text', icon: 'Key', desc: '文本 Base64 编解码', comp: () => import('@/tools/Base64.vue') },

  // —— 文本/编码（纯前端）——
  { id: 'hash', name: '哈希计算', cat: 'text', icon: 'Lock', desc: 'MD5 / SHA1 / SHA256', comp: () => import('@/tools/Hash.vue') },
  { id: 'radix', name: '进制转换', cat: 'text', icon: 'Switch', desc: '2 / 8 / 10 / 16 进制', comp: () => import('@/tools/Radix.vue') },
  { id: 'regex', name: '正则测试', cat: 'text', icon: 'Search', desc: '在线正则匹配测试', comp: () => import('@/tools/Regex.vue') },
  { id: 'jwt', name: 'JWT 解析', cat: 'text', icon: 'Postcard', desc: '解析 JWT 三段', comp: () => import('@/tools/Jwt.vue') },

  // —— 图片处理：走浏览器 Canvas，不落后端（sharp 未安装时后端路由必 500）——
  { id: 'image-compress', name: '图片压缩', cat: 'image', icon: 'Picture', desc: '压缩图片体积', comp: () => import('@/tools/ImageCompress.vue') },
  { id: 'image-convert', name: '格式转换', cat: 'image', icon: 'Refresh', desc: 'PNG/JPG/WebP 互转', comp: () => import('@/tools/ImageConvert.vue') },
  { id: 'image-watermark', name: '图片水印', cat: 'image', icon: 'Brush', desc: '添加文字/图片水印', comp: () => import('@/tools/ImageWatermark.vue') },

  // —— 文档：pdf-lib 前端处理，同样绕开后端 ——
  { id: 'pdf-merge', name: 'PDF 合并', cat: 'doc', icon: 'Files', desc: '多份 PDF 合并为一份', comp: () => import('@/tools/PdfMerge.vue') },
  { id: 'pdf-split', name: 'PDF 拆分', cat: 'doc', icon: 'Scissor', desc: '按页拆分 PDF', comp: () => import('@/tools/PdfSplit.vue') },

  // —— 实用工具（纯前端）——
  { id: 'password', name: '密码生成', cat: 'util', icon: 'Key', desc: '随机强密码生成', comp: () => import('@/tools/Password.vue') },
  { id: 'uuid', name: 'UUID 生成', cat: 'util', icon: 'Postcard', desc: '批量生成 UUID', comp: () => import('@/tools/Uuid.vue') },
  { id: 'color', name: '颜色转换', cat: 'util', icon: 'Brush', desc: 'HEX / RGB / HSL 互转', comp: () => import('@/tools/Color.vue') },
  { id: 'unit', name: '单位换算', cat: 'util', icon: 'ScaleToOriginal', desc: '长度 / 重量 / 温度', comp: () => import('@/tools/Unit.vue') },

  // —— 生活便民（新增分类）：全民高频，不挑职业 ——
  { id: 'calendar', name: '万年历', cat: 'life', icon: 'Calendar', desc: '农历 / 节气 / 节日查询', comp: () => import('@/tools/Calendar.vue') },
  { id: 'exchange', name: '汇率换算', cat: 'life', icon: 'Money', desc: '实时货币汇率换算', comp: () => import('@/tools/Exchange.vue') },
  { id: 'weather', name: '天气预报', cat: 'life', icon: 'Sunny', desc: '查询城市天气与预报', comp: () => import('@/tools/Weather.vue') },
  { id: 'express', name: '快递查询', cat: 'life', icon: 'Van', desc: '快递单号物流跟踪', comp: () => import('@/tools/Express.vue') },
  // 注意：element-plus 图标库里没有 'Oil'，用 'Coin' 代替，否则该卡片图标会是空白方块
  { id: 'oil', name: '今日油价', cat: 'life', icon: 'Coin', desc: '全国油价查询', comp: () => import('@/tools/Oil.vue') },
  { id: 'bus', name: '公交查询', cat: 'life', icon: 'Promotion', desc: '公交 / 地铁线路查询', comp: () => import('@/tools/Bus.vue') }
  // 注：闲置市场是子应用（qiankun /m/idle），已进顶部导航，不再在工具九宫格里放卡片
];

export function getTool(id) {
  return tools.find((t) => t.id === id);
}
