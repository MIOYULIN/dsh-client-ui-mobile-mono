# dsh-client-ui-mobile-mono

DeepSeek Harness（DSH）Web UI 的**移动端适配插件**：手机浏览器自动切换抽屉式布局 + 设置弹窗全屏化 + 详情面板抽屉化，并为所有端注入**黑白（单色）主题**。桌面端零影响。

> **ui-v2**：重做的第二代界面（底部标签栏设置弹窗 + 用户偏好设置卡 + 三档抽屉宽度），与参考项目完全区分，见 [`ui-v2/`](./ui-v2/)。两者同包名，只装一个。

## 特性

### 移动端布局（UA 检测，仅手机浏览器启用）

- 会话列独占全宽，侧栏改为**左侧覆盖式抽屉**（宽 `min(86vw, 360px)`）
- **边缘手势**：屏幕左缘（28px 热区）右滑拉开抽屉；抽屉上左滑关闭
- **拖拽跟随**：手指移动时抽屉实时跟手、遮罩透明度按进度联动，松手按位移（1/3 阈值）或甩动速度判定开合
- 多种关闭方式：点遮罩 / 汉堡按钮 / ESC / 抽屉外点击
- **详情面板（第三列）→ 右侧全宽覆盖抽屉**：用户点开工具/统计时全屏滑入，点遮罩或 ESC 关闭（官方 `data-details-collapsed` 驱动，子树常驻不卸载）
- **设置弹窗 → 全屏 sheet + 顶部横向导航**：官方 SettingsRoot 模态在手机上重排为全屏（188px 左侧导航变横向滚动条，内容区占满剩余高度，插件卡片单列）；hash 类名（`VOzbGW_*`/`qSYn7G_*`）与 `role=dialog` 结构双选择器兜底
- 打开期间锁定背景滚动；手势中断（touchend 被系统吞掉）自动自愈，无残留状态
- 安全区适配（刘海屏 `env(safe-area-inset-*)`）、禁橡皮筋滚动、输入框 ≥16px 防 iOS 聚焦缩放

### 黑白主题（所有端生效）

- light 模式：白底黑字，主操作色为纯黑
- dark 模式：黑底白字，主操作色为纯白
- 90+ 个 `--dsw-alias-*` / `--dsw-specific-*` token 走官方 `theme.overrideTokens()` 分层投影（含错误/警告/成功等功能色的灰阶化），热插拔自动回滚
- 浏览器地址栏 `meta theme-color` 随黑白底色同步

### 工程约定

- 开合状态全部经官方 `ctx.layout` 服务收口（`toggleSidebar` / `closeSidebar` / `closeDetails`）
- 注入控件（遮罩、汉堡）经官方 `slots.inject` / `register` 挂载到 `shell.overlay` 与 `conversation.session.header.actions` 插槽
- 布局锚点只用官方稳定 `data-*` 契约（`data-sidebar-collapsed` 等），不依赖 CSS modules 哈希类名
- 卸载 / HMR 时全量回滚（样式、token 层、meta、事件监听、DOM 属性）

## 安装

### 方式 1：脚本安装（推荐）

```sh
git clone https://github.com/MIOYULIN/dsh-client-ui-mobile-mono.git
cd dsh-client-ui-mobile-mono
./install.sh                    # 默认装进 ~/.dsh/profiles/web
# 或指定 profile：./install.sh ~/.dsh/profiles/你的profile
```

重启 DSH，手机浏览器打开 Web UI 后**强制刷新**一次（Ctrl/Cmd+Shift+R，或移动端清除缓存刷新）。

### 方式 2：DSH 源码仓库本地调试

```sh
# deepseek-harness 仓库根目录
pnpm dsh web --patch /绝对路径/dsh-client-ui-mobile-mono/cordis.patch.yml
```

### 验证

手机浏览器打开 Web UI：

- 会话页头部出现汉堡按钮（或无会话时左上角浮动按钮）
- 左缘右滑出抽屉 → 点遮罩 / 左滑 / ESC 关闭
- 整体为黑白灰，无彩色元素

桌面浏览器打开：与未装插件完全一致。

## 卸载

```sh
./uninstall.sh                  # 或 ./uninstall.sh ~/.dsh/profiles/你的profile
```

## 调试

| 入口 | 作用 |
|---|---|
| `window.__dshmuForce = true` | 桌面浏览器强制启用移动布局（配合 `window.__dshmuApplyMode()` 立即生效） |
| `window.__dshmuForce = false` | 恢复 UA 检测 |

抽屉/遮罩行为异常时先强刷——浏览器可能缓存了旧版 `client.js`。

## 目录结构

```
├── package.json          # @local/dsh-client-ui-mobile-mono manifest（dsh.client）
├── lib/
│   ├── index.js          # 宿主端入口（本插件纯浏览器侧，stub）
│   └── client.js         # 插件本体
├── demo/index.html       # 独立演示页（mock harness 运行时，可直接打开体验）
├── install.sh            # profile 安装脚本
├── uninstall.sh          # 卸载脚本
├── cordis.patch.yml      # 组合行参考
└── ui-v2/                # 第二代界面（底部标签栏设置 + 偏好设置卡），见 ui-v2/README.md
```

`demo/index.html` 复刻了 DSH AppFrame 三栏结构与 layout/theme/slots 服务的 mock，加载的就是正式版 `lib/client.js`——桌面打开后点 `MOBILE` 可直接预览抽屉与黑白主题，点 `EJECT` 可验证卸载回滚。

## 兼容性

- DSH Web（`@deepseek-ai/dsh-client-runtime` / `dsh-client-ui-layout` 注入）
- 现代浏览器（依赖 `ResizeObserver` / `MutationObserver` / `DOMMatrixReadOnly` / `:has()`）

## License

MIT
