#!/usr/bin/env bash
# dsh-client-ui-mobile-mono (ui-v2) 安装脚本
# 用法：./install.sh [profile-dir]   （默认：${DSH_HOME:-$HOME/.dsh}/profiles/web）
set -euo pipefail

PROFILE="${1:-${DSH_HOME:-$HOME/.dsh}/profiles/web}"
SRC="$(cd "$(dirname "$0")" && pwd)"
DEST="$PROFILE/node_modules/@local/dsh-client-ui-mobile-mono"
PATCH="$PROFILE/cordis.patch.yml"

echo "== dsh-client-ui-mobile-mono (ui-v2) installer =="
echo "profile: $PROFILE"

[ -d "$PROFILE" ] || { echo "ERROR: profile directory not found: $PROFILE"; echo "Is DSH with the web profile installed? (expects ~/.dsh/profiles/web)"; exit 1; }

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

# 本插件的组合块（输出到 stdout，调用方负责重定向 >> / >）
write_block() {
  cat <<'EOF'
# Mobile drawer layout + monochrome theme + prefs card (ui-v2, @local/dsh-client-ui-mobile-mono)
- insert:
    - id: ui-mobile-mono-v2
      name: '@local/dsh-client-ui-mobile-mono'
EOF
}

# 0. 归一化已有 patch 文件：
#    - 去 CRLF 换行符
#    - 删掉裸 '[]' 空数组行（默认 profile 的 cordis.patch.yml 就是 '[]'，
#      块状追加前必须去掉，否则 '[]' + '- insert:' 拼出非法 YAML）
#    - 移除本插件 v1/v2 残留组合块（含孤儿 '- insert:' 行，同包名互斥）
if [ -f "$PATCH" ]; then
  TMP="$(mktemp)"
  strip_rows "$PATCH" | sed -e 's/\r$//' -e '/^[[]][[:space:]]*$/d' > "$TMP"
  mv "$TMP" "$PATCH"
fi

# 1. 复制插件包
mkdir -p "$(dirname "$DEST")"
rm -rf "$DEST"
mkdir -p "$DEST/lib"
cp "$SRC/package.json" "$DEST/"
cp "$SRC/lib/index.js" "$SRC/lib/client.js" "$DEST/lib/"
echo "plugin copied -> $DEST"

# 2. 写入组合行——保证结果一定是「顶层 YAML 数组」（dsh 硬性要求，
#    空/仅注释会解析为 null 直接炸启动）
[ -f "$PATCH" ] || touch "$PATCH"
LINE="$(first_entry_line "$PATCH")"
case "$LINE" in
  "- "*)
    # 已有其他条目（列表形状）——安全追加
    printf '\n' >> "$PATCH"
    write_block >> "$PATCH"
    echo "composition row appended -> $PATCH"
    ;;
  "")
    # 空 / 仅注释——原内容备份后重写为本插件组合
    if [ -s "$PATCH" ]; then cp "$PATCH" "$PATCH.bak.$(date +%s)"; fi
    write_block > "$PATCH"
    echo "patch file was empty/comment-only; rewritten with our row (backup saved) -> $PATCH"
    ;;
  *)
    # 未知形状（顶层不是列表）——备份后重写，避免拼出非法 YAML
    cp "$PATCH" "$PATCH.bak.$(date +%s)"
    write_block > "$PATCH"
    echo "WARNING: $PATCH had unexpected top-level ('$LINE'); backed up and rewritten"
    ;;
esac

echo
echo "Done. Next steps:"
echo "  1. restart dsh (web profile)"
echo "  2. hard-refresh the browser (Ctrl/Cmd+Shift+R, or mobile reload)"
echo "Desktop stays untouched; mobile browsers get the drawer layout + B/W theme automatically."
