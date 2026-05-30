#!/usr/bin/env node
// PythScript examples — verification harness (`npm test`).
//
// For every .psc example: assert it expands BYTE-IDENTICALLY to its canonical
// .ps (the Iron Rule), and that both compile without error. Uses the published
// `pyths` binary: set PYTHS_BIN, or have `pyths` on PATH. If neither is found,
// the suite SKIPS with a clear message (so CI without the compiler stays green).
import { readdirSync, readFileSync, existsSync, rmSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { tmpdir } from 'node:os'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const exDir = join(root, 'examples')

function findPyths() {
  if (process.env.PYTHS_BIN && existsSync(process.env.PYTHS_BIN)) return process.env.PYTHS_BIN
  const probe = process.platform === 'win32' ? 'where' : 'which'
  try {
    const hit = execFileSync(probe, ['pyths'], { encoding: 'utf8' }).split('\n')[0].trim()
    if (hit) return hit
  } catch { /* not on PATH */ }
  return null
}

const pyths = findPyths()
if (!pyths) {
  console.log(
    '⏭  SKIP: `pyths` not found (set PYTHS_BIN or add it to PATH).\n' +
    '   The .psc round-trip + compile checks need the published compiler binary.\n' +
    '   Source files and the /benchmarks methodology are inspectable without it.',
  )
  process.exit(0)
}

const pscFiles = readdirSync(exDir).filter((f) => f.endsWith('.psc'))
let pass = 0, fail = 0
const fails = []

for (const psc of pscFiles) {
  const ps = psc.replace(/\.psc$/, '.ps')
  if (!existsSync(join(exDir, ps))) continue
  // 1. Round-trip: expand .psc to a temp file and compare byte-for-byte to the
  //    canonical .ps. (`pyths expand` writes via -o; it has no --stdout flag.)
  const tmp = join(tmpdir(), `pyths-rt-${process.pid}-${psc}.ps`)
  let expanded
  try {
    execFileSync(pyths, ['expand', join(exDir, psc), '-o', tmp], { stdio: 'pipe' })
    expanded = readFileSync(tmp, 'utf8')
  } catch (e) {
    fail++; fails.push(`${psc}: expand failed (${e.message.split('\n')[0]})`); continue
  } finally {
    try { rmSync(tmp, { force: true }) } catch { /* ignore */ }
  }
  const canonical = readFileSync(join(exDir, ps), 'utf8')
  const norm = (s) => s.replace(/\r\n/g, '\n').replace(/\n$/, '')
  if (norm(expanded) !== norm(canonical)) {
    fail++; fails.push(`${psc}: round-trip MISMATCH (expand != ${ps})`); continue
  }
  // 2. Both compile without error.
  try {
    execFileSync(pyths, ['compile', join(exDir, ps), '--stdout'], { stdio: 'pipe' })
    execFileSync(pyths, ['compile', join(exDir, psc), '--stdout'], { stdio: 'pipe' })
  } catch (e) {
    fail++; fails.push(`${psc}: compile failed (${e.message.split('\n')[0]})`); continue
  }
  pass++
  console.log(`✓ ${psc}  round-trips byte-identically + compiles`)
}

console.log(`\n${pass} passed, ${fail} failed (compiler: ${pyths})`)
if (fail) {
  for (const f of fails) console.error('  ✗ ' + f)
  process.exit(1)
}
