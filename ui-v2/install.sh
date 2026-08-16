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

# 0. 若装过 v1，先移除其组合行（同包名，二者互斥）
if [ -f "$PATCH" ]; then
  sed -i '/- id: ui-mobile-mono$/{N;/name: .@local\/dsh-client-ui-mobile-mono./d}' "$PATCH" || true
fi

# 1. 复制插件包
mkdir -p "$(dirname "$DEST")"
rm -rf "$DEST"
mkdir -p "$DEST/lib"
cp "$SRC/package.json" "$DEST/"
cp "$SRC/lib/index.js" "$SRC/lib/client.js" "$DEST/lib/"
echo "plugin copied -> $DEST"

# 2. 添加组合行（移动抽屉布局 + 黑白主题 + 偏好设置卡）
if grep -q 'ui-mobile-mono-v2' "$PATCH" 2>/dev/null; then
  echo "cordis.patch.yml already contains the ui-mobile-mono-v2 row; nothing to add."
else
  [ -f "$PATCH" ] || touch "$PATCH"
  # 丢弃默认 profile 组合的裸 '[]' 空数组行，便于追加块状插入
  sed -i '/^\[\]$/d' "$PATCH"
  cat >> "$PATCH" <<'EOF'

# Mobile drawer layout + monochrome theme + prefs card (ui-v2, @local/dsh-client-ui-mobile-mono)
- insert:
    - id: ui-mobile-mono-v2
      name: '@local/dsh-client-ui-mobile-mono'
EOF
  echo "composition row added -> $PATCH"
fi

echo
echo "Done. Next steps:"
echo "  1. restart dsh (web profile)"
echo "  2. hard-refresh the browser (Ctrl/Cmd+Shift+R, or mobile reload)"
echo "Desktop stays untouched; mobile browsers get the drawer layout + B/W theme automatically."
