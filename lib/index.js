// 宿主端入口：本插件纯浏览器侧生效（移动抽屉布局 + 黑白主题），
// 宿主无需注册任何路由或服务。此文件仅为组合行的加载目标存在；
// 浏览器半边由 package.json 的 dsh.client manifest 自动注入
// （./client 导出经 DSH Web 模块系统加载）。
export function apply() {
  // 无宿主侧工作
}
