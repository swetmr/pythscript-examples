#!/usr/bin/env node
// PythScript examples — source-size benchmark (LOC + bytes), zero dependencies.
//
// Reports PythScript (.ps) vs the React+TS oracle for each example pair, plus
// the .psc compression delta vs its own .ps. Token (cl100k) deltas require the
// published benchmark harness / tiktoken and are reported in /benchmarks.
import { readFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const ex = (p) => join(root, 'examples', p)

const loc = (f) =>
  readFileSync(f, 'utf8').split('\n').filter((l) => l.trim() !== '').length
const bytes = (f) => readFileSync(f).length
const pct = (a, b) => `${(((b - a) / a) * 100).toFixed(1)}%`

// [label, pythscript .ps, react oracle .tsx/.ts]
const PAIRS = [
  ['Counter', 'Counter.ps', 'Counter.tsx'],
  ['similarity', 'similarity.ps', 'similarity.ts'],
  ['dashboard_500', 'dashboard_500.ps', 'react-equivalent/Dashboard500.tsx'],
  ['app_1000', 'app_1000.ps', 'react-equivalent/App1000.tsx'],
]

console.log('\nPythScript vs React+TS — source size (negative = PythScript smaller)\n')
console.log(
  ['example'.padEnd(16), 'LOC ps'.padStart(8), 'LOC ref'.padStart(8), 'LOC Δ'.padStart(8),
   'B ps'.padStart(8), 'B ref'.padStart(8), 'B Δ'.padStart(8)].join(' '),
)
let any = false
for (const [label, ps, ref] of PAIRS) {
  if (!existsSync(ex(ps)) || !existsSync(ex(ref))) {
    console.log(`${label.padEnd(16)}  (missing file — skipped)`)
    continue
  }
  any = true
  const lp = loc(ex(ps)), lr = loc(ex(ref)), bp = bytes(ex(ps)), br = bytes(ex(ref))
  console.log(
    [label.padEnd(16), String(lp).padStart(8), String(lr).padStart(8), pct(lr, lp).padStart(8),
     String(bp).padStart(8), String(br).padStart(8), pct(br, bp).padStart(8)].join(' '),
  )
}

console.log('\n.psc compression vs canonical .ps (negative = .psc smaller)\n')
console.log(['example'.padEnd(16), 'B ps'.padStart(8), 'B psc'.padStart(8), 'B Δ'.padStart(8)].join(' '))
for (const [label, ps] of PAIRS) {
  const psc = ps.replace(/\.ps$/, '.psc')
  if (!existsSync(ex(ps)) || !existsSync(ex(psc))) continue
  const bp = bytes(ex(ps)), bc = bytes(ex(psc))
  console.log([label.padEnd(16), String(bp).padStart(8), String(bc).padStart(8), pct(bp, bc).padStart(8)].join(' '))
}

if (!any) {
  console.error('\nNo example pairs found.')
  process.exit(1)
}
console.log(
  '\nNote: cl100k token deltas + shipped-bundle (min+gzip) numbers are in /benchmarks' +
  '\n(they need the published compiler + tiktoken). LOC is the most consistent win;' +
  '\ntoken savings are codebase-dependent (~2–20%).\n',
)
