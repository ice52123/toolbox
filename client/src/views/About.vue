<template>
  <div class="about">
    <!-- ============ 总览 ============ -->
    <div class="intro tb-card">
      <h2>校园工具箱 · CampusToolBox</h2>
      <p>
        面向同一所高校的一站式校园生活平台：校园社区互助 + 二手闲置交易 + 22 个常用在线小工具。
        微前端（qiankun）骨架 + 双后端并行（MySQL / MongoDB），全栈 Node 实现，一个人从 0 到 1。
      </p>
      <div class="nums">
        <div><b>6</b><span>阶段规划</span></div>
        <div><b>3</b><span>微应用（1 已接入）</span></div>
        <div><b>{{ tools.length }}</b><span>在线工具</span></div>
        <div><b>12</b><span>已写接口</span></div>
        <div><b>39</b><span>待写接口</span></div>
      </div>
    </div>

    <!-- ============ 项目全貌 ============ -->
    <div class="tb-card mods">
      <h3>项目全貌</h3>
      <div class="mgrid">
        <div v-for="m in mods" :key="m.title" class="mod">
          <div class="mt">
            <b>{{ m.title }}</b>
            <code>{{ m.path }}</code>
          </div>
          <ul>
            <li v-for="l in m.lines" :key="l">{{ l }}</li>
          </ul>
        </div>
      </div>
    </div>

    <div class="col-2">
      <!-- 技术栈 -->
      <div class="tb-card stack">
        <h3>技术栈</h3>
        <div v-for="t in techStack" :key="t.layer" class="layer">
          <span class="lb">{{ t.layer }}</span>
          <span class="it">{{ t.items.join(' · ') }}</span>
        </div>
      </div>

      <!-- 路线图 -->
      <div class="tb-card roadmap">
        <div class="rh">
          <h3>研发路线（P1 → P6）</h3>
          <el-link type="primary" :underline="false" @click="$router.push('/roadmap')">完整路线 ›</el-link>
        </div>
        <el-timeline class="tl">
          <el-timeline-item
            v-for="r in roadmap"
            :key="r.phase"
            :type="r.status === 'done' ? 'success' : r.status === 'doing' ? 'primary' : 'info'"
            :hollow="r.status === 'todo'"
          >
            <div class="ph">
              <b>{{ r.phase }}</b> · {{ r.name }}
              <el-tag :type="r.status === 'done' ? 'success' : r.status === 'doing' ? 'primary' : 'info'" size="small" effect="plain">
                {{ statusText(r.status) }}
              </el-tag>
            </div>
            <ul class="items">
              <li v-for="it in r.items" :key="it">{{ it }}</li>
            </ul>
          </el-timeline-item>
        </el-timeline>
      </div>
    </div>

    <!-- ============ 在线工具箱 ============ -->
    <div class="tb-card tb">
      <h3>在线工具箱<small>共 {{ tools.length }} 个，全部在浏览器端处理，不依赖后端</small></h3>
      <div v-for="g in groups" :key="g.key" class="tg">
        <span class="tn">{{ g.name }}<i>{{ g.list.length }}</i></span>
        <div class="chips">
          <el-tag v-for="t in g.list" :key="t.id" size="small" effect="plain">{{ t.name }}</el-tag>
        </div>
      </div>
      <p class="note">
        新增工具 = 写一个 Vue 组件 + 在 <code>client/src/config/tools.js</code> 加一条（comp 用动态 import 懒加载）。
        「生活便民」3 项当前吃 <code>mockData.js</code> 示例数据，接后端后把页面里的 mock 换成 request 即可。
      </p>
    </div>

    <div class="col-2">
      <!-- 接口现状 -->
      <div class="tb-card api">
        <h3>接口现状</h3>
        <div class="kv">
          <span>已实现</span>
          <b>server/ 共 12 条</b>
        </div>
        <ul class="-items">
          <li v-for="p in doneApis" :key="p">{{ p }}</li>
        </ul>
        <div class="kv">
          <span>双后端差异</span>
          <b class="warn">server-mongo/ 少 4 条</b>
        </div>
        <ul class="items">
          <li v-for="p in mongoMissing" :key="p">{{ p }}</li>
        </ul>
        <div class="kv">
          <span>前端已接</span>
          <b>6 条（登录 / 注册 / 手机验证码 / 快捷登录 / 找回密码 / 头像）</b>
        </div>
        <div class="kv">
          <span>待写</span>
          <b>39 条，清单见仓库 <code>docs/API-清单.md</code>（含 MySQL 建表 + Mongo collection）</b>
        </div>
      </div>

      <!-- 当前状态与待办 -->
      <div class="tb-card todo">
        <h3>当前状态与待办</h3>
        <ul class="items">
          <li v-for="t in todos" :key="t" :class="{ bad: t.startsWith('·') }">{{ t }}</li>
        </ul>
      </div>
    </div>

    <!-- ============ 本地启动 ============ -->
    <div class="tb-card run">
      <h3>本地启动</h3>
      <pre class="code"># 主站（5173）
