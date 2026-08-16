// 浏览器端模块：移动端抽屉布局 + 黑白主题。
// 经 package.json 的 dsh.client manifest 由 DSH Web 模块系统加载（本文件顶层
// 的 window.__ModuleLoader__.load 调用即模块注册入口，勿直接 <script> 引入）。
//
// 架构（参考 dsh-client-ui-mobile 社区插件约定）：
//  - 移动检测：只看 UA —— 手机浏览器启用抽屉布局，桌面端与原版完全一致
//  - 布局开关：在 AppFrame 根元素上维护 data-dshmu-mobile 属性（官方稳定
//    data-* 契约，不依赖 CSS modules 哈希类名）
//  - 开合交互：走官方 ctx.layout 服务（toggleSidebar / closeDetails），
//    组件经 slots.inject/register 注入 shell.overlay 与会话头部插槽
//  - 手势：左缘右滑开抽屉、抽屉上左滑关闭，拖拽实时跟随 + 速度判定
//  - 黑白主题：优先官方 ctx.theme.overrideTokens()（light/dark 成对灰阶
//    token，官方 presenter 负责 DOM 投影）；无 theme 服务时退化为静态
//    CSS 变量表；同时维护 meta[name=theme-color] 跟随黑白底色
window.__ModuleLoader__.load({
  id: "@local/dsh-client-ui-mobile-mono",
  factory: (require) => {
    var module = { exports: {} };
    var exports = module.exports;
    const react = require("react");

    /* ---------------------------------------------------------------
     * 黑白主题 token 表：--dsw-alias-* / --dsw-specific-* 的灰阶覆盖。
     * 每个 token 必须同时给出 light / dark 值（overrideTokens 契约）。
     * ------------------------------------------------------------- */
    const P = (light, dark) => ({ light, dark });

    const MONO_TOKENS = {
      /* 背景层级 */
      "--dsw-alias-bg-base": P("#ffffff", "#000000"),
      "--dsw-alias-bg-layer-1": P("#ffffff", "#0a0a0a"),
      "--dsw-alias-bg-layer-2": P("#fafafa", "#111111"),
      "--dsw-alias-bg-layer-3": P("#f5f5f5", "#1a1a1a"),
      "--dsw-alias-bg-module-platform": P("#f5f5f5", "#1a1a1a"),
      "--dsw-alias-bg-multi-select": P("#f5f5f5", "#111111"),
      "--dsw-alias-bg-overlay": P("#f0f0f0", "#262626"),
      "--dsw-alias-bg-skeleton": P("rgba(0,0,0,0.04)", "rgba(255,255,255,0.08)"),
      "--dsw-alias-bg-mask-1": P("rgba(0,0,0,0.32)", "rgba(0,0,0,0.5)"),
      "--dsw-alias-bg-mask-2": P("rgba(0,0,0,0.12)", "rgba(0,0,0,0.2)"),
      "--dsw-alias-bg-mask-3": P("rgba(0,0,0,0.48)", "rgba(0,0,0,0.48)"),
      "--dsw-alias-bg-mask-photo": P("rgba(0,0,0,0.88)", "rgba(0,0,0,0.88)"),
      "--dsw-alias-bg-mask-drop": P("rgba(255,255,255,0.72)", "rgba(10,10,10,0.7)"),
      /* 边框（灰阶 alpha） */
      "--dsw-alias-border-inverted": P("rgba(0,0,0,0)", "rgba(255,255,255,0)"),
      "--dsw-alias-border-inverted2": P("rgba(0,0,0,0)", "rgba(255,255,255,0)"),
      "--dsw-alias-border-l1": P("rgba(0,0,0,0.08)", "rgba(255,255,255,0.08)"),
      "--dsw-alias-border-l2": P("rgba(0,0,0,0.12)", "rgba(255,255,255,0.14)"),
      "--dsw-alias-border-l2-darkmode-thin": P("rgba(0,0,0,0.1)", "rgba(255,255,255,0.08)"),
      "--dsw-alias-border-l3": P("rgba(0,0,0,0.16)", "rgba(255,255,255,0.2)"),
      "--dsw-alias-border-l4": P("rgba(0,0,0,0.22)", "rgba(255,255,255,0.28)"),
      /* 品牌与主按钮（黑白反转：light 黑底白字，dark 白底黑字） */
      "--dsw-alias-brand-primary": P("#000000", "#ffffff"),
      "--dsw-alias-brand-primary-invert": P("#ffffff", "#000000"),
      "--dsw-alias-brand-primary-new-colorprimary-new-color": P("#000000", "#ffffff"),
      "--dsw-alias-brand-text": P("#000000", "#ffffff"),
      "--dsw-alias-button-primary-fill": P("#000000", "#ffffff"),
      "--dsw-alias-button-primary-hover": P("#262626", "#e5e5e5"),
      "--dsw-alias-button-primary-dimmed": P("#f0f0f0", "#1f1f1f"),
      "--dsw-alias-button-info-fill": P("#000000", "#ffffff"),
      "--dsw-alias-button-info-hover": P("#262626", "#e5e5e5"),
      "--dsw-alias-button-contrast-fill": P("#404040", "#f5f5f5"),
      /* 按钮表面 */
      "--dsw-alias-button-elevated-fill": P("#ffffff", "#1f1f1f"),
      "--dsw-alias-button-floating-fill": P("#ffffff", "#111111"),
      "--dsw-alias-button-floating-hover": P("#f5f5f5", "#1a1a1a"),
      "--dsw-alias-button-ghost-active-border": P("#737373", "#8a8a8a"),
      "--dsw-alias-button-ghost-active-fill": P("#f0f0f0", "#1f1f1f"),
      "--dsw-alias-button-ghost-active-hover": P("#e5e5e5", "#262626"),
      "--dsw-alias-button-tool-bar-fill-invisible": P("rgba(38,38,38,0.32)", "rgba(230,230,230,0.32)"),
      "--dsw-alias-button-tool-bar-fill": P("rgba(64,64,64,0.5)", "rgba(200,200,200,0.5)"),
      "--dsw-alias-button-tool-bar-hover": P("rgba(64,64,64,0.62)", "rgba(230,230,230,0.62)"),
      /* 交互态背景 */
      "--dsw-alias-interactive-bg-active": P("rgba(0,0,0,0.1)", "rgba(255,255,255,0.14)"),
      "--dsw-alias-interactive-bg-hover": P("rgba(0,0,0,0.06)", "rgba(255,255,255,0.08)"),
      "--dsw-alias-interactive-bg-hover-accent": P("rgba(0,0,0,0.14)", "rgba(255,255,255,0.24)"),
      "--dsw-alias-interactive-bg-hover-solid": P("#f5f5f5", "#1a1a1a"),
      /* 文字层级 */
      "--dsw-alias-label-primary": P("#000000", "#ffffff"),
      "--dsw-alias-label-primary-bluish": P("#000000", "#ffffff"),
      "--dsw-alias-label-primary-dimmed": P("#404040", "#d4d4d4"),
      "--dsw-alias-label-primary-foreground": P("#ffffff", "#000000"),
      "--dsw-alias-label-primary-inverted": P("#ffffff", "#1a1a1a"),
      "--dsw-alias-label-secondary": P("#525252", "#a3a3a3"),
      "--dsw-alias-label-tertiary": P("#737373", "#8a8a8a"),
      "--dsw-alias-label-caption": P("#8a8a8a", "#6f6f6f"),
      "--dsw-alias-label-dimmed": P("#d4d4d4", "#3f3f3f"),
      /* 代码块 / 引用 / 标签 */
      "--dsw-alias-markdown-citation": P("#f0f0f0", "#1f1f1f"),
      "--dsw-alias-markdown-code-block": P("#fafafa", "#0d0d0d"),
      "--dsw-alias-markdown-code-block-banner": P("#fafafa", "#141414"),
      "--dsw-alias-markdown-code-segment-selected": P("#ffffff", "#1f1f1f"),
      "--dsw-alias-markdown-code-segment-unselected": P("#f0f0f0", "#0d0d0d"),
      "--dsw-alias-markdown-inline-code": P("#f0f0f0", "#1a1a1a"),
      "--dsw-alias-markdown-placeholder": P("#f5f5f5", "#141414"),
      "--dsw-alias-markdown-tag": P("#f0f0f0", "#1a1a1a"),
      /* 滚动条 */
      "--dsw-alias-scrollbar-bg-l1": P("#e5e5e5", "#333333"),
      "--dsw-alias-scrollbar-bg-l2": P("#e5e5e5", "#404040"),
      "--dsw-alias-scrollbar-hover-l1": P("#d4d4d4", "#4d4d4d"),
      "--dsw-alias-scrollbar-hover-l2": P("#d4d4d4", "#525252"),
      /* 状态色（全部灰阶化，保持黑白主体） */
      "--dsw-alias-state-business-primary": P("#000000", "#ffffff"),
      "--dsw-alias-state-business-tertiary": P("#f0f0f0", "#1f1f1f"),
      "--dsw-alias-state-error-primary": P("#404040", "#d4d4d4"),
      "--dsw-alias-state-error-secondary": P("#525252", "#a3a3a3"),
      "--dsw-alias-interactive-bg-hover-danger": P("rgba(0,0,0,0.06)", "rgba(255,255,255,0.1)"),
      "--dsw-alias-state-warn-label": P("#525252", "#a3a3a3"),
      "--dsw-alias-state-warn-primary": P("#404040", "#d4d4d4"),
      "--dsw-alias-state-warn-secondary": P("#525252", "#a3a3a3"),
      "--dsw-alias-state-warn-tertiary": P("#f0f0f0", "#1f1f1f"),
      "--dsw-alias-state-success-primary": P("#404040", "#d4d4d4"),
      "--dsw-alias-state-success-secondary": P("#525252", "#a3a3a3"),
      "--dsw-alias-state-success-tertiary": P("#f0f0f0", "#1f1f1f"),
      /* 浮层 */
      "--dsw-alias-toast-bg": P("#171717", "#1f1f1f"),
      "--dsw-alias-tooltip-bg": P("#171717", "#1f1f1f"),
      /* 专属表面 */
      "--dsw-specific-bubble": P("#f5f5f5", "#141414"),
      "--dsw-specific-bubble-highlight": P("#ebebeb", "#1f1f1f"),
      "--dsw-specific-input-major": P("#ffffff", "#0d0d0d"),
      "--dsw-specific-login-input": P("#fafafa", "#141414"),
      "--dsw-specific-menu": P("#ffffff", "#1f1f1f"),
      "--dsw-specific-selector": P("#f5f5f5", "#1a1a1a"),
      "--dsw-specific-sidebar-fill": P("#fafafa", "#0a0a0a"),
      "--dsw-specific-sidebar-nav-item-active": P("#e5e5e5", "#262626"),
      "--dsw-specific-sidebar-nav-item-active-accent": P("#d4d4d4", "#333333"),
      "--dsw-specific-sidebar-nav-item-hover": P("#f0f0f0", "#1a1a1a"),
      "--dsw-specific-tip": P("#f5f5f5", "#1a1a1a"),
    };

    /* 无 theme 服务时的静态 CSS 变量回退表 */
    function monoFallbackCss() {
      const light = [];
      const dark = [];
      for (const [name, modes] of Object.entries(MONO_TOKENS)) {
        light.push(`${name}:${modes.light}`);
        dark.push(`${name}:${modes.dark}`);
      }
      return `body{${light.join(";")}}body[data-ds-dark-theme]{${dark.join(";")}}`;
    }

    /* ---------------------------------------------------------------
     * CSS：抽屉布局 + 注入控件。
     * 布局规则挂在 AppFrame 根元素的 [data-dshmu-mobile] 上（进入移动
     * 模式时由 JS 设置）；触摸优化挂在 body[data-dshmu-touch] 上。
     * ------------------------------------------------------------- */
    const CSS = `
    /* 移动端专属控件默认隐藏（也避免检测器运行前渲染出无样式汉堡） */
    .dshmu-toggle, .dshmu-backdrop, .dshmu-header-toggle { display: none; }

    /* 抽屉接管：三列轨道归零（覆盖 AppFrame 的内联 grid 宽度） */
    [data-dshmu-mobile] { grid-template-columns: 0 minmax(0, 1fr) 0 !important; }

    /* 关键：侧栏列改为 absolute 后脱离 grid 流，剩余网格项会自动错位
       （center 落到第 1 列 0px、details 占满）。必须显式钉住列位。 */
    [data-dshmu-mobile] > div:nth-child(2) { grid-column: 2; grid-row: 1; }

    /* 详情列（第三列，官方子树常驻挂载）→ 右侧全宽覆盖抽屉；
       开合跟随官方 data-details-collapsed（用户点工具/统计等仍可打开）。
       注意：absolute 后不能保留 grid-column 钉扎 —— 指定了网格位置的
       abspos 子元素包含块是那个网格区域（第三列已归零宽），width:100%
       会被钳到 0。去掉钉扎后包含块回到 frame 内边距盒。
       hash 类名 .pI_x6G_detailsCol 作双保险（跨版本可能变化）。 */
    [data-dshmu-mobile] > div:nth-child(3),
    [data-dshmu-mobile] .pI_x6G_detailsCol {
      position: absolute !important;
      top: 0; bottom: 0; right: 0; left: 0;
      width: 100% !important; max-width: 100% !important;
      z-index: 28;
      background: var(--dsw-alias-bg-base, #ffffff);
      border-left: 1px solid var(--dsw-alias-border-l1, rgb(0 0 0 / 8%));
      box-shadow: -12px 0 40px rgb(0 0 0 / 18%);
      transform: translateX(102%);
      transition: transform 320ms cubic-bezier(0.32, 0.72, 0, 1);
    }
    [data-dshmu-mobile]:not([data-details-collapsed]) > div:nth-child(3),
    [data-dshmu-mobile]:not([data-details-collapsed]) .pI_x6G_detailsCol {
      transform: translateX(0);
    }

    /* 侧栏列 → 左侧离屏抽屉；开合跟随官方 data-sidebar-collapsed */
    [data-dshmu-mobile] > div:first-child {
      position: absolute !important;
      top: 0; bottom: 0; left: 0;
      width: min(86vw, 360px) !important;
      z-index: 30;
      border-right: 1px solid var(--dsw-alias-border-l1, rgb(0 0 0 / 8%));
      box-shadow:
        0 0 0 1px rgb(0 0 0 / 3%),
        8px 0 24px rgb(0 0 0 / 18%),
        28px 0 72px rgb(0 0 0 / 32%);
      transform: translateX(-102%);
      transition: transform 320ms cubic-bezier(0.32, 0.72, 0, 1);
    }
    [data-dshmu-mobile]:not([data-sidebar-collapsed]) > div:first-child { transform: translateX(0); }

    /* 进入移动模式的首帧禁用过渡（防"抽屉滑出"闪动；JS 挂 arming 两帧） */
    [data-dshmu-mobile][data-dshmu-arming] > div:first-child,
    [data-dshmu-mobile][data-dshmu-arming] > div:nth-child(2) { transition: none !important; }

    /* 抽屉打开时中列景深收缩（内容后退一步，聚焦抽屉） */
    [data-dshmu-mobile] > div:nth-child(2) {
      transition: transform 320ms cubic-bezier(0.32, 0.72, 0, 1);
      transform-origin: left center;
      will-change: transform;
    }
    [data-dshmu-mobile]:not([data-sidebar-collapsed]) > div:nth-child(2) {
      transform: scale(0.96) translateX(3%);
    }

    /* 触屏上隐藏拖拽手柄（AppFrame 的 data-side 命中条带） */
    [data-dshmu-mobile] [data-side] { display: none !important; }

    /* 遮罩显隐完全由官方开合态（data-sidebar-collapsed）状态机管辖，
       手势/JS 一律不写 display 内联 —— 杜绝"抽屉已关、遮罩残留"。
       拖拽进度只经 frame 上的 --dshmu-progress 变量影响透明度。 */
    [data-dshmu-mobile] .dshmu-backdrop {
      display: none;
      position: absolute; inset: 0;
      z-index: 25;
      background: rgb(0 0 0 / 42%);
      -webkit-backdrop-filter: blur(10px) saturate(0.9);
      backdrop-filter: blur(10px) saturate(0.9);
    }
    [data-dshmu-mobile]:not([data-sidebar-collapsed]) .dshmu-backdrop,
    [data-dshmu-mobile]:not([data-details-collapsed]) .dshmu-backdrop {
      display: block;
      animation: dshmu-fade-in 280ms ease;
    }
    /* 拖拽跟随态：无论官方态如何，挂 dragging 时显示并按进度渲染 */
    [data-dshmu-mobile][data-dshmu-dragging] .dshmu-backdrop {
      display: block;
      opacity: var(--dshmu-progress, 1);
      animation: none;
    }
    @keyframes dshmu-fade-in { from { opacity: 0; } to { opacity: 1; } }

    /* 抽屉打开期间锁定背景滚动（JS 监听 frame 属性同步 body）。
       注意：body 上挂的是 data-dshmu-touch（触摸优化专用），绝不能与
       frame 的 data-dshmu-mobile 同名 —— 遮罩/抽屉选择器是后代选择器，
       若 body 也带 data-dshmu-mobile，":not([data-sidebar-collapsed])"
       会经 body 分支永远命中，导致遮罩关不掉。 */
    body[data-dshmu-touch][data-dshmu-drawer-open] { overflow: hidden; }

    /* 浮动汉堡（hero / 无会话画面）：毛玻璃浮层按钮 */
    [data-dshmu-mobile] .dshmu-toggle {
      display: inline-flex;
      position: absolute;
      top: calc(12px + env(safe-area-inset-top));
      left: 12px;
      z-index: 26;
      width: 40px; height: 40px;
      align-items: center; justify-content: center;
      border-radius: 13px;
      border: 1px solid var(--dsw-alias-border-l2, rgb(0 0 0 / 12%));
      background: var(--dsw-alias-bg-layer-1, #ffffff);
      background: color-mix(in srgb, var(--dsw-alias-bg-layer-1, #ffffff) 74%, transparent);
      -webkit-backdrop-filter: blur(16px) saturate(1.2);
      backdrop-filter: blur(16px) saturate(1.2);
      color: var(--dsw-alias-label-primary, #0f1115);
      box-shadow: 0 2px 10px rgb(0 0 0 / 10%), 0 12px 32px rgb(0 0 0 / 12%);
      cursor: pointer;
      padding: 0;
      -webkit-tap-highlight-color: transparent;
      transition: transform 160ms cubic-bezier(0.32, 0.72, 0, 1), box-shadow 160ms ease;
    }
    [data-dshmu-mobile] .dshmu-toggle:active {
      transform: scale(0.92);
      box-shadow: 0 1px 6px rgb(0 0 0 / 12%);
    }

    /* 会话头部汉堡（有活动会话时；经 conversation.session.header.actions 插槽注入） */
    [data-dshmu-mobile] .dshmu-header-toggle {
      display: inline-flex;
      align-items: center; justify-content: center;
      width: 34px; height: 34px;
      border: none; background: none;
      color: var(--dsw-alias-label-primary, #0f1115);
      border-radius: 10px;
      cursor: pointer;
      padding: 0;
      -webkit-tap-highlight-color: transparent;
      transition: transform 160ms cubic-bezier(0.32, 0.72, 0, 1), background 160ms ease;
    }
    [data-dshmu-mobile] .dshmu-header-toggle:active {
      transform: scale(0.9);
      background: var(--dsw-alias-interactive-bg-hover, rgb(0 0 0 / 6%));
    }

    /* 触摸优化（移动模式下的全局行为） */
    body[data-dshmu-touch] { overscroll-behavior-y: none; -webkit-text-size-adjust: 100%; }
    body[data-dshmu-touch], body[data-dshmu-touch] button { touch-action: manipulation; }
    /* iOS 聚焦缩放防线：窄视口下输入类元素 >= 16px（任意窄窗口均生效） */
    @media (max-width: 1023px) { textarea, input, select { font-size: 16px !important; } }

    /* ------------------------------------------------------------
     * 设置弹窗（官方 SettingsRoot，body 级 portal）→ 全屏 sheet +
     * 顶部横向导航。hash 前缀（VOzbGW_/qSYn7G_）跨版本可能变化，
     * 每条规则均带 role=dialog / nth-child 结构兜底。
     * 作用域用 body[data-dshmu-touch]（弹窗在 frame 外）。
     * ---------------------------------------------------------- */
    /* 遮罩层拉满 */
    body[data-dshmu-touch] .VOzbGW_overlay { align-items: stretch !important; }
    /* 面板全屏化 */
    body[data-dshmu-touch] .VOzbGW_panel,
    body[data-dshmu-touch] [role="dialog"] {
      width: 100% !important; max-width: 100% !important;
      height: 100% !important; max-height: 100% !important;
      border-radius: 0 !important;
      flex-direction: column !important;
    }
    /* 导航：左侧 188px rail → 顶部横向滚动条 */
    body[data-dshmu-touch] .VOzbGW_nav,
    body[data-dshmu-touch] [role="dialog"] > div:first-child {
      flex-direction: row !important;
      width: 100% !important; height: auto !important;
      min-width: 0 !important;
      overflow-x: auto; overflow-y: hidden;
      border-right: none !important;
      border-bottom: 1px solid var(--dsw-alias-border-l1, rgb(0 0 0 / 8%));
    }
    body[data-dshmu-touch] .VOzbGW_navList,
    body[data-dshmu-touch] [role="dialog"] > div:first-child > div:nth-child(2) {
      flex-direction: row !important;
      overflow-x: auto;
      white-space: nowrap;
    }
    body[data-dshmu-touch] .VOzbGW_rail { display: none !important; }
    /* 内容区占满剩余高度（min-height:0 防溢出） */
    body[data-dshmu-touch] .VOzbGW_content,
    body[data-dshmu-touch] [role="dialog"] > div:last-child {
      flex: 1 1 auto !important;
      min-width: 0 !important; min-height: 0 !important;
      overflow-y: auto;
    }
    /* 插件清单卡片单列 */
    body[data-dshmu-touch] .qSYn7G_cards { grid-template-columns: 1fr !important; }
    `;

    /* ---------- 中英双语文案 ---------- */
    const STRINGS = {
      zh: { openSidebar: "打开侧边栏" },
      en: { openSidebar: "Open sidebar" },
    };
    let curLang = "zh";
    const t = (key) => (STRINGS[curLang] && STRINGS[curLang][key]) || STRINGS.zh[key] || key;

    const inject = ["slots"];

    // 双挂载防护（与宿主端同理）：组合若把本包挂载两次，浏览器花名册会把
    // 客户端 apply 跑两遍、重复注册每个 slot。模块级标记在整页生命周期内
    // 共享；刷新页面自然重置，无需 dispose 复位。
    let clientApplied = false;

    function apply(ctx) {
      if (clientApplied) return;
      clientApplied = true;

      /* ---------- 官方服务（可选获取） ---------- */
      const layout = ctx.get("layout");
      const theme = ctx.get("theme");
      const locale = ctx.get("locale");
      const drawerOpen = () => frame !== null
        && frame.hasAttribute("data-dshmu-mobile")
        && !frame.hasAttribute("data-sidebar-collapsed");
      const detailsOpen = () => frame !== null
        && frame.hasAttribute("data-dshmu-mobile")
        && !frame.hasAttribute("data-details-collapsed");
      const openDrawer = () => {
        if (layout === undefined) return;
        if (typeof layout.openSidebar === "function") layout.openSidebar();
        else if (typeof layout.toggleSidebar === "function" && !drawerOpen()) layout.toggleSidebar();
      };
      const closeDrawer = () => {
        if (layout === undefined) return;
        if (typeof layout.closeSidebar === "function") layout.closeSidebar();
        else if (typeof layout.toggleSidebar === "function" && drawerOpen()) layout.toggleSidebar();
      };
      const toggle = () => (drawerOpen() ? closeDrawer() : openDrawer());

      /* ---------- 语言（navigator 兜底 + locale 服务注册） ---------- */
      curLang = (typeof navigator !== "undefined" && (navigator.language || "")).toLowerCase().startsWith("zh")
        ? "zh" : "en";
      if (locale !== undefined) {
        try { locale.register("dshmu", STRINGS); } catch { /* locale API 差异时静默回退 */ }
      }

      /* ---------- 样式注入（有 theme 服务时不带黑白回退表，避免双重投影） ---------- */
      const tag = document.createElement("style");
      tag.dataset.plugin = "@local/dsh-client-ui-mobile-mono";
      tag.textContent = CSS + (theme !== undefined ? "" : monoFallbackCss());
      document.head.appendChild(tag);

      /* ---------- 黑白主题：官方 overrideTokens 优先 ---------- */
      let disposeLayer = null;
      let themeColorMeta = null;
      let onThemeChange = null;
      if (theme !== undefined && typeof theme.overrideTokens === "function") {
        disposeLayer = theme.overrideTokens("@local/dsh-client-ui-mobile-mono", MONO_TOKENS);
        themeColorMeta = document.createElement("meta");
        themeColorMeta.setAttribute("name", "theme-color");
        const syncThemeColor = (snapshot) => {
          const scheme = snapshot && snapshot.active && snapshot.active.colorScheme;
          themeColorMeta.setAttribute("content", scheme === "dark" ? "#000000" : "#ffffff");
        };
        syncThemeColor(theme.getTheme());
        document.head.appendChild(themeColorMeta);
        onThemeChange = syncThemeColor;
        ctx.on("theme/change", onThemeChange);
      } else {
        // 回退路径（组合里无 ui-theme 时）：静态 CSS 已并入样式表；
        // meta theme-color 跟随系统配色即可。
        themeColorMeta = document.createElement("meta");
        themeColorMeta.setAttribute("name", "theme-color");
        const media = typeof matchMedia !== "undefined"
          ? matchMedia("(prefers-color-scheme: dark)") : null;
        const sync = () => themeColorMeta.setAttribute("content", media && media.matches ? "#000000" : "#ffffff");
        sync();
        document.head.appendChild(themeColorMeta);
        if (media !== null) {
          onThemeChange = () => sync();
          media.addEventListener("change", onThemeChange);
        }
      }

      /* ---------- 移动检测器（UA 识别 + 手动强制开关） ----------
       * 只看浏览器标识：用户在手机上开"桌面版网站"且浏览器真的切换了
       * UA → 视为电脑显示桌面布局；桌面浏览器保持原版。
       * window.__dshmuForce === true 可强制开启（桌面预览/调试用）。 */
      let frame = null;
      let ro = null;
      let drawerMo = null;
      let retries = 0;
      // 手势状态与元素访问器（提前声明：syncDrawerState / applyMode 首次
      // 运行即会引用，避免 TDZ）
      const drawerEl = () => (frame && frame.isConnected ? frame.firstElementChild : null);
      const backdropEl = () => (typeof document === "undefined" ? null : document.querySelector(".dshmu-backdrop"));
      const matrixX = (el) => {
        try {
          const m = new DOMMatrixReadOnly(getComputedStyle(el).transform);
          return Number.isFinite(m.m41) ? m.m41 : 0;
        } catch { return 0; }
      };
      let drag = null;
      const findFrame = () => (typeof document === "undefined") ? null
        : (document.querySelector("div:has(> [data-shell-overlay])")
          || document.querySelector("[data-sidebar-collapsed], [data-details-collapsed]"));

      // 抽屉状态 → body 属性（滚动锁定）；frame 属性由官方 layout 服务维护
      // 同时是手势中断的自愈点：官方开合态变化时清掉拖拽视觉残留
      const resetDragVisual = () => {
        if (frame === null || !frame.isConnected) return;
        frame.style.removeProperty("--dshmu-progress");
        frame.removeAttribute("data-dshmu-dragging");
        const sb = drawerEl();
        if (sb !== null) { sb.style.transition = ""; sb.style.transform = ""; }
      };
      const syncDrawerState = () => {
        if (typeof document === "undefined") return;
        document.body.toggleAttribute("data-dshmu-drawer-open", drawerOpen() || detailsOpen());
        // 官方开合态发生了外部变化（点汉堡/遮罩/ESC 或手势收尾）：
        // 无条件终止任何进行中/泄漏的手势并清理视觉残留。
        // resetDragVisual 幂等，正常收尾路径重复执行无害。
        drag = null;
        resetDragVisual();
      };

      let detailsAutoClosed = false;
      const applyMode = () => {
        if (typeof window === "undefined" || typeof document === "undefined") return;
        if (!frame || !frame.isConnected) {
          frame = findFrame();
          if (!frame) {
            // 外壳可能仍在挂载：rAF 限时重试直到 frame 出现
            if (retries < 150 && typeof requestAnimationFrame !== "undefined") {
              retries += 1;
              requestAnimationFrame(applyMode);
            }
            return;
          }
          retries = 0;
          if (typeof ResizeObserver !== "undefined" && ro === null) {
            ro = new ResizeObserver(() => applyMode());
            ro.observe(frame);
          }
          // 监听官方开合属性，同步 body 滚动锁 + 景深状态
          if (drawerMo === null && typeof MutationObserver !== "undefined") {
            drawerMo = new MutationObserver(syncDrawerState);
            drawerMo.observe(frame, { attributes: true, attributeFilter: ["data-sidebar-collapsed", "data-details-collapsed", "data-dshmu-mobile"] });
          }
        }
        const ua = (typeof navigator !== "undefined" && navigator.userAgent) || "";
        const mobile = window.__dshmuForce === true
          || /Android|iPhone|iPod|iPad|Windows Phone|Mobile/i.test(ua);
        if (mobile) {
          // 首次进入移动模式：挂 arming 两帧禁用过渡，防止抽屉"滑出"闪动
          if (!frame.hasAttribute("data-dshmu-mobile")) {
            frame.setAttribute("data-dshmu-arming", "");
            requestAnimationFrame(() => requestAnimationFrame(() => {
              frame.removeAttribute("data-dshmu-arming");
              syncDrawerState();
            }));
          }
          frame.setAttribute("data-dshmu-mobile", "");
          document.body.setAttribute("data-dshmu-touch", "");
          // 详情栏只在首次进入移动模式时收起一次（桌面遗留的展开态）；
          // 之后用户主动打开（工具/统计）→ 右侧全宽抽屉，resize 不再强关
          if (!detailsAutoClosed && layout !== undefined) {
            layout.closeDetails();
            detailsAutoClosed = true;
          }
        } else {
          frame.removeAttribute("data-dshmu-mobile");
          document.body.removeAttribute("data-dshmu-touch");
          detailsAutoClosed = false;
        }
        syncDrawerState();
      };
      applyMode();
      const onResize = () => applyMode();
      window.addEventListener("resize", onResize);
      // 桌面调试入口（强制移动模式后手动重跑检测）
      window.__dshmuApplyMode = applyMode;

      /* ---------- ESC 关闭（详情抽屉优先，其次侧栏抽屉） ---------- */
      const closeDetails = () => {
        if (layout !== undefined && typeof layout.closeDetails === "function") layout.closeDetails();
      };
      const onKeyDown = (e) => {
        if (e.key !== "Escape") return;
        if (frame === null || !frame.isConnected) return;
        if (detailsOpen()) closeDetails();
        else if (drawerOpen()) closeDrawer();
      };
      window.addEventListener("keydown", onKeyDown);

      /* ---------- 触摸手势：左缘右滑开抽屉 / 抽屉上左滑关闭 ----------
       * 拖拽实时跟随（抽屉 transform 内联 + frame 上进度变量驱动遮罩
       * 透明度），松手按位移阈值或速度判定开合；全部状态走官方 layout
       * 服务收口。遮罩 display 永不写内联 —— 显隐只归 CSS 状态机管，
       * 即使 touchend 被系统吞掉也只残留透明度，官方态一变即自愈。 */
      const EDGE = 28; // 左缘热区宽度（px）
      const onTouchStart = (e) => {
        if (!frame || !frame.isConnected || !frame.hasAttribute("data-dshmu-mobile")) return;
        // 上一次手势若未正常收尾（touchend 被吞），先复位
        if (drag !== null) { resetDragVisual(); drag = null; }
        if (e.touches.length !== 1) return;
        const t = e.touches[0];
        const sb = drawerEl();
        if (sb === null) return;
        const w = sb.getBoundingClientRect().width || 320;
        const onDrawer = sb === e.target || sb.contains(e.target);
        if (drawerOpen()) {
          if (!onDrawer) return;
          drag = { x0: t.clientX, w, lastX: t.clientX, lastT: performance.now(), vx: 0 };
        } else if (t.clientX <= EDGE) {
          drag = { x0: t.clientX, w, lastX: t.clientX, lastT: performance.now(), vx: 0, fromClosed: true };
        }
        if (drag !== null) {
          sb.style.transition = "none";
          frame.setAttribute("data-dshmu-dragging", "");
        }
      };
      const onTouchMove = (e) => {
        if (drag === null) return;
        if (e.touches.length !== 1) { onTouchEnd(); return; }
        const t = e.touches[0];
        const now = performance.now();
        drag.vx = (t.clientX - drag.lastX) / Math.max(1, now - drag.lastT);
        drag.lastX = t.clientX; drag.lastT = now;
        const sb = drawerEl();
        if (sb === null) { drag = null; resetDragVisual(); return; }
        const w = drag.w;
        let x = t.clientX - drag.x0;
        if (drag.fromClosed) x -= w; // 关闭态从 -w 起步
        x = Math.min(0, Math.max(-w, x));
        sb.style.transform = `translateX(${x}px)`;
        // 遮罩进度：只写变量，不碰 display
        frame.style.setProperty("--dshmu-progress", String(Math.max(0, Math.min(1, 1 + x / w))));
        if (Math.abs(t.clientX - drag.x0) > 10 && e.cancelable) e.preventDefault();
      };
      const onTouchEnd = () => {
        if (drag === null) return;
        const { w, vx } = drag;
        const sb = drawerEl();
        let cur = 0;
        if (sb !== null) {
          cur = matrixX(sb);
          sb.style.transition = "";
          sb.style.transform = "";
        }
        drag = null;
        resetDragVisual();
        // 位移超 1/3 或向右甩动 → 打开；否则回闭
        if (vx > 0.5 || cur > -w / 3) openDrawer();
        else closeDrawer();
      };
      document.addEventListener("touchstart", onTouchStart, { passive: true });
      document.addEventListener("touchmove", onTouchMove, { passive: false });
      document.addEventListener("touchend", onTouchEnd);
      document.addEventListener("touchcancel", onTouchEnd);

      /* ---------- 汉堡图标 ---------- */
      const ICON = react.createElement("svg", {
        width: 18, height: 18, viewBox: "0 0 18 18",
        fill: "none", stroke: "currentColor", strokeWidth: 1.7,
        strokeLinecap: "round", "aria-hidden": true,
      }, react.createElement("path", { d: "M2.5 4.5h13M2.5 9h13M2.5 13.5h13" }));

      /* ---------- 组件（纯函数，无 hooks） ---------- */
      function Backdrop() {
        return react.createElement("div", {
          className: "dshmu-backdrop",
          "data-dshmu-backdrop": true,
          onClick: () => { if (detailsOpen()) closeDetails(); else closeDrawer(); },
          "aria-hidden": true,
        });
      }

      // 浮动汉堡：有活动（非 blank）会话时隐藏——那时会话头部
      // 自己的汉堡（header.actions 插槽）已经可见。
      function FloatingToggle(props) {
        let hasActiveSession = false;
        if (typeof props.useSessions === "function") {
          hasActiveSession = props.useSessions((st) => {
            const cur = st.current;
            return cur !== undefined && st.byId[cur] !== undefined && st.byId[cur].blank === false;
          });
        }
        if (hasActiveSession) return null;
        return react.createElement("button", {
          type: "button",
          className: "dshmu-toggle",
          onClick: openDrawer,
          "aria-label": t("openSidebar"),
          title: t("openSidebar"),
        }, ICON);
      }

      function HeaderToggle() {
        return react.createElement("button", {
          type: "button",
          className: "dshmu-header-toggle",
          onClick: toggle,
          "aria-label": t("openSidebar"),
          title: t("openSidebar"),
        }, ICON);
      }

      /* ---------- slot 注册 ---------- */
      const slots = ctx.get("slots");
      if (slots === undefined) return;
      ctx.effect(() => {
        const off1 = slots.inject("shell.overlay", () => slots.register({ name: "shell.overlay", id: "dshmu-backdrop", order: -100 }, Backdrop));
        const off2 = slots.inject("shell.overlay", () => slots.register({ name: "shell.overlay", id: "dshmu-toggle", order: -99 }, FloatingToggle));
        const off3 = slots.inject("conversation.session.header.actions", () => slots.register({ name: "conversation.session.header.actions", id: "dshmu-header-toggle", order: -20 }, HeaderToggle));
        return () => { off1(); off2(); off3(); };
      }, "dshmu-mono: slots");

      /* ---------- 全量清理（卸载 / HMR 热替换时回滚） ---------- */
      ctx.effect(() => {
        return () => {
          window.removeEventListener("resize", onResize);
          window.removeEventListener("keydown", onKeyDown);
          document.removeEventListener("touchstart", onTouchStart);
          document.removeEventListener("touchmove", onTouchMove);
          document.removeEventListener("touchend", onTouchEnd);
          document.removeEventListener("touchcancel", onTouchEnd);
          if (ro !== null) ro.disconnect();
          if (drawerMo !== null) drawerMo.disconnect();
          if (drag !== null) { resetDragVisual(); drag = null; }
          delete window.__dshmuApplyMode;
          if (frame !== null && frame.isConnected) {
            frame.removeAttribute("data-dshmu-mobile");
            frame.removeAttribute("data-dshmu-arming");
          }
          document.body.removeAttribute("data-dshmu-mobile");
          document.body.removeAttribute("data-dshmu-touch");
          document.body.removeAttribute("data-dshmu-drawer-open");
          if (disposeLayer !== null) { try { disposeLayer(); } catch { /* ignore */ } }
          if (onThemeChange !== null) {
            try { ctx.off("theme/change", onThemeChange); } catch { /* ignore */ }
          }
          if (themeColorMeta !== null) themeColorMeta.remove();
          tag.remove();
        };
      }, "dshmu-mono: teardown");
    }

    exports.apply = apply;
    exports.inject = inject;
    return module.exports;
  }
});
