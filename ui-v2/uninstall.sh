#!/usr/bin/env bash
# dsh-client-ui-mobile-mono (ui-v2) 卸载脚本
# 用法：./uninstall.sh [profile-dir]   （默认：${DSH_HOME:-$HOME/.dsh}/profiles/web）
set -euo pipefail

PROFILE="${1:-${DSH_HOME:-$HOME/.dsh}/profiles/web}"
DEST="$PROFILE/node_modules/@local/dsh-client-ui-mobile-mono"
PATCH="$PROFILE/cordis.patch.yml"

echo "== dsh-client-ui-mobile-mono (ui-v2) uninstaller =="
echo "profile: $PROFILE"

rm -rf "$DEST"
echo "plugin removed: $DEST"

# 文件的第一个「非空、非注释」行（用于判定顶层形状）
first_entry_line() { awk 'NF && $1 !~ /^#/ { print; exit }' "$1" 2>/dev/null || true; }

# 从 patch 文件中精确移除本插件（v1/v2）的整条组合块：
# 注释行、`- insert:` 行、`- id:` 行、`name:` 行，一个不多一个不少；
# 同时清掉孤儿 '- insert:' 行（值非数组的残留——旧脚本 bug 留下的，
# 会让条目变成 {insert: null}，正是 dsh 启动崩溃的根源）
strip_rows() {
  awk '
  { n++; L[n] = $0; keep[n] = 1 }
  END {
    for (i = 1; i <= n; i++) {
      line = L[i]; del = 0
      # 本插件的注释行 / 单行 flow 写法
      if (line ~ /^[ \t]*#/ && line ~ /dsh-client-ui-mobile-mono/) del = 1
      if (line ~ /ui-mobile-mono/ && line ~ /@local\/dsh-client-ui-mobile-mono/) del = 1
      # 本插件的 id 行，连同其上一行 insert 行
      if (line ~ /^[ \t]*-[ \t]+id:[ \t]+ui-mobile-mono(-v2)?[ \t]*$/) {
        del = 1
        if (i > 1 && L[i-1] ~ /^[ \t]*-[ \t]+insert:[ \t]*$/) keep[i-1] = 0
      }
      # 本插件的 name 行（紧跟在其 id 行之后）
      if (i > 1 && L[i-1] ~ /^[ \t]*-[ \t]+id:[ \t]+ui-mobile-mono(-v2)?[ \t]*$/ \
          && line ~ /^[ \t]*name:/ && line ~ /@local\/dsh-client-ui-mobile-mono/) del = 1
      # 孤儿 insert 行：下一行不是缩进列表项 => 值为空，非法条目，删除
      if (line ~ /^[ \t]*-[ \t]+insert:[ \t]*$/) {
        nxt = (i < n) ? L[i+1] : ""
        if (nxt !~ /^[ \t]+-/) keep[i] = 0
      }
      if (del) keep[i] = 0
    }
    for (i = 1; i <= n; i++) if (keep[i]) print L[i]
  }
  ' "$1"
}

if [ -f "$PATCH" ]; then
  # 修改前先备份
  if [ -s "$PATCH" ]; then cp "$PATCH" "$PATCH.bak.$(date +%s)"; fi

  # 移除本插件 v1/v2 组合块（含孤儿 '- insert:' 行），归一化 CRLF 与裸 '[]' 行
  TMP="$(mktemp)"
  strip_rows "$PATCH" | sed -e 's/\r$//' -e '/^[[]][[:space:]]*$/d' > "$TMP"
  mv "$TMP" "$PATCH"

  # 保证结果一定是「顶层 YAML 数组」（dsh 硬性要求，
  # 空/仅注释会解析为 null，直接炸启动）
  LINE="$(first_entry_line "$PATCH")"
  case "$LINE" in
    "- "*)
      # 还有其他插件条目——保留
      echo "composition rows removed; other entries kept -> $PATCH"
      ;;
    "")
      # 已无任何条目——写回空数组，避免空/仅注释文件
      printf '[]\n' > "$PATCH"
      echo "composition rows removed; no entries left, reset to '[]' -> $PATCH"
      ;;
    *)
      # 剩余内容形状异常——重置为 '[]'（原内容已备份）
      printf '[]\n' > "$PATCH"
      echo "WARNING: leftover content had unexpected shape ('$LINE'); reset to '[]' (backup saved) -> $PATCH"
      ;;
  esac
else
  echo "no $PATCH found; nothing to clean"
fi

echo "Done. Restart dsh to fully unload."
