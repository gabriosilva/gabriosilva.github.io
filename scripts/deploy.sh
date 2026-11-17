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
