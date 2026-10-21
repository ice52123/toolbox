// 列表分页的两个公共件：移动端判定 + 文档级滚动加载
//
// 为什么不用 el 的 v-infinite-scroll：那个指令要求「容器自身可滚动」，
// 而这个项目手机端/PC 端的滚动条都挂在 document 上（页面整体滚），
// 挂在普通 div 上永远不会触发。干脆监听 window scroll，距底部小于
// 阈值就回调，由页面自己的 loading / noMore 状态防重入。

import { ref, onMounted, onBeforeUnmount } from 'vue';

// 移动端判定：断点与各页媒体查询保持一致（默认 900px）
export function useIsMobile(breakpoint = 900) {
  const isMobile = ref(false);
  let mq = null;
  function onChg(e) {
    isMobile.value = e.matches;
  }
  onMounted(() => {
    mq = window.matchMedia('(max-width: ' + breakpoint + 'px)');
    isMobile.value = mq.matches;
    mq.addEventListener('change', onChg);
  });
  onBeforeUnmount(() => {
    if (mq) mq.removeEventListener('change', onChg);
  });
  return isMobile;
}

// 文档级滚动加载：enabled 为真且滚到距底 < distance 时调 cb。
// rAF 节流 + enabled 状态防抖，页面侧只需保证 busy 时 enabled 为假。
export function useInfiniteOnScroll(enabled, cb, distance = 240) {
  let ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      ticking = false;
      if (!enabled.value) return;
      const doc = document.documentElement;
      if (doc.scrollHeight - window.scrollY - window.innerHeight <= distance) cb();
    });
  }
  onMounted(() => window.addEventListener('scroll', onScroll, { passive: true }));
  onBeforeUnmount(() => window.removeEventListener('scroll', onScroll));
}
