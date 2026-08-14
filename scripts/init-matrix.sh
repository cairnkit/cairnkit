#!/usr/bin/env bash
# Real projects, real installs, real compilers. The unit tests prove the plan is
# right; only this proves the files it writes actually work in someone's repo.
set -uo pipefail

# Scratch projects live outside the repo so a failed run cannot leave litter
# behind, and so nothing here is ever mistaken for a workspace package.
ROOT="${TMPDIR:-/tmp}/cairn-init-matrix"
CLI="$(cd "$(dirname "$0")/.." && pwd)/packages/cli/dist/bin.js"

if [ ! -f "$CLI" ]; then
  echo "Build the CLI first:  pnpm --filter @cairnkit/cli build"
  exit 1
fi
rm -rf "$ROOT"; mkdir -p "$ROOT"

PASS=0; FAIL=0
result() { # name, ok(0/1), detail
  if [ "$2" -eq 0 ]; then printf "  \033[32mPASS\033[0m  %-28s %s\n" "$1" "$3"; PASS=$((PASS+1));
  else printf "  \033[31mFAIL\033[0m  %-28s %s\n" "$1" "$3"; FAIL=$((FAIL+1)); fi
}

TSCONFIG='{"compilerOptions":{"target":"ES2022","lib":["dom","esnext"],"jsx":"preserve","module":"esnext","moduleResolution":"bundler","strict":true,"noEmit":true,"skipLibCheck":true,"paths":{"@/*":["./*"]}},"include":["**/*.ts","**/*.tsx"]}'

setup() { # name, deps-json, extra-dirs, tsconfig?
  local dir="$ROOT/$1"; mkdir -p "$dir"; cd "$dir"
  echo "{\"name\":\"$1\",\"private\":true,\"dependencies\":$2}" > package.json
  [ -n "${4:-}" ] && echo "$4" > tsconfig.json
  for d in $3; do mkdir -p "$d"; touch "$d/placeholder.tsx"; done
  echo "$dir"
}

check_ts() { # dir, name  — install deps init asked for, then compile
  local dir="$1" name="$2"; cd "$dir"
  local pkgs; pkgs=$(node "$CLI" init --dry-run 2>/dev/null | grep -oE '@cairnkit/[a-z]+' | sort -u | tr '\n' ' ')
  node "$CLI" init >/dev/null 2>&1

  # Without this, a run where init silently did nothing compiles clean and
  # reports a pass — which is exactly what happened the first time.
  local made; made=$(find . -name "cairn-provider.*" -not -path "./node_modules/*" | wc -l | tr -d ' ')
  if [ "$made" = "0" ]; then result "$name" 1 "init wrote nothing"; return; fi

  npm install $pkgs typescript@5 @types/react@19 @types/node --silent >/dev/null 2>&1
  local out; out=$(./node_modules/.bin/tsc --noEmit 2>&1 | head -3)
  [ -z "$out" ]; result "$name" $? "${out:-compiles ($made provider)}"
}

echo ""
echo "── TypeScript projects: generated code must compile ─────────────"

d=$(setup next-app '{"next":"15.5.23","react":"19.0.0","react-dom":"19.0.0"}' "app" "$TSCONFIG")
check_ts "$d" "next app router"

d=$(setup next-pages '{"next":"15.5.23","react":"19.0.0","react-dom":"19.0.0"}' "pages" "$TSCONFIG")
check_ts "$d" "next pages router"

d=$(setup next-src '{"next":"15.5.23","react":"19.0.0","react-dom":"19.0.0"}' "src/app" "$TSCONFIG")
check_ts "$d" "next app router (src/)"

# Both routers, both layouts. `detect` has always handled `src/pages`, but the
# matrix only ever covered three corners of that square — and the missing corner
# is the one where a wrong guess writes the provider somewhere the app cannot
# import it.
d=$(setup next-pages-src '{"next":"15.5.23","react":"19.0.0","react-dom":"19.0.0"}' "src/pages" "$TSCONFIG")
check_ts "$d" "next pages router (src/)"

d=$(setup rr7 '{"react":"19.0.0","react-dom":"19.0.0","react-router":"7.1.0"}' "src" "$TSCONFIG")
check_ts "$d" "react-router v7"

d=$(setup rr6 '{"react":"19.0.0","react-dom":"19.0.0","react-router-dom":"6.28.0"}' "src" "$TSCONFIG")
check_ts "$d" "react-router v6"

d=$(setup plain-react '{"react":"19.0.0","react-dom":"19.0.0"}' "src" "$TSCONFIG")
check_ts "$d" "react, no router"

