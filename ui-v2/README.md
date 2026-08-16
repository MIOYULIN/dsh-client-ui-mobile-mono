# ui-v2 — dsh-client-ui-mobile-mono v0.4.0

DSH Web 移动端插件的第二代界面。与仓库根目录的 v1（`lib/`）相比，ui-v2 重做了设置与各界面的视觉和交互。

## 与 v1 的差异

| 方面 | v1（根目录） | ui-v2 |
| --- | --- | --- |
| 设置弹窗导航 | 顶部横向标签 | 底部标签栏，拇指可达，刘海屏安全区自适应 |
| 用户偏好 | 无 | 自有「移动端界面」设置卡：黑白主题、抽屉宽度、左缘手势、隐藏模型名，`localStorage` 持久化并热应用 |
| 抽屉 | 固定宽度 | 可选 320 / 360 / 400 三档宽度 |
| 详情列定位 | 依赖官方 hash 类名 + 列序 | JS 列标记（`data-dshmu-*`）+ hash 无关 `[class*=detailsCol]` 双通道，点会话统计条即可展开右侧抽屉 |
| 模型选择器 | 原样 | 输入栏选择器隐藏模型名、只显示思考等级（可在设置卡关闭） |
| 会话统计 | 常驻一行文本 | 官方统计条移动端隐藏，收进 composer 下折叠胶囊；点开为双列统计卡（轮次/LLM/工具/TTFT/速度/缓存/tokens） |
| 视觉 | 基础灰阶 | Nothing OS × Linear 式黑白极简：发丝边框、点阵纹理、等宽功能标签 |
| 动效 | 仅抽屉位移 | 统一缓动动效系统：弹窗底部滑入、标签栏交错浮现、统计卡上滑展开+单元格级联、汉堡弹入、开关拇指回弹、分段/标签按压反馈；`prefers-reduced-motion` 时全线关停 |

## 安装

```bash
cd ui-v2
./install.sh            # 或：DSH_HOME=~/.dsh ./install.sh
```

卸载：`./uninstall.sh`。本地开发：

```bash
pnpm dsh web --patch /absolute/path/to/dsh-client-ui-mobile-mono/ui-v2/cordis.patch.yml
```

## 结构

```
ui-v2/
├── package.json   # @local/dsh-client-ui-mobile-mono @ 0.4.0
├── install.sh
├── uninstall.sh
├── cordis.patch.yml
└── lib/
    ├── index.js   # 宿主端入口（无宿主侧工作）
    └── client.js  # 浏览器端：抽屉布局 + 黑白主题 + 偏好设置卡
```

MIT License.
