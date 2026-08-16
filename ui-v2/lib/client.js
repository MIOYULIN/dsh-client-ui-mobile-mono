// 浏览器端模块 v2：移动端抽屉布局 + 黑白主题 + 可配置设置卡。
// 经 package.json 的 dsh.client manifest 由 DSH Web 模块系统加载。
//
// v2 与参考项目（dsh-client-ui-mobile）的差异化设计：
//  - 设置弹窗：底部标签栏（thumb-friendly），参考项目为顶部横向滚动条
//  - 自有设置卡：经官方 settings.general.item 插槽注入，提供
//    黑白主题开关 / 抽屉宽度 / 左缘手势开关，localStorage 持久化 + 热应用
//  - 抽屉宽度可调：CSS 变量 --dshmu-drawer-w 驱动（300/360/420）
//  - 官方稳定契约优先：data-* 属性 + 结构选择器兜底，hash 类名集中可替换
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
     * CSS：抽屉布局 + 注入控件 + 设置弹窗重排 + 自有设置卡样式。
     * ------------------------------------------------------------- */
    const CSS = `
    /* 移动端专属控件默认隐藏 */
    .dshmu-toggle, .dshmu-backdrop, .dshmu-header-toggle { display: none; }

    /* 抽屉接管：三列轨道归零（覆盖 AppFrame 的内联 grid 宽度） */
    [data-dshmu-mobile] { grid-template-columns: 0 minmax(0, 1fr) 0 !important; }

    /* 侧栏列 absolute 后脱离 grid 流，显式钉住中列列位 */
    [data-dshmu-mobile] > [data-dshmu-center],
    [data-dshmu-mobile] > div:nth-child(2) { grid-column: 2; grid-row: 1; }

    /* 详情列（官方子树常驻挂载）→ 右侧全宽覆盖抽屉；
       开合跟随官方 data-details-collapsed。
       定位双通道：tagColumns() 打的 data-dshmu-details 标记（抗官方
       hash 类名与列序变化）+ [class*=detailsCol]（hash 无关包含匹配）。
       注意：absolute 后不能保留 grid-column 钉扎 —— abspos 子元素的
       包含块是那个网格区域（第三列已归零宽），width:100% 会被钳到 0。 */
    [data-dshmu-mobile] > [data-dshmu-details],
    [data-dshmu-mobile] [class*="detailsCol" i] {
      position: absolute !important;
      top: 0; bottom: 0; right: 0; left: 0;
      width: 100% !important; max-width: 100% !important;
      z-index: 28;
      background: var(--dsw-alias-bg-base, #ffffff);
      border-left: 1px solid var(--dsw-alias-border-l1, rgb(0 0 0 / 8%));
      box-shadow: none; /* 关闭态零阴影：防出屏后阴影向屏内泄漏 */
      transform: translateX(102%);
      /* 只过渡 transform（合成器动画）；box-shadow 过渡会逐帧重绘 */
      transition: transform 320ms cubic-bezier(0.32, 0.72, 0, 1);
    }
    [data-dshmu-mobile]:not([data-details-collapsed]) > [data-dshmu-details],
    [data-dshmu-mobile]:not([data-details-collapsed]) [class*="detailsCol" i] {
      transform: translateX(0);
      box-shadow: -12px 0 40px rgb(0 0 0 / 18%);
    }

    /* 侧栏列 → 左侧离屏抽屉；宽度经 --dshmu-drawer-w 可配置（设置卡） */
    [data-dshmu-mobile] > [data-dshmu-sidebar],
    [data-dshmu-mobile] > div:first-child {
      position: absolute !important;
      top: 0; bottom: 0; left: 0;
      width: min(86vw, var(--dshmu-drawer-w, 360px)) !important;
      z-index: 30;
      border-right: 1px solid var(--dsw-alias-border-l1, rgb(0 0 0 / 8%));
      box-shadow: none;
      transform: translateX(-102%);
      transition: transform 320ms cubic-bezier(0.32, 0.72, 0, 1);
    }
    [data-dshmu-mobile]:not([data-sidebar-collapsed]) > [data-dshmu-sidebar],
    [data-dshmu-mobile]:not([data-sidebar-collapsed]) > div:first-child {
      transform: translateX(0);
      box-shadow:
        0 0 0 1px rgb(0 0 0 / 3%),
        8px 0 24px rgb(0 0 0 / 18%),
        28px 0 72px rgb(0 0 0 / 32%);
    }

    /* 进入移动模式首帧禁用过渡（防闪动） */
    [data-dshmu-mobile][data-dshmu-arming] > [data-dshmu-sidebar],
    [data-dshmu-mobile][data-dshmu-arming] > div:first-child,
    [data-dshmu-mobile][data-dshmu-arming] > [data-dshmu-center],
    [data-dshmu-mobile][data-dshmu-arming] > div:nth-child(2) { transition: none !important; }

    /* 抽屉打开时中列景深收缩（不用 will-change：常态驻层在低端机反噬） */
    [data-dshmu-mobile] > [data-dshmu-center],
    [data-dshmu-mobile] > div:nth-child(2) {
      transition: transform 320ms cubic-bezier(0.32, 0.72, 0, 1);
      transform-origin: left center;
    }
    [data-dshmu-mobile]:not([data-sidebar-collapsed]) > [data-dshmu-center],
    [data-dshmu-mobile]:not([data-sidebar-collapsed]) > div:nth-child(2) {
      transform: scale(0.96) translateX(3%);
    }

    /* 触屏隐藏拖拽手柄 */
    [data-dshmu-mobile] [data-side] { display: none !important; }

    /* 输入栏模型选择器：隐藏模型名（sweepModelTriggers 打标，偏好可关） */
    body[data-dshmu-touch] [data-dshmu-hide="model"] { display: none !important; }

    /* 遮罩：显隐完全由官方开合态状态机管辖。
       性能：不用 backdrop-filter —— 全屏 blur 在移动端 WebView 是抽屉
       卡顿的头号来源（每帧全屏重采样）；纯 rgba 层零开销。 */
    [data-dshmu-mobile] .dshmu-backdrop {
      display: none;
      position: absolute; inset: 0;
      z-index: 25;
      background: rgb(0 0 0 / 48%);
    }
    [data-dshmu-mobile]:not([data-sidebar-collapsed]) .dshmu-backdrop,
    [data-dshmu-mobile]:not([data-details-collapsed]) .dshmu-backdrop {
      display: block;
      animation: dshmu-fade-in 280ms ease;
    }
    [data-dshmu-mobile][data-dshmu-dragging] .dshmu-backdrop {
      display: block;
      opacity: 1; /* 拖拽透明度由 JS 直写 style.opacity（见 onTouchMove） */
      animation: none;
    }
    @keyframes dshmu-fade-in { from { opacity: 0; } to { opacity: 1; } }

    /* 抽屉打开期间锁定背景滚动。
       body 挂 data-dshmu-touch（绝不与 frame 的 data-dshmu-mobile 同名，
       否则遮罩后代选择器经 body 分支永远命中，关不掉）。 */
    body[data-dshmu-touch][data-dshmu-drawer-open] { overflow: hidden; }

    /* 浮动汉堡（hero / 无会话画面）。
       性能：不透明实底 + 静态阴影 —— backdrop-filter 会让首页动态背景
       每帧重采样该按钮后方区域，整页跟着掉帧（首页卡顿主因）。 */
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
      color: var(--dsw-alias-label-primary, #0f1115);
      box-shadow: 0 2px 10px rgb(0 0 0 / 10%);
      cursor: pointer; padding: 0;
      -webkit-tap-highlight-color: transparent;
      transition: transform 160ms cubic-bezier(0.32, 0.72, 0, 1);
    }
    [data-dshmu-mobile] .dshmu-toggle:active {
      transform: scale(0.92);
    }

    /* 会话头部汉堡 */
    [data-dshmu-mobile] .dshmu-header-toggle {
      display: inline-flex;
      align-items: center; justify-content: center;
      width: 34px; height: 34px;
      border: none; background: none;
      color: var(--dsw-alias-label-primary, #0f1115);
      border-radius: 10px;
      cursor: pointer; padding: 0;
      -webkit-tap-highlight-color: transparent;
      transition: transform 160ms cubic-bezier(0.32, 0.72, 0, 1), background 160ms ease;
    }
    [data-dshmu-mobile] .dshmu-header-toggle:active {
      transform: scale(0.9);
      background: var(--dsw-alias-interactive-bg-hover, rgb(0 0 0 / 6%));
    }

    /* 触摸优化 */
    body[data-dshmu-touch] { overscroll-behavior-y: none; -webkit-text-size-adjust: 100%; }
    body[data-dshmu-touch], body[data-dshmu-touch] button { touch-action: manipulation; }
    @media (max-width: 1023px) { textarea, input, select { font-size: 16px !important; } }

    /* ------------------------------------------------------------
     * 设置弹窗（官方 SettingsRoot，body 级 portal）v2 重排：
     * 全屏 + 大标题头 + 【底部标签栏】（拇指可达，区别于参考项目的
     * 顶部横条方案）。hash 前缀（VOzbGW_/qSYn7G_）跨版本可能变化，
     * 每条规则均带 role=dialog / nth-child 结构兜底。
     * 作用域 body[data-dshmu-touch]（弹窗在 frame 外）。
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
    /* 内容区在上（order 1），占满剩余高度 */
    body[data-dshmu-touch] .VOzbGW_content,
    body[data-dshmu-touch] [role="dialog"] > div:last-child {
      order: 1;
      flex: 1 1 auto !important;
      min-width: 0 !important; min-height: 0 !important;
      overflow-y: auto;
    }
    /* 导航 → 底部标签栏（order 2）：贴拇指、玻璃底、安全区让位 */
    body[data-dshmu-touch] .VOzbGW_nav,
    body[data-dshmu-touch] [role="dialog"] > div:first-child {
      order: 2;
      flex-direction: row !important;
      width: 100% !important; height: auto !important;
      min-width: 0 !important;
      border-right: none !important;
      border-top: 1px solid var(--dsw-alias-border-l1, rgb(0 0 0 / 8%));
      background: var(--dsw-alias-bg-layer-1, #ffffff);
      padding: 0 !important;
      padding-bottom: env(safe-area-inset-bottom, 0px) !important;
      gap: 0 !important;
    }
    body[data-dshmu-touch] .VOzbGW_navTitle,
    body[data-dshmu-touch] .VOzbGW_rail { display: none !important; }
    body[data-dshmu-touch] .VOzbGW_navList,
    body[data-dshmu-touch] [role="dialog"] > div:first-child > div:nth-child(2) {
      flex-direction: row !important;
      width: 100%;
      justify-content: space-around;
      padding: 6px 8px;
    }
    /* 标签单元：等分、纵向堆叠（官方纯文本亦居中）、mono 大写小字 */
    body[data-dshmu-touch] .VOzbGW_navCell {
      flex: 1 1 0;
      display: flex; flex-direction: column;
      align-items: center; justify-content: center;
      gap: 3px;
      padding: 7px 2px 9px !important;
      border-radius: 12px !important;
      font-family: ui-monospace, SFMono-Regular, Menlo, monospace !important;
      font-size: 10px !important;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      white-space: nowrap;
      min-width: 0;
    }
    /* 内容头：大标题 + 圆形关闭钮 */
    body[data-dshmu-touch] .VOzbGW_header { padding: 18px 18px 12px !important; }
    body[data-dshmu-touch] .VOzbGW_header .ht,
    body[data-dshmu-touch] [role="dialog"] .navTitle {
      font-size: 24px !important;
      font-weight: 800 !important;
      letter-spacing: -0.02em !important;
    }
    body[data-dshmu-touch] .VOzbGW_close {
      width: 34px !important; height: 34px !important;
      border-radius: 999px !important;
      border: 1px solid var(--dsw-alias-border-l2, rgb(0 0 0 / 12%)) !important;
      background: none !important;
    }
    body[data-dshmu-touch] .VOzbGW_options { padding: 4px 16px 28px !important; }
    /* 插件清单卡片单列 */
    body[data-dshmu-touch] .qSYn7G_cards { grid-template-columns: 1fr !important; }

    /* ------------------------------------------------------------
     * 自有设置卡（settings.general.item 注入，自带 dshmu-* 类，
     * 不依赖官方 hash；官方 token 优先，缺省回退灰阶）
     * ---------------------------------------------------------- */
    .dshmu-set-card {
      border: 1px solid var(--dsw-alias-border-l1, rgb(0 0 0 / 8%));
      border-radius: 18px;
      background: var(--dsw-alias-bg-layer-2, #fafafa);
      overflow: hidden;
      width: 100%;
      text-align: left;
      font: inherit;
      color: inherit;
      padding: 0;
      margin: 0;
    }
    .dshmu-set-head {
      display: flex; align-items: center; gap: 10px;
      padding: 14px 16px 10px;
    }
    .dshmu-set-glyph {
      width: 30px; height: 30px; flex: none;
      display: inline-flex; align-items: center; justify-content: center;
      border-radius: 10px;
      background: var(--dsw-alias-label-primary, #000000);
      color: var(--dsw-alias-label-primary-foreground, #ffffff);
      font-size: 14px; font-weight: 700;
    }
    .dshmu-set-head .t { flex: 1; min-width: 0; }
    .dshmu-set-head b { display: block; font-size: 13.5px; font-weight: 650; letter-spacing: -0.01em; }
    .dshmu-set-head span { display: block; font-size: 11px; margin-top: 1px; color: var(--dsw-alias-label-tertiary, #737373); }
    .dshmu-set-row {
      display: flex; align-items: center; gap: 12px;
      padding: 11px 16px;
    }
    .dshmu-set-row + .dshmu-set-row { border-top: 1px solid var(--dsw-alias-border-l1, rgb(0 0 0 / 8%)); }
    .dshmu-set-row .t { flex: 1; min-width: 0; }
    .dshmu-set-row b { display: block; font-size: 13px; font-weight: 600; }
    .dshmu-set-row span { display: block; font-size: 10.5px; margin-top: 1px; color: var(--dsw-alias-label-tertiary, #737373); }
    /* 开关（chunky 胶囊，黑白反转） */
    .dshmu-sw {
      width: 44px; height: 26px; flex: none;
      border-radius: 999px;
      background: var(--dsw-alias-bg-layer-3, #f0f0f0);
      border: 1px solid var(--dsw-alias-border-l2, rgb(0 0 0 / 12%));
      position: relative;
      cursor: pointer;
      transition: background 180ms cubic-bezier(0.32, 0.72, 0, 1), border-color 180ms;
      -webkit-tap-highlight-color: transparent;
    }
    .dshmu-sw::after {
      content: "";
      position: absolute; top: 2px; left: 2px;
      width: 20px; height: 20px; border-radius: 50%;
      background: var(--dsw-alias-label-primary, #000000);
      transition: left 180ms cubic-bezier(0.32, 0.72, 0, 1), background 180ms;
    }
    .dshmu-sw[data-on="true"] {
      background: var(--dsw-alias-button-primary-fill, #000000);
      border-color: transparent;
    }
    .dshmu-sw[data-on="true"]::after {
      left: 20px;
      background: var(--dsw-alias-brand-primary-invert, #ffffff);
    }
    .dshmu-sw:active { transform: scale(0.96); }
    /* 宽度分段选择器 */
    .dshmu-seg {
      display: inline-flex; flex: none;
      border: 1px solid var(--dsw-alias-border-l2, rgb(0 0 0 / 12%));
      border-radius: 11px;
      overflow: hidden;
      background: var(--dsw-alias-bg-layer-1, #ffffff);
    }
    .dshmu-seg button {
      border: none; background: none; cursor: pointer;
      padding: 7px 12px;
      font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
      font-size: 11px;
      color: var(--dsw-alias-label-tertiary, #737373);
      transition: background 140ms, color 140ms;
      -webkit-tap-highlight-color: transparent;
    }
    .dshmu-seg button + button { border-left: 1px solid var(--dsw-alias-border-l1, rgb(0 0 0 / 8%)); }
    .dshmu-seg button[data-on="true"] {
      background: var(--dsw-alias-label-primary, #000000);
      color: var(--dsw-alias-label-primary-foreground, #ffffff);
    }
    `;

    /* ---------- 中英双语文案 ---------- */
    const STRINGS = {
      zh: {
        openSidebar: "打开侧边栏",
        setCardTitle: "移动端 · Mobile UI",
        setCardDesc: "抽屉布局与黑白主题偏好（本机保存）",
        optMono: "黑白主题", optMonoDesc: "全站 UI 灰阶化，light 黑主色 / dark 白主色",
        optWidth: "抽屉宽度", optWidthDesc: "侧栏抽屉展开宽度",
        optEdge: "左缘滑开手势", optEdgeDesc: "屏幕左缘右滑打开抽屉",
        optHideModel: "隐藏模型名称", optHideModelDesc: "输入栏模型选择器只显示思考等级",
        wShort: "窄", wMid: "标准", wWide: "宽",
      },
      en: {
        openSidebar: "Open sidebar",
        setCardTitle: "Mobile UI",
        setCardDesc: "Drawer & monochrome preferences (stored locally)",
        optMono: "Monochrome", optMonoDesc: "Grayscale UI; black accent on light, white on dark",
        optWidth: "Drawer width", optWidthDesc: "Expanded sidebar drawer width",
        optEdge: "Edge swipe", optEdgeDesc: "Swipe from left edge to open drawer",
        optHideModel: "Hide model name", optHideModelDesc: "Composer model picker shows thinking level only",
        wShort: "N", wMid: "M", wWide: "W",
      },
    };
    let curLang = "zh";
    const t = (key) => (STRINGS[curLang] && STRINGS[curLang][key]) || STRINGS.zh[key] || key;

    const inject = ["slots"];

    // 双挂载防护
    let clientApplied = false;

    /* ---------- 用户偏好（localStorage 持久化，热应用） ---------- */
    const OPTS_KEY = "dshmu:opts";
    const DEFAULT_OPTS = { monochrome: true, drawerW: 360, edgeSwipe: true, hideModel: true };
    const loadOpts = () => {
      try { return { ...DEFAULT_OPTS, ...JSON.parse(localStorage.getItem(OPTS_KEY) || "{}") }; }
      catch { return { ...DEFAULT_OPTS }; }
    };

    function apply(ctx) {
      if (clientApplied) return;
      clientApplied = true;
      let opts = loadOpts();
      const saveOpts = () => {
        try { localStorage.setItem(OPTS_KEY, JSON.stringify(opts)); } catch { /* 隐私模式等 */ }
      };

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

      /* ---------- 语言 ---------- */
      curLang = (typeof navigator !== "undefined" && (navigator.language || "")).toLowerCase().startsWith("zh")
        ? "zh" : "en";
      if (locale !== undefined) {
        try { locale.register("dshmu", STRINGS); } catch { /* locale API 差异时静默回退 */ }
      }

      /* ---------- 样式注入 ---------- */
      const tag = document.createElement("style");
      tag.dataset.plugin = "@local/dsh-client-ui-mobile-mono";
      tag.textContent = CSS;
      document.head.appendChild(tag);

      /* ---------- 黑白主题：官方 overrideTokens 优先，可开关热切换 ---------- */
      let monoLayer = null;
      let themeColorMeta = null;
      let onThemeChange = null;

      const applyMonochrome = (on) => {
        if (theme === undefined || typeof theme.overrideTokens !== "function") return;
        if (on && monoLayer === null) {
          monoLayer = theme.overrideTokens("@local/dsh-client-ui-mobile-mono", MONO_TOKENS);
        } else if (!on && monoLayer !== null) {
          try { monoLayer(); } catch { /* ignore */ }
          monoLayer = null;
        }
      };

      if (theme !== undefined && typeof theme.overrideTokens === "function") {
        applyMonochrome(opts.monochrome);
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
        // 回退路径：无 theme 服务时静态 CSS 变量表 + meta 跟随系统
        if (opts.monochrome) tag.textContent = CSS + "\n" + monoFallbackCss();
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

      /* ---------- 移动检测器 ---------- */
      let frame = null;
      let ro = null;
      let drawerMo = null;
      let retries = 0;
      const drawerEl = () => (frame && frame.isConnected
        ? (frame.querySelector(":scope > [data-dshmu-sidebar]") || frame.firstElementChild)
        : null);
      const backdropEl = () => (typeof document === "undefined" ? null : document.querySelector(".dshmu-backdrop"));
      const matrixX = (el) => {
        try {
          const m = new DOMMatrixReadOnly(getComputedStyle(el).transform);
          return Number.isFinite(m.m41) ? m.m41 : 0;
        } catch { return 0; }
      };
      const findFrame = () => (typeof document === "undefined") ? null
        : (document.querySelector("div:has(> [data-shell-overlay])")
          || document.querySelector("[data-sidebar-collapsed], [data-details-collapsed]"));

      /* ---------- 列标记：给侧栏/中列/详情列打 data-dshmu-* 属性 ----------
       * 官方 hash 类名（如 pI_x6G_detailsCol）与列序随版本漂移，CSS 选择器
       * 双通道兜底之一即此标记。只认 grid 列子元素（跳过 shell.overlay
       * 挂载点等非列子节点），详情列优先按 *detailsCol* 类名包含匹配。 */
      let taggedCols = null; // [sidebar, center, details] 指纹：命中即跳过重打
      const tagColumns = () => {
        if (frame === null || !frame.isConnected || typeof document === "undefined") return;
        const cols = Array.from(frame.children).filter((n) => n.nodeType === 1
          && !n.hasAttribute("data-shell-overlay")
          && !n.classList.contains("dshmu-backdrop")
          && !n.classList.contains("dshmu-toggle"));
        if (cols.length < 2) { taggedCols = null; return; }
        let det = cols.find((n) => /detailscol/i.test(String(n.className)));
        if (det === undefined) {
          const nested = frame.querySelector("[class*='detailsCol' i]");
          if (nested !== null && !cols[0].contains(nested) && !cols[1].contains(nested)) det = nested;
        }
        if (det === undefined && cols.length >= 3) det = cols[2];
        // 指纹未变（同一组元素、同样角色）→ 跳过，避免高频摘挂属性触发重排
        if (taggedCols !== null
          && taggedCols[0] === cols[0] && taggedCols[1] === cols[1]
          && taggedCols[2] === (det || null)) return;
        for (const el of frame.querySelectorAll("[data-dshmu-sidebar], [data-dshmu-center], [data-dshmu-details]")) {
          el.removeAttribute("data-dshmu-sidebar");
          el.removeAttribute("data-dshmu-center");
          el.removeAttribute("data-dshmu-details");
        }
        cols[0].setAttribute("data-dshmu-sidebar", "");
        cols[1].setAttribute("data-dshmu-center", "");
        if (det !== undefined) det.setAttribute("data-dshmu-details", "");
        taggedCols = [cols[0], cols[1], det || null];
      };

      const resetDragVisual = () => {
        if (frame === null || !frame.isConnected) return;
        frame.removeAttribute("data-dshmu-dragging");
        const sb = drawerEl();
        if (sb !== null) { sb.style.transition = ""; sb.style.transform = ""; }
        const bd = backdropEl();
        if (bd !== null) bd.style.opacity = "";
      };
      const syncDrawerState = () => {
        if (typeof document === "undefined") return;
        tagColumns();
        document.body.toggleAttribute("data-dshmu-drawer-open", drawerOpen() || detailsOpen());
        drag = null;
        resetDragVisual();
      };

      // 偏好热应用：抽屉宽度写 frame 上的 CSS 变量（规则里 var() 消费）
      const applyWidth = () => {
        if (frame !== null && frame.isConnected) {
          frame.style.setProperty("--dshmu-drawer-w", `${opts.drawerW}px`);
        }
      };

      let detailsAutoClosed = false;
      const applyMode = () => {
        if (typeof window === "undefined" || typeof document === "undefined") return;
        if (!frame || !frame.isConnected) {
          frame = findFrame();
          if (!frame) {
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
          if (drawerMo === null && typeof MutationObserver !== "undefined") {
            drawerMo = new MutationObserver(syncDrawerState);
            // childList（不带 subtree）= 只看 frame 直接子级 = 列挂载/卸载，
            // 不会因抽屉内部内容刷新而触发
            drawerMo.observe(frame, {
              childList: true,
              attributes: true,
              attributeFilter: ["data-sidebar-collapsed", "data-details-collapsed", "data-dshmu-mobile"],
            });
          }
          tagColumns();
        }
        const ua = (typeof navigator !== "undefined" && navigator.userAgent) || "";
        const mobile = window.__dshmuForce === true
          || /Android|iPhone|iPod|iPad|Windows Phone|Mobile/i.test(ua);
        if (mobile) {
          const wasMobile = frame.hasAttribute("data-dshmu-mobile");
          if (!wasMobile) {
            frame.setAttribute("data-dshmu-arming", "");
            requestAnimationFrame(() => requestAnimationFrame(() => {
              frame.removeAttribute("data-dshmu-arming");
              syncDrawerState();
            }));
          }
          // 幂等写入：地址栏伸缩等 resize 风暴下不重复设同名属性，
          // 避免惊醒 MutationObserver 级联（首页卡顿帮凶）
          if (!wasMobile) frame.setAttribute("data-dshmu-mobile", "");
          if (!document.body.hasAttribute("data-dshmu-touch")) {
            document.body.setAttribute("data-dshmu-touch", "");
          }
          applyWidth();
          if (!detailsAutoClosed && layout !== undefined) {
            layout.closeDetails();
            detailsAutoClosed = true;
          }
        } else {
          frame.removeAttribute("data-dshmu-mobile");
          frame.style.removeProperty("--dshmu-drawer-w");
          document.body.removeAttribute("data-dshmu-touch");
          detailsAutoClosed = false;
        }
        syncDrawerState();
      };
      applyMode();
      const onResize = () => applyMode();
      window.addEventListener("resize", onResize);
      window.__dshmuApplyMode = applyMode;

      /* ---------- 输入栏模型选择器：隐藏模型名，只留思考等级 ----------
       * 官方 ModelSelect 触发器类名形如 _<hash>_trigger（hash 随版本变化），
       * 按该模式扫描触发器，再对触发器内匹配模型名特征的文本叶元素打
       * data-dshmu-hide="model"（CSS 隐藏）。偏好可关；关闭/卸载即摘标。 */
      const TRIGGER_CLASS_RE = /_[A-Za-z0-9]{4,12}_trigger\b/;
      const MODEL_NAME_RE = /(deepseek|reasoner|\bv\d+(\.\d+)*)/i;
      const hiddenByName = new Set();
      const unhideModelNames = () => {
        for (const el of hiddenByName) {
          if (el.isConnected) el.removeAttribute("data-dshmu-hide");
        }
        hiddenByName.clear();
      };
      const sweepModelTriggers = () => {
        if (typeof document === "undefined") return;
        if (!document.body.hasAttribute("data-dshmu-touch") || !opts.hideModel) {
          unhideModelNames();
          return;
        }
        unhideModelNames();
        for (const el of document.querySelectorAll('[class*="_trigger"]')) {
          if (typeof el.className !== "string" || !TRIGGER_CLASS_RE.test(el.className)) continue;
          for (const leaf of el.querySelectorAll("*")) {
            if (leaf.children.length > 0) continue;
            const text = (leaf.textContent || "").trim();
            if (text !== "" && MODEL_NAME_RE.test(text)) {
              leaf.setAttribute("data-dshmu-hide", "model");
              hiddenByName.add(leaf);
            }
          }
        }
      };

      // 自愈观察器（性能版）：只监听 childList（不含 characterData ——
      // 流式输出/秒级计时会高频触发），且仅当新增节点命中 trigger 模式
      // 才安排重扫；拖拽中一律跳过。菜单内点击（切模型/等级）由 click
      // 监听兜底 —— 这些路径覆盖了 trigger 重挂的全部场景。
      const TRIGGER_HIT = (n) => (typeof n.matches === "function" && n.matches('[class*="_trigger"]'))
        || (typeof n.querySelector === "function" && n.querySelector('[class*="_trigger"]') !== null);
      let sweepMo = null;
      let sweepTimer = 0;
      const scheduleSweep = () => {
        if (sweepTimer !== 0) return;
        sweepTimer = setTimeout(() => {
          sweepTimer = 0;
          if (drag === null) sweepModelTriggers();
        }, 250);
      };
      if (typeof MutationObserver !== "undefined") {
        sweepMo = new MutationObserver((muts) => {
          if (drag !== null) return;
          for (const m of muts) {
            if (m.addedNodes.length > 0) {
              for (const n of m.addedNodes) {
                if (n.nodeType === 1 && TRIGGER_HIT(n)) { scheduleSweep(); return; }
              }
            } else if (m.removedNodes.length > 0 && hiddenByName.size > 0) {
              scheduleSweep(); return;
            }
          }
        });
        sweepMo.observe(document.body, { childList: true, subtree: true });
        document.addEventListener("click", scheduleSweep, true);
        sweepModelTriggers();
      }

      /* ---------- ESC 关闭（详情优先） ---------- */
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

      /* ---------- 触摸手势（左缘右滑受偏好开关控制） ---------- */
      const EDGE = 28;
      const onTouchStart = (e) => {
        if (!frame || !frame.isConnected || !frame.hasAttribute("data-dshmu-mobile")) return;
        if (drag !== null) { resetDragVisual(); drag = null; }
        if (e.touches.length !== 1) return;
        const t0 = e.touches[0];
        const sb = drawerEl();
        if (sb === null) return;
        const w = sb.getBoundingClientRect().width || 320;
        const onDrawer = sb === e.target || sb.contains(e.target);
        if (drawerOpen()) {
          if (!onDrawer) return;
          drag = { x0: t0.clientX, w, lastX: t0.clientX, lastT: performance.now(), vx: 0 };
        } else if (opts.edgeSwipe && t0.clientX <= EDGE) {
          drag = { x0: t0.clientX, w, lastX: t0.clientX, lastT: performance.now(), vx: 0, fromClosed: true };
        }
        if (drag !== null) {
          sb.style.transition = "none";
          frame.setAttribute("data-dshmu-dragging", "");
        }
      };
      const onTouchMove = (e) => {
        if (drag === null) return;
        if (e.touches.length !== 1) { onTouchEnd(); return; }
        const t0 = e.touches[0];
        const now = performance.now();
        drag.vx = (t0.clientX - drag.lastX) / Math.max(1, now - drag.lastT);
        drag.lastX = t0.clientX; drag.lastT = now;
        const sb = drawerEl();
        if (sb === null) { drag = null; resetDragVisual(); return; }
        const w = drag.w;
        let x = t0.clientX - drag.x0;
        if (drag.fromClosed) x -= w;
        x = Math.min(0, Math.max(-w, x));
        sb.style.transform = `translateX(${x}px)`;
        const bd = backdropEl();
        if (bd !== null) bd.style.opacity = String(Math.max(0, Math.min(1, 1 + x / w)));
        if (Math.abs(t0.clientX - drag.x0) > 10 && e.cancelable) e.preventDefault();
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
        if (vx > 0.5 || cur > -w / 3) openDrawer();
        else closeDrawer();
      };
      document.addEventListener("touchstart", onTouchStart, { passive: true });
      document.addEventListener("touchmove", onTouchMove, { passive: false });
      document.addEventListener("touchend", onTouchEnd);
      document.addEventListener("touchcancel", onTouchEnd);

      /* ---------- 图标 ---------- */
      const ICON = react.createElement("svg", {
        width: 18, height: 18, viewBox: "0 0 18 18",
        fill: "none", stroke: "currentColor", strokeWidth: 1.7,
        strokeLinecap: "round", "aria-hidden": true,
      }, react.createElement("path", { d: "M2.5 4.5h13M2.5 9h13M2.5 13.5h13" }));

      /* ---------- 组件 ---------- */
      function Backdrop() {
        return react.createElement("div", {
          className: "dshmu-backdrop",
          "data-dshmu-backdrop": true,
          onClick: () => { if (detailsOpen()) closeDetails(); else closeDrawer(); },
          "aria-hidden": true,
        });
      }

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

      /* 自有设置卡：settings.general.item 注入的行内容完全自绘。
       * 组件无状态（纯函数 + 直接 DOM 更新），官方与 demo 均可挂载。 */
      function MobileUiSettingsRow() {
        const sw = (key, on) => react.createElement("span", {
          className: "dshmu-sw",
          "data-on": String(on),
          role: "switch",
          "aria-checked": String(on),
          tabIndex: 0,
          onClick: (e) => {
            const el = e.currentTarget || e.target;
            const next = el.getAttribute("data-on") !== "true";
            el.setAttribute("data-on", String(next));
            el.setAttribute("aria-checked", String(next));
            opts[key] = next;
            saveOpts();
            if (key === "monochrome") {
              if (theme !== undefined && typeof theme.overrideTokens === "function") applyMonochrome(next);
              else tag.textContent = next ? CSS + "\n" + monoFallbackCss() : CSS;
            }
            if (key === "drawerW") applyWidth();
            if (key === "hideModel") sweepModelTriggers();
          },
        });
        const segBtn = (val, label, on) => react.createElement("button", {
          type: "button",
          "data-on": String(on),
          onClick: (e) => {
            const el = e.currentTarget || e.target;
            const parent = el.parentNode;
            for (const b of parent.childNodes) {
              if (b.nodeType === 1) b.setAttribute("data-on", String(b === el));
            }
            opts.drawerW = val;
            saveOpts();
            applyWidth();
          },
        }, label);

        return react.createElement("div", { className: "dshmu-set-card" },
          react.createElement("div", { className: "dshmu-set-head" },
            react.createElement("span", { className: "dshmu-set-glyph", "aria-hidden": true }, "✳"),
            react.createElement("span", { className: "t" },
              react.createElement("b", null, t("setCardTitle")),
              react.createElement("span", null, t("setCardDesc")))),
          react.createElement("div", { className: "dshmu-set-row" },
            react.createElement("span", { className: "t" },
              react.createElement("b", null, t("optMono")),
              react.createElement("span", null, t("optMonoDesc"))),
            sw("monochrome", opts.monochrome)),
          react.createElement("div", { className: "dshmu-set-row" },
            react.createElement("span", { className: "t" },
              react.createElement("b", null, t("optWidth")),
              react.createElement("span", null, t("optWidthDesc"))),
            react.createElement("span", { className: "dshmu-seg" },
              segBtn(300, t("wShort"), opts.drawerW === 300),
              segBtn(360, t("wMid"), opts.drawerW === 360),
              segBtn(420, t("wWide"), opts.drawerW === 420))),
          react.createElement("div", { className: "dshmu-set-row" },
            react.createElement("span", { className: "t" },
              react.createElement("b", null, t("optEdge")),
              react.createElement("span", null, t("optEdgeDesc"))),
            sw("edgeSwipe", opts.edgeSwipe)),
          react.createElement("div", { className: "dshmu-set-row" },
            react.createElement("span", { className: "t" },
              react.createElement("b", null, t("optHideModel")),
              react.createElement("span", null, t("optHideModelDesc"))),
            sw("hideModel", opts.hideModel)));
      }

      /* ---------- slot 注册 ---------- */
      const slots = ctx.get("slots");
      if (slots === undefined) return;
      ctx.effect(() => {
        const off1 = slots.inject("shell.overlay", () => slots.register({ name: "shell.overlay", id: "dshmu-backdrop", order: -100 }, Backdrop));
        const off2 = slots.inject("shell.overlay", () => slots.register({ name: "shell.overlay", id: "dshmu-toggle", order: -99 }, FloatingToggle));
        const off3 = slots.inject("conversation.session.header.actions", () => slots.register({ name: "conversation.session.header.actions", id: "dshmu-header-toggle", order: -20 }, HeaderToggle));
        // v2：自有设置卡（官方通用设置页单行插槽）
        const off4 = slots.inject("settings.general.item", () => slots.register({ name: "settings.general.item", id: "dshmu-mobile-ui", order: 20 }, MobileUiSettingsRow));
        return () => { off1(); off2(); off3(); off4(); };
      }, "dshmu-mono: slots");

      /* ---------- 全量清理 ---------- */
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
          if (sweepMo !== null) sweepMo.disconnect();
          clearTimeout(sweepTimer);
          document.removeEventListener("click", scheduleSweep, true);
          unhideModelNames();
          if (drag !== null) { resetDragVisual(); drag = null; }
          delete window.__dshmuApplyMode;
          if (frame !== null && frame.isConnected) {
            frame.removeAttribute("data-dshmu-mobile");
            frame.removeAttribute("data-dshmu-arming");
            frame.style.removeProperty("--dshmu-drawer-w");
            for (const el of frame.querySelectorAll("[data-dshmu-sidebar], [data-dshmu-center], [data-dshmu-details]")) {
              el.removeAttribute("data-dshmu-sidebar");
              el.removeAttribute("data-dshmu-center");
              el.removeAttribute("data-dshmu-details");
            }
          }
          document.body.removeAttribute("data-dshmu-mobile");
          document.body.removeAttribute("data-dshmu-touch");
          document.body.removeAttribute("data-dshmu-drawer-open");
          if (monoLayer !== null) { try { monoLayer(); } catch { /* ignore */ } monoLayer = null; }
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
