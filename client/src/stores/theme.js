import { defineStore } from 'pinia';
import { accentPresets, getAccent, mix, rgba } from '@/config/theme';

// 主题：亮/暗 + 主色（accent）两套维度，都落到 CSS 变量上，刷新不丢。
// 关键点是 apply() 里同时写 --tb-*（本项目自己的）和 --el-color-*（Element Plus），
// 否则只换主色、按钮还是紫的，看着就像没生效。
export const useThemeStore = defineStore('theme', {
  state: () => ({
    dark: localStorage.getItem('tb_dark') === '1',
    accent: localStorage.getItem('tb_accent') || 'violet'
  }),
  getters: {
    presets: () => accentPresets,
    preset: (s) => getAccent(s.accent)
  },
  actions: {
    toggle() {
      this.dark = !this.dark;
      localStorage.setItem('tb_dark', this.dark ? '1' : '0');
      this.apply();
    },
    setDark(v) {
      this.dark = !!v;
      localStorage.setItem('tb_dark', this.dark ? '1' : '0');
      this.apply();
    },
    setAccent(key) {
      if (!accentPresets.some((p) => p.key === key)) return;
      this.accent = key;
      localStorage.setItem('tb_accent', key);
      this.apply();
    },
    apply() {
      if (typeof document === 'undefined') return;
      const p = getAccent(this.accent);
      const root = document.documentElement;
      root.classList.toggle('dark', this.dark);

      root.style.setProperty('--tb-primary', p.primary);
      root.style.setProperty('--tb-secondary', p.secondary);
      root.style.setProperty('--tb-primary-soft', rgba(p.primary, 0.14));
      root.style.setProperty('--tb-primary-soft-2', rgba(p.primary, 0.08));
      root.style.setProperty('--tb-primary-ring', rgba(p.primary, 0.32));

      // Element Plus 派生色：light-N 一律是「向白混」，和官方语义一致
      root.style.setProperty('--el-color-primary', p.primary);
      root.style.setProperty('--el-color-primary-light-3', mix('#ffffff', p.primary, 0.7));
      root.style.setProperty('--el-color-primary-light-5', mix('#ffffff', p.primary, 0.5));
      root.style.setProperty('--el-color-primary-light-7', mix('#ffffff', p.primary, 0.3));
      root.style.setProperty('--el-color-primary-light-8', mix('#ffffff', p.primary, 0.18));
      root.style.setProperty('--el-color-primary-light-9', mix('#ffffff', p.primary, 0.08));
      root.style.setProperty('--el-color-primary-dark-2', mix(p.primary, '#000000', 0.2));

      root.style.setProperty(
        '--tb-gradient-text',
        `linear-gradient(120deg, ${p.primary}, ${p.secondary} 55%, ${mix('#ffffff', p.primary, 0.55)})`
      );
      root.style.setProperty('--tb-aurora', rgba(p.primary, 0.42));
    }
  }
});
