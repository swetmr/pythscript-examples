#!/usr/bin/env node
// CI checks that need NO private compiler — so the badge is honestly green.
//   1. Every example .ps has a .psc sibling and vice-versa.
//   2. Checked-in compiled output exists, is non-empty, and the .wasm is a
//      valid WebAssembly module (magic header \0asm).
//   3. The benchmark script runs clean.
// (The full `.psc` round-trip + compile suite needs the published `pyths`
//  binary; run `npm test` locally for that — see README.)
import { readdirSync, readFileSync, existsSync, statSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const ex = join(root, 'examples')
const comp = join(ex, 'compiled')
let fail = 0
const ok = (m) => console.log('✓ ' + m)
const bad = (m) => { console.error('✗ ' + m); fail++ }

// 1. .ps <-> .psc pairing
const ps = readdirSync(ex).filter((f) => f.endsWith('.ps'))
for (const f of ps) {
  const psc = f.replace(/\.ps$/, '.psc')
  existsSync(join(ex, psc)) ? ok(`${f} has a .psc sibling`) : bad(`${f} missing ${psc}`)
}

// 2. compiled output present + non-empty; .wasm header valid
const required = ['Counter.js', 'similarity.js', 'similarity.glue.js', 'similarity.wasm']
for (const f of required) {
  const p = join(comp, f)
  if (!existsSync(p) || statSync(p).size === 0) { bad(`compiled/${f} missing or empty`); continue }
  ok(`compiled/${f} present (${statSync(p).size} B)`)
}
const wasm = join(comp, 'similarity.wasm')
if (existsSync(wasm)) {
  const h = readFileSync(wasm).subarray(0, 4)
  const magic = h[0] === 0x00 && h[1] === 0x61 && h[2] === 0x73 && h[3] === 0x6d
  magic ? ok('similarity.wasm is a valid WebAssembly module (\0asm header)')
        : bad('similarity.wasm has no valid \0asm header')
}

// 3. benchmark runs
try {
  execFileSync(process.execPath, [join(root, 'scripts', 'benchmark.mjs')], { stdio: 'pipe' })
  ok('benchmark script runs clean')
} catch (e) {
  bad('benchmark script failed: ' + e.message.split('\n')[0])
}

console.log(`\n${fail === 0 ? 'ALL CHECKS PASSED' : fail + ' CHECK(S) FAILED'}`)
process.exit(fail === 0 ? 0 : 1)
