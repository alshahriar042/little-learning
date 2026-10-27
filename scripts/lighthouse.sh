#!/usr/bin/env bash
# Runs mobile Lighthouse against a running `npm run preview` (http://127.0.0.1:4173) for key pages.
# Usage: CHROME_PATH=/path/to/chrome bash scripts/lighthouse.sh
cd "$(dirname "$0")/.."
mkdir -p .lighthouse
for u in "" "m/picture-words" "m/picture-words/animals" "m/picture-words/animals/animals-tiger" "m/picture-words/games"; do
  n=$(echo "page_$u" | tr '/' '_')
  npx -y lighthouse@12 "http://127.0.0.1:4173/$u" --chrome-flags="--headless=new --no-sandbox" \
    --output=json --output-path=".lighthouse/$n.json" --quiet >/dev/null 2>&1
  node -e '
    const r = require("./.lighthouse/'"$n"'.json");
    console.log("/'"$u"'", Object.entries(r.categories).map(([k, v]) => k + ":" + Math.round(v.score * 100)).join(" "));
    for (const a of Object.values(r.audits))
      if (a.score !== null && a.score < 0.9 && ["color-contrast","label-content-name-mismatch","button-name","image-alt","link-name","target-size","heading-order"].includes(a.id))
        console.log("  -", a.id, (a.details?.items ?? []).slice(0, 3).map((i) => i.node?.snippet).join(" | "));
  '
done
