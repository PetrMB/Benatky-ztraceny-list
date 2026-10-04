#!/bin/bash
# Publikuje aktuální buildy do větve gh-pages (GitHub Pages → bnj.honeger.com)
set -e
cd "$(dirname "$0")"
T=$(mktemp -d)
mkdir -p "$T/v1"
cp v2/dist/index.html "$T/index.html"
cp dist/index.html "$T/v1/index.html"
echo "bnj.honeger.com" > "$T/CNAME"
touch "$T/.nojekyll"
URL=$(git remote get-url origin)
cd "$T"
git init -q -b gh-pages
git add -A
git -c user.name="$(git -C "$OLDPWD" config user.name)" -c user.email="$(git -C "$OLDPWD" config user.email)" commit -q -m "Nasazení hry $(date +%Y-%m-%d)"
git push -q -f "$URL" gh-pages
rm -rf "$T"
echo "gh-pages aktualizováno"