# A React app laid out flat. Every react case above has a `src`, so nothing
# proved the no-src branch for anything other than Next — and that branch
# decides whether the scaffold lands in `walkthrough/` or `src/walkthrough/`.
d=$(setup react-flat '{"react":"19.0.0","react-dom":"19.0.0","react-router":"7.1.0"}' "components" "$TSCONFIG")
check_ts "$d" "react-router, no src/"

d=$(setup react18 '{"next":"14.2.15","react":"18.3.1","react-dom":"18.3.1"}' "pages" "$TSCONFIG")
check_ts "$d" "react 18 + next 14"

echo ""
echo "── JavaScript project: generated files must at least parse ──────"

d=$(setup js-app '{"react":"19.0.0","react-dom":"19.0.0","react-router-dom":"7.1.0"}' "src" "")
cd "$d"; node "$CLI" init >/dev/null 2>&1
npm install @babel/parser@7 --silent >/dev/null 2>&1
node --input-type=module -e "
import { parse } from '@babel/parser';
import { readFileSync, readdirSync } from 'node:fs';
const dir = 'src/walkthrough';
let bad = [];
for (const f of readdirSync(dir)) {
  const src = readFileSync(dir + '/' + f, 'utf8');
  try { parse(src, { sourceType: 'module', plugins: ['jsx'] }); }   // no TS plugin: JS must be JS
  catch (e) { bad.push(f + ': ' + e.message.split('\n')[0]); }
}
if (bad.length) { console.error(bad.join(' | ')); process.exit(1); }
" 2>/tmp/js.err
result "javascript (no TS syntax)" $? "$(head -c 120 /tmp/js.err 2>/dev/null || echo 'all files parse as JS')"

echo ""
echo "── Behaviour ────────────────────────────────────────────────────"

cd "$ROOT/next-app"
before=$(md5 -q walkthrough/anchors.ts)
node "$CLI" init >/dev/null 2>&1
after=$(md5 -q walkthrough/anchors.ts)
[ "$before" = "$after" ]; result "rerun does not clobber" $? "file unchanged"

cd "$ROOT/next-app"
out=$(node "$CLI" init 2>&1)
echo "$out" | grep -q "already in place"; result "rerun is a no-op" $? "reports nothing to do"

d=$(setup nopkg '{}' "" ""); cd "$d"; rm -f package.json
node "$CLI" init >/dev/null 2>&1
[ $? -ne 0 ]; result "refuses without package.json" $? "exits non-zero"

d=$(setup dryrun '{"next":"15","react":"19"}' "app" "$TSCONFIG"); cd "$d"
node "$CLI" init --dry-run >/dev/null 2>&1
[ ! -d walkthrough ]; result "--dry-run writes nothing" $? "no files created"

d=$(setup customdir '{"next":"15","react":"19"}' "app" "$TSCONFIG"); cd "$d"
node "$CLI" init --dir tours >/dev/null 2>&1
[ -f tours/anchors.ts ]; result "--dir is honoured" $? "tours/anchors.ts"

echo ""
echo "── check, against what init just wrote ──────────────────────────"

# The two commands are one workflow and were tested as if they were two. What a
# new user actually does is run init and then wire `cairn check` into CI, and
# nothing here proved that the second understands the layout the first chose.
#
# Uses the no-src project on purpose: `check` given no argument has to find the
# scaffold without being told, and "src" alone was once the only default — which
# threw ENOENT on exactly this shape of project.
cd "$ROOT/next-app"

node "$CLI" check >/dev/null 2>&1
[ $? -eq 1 ]; result "check fails on fresh scaffold" $? "anchors declared, none applied"

cat > app/placeholder.tsx <<'TSX'
import { anchor } from "@cairnkit/core";
import { anchors } from "@/walkthrough/anchors";

export default function Placeholder() {
  return (
    <main>
      <a {...anchor(anchors.nav.home)} href="/">Home</a>
      <button {...anchor(anchors.home.primaryAction)}>Upgrade</button>
    </main>
  );
}
TSX

node "$CLI" check >/dev/null 2>&1
[ $? -eq 0 ]; result "check passes once applied" $? "no argument, finds walkthrough/"

# The whole product promise: someone deletes the element in an unrelated PR and
# CI stops the deploy rather than a customer finding out.
cat > app/placeholder.tsx <<'TSX'
import { anchor } from "@cairnkit/core";
import { anchors } from "@/walkthrough/anchors";

export default function Placeholder() {
  return <main><a {...anchor(anchors.nav.home)} href="/">Home</a></main>;
}
TSX

out=$(node "$CLI" check 2>&1); code=$?
[ "$code" -eq 1 ] && echo "$out" | grep -q "home.primary-action"
result "check catches a deleted element" $? "exit 1, names the anchor"

echo ""
printf "  %d passed, %d failed\n\n" "$PASS" "$FAIL"
rm -rf "$ROOT"
[ "$FAIL" -eq 0 ]
