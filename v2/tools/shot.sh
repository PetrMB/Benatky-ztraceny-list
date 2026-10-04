#!/bin/bash
# tools/shot.sh <out.png> <hash>   — screenshot v2 přes tools/pano.html
CH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
DIR="$(cd "$(dirname "$0")" && pwd)"
perl -e "alarm shift; exec @ARGV" ${TO:-150} "$CH" --headless=new --disable-gpu --hide-scrollbars --window-size=1920,1080 --virtual-time-budget=${VT:-7000} \
  --enable-logging=stderr --v=0 --screenshot="$1" "file://$DIR/pano.html#$2" 2>&1 | grep -i "PERF\|JSERR\|\[BNJ\]" | grep -v "gpu\|GPU\|dbus\|Fontconfig" | head -20
