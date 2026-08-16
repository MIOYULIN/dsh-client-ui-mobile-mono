# dsh-client-ui-mobile-mono

DeepSeek Harness（DSH）Web UI 的**移动端适配插件**：手机浏览器自动切换抽屉式布局 + 设置弹窗全屏化 + 详情面板抽屉化 + 折叠统计，并为所有端注入**黑白（单色）主题**。桌面端零影响。

插件本体在 [`ui-v2/`](./ui-v2/)，说明见 [ui-v2/README.md](./ui-v2/README.md)。

## 快速安装

```sh
git clone https://github.com/MIOYULIN/dsh-client-ui-mobile-mono.git
cd dsh-client-ui-mobile-mono/ui-v2
./install.sh                # 默认装进 ~/.dsh/profiles/web
```

重启 DSH，手机浏览器打开 Web UI 后**强制刷新**一次。

卸载：`./uninstall.sh`。本地调试：`pnpm dsh web --patch /绝对路径/dsh-client-ui-mobile-mono/ui-v2/cordis.patch.yml`。

## 一览

- 移动端：会话列独占全宽，侧栏/详情均改为覆盖式抽屉，左缘手势 + 拖拽跟手
- Session log：工具栏/账本/检查器全面移动适配，检查器全宽 sheet 化
- 设置弹窗：全屏 sheet + 底部标签栏，含「移动端界面」偏好卡（黑白主题/抽屉宽度/手势/隐藏模型名）
- 会话统计：收进 composer 下折叠胶囊，点开为双列统计卡（含版本脚注）
- 黑白主题：90+ 官方 token 灰阶覆盖，light/dark 双模式
- 统一缓动动效系统，`prefers-reduced-motion` 自动关停
- 预览：`ui-v2/demo/index.html`（mock 运行时，桌面打开点 `MOBILE` 即可体验）

## 兼容性

- DSH Web（`@deepseek-ai/dsh-client-runtime` / `dsh-client-ui-layout` 注入）
- 现代浏览器（依赖 `ResizeObserver` / `MutationObserver` / `DOMMatrixReadOnly` / `:has()`）

## License

MIT
