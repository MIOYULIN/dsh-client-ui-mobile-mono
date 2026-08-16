# 维护与后续开发指南（MAINTAINING）

面向后续维护者的开发文档：架构、关键机制、约束、调试方法、发版流程。改动插件前建议通读第 2、3、5 节。

---

## 1. 项目结构

```
dsh-client-ui-mobile-mono/
├── README.md              # 仓库门面（双语，面向用户/搜索）
├── MAINTAINING.md         # 本文档（面向维护者）
└── ui-v2/
    ├── package.json       # 包元信息 + dsh.client 注入声明（版本号在此）
    ├── install.sh         # 安装进 ~/.dsh/profiles/web（写 cordis.patch.yml 组合行）
    ├── uninstall.sh       # 卸载（清文件 + 清组合行 + 清 v1 残留行）
    ├── cordis.patch.yml   # 本地开发用 patch 组合
    ├── demo/index.html    # 本地 mock 演示页（已 gitignore，仅本地预览）
    └── lib/
        ├── index.js       # 宿主端入口（no-op，仅为满足 exports）
        └── client.js      # ★ 全部浏览器端实现（~1600 行）
```

核心只有一个文件：`ui-v2/lib/client.js`。所有功能都在里面，按「常量 → CSS → i18n → apply() 主流程 → 组件 → slots 注入 → 清理」组织。

## 2. 架构与执行流

### 2.1 模块注册

文件最外层是 DSH 插件约定的 AMD 风格包装：

```js
window.__ModuleLoader__.load(
  ["@deepseek-ai/dsh-client-runtime", "@deepseek-ai/dsh-client-ui-layout"],
  function (require, module, exports) { /* 全部实现 */ }
);
```

依赖声明必须与 `package.json` 的 `dsh.client.inject` 数组一致（漏一个 → 启动报 `dsh.client.platform must be a string` / exports 类错误）。`react` 通过 `require("react")` 取宿主实例，**不要**自带 React。

### 2.2 client.js 内部分区（按行号序）

| 区段 | 内容 |
|---|---|
| 头部 | `VERSION`（显示在统计卡脚注）、`P(light,dark)` 令牌对构造器 |
| `MONO_TOKENS` | 90+ 个官方 token（`--dsw-alias-*` / `--dsw-specific-*`）的灰阶映射，light/dark 双值 |
| `CSS` | 单一大模板字符串。选择器全部挂 `body[data-dshmu-touch]` / `body[data-dshmu-mobile]` 前缀，桌面端零生效 |
| `STRINGS` + `t()` | zh/en 文案表；新文案两处都要加 |
| `apply(ctx)` | 主流程：取服务 → 注样式 → 模式检测 → 列标记 → 手势 → 观察器 → 组件注册 |
| 组件 | `StatsFold` / `Backdrop` / `FloatingToggle` / `HeaderToggle` / `MobileUiSettingsRow`（均为 React 组件，经 slots 注入） |
| teardown | 全量清理（见 §6） |

### 2.3 使用的官方服务

- `ctx.get("layout")` — 抽屉开合的官方状态源（`drawerOpen()` / `openDrawer()` / `closeDrawer()` 都走它，**不要**直接改 class 绕过）
- `ctx.get("theme")` — `applyMonochrome()` 经它做 token 覆盖层，返回卸载函数存入 `monoLayer`
- `ctx.get("locale")` — 语言，驱动 `t()`
- `ctx.get("slots")` — 组件注入，当前 5 个：

| slot | id | order | 组件 |
|---|---|---|---|
| `shell.overlay` | `dshmu-backdrop` | -100 | 透明点击关闭层 |
| `shell.overlay` | `dshmu-toggle` | -99 | 浮动汉堡 |
| `conversation.session.header.actions` | `dshmu-header-toggle` | -20 | 会话头开关 |
| `settings.general.item` | `dshmu-mobile-ui` | 20 | 「移动端界面」偏好卡 |
| `conversation.composer.dock` | `dshmu-stats-fold` | 1 | 折叠统计胶囊 |

新增 UI 优先找官方 slot；没有合适 slot 才用 MutationObserver 挂 DOM。

## 3. 关键机制（改代码前必读）

### 3.1 模式检测与列标记

