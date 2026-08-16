#!/usr/bin/env bash
# dsh-client-ui-mobile-mono 安装脚本
# 用法：./install.sh [profile-dir]   （默认：${DSH_HOME:-$HOME/.dsh}/profiles/web）
set -euo pipefail

PROFILE="${1:-${DSH_HOME:-$HOME/.dsh}/profiles/web}"
SRC="$(cd "$(dirname "$0")" && pwd)"
DEST="$PROFILE/node_modules/@local/dsh-client-ui-mobile-mono"
PATCH="$PROFILE/cordis.patch.yml"

echo "== dsh-client-ui-mobile-mono installer =="
echo "profile: $PROFILE"

[ -d "$PROFILE" ] || { echo "ERROR: profile directory not found: $PROFILE"; echo "Is DSH with the web profile installed? (expects ~/.dsh/profiles/web)"; exit 1; }

# 1. 复制插件包
mkdir -p "$(dirname "$DEST")"
rm -rf "$DEST"
mkdir -p "$DEST/lib"
cp "$SRC/package.json" "$DEST/"
cp "$SRC/lib/index.js" "$SRC/lib/client.js" "$DEST/lib/"
echo "plugin copied -> $DEST"

# 2. 添加组合行（移动抽屉布局 + 黑白主题）
if [ -f "$PATCH" ] && grep -q 'ui-mobile-mono' "$PATCH"; then
  echo "cordis.patch.yml already contains the ui-mobile-mono row; nothing to add."
else
  if [ -f "$PATCH" ]; then
    # 丢弃默认 profile 组合的裸 '[]' 空数组行，便于追加块状插入
    sed -i '/^\[\]$/d' "$PATCH"
  fi
  cat >> "$PATCH" <<'EOF'

# Mobile drawer layout + monochrome theme (@local/dsh-client-ui-mobile-mono)
- insert:
    - id: ui-mobile-mono
      name: '@local/dsh-client-ui-mobile-mono'
EOF
  echo "composition row added -> $PATCH"
fi

echo
echo "Done. Next steps:"
echo "  1. restart dsh (web profile)"
echo "  2. hard-refresh the browser (Ctrl/Cmd+Shift+R, or mobile reload)"
echo "Desktop stays untouched; mobile browsers get the drawer layout + B/W theme automatically."