cd F:/web/Node/项目/toolbox/client
node node_modules/vite/bin/vite.js --port 5173

# 闲置市场子应用（4200）—— 端口被占时 vite 会退到 4201，但宿主写死连 4200，务必复用 4200
cd F:/web/Node/项目/toolbox/idle-market
node node_modules/vite/bin/vite.js --port 4200

# 后端（双轨并行，契约一致）
node server/app.js        # MySQL 版 · 3201
node server-mongo/app.js  # MongoDB 版 · 3202</pre>
    </div>

    <div class="tb-card go">
      <el-button type="primary" @click="$router.push('/')">回首页</el-button>
      <el-button @click="$router.push('/tools')">逛工具箱</el-button>
      <el-button @click="$router.push('/roadmap')">看研发路线</el-button>
      <el-button @click="$router.push('/m/idle')">逛闲置市场</el-button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { techStack, roadmap } from '@/config/mockData';
import { tools, categories } from '@/config/tools';

// 工具分组直接由 tools.js 算出来，以后加工具不用改这里
const groups = computed(() =>
  categories
    .filter((c) => c.key !== 'all')
    .map((c) => ({ key: c.key, name: c.name, list: tools.filter((t) => t.cat === c.key) }))
);

// 项目全貌：数字与目录结构手工同步（跟 router / tools.js 对一遍即可）
const mods = [
  {
    title: '主站壳与导航',
    path: 'client/ · 5173',
    lines: [
      'Vue 3 + Vite + Element Plus + Pinia',
      '21 个页面模块 + AppLayout 外壳 + qiankun 宿主',
      '22 个工具组件 + tools.js 注册表',
      '主题 / UI / 用户三个 Pinia store'
    ]
  },
  {
    title: '闲置市场（子应用）',
    path: 'idle-market/ · 4200',
    lines: [
      '独立 Vite 应用，qiankun 注册接入',
      '列表 / 详情 / 发布三个页面',
      '数据写死在 localStorage（store.js），整层可换',
      '另有 forum、message-center 两个应用已注册但 enabled:false'
    ]
  },
  {
    title: '后端双轨',
    path: 'server/ · server-mongo/',
    lines: [
      'server/ —— MySQL 8，12 条接口，3201',
      'server-mongo/ —— MongoDB，8 条接口，3202',
      '两套路由前缀与响应契约保持一致',
      '响应统一 { code, message, data }，前端只认 code === 0'
    ]
  }
];

const doneApis = [
  'POST /api/user/login、register、sms-login、quick-login、reset-password',
  'GET /api/user/me、POST /api/user/avatar',
  'GET /api/tool/history、POST /api/tool/history、GET /api/tool/rank',
  'POST /api/upload/image、POST /api/upload/pdf'
];
const mongoMissing = ['POST /api/user/avatar', 'POST /api/user/sms-login', 'POST /api/user/quick-login', 'POST /api/user/reset-password'];
const todos = [
  'MySQL 权限没修好（F:\\tools\\mysql\\data\\Data），net start MySQL267 报错误 5，3201 起库相关接口会 500',
  '前端 18 个页面现在仍由 mockData.js 驱动，除登录/头像外没接后端',
  'ToolPlaceholder.vue 已成孤儿（全项目无人 import），可当模板参考或删掉',
  '支付沙箱 + 回调 + 退款售后 + 投诉工单：本轮明确不做',
  'PNG→WebP 等图片能力与 PDF 合并/拆分走前端（sharp、pdf-lib 后端没装，走后端必 500）'
];

function statusText(s) {
  return { done: '已完成', doing: '进行中', todo: '待开始' }[s];
}
</script>

<style lang="less" scoped>
@import '@/styles/mixins.less';

.about {
  max-width: 1000px;

  .m-sm({
    max-width: 100%;
  });
}
.intro {
  padding: 26px 28px;

  h2 {
    margin: 0 0 8px;
    font-size: 24px;
  }
  p {
    margin: 0 0 16px;
    color: var(--tb-sub);
    line-height: 1.8;
  }

  .m-sm({
    padding: 18px 16px;

    h2 {
      font-size: 20px;
    }
    p {
      font-size: 13.5px;
      line-height: 1.75;
    }
  });
}
.nums {
  display: flex;
  gap: 30px;

  b {
    display: block;
    font-size: 22px;
    color: var(--tb-primary);
  }
  span {
    font-size: 12px;
    color: var(--tb-sub);
  }

  .m-sm({
    gap: 18px;
    flex-wrap: wrap;

    b {
      font-size: 19px;
    }
  });
}

