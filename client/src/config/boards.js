// 板块 key → 中文名（图标/描述也一起放在这儿，各页共一份）
//
// 为什么需要它：后端帖子表里存的是 board_key（general / help / lost …），
// /community/boards 虽然返回了中文名，但只有社区页拉过那接口 —— 其他页面
// 拿到的就只有 key，直接渲染就成了英文（帖子详情顶部那个 general 标签）。
// 这里做一份静态字典，任何页面拿到 key 都能翻译成中文，不必再请求一次。
export const BOARD_NAME = {
  general: '综合灌水',
  secondhand: '二手闲置',
  study: '学习互助',
  lost: '失物招领',
  help: '求助问答',
  job: '校园兼职'
};

// 板块图标（社区页侧栏 / 热门板块那栏在用）
export const BOARD_ICON = {
  general: 'Comment',
  secondhand: 'Shop',
  study: 'Notebook',
  lost: 'MagicStick',
  help: 'ChatLineSquare',
  job: 'Briefcase'
};

// 板块一句话描述
export const BOARD_DESC = {
  general: '随便聊聊',
  secondhand: '毕业甩卖 / 好物转让',
  study: '学习互助',
  lost: '捡到 / 丢了啥',
  help: '问路 / 求推荐 / 找攻略',
  job: '校园兼职'
};

/**
 * 把 board_key 翻成中文名。
 * @param {string} key 板块 key（也可能已经是中文，直接原样返回）
 * @param {string} fallback 未知 key 时的兜底文案
 * @returns {string}
 */
export function boardName(key, fallback = '其他板块') {
  if (!key) return fallback;
  return BOARD_NAME[key] || key || fallback;
}