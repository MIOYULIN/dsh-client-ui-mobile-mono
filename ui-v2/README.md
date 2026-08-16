# ui-v2 — dsh-client-ui-mobile-mono v0.4.14

DSH Web 移动端插件的浏览器端实现：抽屉布局 + 黑白主题 + 偏好设置卡 + 折叠统计 + Session log 适配。

## 特性

- **移动端布局**（UA 检测，仅手机浏览器启用）：会话列独占全宽；侧栏 → 左侧覆盖抽屉（可选 320/360/400 三档宽度）；详情列 → 右侧全宽抽屉（JS 列标记 `data-dshmu-*` + hash 无关 `[class*=detailsCol]` 双通道，点会话统计条即可展开）；左缘右滑开抽屉、拖拽实时跟手、速度判定开合
- **设置弹窗**：全屏 sheet + 底部标签栏（拇指可达，刘海屏安全区自适应）；「移动端界面」偏好卡：黑白主题、抽屉宽度、左缘手势、隐藏模型名，`localStorage` 持久化并热应用
- **模型选择器**：隐藏模型名、只显示思考等级（可在设置卡关闭）
- **会话统计**：官方统计条移动端隐藏，收进 composer 下折叠胶囊；点开为双列统计卡（轮次/LLM/工具/TTFT/速度/缓存/tokens），尾部带 `MONO · v*` 版本脚注；展开上滑入场、收起下滑退出（可中断回放）
- **Session log（Trajectory 视图）**：视图标签间距收窄可横滑；工具栏按钮加高、搜索框独占一行防溢出；时序概览放行纵向手势（官方 `touch-action:none` 会卡死滚动）；账本行高提升为触摸目标、子工具行收紧缩进、工具行内容单列堆叠；检查器全宽 sheet 化并右缘滑入、关闭钮/标签行加大
- **上下文统计环（composer 工具行内）**：触发圆环放大为 34px 触摸目标带按压反馈；弹层由窄屏易裁切的小浮层转为固定定位底部 sheet（居中、最大 430px、含刘海安全区、贴 composer 上方），分段条/图例行加大，上滑入场动画
- **黑白主题**：90+ `--dsw-alias-*` / `--dsw-specific-*` token 灰阶覆盖，light 黑主色 / dark 白主色
- **动效**：统一缓动系统，覆盖到控件级——抽屉/详情列打开时内部交互块交错入场（会话项、按钮，限前 14 个保长列表性能）；二级菜单（listbox/menu）缩放弹入 + 选项级联浮现；设置弹窗切标签内容上滑过渡 + 插件清单卡片级联；弹窗底部滑入、标签栏交错、统计卡上滑展开、汉堡弹入、开关拇指回弹、按压反馈、Session log 检查器右缘滑入；`prefers-reduced-motion` 时全线关停
- **视觉**：Nothing OS × Linear 式黑白极简：发丝边框、点阵纹理、等宽功能标签

## 安装

```bash
cd ui-v2
./install.sh            # 或：DSH_HOME=~/.dsh ./install.sh
```

卸载：`./uninstall.sh`。本地开发：

```bash
pnpm dsh web --patch /absolute/path/to/dsh-client-ui-mobile-mono/ui-v2/cordis.patch.yml
```

预览：浏览器直接打开 `demo/index.html`（mock 运行时），点 `MOBILE` 体验抽屉与黑白主题，点 `EJECT` 验证卸载回滚。

## 结构

```
ui-v2/
├── package.json   # @local/dsh-client-ui-mobile-mono @ 0.4.14
├── install.sh
├── uninstall.sh
├── cordis.patch.yml
├── demo/
│   └── index.html # 独立演示页（mock harness 运行时）
└── lib/
    ├── index.js   # 宿主端入口（无宿主侧工作）
    └── client.js  # 浏览器端：抽屉布局 + 黑白主题 + 偏好设置卡 + 折叠统计
```

MIT License.