- 手机判定：UA 检测 → `body[data-dshmu-touch]`（触摸/窄屏样式总开关）；布局模式再细分 `body[data-dshmu-mobile]`
- `findFrame()` 找官方三列 frame；`tagColumns()` 给三列打 `data-dshmu-sidebar` / `data-dshmu-center` / `data-dshmu-details`
- 打标失败会自动重试（`MutationObserver` + `ResizeObserver` 双保险），不要把打标做成一次性的

### 3.2 选择器策略（最重要）

官方 CSS-modules 类名是 hash 格式（如 `_VOzbGW_options`），**hash 段跨版本会变，local 段稳定**。因此所有针对官方 DOM 的选择器必须 hash 无关，按优先级：

1. 结构/语义属性：`[role="listbox"]`、`[aria-current="true"]`、`:has(> [class$="_ledger"])`
2. 后缀匹配：`[class$="_trigger"]`、`[class*="detailsCol"]`（hash 变了仍命中）
3. 具体类名只作为**主通道**，必须配结构签名兜底通道（例：切标签动画 = `.VOzbGW_options > *` + `[role="dialog"] > div:last-child > div:last-child > *`）

**新增适配时先看官方包源码确认 DOM 与重挂载行为**：官方 npm 包（`@deepseek-ai/dsh-client-ui-*`）解包读 `lib/client.js` 即可。条件渲染的元素（如切标签重挂载）纯 CSS 动画就能重放；不重挂载的才需要 JS 打属性驱动。

### 3.3 抽屉与手势

- 侧栏抽屉宽度三档 320/360/400（`--dshmu-drawer-w`），详情抽屉恒全宽
- 手势：左缘 28px 内右滑开抽屉；抽屉上左滑关闭；拖拽实时跟手（transform），松手按**位移 + 速度**判定开合
- 遮罩层是**纯透明命中层**（有意为之：历史上黑色遮罩被用户要求去掉；景深由中列 scale 收缩表达）

### 3.4 统计折叠（StatsFold）

