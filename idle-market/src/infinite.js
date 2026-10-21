// 子应用自己的一份滚动分页公共件（不依赖主站的 @/utils/infinite，独立跑也能用）
//
// 为什么不用 el 的 v-infinite-scroll：它要求「容器自身可滚动」，而内嵌（qiankun）
// 时滚动条挂在主站 document 上，挂在普通 div 上永远不会触发。监听 window scroll
// 两种形态（独立/内嵌）都成立，距底部小于阈值就回调，页面自己拿 loading 防重入。

import { ref, onMounted, onBeforeUnmount } from 'vue';

// 移动端判定：断点与页面媒体查询保持一致（900px）
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
