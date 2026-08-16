# ui-v2 — dsh-client-ui-mobile-mono v0.4.10

DSH Web 移动端插件的浏览器端实现：抽屉布局 + 黑白主题 + 偏好设置卡 + 折叠统计。

## 特性

- **移动端布局**（UA 检测，仅手机浏览器启用）：会话列独占全宽；侧栏 → 左侧覆盖抽屉（可选 320/360/400 三档宽度）；详情列 → 右侧全宽抽屉（JS 列标记 `data-dshmu-*` + hash 无关 `[class*=detailsCol]` 双通道，点会话统计条即可展开）；左缘右滑开抽屉、拖拽实时跟手、速度判定开合
- **设置弹窗**：全屏 sheet + 底部标签栏（拇指可达，刘海屏安全区自适应）；「移动端界面」偏好卡：黑白主题、抽屉宽度、左缘手势、隐藏模型名，`localStorage` 持久化并热应用
- **模型选择器**：隐藏模型名、只显示思考等级（可在设置卡关闭）
- **会话统计**：官方统计条移动端隐藏，收进 composer 下折叠胶囊；点开为双列统计卡（轮次/LLM/工具/TTFT/速度/缓存/tokens），尾部带 `MONO · v*` 版本脚注
- **黑白主题**：90+ `--dsw-alias-*` / `--dsw-specific-*` token 灰阶覆盖，light 黑主色 / dark 白主色
- **动效**：统一缓动系统（弹窗底部滑入、标签栏交错浮现、统计卡上滑展开 + 单元格级联、汉堡弹入、开关拇指回弹、按压反馈）；`prefers-reduced-motion` 时全线关停
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
├── package.json   # @local/dsh-client-ui-mobile-mono @ 0.4.10
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