/* —— 项目全貌 —— */
.mods {
  padding: 20px 22px;
  margin-top: 16px;

  h3 {
    margin: 0 0 12px;
    font-size: 16px;
  }

  .m-sm({
    padding: 15px 16px;
  });
}
.mgrid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;

  .m-sm({
    grid-template-columns: 1fr;
  });
}
.mod {
  padding: 12px 14px;
  border: 1px solid var(--tb-line);
  border-radius: @r-sm;
  background: var(--tb-surface);

  .mt {
    display: flex;
    align-items: baseline;
    gap: 8px;
    margin-bottom: 8px;

    b {
      font-size: 13.5px;
    }
  }
  code {
    font-size: 11.5px;
    color: var(--tb-primary);
    background: var(--tb-primary-soft);
    padding: 1px 6px;
    border-radius: @r-xs;
  }
  ul {
    margin: 0;
    padding-left: 16px;
    font-size: 12.5px;
    line-height: 1.85;
    color: var(--tb-sub);
  }
}

/* —— 工具箱 —— */
.tb {
  padding: 20px 22px;
  margin-top: 16px;

  h3 {
    margin: 0 0 10px;
    font-size: 16px;

    small {
      margin-left: 8px;
      font-size: 12px;
      font-weight: 400;
      color: var(--tb-sub);
    }
  }

  .m-sm({
    padding: 15px 16px;
  });
}
.tg {
  display: flex;
  gap: 12px;
  padding: 8px 0;
  border-top: 1px solid var(--tb-line-soft);
  font-size: 13px;

  .m-sm({
    flex-wrap: wrap;
    gap: 6px 10px;
  });
}
.tn {
  width: 76px;
  flex: none;
  color: var(--tb-primary);
  font-weight: 700;

  i {
    margin-left: 6px;
    font-style: normal;
    font-size: 11.5px;
    color: var(--tb-sub);
  }
}
.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.note {
  margin: 10px 0 0;
  padding-top: 10px;
  border-top: 1px dashed var(--tb-line-dashed);
  font-size: 12.5px;
  line-height: 1.8;
  color: var(--tb-sub);

  code {
    color: var(--tb-primary);
  }
}

/* —— 接口现状 —— */
.api,
.todo {
  padding: 20px 22px;

  h3 {
    margin: 0 0 12px;
    font-size: 16px;
  }

  .m-sm({
    padding: 15px 16px;
  });
}
.kv {
  display: flex;
  gap: 10px;
  padding: 7px 0;
  border-top: 1px solid var(--tb-line-soft);
  font-size: 12.5px;

  span {
    width: 70px;
    flex: none;
    color: var(--tb-primary);
    font-weight: 700;
  }
  b {
    font-weight: 500;
    color: var(--tb-sub);
    line-height: 1.7;

    &.warn {
      color: var(--tb-warn);
    }
  }
  code {
    color: var(--tb-primary);
  }

  .m-sm({
    flex-wrap: wrap;
    gap: 2px 10px;
  });
}
.todo .items li.bad {
  color: var(--tb-warn);
}

.col-2 {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  margin: 16px 0;

  .m-sm({
    grid-template-columns: 1fr;
  });
}
.stack,
.roadmap,
.run,
.go {
  padding: 20px 22px;

  .m-sm({
    padding: 15px 16px;
  });
}
.stack,
.roadmap,
.run {
  h3 {
    margin: 0 0 12px;
    font-size: 16px;
  }
}
.layer {
  display: flex;
  gap: 12px;
  padding: 8px 0;
  border-top: 1px solid rgba(124, 58, 237, 0.1);
  font-size: 13px;

  .m-sm({
    flex-wrap: wrap;
    gap: 4px 10px;
  });
}
.lb {
  width: 54px;
  color: var(--tb-primary);
  font-weight: 700;
  flex: none;
}
.it {
  color: var(--tb-sub);
}
.go {
  display: flex;
  gap: 12px;

  .m-sm({
    flex-wrap: wrap;

    .el-button {
      flex: 1;
    }
  });
}

.code {
  margin: 0;
  padding: 14px 16px;
  background: rgba(30, 20, 60, 0.06);
  border-radius: @r-sm;
  font-size: 12.5px;
  line-height: 1.9;
  overflow-x: auto;

  .m-sm({
    font-size: 11.5px;
  });
}
.rh {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;

  .m-sm({
    align-items: flex-start;
    flex-direction: column;
    gap: 2px;
  });
}
.tl {
  padding-left: 6px;
}
.ph {
  .flex-center();
  gap: 8px;
  font-size: 14px;
  margin-bottom: 6px;
}
.items {
  margin: 0;
  padding-left: 18px;
  color: var(--tb-sub);
  font-size: 13px;
  line-height: 1.8;
}
</style>
