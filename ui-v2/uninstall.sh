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

if [ -f "$PATCH" ]; then
  # 移除本插件的组合块（注释行 + 两行插入块）
  sed -i '/# Mobile drawer layout + monochrome theme + prefs card (ui-v2, @local\/dsh-client-ui-mobile-mono)/,/^$/{d}' "$PATCH"
  sed -i '/- id: ui-mobile-mono-v2/{N;/name: .@local\/dsh-client-ui-mobile-mono./d}' "$PATCH"
  echo "composition rows removed from $PATCH"
fi

echo "Done. Restart dsh to fully unload."
