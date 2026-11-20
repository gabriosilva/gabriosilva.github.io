#!/usr/bin/env bash
# Builds the site and publishes it to the gh-pages branch, without GitHub
# Actions. In the repo's Settings > Pages, set the source to "Deploy from a
# branch", branch gh-pages, folder / (root).
#
#   npm run deploy
set -euo pipefail

cd "$(dirname "$0")/.."
REMOTE="$(git remote get-url origin)"
# GitHub blocks pushes that expose a private email, so always use the
# no-reply address here (override with GIT_AUTHOR_NAME / GIT_AUTHOR_EMAIL).
NAME="${GIT_AUTHOR_NAME:-Gabrio Lina}"
EMAIL="${GIT_AUTHOR_EMAIL:-20153552+gabriosilva@users.noreply.github.com}"
FROM="$(git rev-parse --short HEAD)"

npm run build

TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
cp -R out/. "$TMP"
touch "$TMP/.nojekyll" # serve the _next folder as it is

git -C "$TMP" init -q -b gh-pages
git -C "$TMP" add -A
git -C "$TMP" -c user.name="$NAME" -c user.email="$EMAIL" \
  commit -q -m "Deploy $FROM"
git -C "$TMP" remote add origin "$REMOTE"
git -C "$TMP" push --force origin gh-pages

echo "Published $FROM to gh-pages."

# Tell IndexNow (Bing, and the AI search built on it) that every page in the
# sitemap may have changed. Waits for GitHub Pages to serve the new build first.
SITE="https://$(cat public/CNAME)"
KEY_FILE="$(ls public | grep -E '^[0-9a-f]{32}\.txt$' | head -1)"
if [ -n "$KEY_FILE" ]; then
  KEY="${KEY_FILE%.txt}"
  sleep 45 # GitHub Pages takes a moment to publish the new build.
  for _ in $(seq 1 30); do
    [ "$(curl -s "$SITE/$KEY_FILE")" = "$KEY" ] && break
    sleep 10
  done
  URLS="$(grep -o '<loc>[^<]*' out/sitemap.xml | sed 's/<loc>//' |
    python3 -c 'import json,sys; print(json.dumps([l.strip() for l in sys.stdin if l.strip()]))')"
  CODE="$(curl -s -o /dev/null -w '%{http_code}' -X POST https://api.indexnow.org/indexnow \
    -H 'Content-Type: application/json; charset=utf-8' \
    -d "{\"host\":\"${SITE#https://}\",\"key\":\"$KEY\",\"keyLocation\":\"$SITE/$KEY_FILE\",\"urlList\":$URLS}")"
  echo "IndexNow: $CODE"
fi