- 官方统计条移动端隐藏，由 `StatsFold` 接管：胶囊 + 展开卡片（轮次/LLM/工具/TTFT/速度/缓存/tokens/**上下文占用** + `MONO · v{VERSION}` 脚注）
- 数据源：`deriveStats(nodes)` + `contextPressure` 投影（与官方 ContextMeter 同源）
- 官方上下文环在移动端**整体隐藏**（选择器签名：`_trigger` 且其 svg 内含 `_track` 环形轨道），功能收进本卡片
- 展开/收起动画：外层 `.dshmu-stats-wrap` 用 `grid-template-rows: 1fr ↔ 0fr` 过渡**布局高度**（否则收起时上方内容会闪跳）；退出动画有 260ms 兜底定时器（reduced-motion 下不派发 animationend）+ `e.target === e.currentTarget` 过滤冒泡 + 可中断回放

### 3.5 偏好持久化

- `localStorage["dshmu:opts"]`，键：`monochrome` / `drawerW` / `edgeSwipe` / `hideModel`
- 读写集中在 `loadOpts()` / `saveOpts()`，热应用走既有 `applyMonochrome()` / `applyWidth()` 等，不要另起一套

### 3.6 动效系统

- 统一缓动：`cubic-bezier(0.32, 0.72, 0, 1)`（标准）/ `cubic-bezier(0.34, 1.3, 0.5, 1)`（过冲）
- 命名前缀 `dshmu-`：`rise` / `menu-in` / `sheet-up` / `sheet-down` / `rows-open` / `page-in` / `nav-pill` …
- **硬性规则**：所有新动画必须加入文件尾的 `prefers-reduced-motion` 关停列表——注意元素的 `animation: none` **不会**覆盖伪元素（`::after` 指示条这类要单独列）和子组件
- 性能红线见 §5

## 4. 开发工作流

```bash
# 1. 本地跑（改完即热刷）
pnpm dsh web --patch /绝对路径/ui-v2/cordis.patch.yml
# 或装进 profile 后直接重启 dsh
cd ui-v2 && ./install.sh

# 2. 语法自检（无构建步骤，改完必跑）
node --check lib/client.js

# 3. 手机验证：浏览器 DevTools UA 切 iPhone/Android + 窄视口，
#    真机则同局域网访问，改完 Ctrl/Cmd+Shift+R 强刷

# 4. mock 演示页（不依赖 DSH，仅本地存在）
cd ui-v2 && python3 -m http.server 8902   # 开 /demo/index.html
```

验证清单（发版前过一遍）：

- [ ] 桌面端完全无变化（`data-dshmu-*` 属性未落 到 body/frame）
- [ ] 手机：抽屉开/关/拖拽跟手、左缘手势、点遮罩关闭
- [ ] 设置卡四项开关即时生效 + 刷新后保留
- [ ] 统计卡展开/收起高度平滑、收起时上方内容不闪跳
- [ ] 切 light/dark 主题令牌跟随
- [ ] Eject/卸载后官方 UI 完整还原（属性、样式节点、观察器全清）
- [ ] 系统开启「减少动态效果」后所有动画停

## 5. 性能红线（历史教训，勿回退）

| 规则 | 原因 |
|---|---|
| **禁止 `backdrop-filter`** | Firefox 下首页/抽屉异常卡顿的元凶，已全量移除 |
| 按压反馈只允许 `transform` / 背景色 | `:active` 切换 `box-shadow` 大模糊 → 每次点击整层重绘「一闪一闪」 |
| 全局已关 `-webkit-tap-highlight-color`（通配） | 该属性不继承，删通配会复发灰色高亮闪烁 |
| 遮罩保持纯透明 | 黑色遮罩曾被明确要求移除 |
| 抽屉展开态不加 `box-shadow` | 同上，景深只用 scale + 1px 发丝边 |
| 动画限流 | 交错入场限前 14 个元素；长列表别放开 |

## 6. 清理（teardown）完整性

卸载/Eject 时必须可完整回滚。清单在 `apply()` 尾部的 teardown effect：window/document 事件、三个 Observer、两个 timer、stagger 标记、`unhideModelNames()`、frame/body 属性、`--dshmu-drawer-w` 变量、monoLayer、theme 监听、meta、style 节点。**新增任何全局副作用（监听器/观察器/定时器/属性/节点）都必须同步加进 teardown**，这是桌面端「零影响」承诺的保证。

## 7. 发版流程

1. 版本号**三处同步**：`lib/client.js` 的 `VERSION`、`package.json`、`ui-v2/README.md`（标题 + 目录树两处）
2. 若有用户可感知变化，更新 `ui-v2/README.md` 特性列表；动结构则更新本文档 §1/§2
3. `node --check lib/client.js` + §4 验证清单
4. 提交信息用英文、说明 why（历史风格保持），push 到 `main`（仓库直推 main，无 PR 流程）
5. 根 README 的版本徽章同步

版本策略：当前 0.4.x，小改进 +0.0.1；引入新界面适配/新组件可升 minor。

## 8. 常见故障排查

| 症状 | 排查 |
|---|---|
| 插件不加载、启动报错 | `package.json` 的 `dsh.client.platform` / `inject` / `exports` 三者是否齐全且与文件头 `load([...])` 一致 |
| 手机上无任何效果 | body 是否有 `data-dshmu-touch`；UA 检测是否命中；强刷缓存 |
| 抽屉样式生效但布局错乱 | `tagColumns()` 是否打上标（frame 结构可能变了）→ 更新 `findFrame()` |
| 某界面适配失效 | 官方包更新导致 hash 变了 → 按 §3.2 重下官方包核对 DOM，主通道类名换新 hash，兜底通道一般仍有效 |
| 动画不播 | 元素是否条件渲染重挂载？reduced-motion 是否开着？伪元素是否漏进关停列表 |
| 卡顿/闪烁 | 是否引入了 §5 红线项 |
| 卸载后异常 | 对照 §6 清单查漏 |

## 9. 已适配的官方界面（维护索引）

- 主布局三列（frame/sidebar/center/details）
- 会话头操作区、composer dock（统计胶囊）
- 设置弹窗（`settings-general`：节块 renderSlot 重挂载、`aria-current` 标签）
- Session log（`dsh-client-ui-trajectory`：工具栏/账本/检查器，检查器全宽 sheet 化）
- 上下文指示器（`ContextMeter`：移动端隐藏，数据并入统计卡）
- 模型选择器（按 `_trigger` + svg `_track` 签名隐藏模型名）

适配每个界面的方法论统一：**解包官方 npm 包读源码 → 找稳定 local 类名/结构签名 → 主通道 + 兜底双选择器 → 动画纳入 reduced-motion → 更新本索引**。
