# Frontend dual-track benchmarks — rolling master

**This is the rolling aggregate across every frontend spec.** React `.tsx`/`.ts`
is the oracle (built first per component); PythScript `.ps` is the system under
test (production track). One row per shipped frontend spec; per-spec deep-dives
link out. Update this file at the end of **every** frontend spec.

**Tooling:** LOC `wc -l` · tokens `tiktoken` cl100k on source · compiled-JS
`pyths compile --stdout` (`.ps`) vs `esbuild --format=esm [--jsx=automatic]`
(`.tsx`/`.ts`), bytes of emitted JS. Deltas are `(ps − ref) / ref` — **negative
= PythScript smaller**.

> **Read the positioning first.** PythScript's primary value is a *Pythonic
> frontend for Python devs*; the size deltas are the expected bonus, reported as
> **ranges across codebases**, never a single number. The "why the delta varies"
> analysis is in the per-spec sections below.

### Update protocol (do this when a frontend spec lands)

1. Confirm the new components are dual-track (`.ps` + `.tsx`/`.ts`) and parity-green.
2. Run the per-pair LOC / cl100k-token / compiled-JS measurement.
3. Add one row to the **Per-spec master table** + a raw per-component subsection.
4. Re-derive the **papertopia real-app aggregate** row and the **cross-codebase
   range**.
5. If the spec unlocks a deferred axis (WASM, libs-bundle, `.psc`, cold-start),
   move it out of **Pending metric axes** into a measured section.

---

## Per-spec master table

Bundle Δ is **minified + gzipped** — what actually ships. Raw compiled-JS is a
poor bundle proxy (TSX minifies away ~39% vs `.ps` ~30%, so a raw `.ps` lead
reverses after minify); it's kept in the per-component tables only as the
upstream codegen number, not the bundle claim.

| Codebase (spec) | Components | Character | LOC Δ | cl100k tok Δ | bundle (min+gz) Δ |
|---|---:|---|---:|---:|---:|
| `front-papertopia-studio-ui` | 6 | presentational, inline-style-heavy | **−13.0%** (1258→1095) | **−0.6%** (15997→15906) | **+4.5%** (13490→14100) |
| `front-agent-run-streaming` | 10 | logic / async-SSE / hooks / Tier-7 exceptions | **−1.1%** (714→706) | **−4.5%** (5255→5021) | **+14.8%** (5939→6817) |
| **papertopia real-app aggregate** | **16** | both flavors combined | **−8.7%** (1972→1801) | **−1.5%** (21252→20927) | **+7.7%** (19429→20917) |
| `dashboard_500` *(pythscript synthetic)* | — | typed ops dashboard | −34.5% | −16.8% | n/m |
| `app_1000` *(pythscript synthetic)* | — | typed CRM + validation | −34.2% | −14.3% | n/m |

Raw-compiled-JS (pre-minify, not shipped) for reference: Studio −9.9%, Streaming
+10.0%, aggregate −5.1%. Minified-only (pre-gzip): aggregate +5.7%.

**Cross-codebase range (live):**

| Metric | Range | Driver |
|---|---|---|
| LOC (total) | **−1% … −40%** | flat-form PSX drops close-tags + `{cond && …}`; biggest on markup-heavy code |
| Tokens (cl100k, source) | **−0.6% … −17%** | rises with types/validation/logic; near parity for inline-style presentational UI |
| Bundle (min+gzip) | **+4.5% … +14.8%** (this app) | PythScript ships **slightly larger** here — codegen wrappers (`pyLen`/`pyGetItem`/`pyRange`, exception-unwrap) survive minification; raw-size lead does not |

---

## The two-flavor contrast (the comprehensiveness payoff)

The two papertopia specs sit at **opposite corners**, which is exactly why
benchmarking both is more honest than either alone:

| | Studio (presentational) | Streaming (logic/async) |
|---|---|---|
| **Source tokens** | flat (−0.6%) — inline style dicts dominate | **−4.5%** — type/hook/validation overhead the `.ps` side skips |
| **Raw compiled-JS** | −10% — PSX markup → tight `createElement` | +10% — exception unwrap, `pyRange`/`pyGetItem`, closures |
| **Shipped bundle (min+gz)** | **+4.5%** — raw lead lost to minify | **+14.8%** — wrappers survive minify |

So PythScript **wins source tokens** (LOC always, cl100k up to −17%) but **ships
a slightly larger bundle** for this app. A real app is a mix of both flavors;
the aggregate (−8.7% LOC, −1.5% tok, **+7.7% bundle**) is the honest whole-app
figure.

**Why raw compiled-JS is a bad bundle proxy** (the trap we corrected): the raw
`.tsx`-via-esbuild output is whitespace/JSX-heavy and **minifies away ~39%**,
while the `.ps` output minifies only ~30% — so a raw `.ps` *lead* (−9.9% Studio)
**reverses** after minification (+4.5% min+gz). Always report bundle as
**minified+gzipped**, never raw.

**Why the bundle is larger** (and what would shrink it): runtime helpers are
**imported** from `pyths-runtime`, so they are *not* in these numbers and ship
once regardless. The cost is **call-site verbosity** that does *not* dedupe —
`pyLen(events)` vs `events.length`, `pyGetItem(ev, "id")` vs `ev.id`,
`pyRange(n)` vs a native loop, and the `if (__exc instanceof X) { let e = … }`
exception-unwrap. These survive minify and gzip. The lever is **PythScript
codegen** (emit native forms when the type is statically known) — an upstream
issue, not a papertopia build-config fix. A precise net Vite bundle (two-entry,
shared `pyths-runtime` deduped once) is still Pending below and would nudge the
aggregate slightly *down* from +7.7%, not negative.

---

## Raw per-component measurements

### `front-agent-run-streaming` (added 2026-05-29)

10 dual-track pairs: 5 components + 2 pages + 1 hook + 2 lib modules. Shared
`api.ts`/`queryClient.ts` are infra (no `.ps`), excluded.

| File | LOC ref→ps | tok ref→ps | compiled-JS ref→ps |
|---|---|---|---|
| RunEventStream | 61→56 (−8%) | 398→387 (−3%) | 1598→1490 (−7%) |
| StageTimeline | 43→44 (+2%) | 295→321 (+9%) | 1212→1330 (+10%) |
| GapsPanel | 89→73 (−18%) | 690→544 (−21%) | 2402→2200 (−8%) |
| ReviewerVerdict | 99→86 (−13%) | 717→635 (−11%) | 2520→2678 (+6%) |
| PdfPreview | 40→36 (−10%) | 282→214 (−24%) | 988→1142 (+16%) |
| RunDetail (page) | 71→86 (+21%) | 596→628 (+5%) | 2994→2956 (−1%) |
| Runs (page) | 110→139 (+26%) | 793→962 (+21%) | 3808→4239 (+11%) |
| use_run_events (hook) | 142→129 (−9%) | 1021→835 (−18%) | 3139→4228 (+35%) |
| errors (lib) | 25→23 (−8%) | 173→173 (+0%) | 661→680 (+3%) |
| decorators (lib) | 34→34 (+0%) | 290→322 (+11%) | 697→1079 (+55%) |
| **Total** | **714→706 (−1.1%)** | **5255→5021 (−4.5%)** | **20019→22022 (+10.0%)** |

The compiled-JS column is **raw** (pre-minify). **Shipped bundle (min+gzip):
5939→6817 (+14.8%).** Notable: the pages (`RunDetail`/`Runs`) and
`decorators`/`use_run_events` carry the growth (async control flow + exception
classes + closures); data-reduction components (`GapsPanel`, `PdfPreview`) carry
the token wins.

### `front-papertopia-studio-ui` (added 2026-05-29)

Presentational, inline-style-heavy components — the near-parity (low) end of the
token range. Inline `style={...}` dicts dominate and cancel on both tracks, so
token savings are smallest here; the win shows up in LOC and markup structure.

| Component | LOC tsx→ps | tok tsx→ps | compiled-JS tsx→ps |
|---|---|---|---|
| primitives | 262→237 (−10%) | 2987→3000 (+0%) | 11401→9820 (−14%) |
| agents | 297→230 (−23%) | 3483→3407 (−2%) | 15363→12012 (−22%) |
| artifacts | 228→236 (+4%) | 3843→3808 (−1%) | 13832→13039 (−6%) |
| StudioAgents | 83→58 (−30%) | 952→888 (−7%) | 3599→3277 (−9%) |
| PaperView | 205→165 (−20%) | 2430→2467 (+2%) | 9874→8884 (−10%) |
| Papertopia (shell) | 183→169 (−8%) | 2302→2336 (+1%) | 7891→8771 (+11%) |
| **Total** | **1258→1095 (−13%)** | **15997→15906 (−0.6%)** | **61960→55803 (−9.9%)** |

The compiled-JS column is **raw** (pre-minify) and is the **only** metric that
flips sign after minification. **Shipped bundle (min+gzip): 13490→14100
(+4.5%)** — the raw −9.9% lead is an artifact of unminified JSX whitespace.

---

## All 7 CLAUDE.md benchmark metrics — status

| # | Metric | Aggregate | Status |
|---|---|---|---|
| 1 | LOC | **−8.7%** | ✅ measured |
| 2 | Tokens (cl100k) | **−1.5%** | ✅ measured |
| 3 | Bundle size (min+gzip) | **+7.7%** | ✅ measured (precise net Vite build pending) |
| 4 | Pixel parity | functional parity ✅ 84/84 Vitest; pixel-diff pending | ⏳ Percy/pixelmatch |
| 5 | Lighthouse (FCP/TTI/LCP) | expected parity (same React runtime) | ⏳ preview deploy + LH-CI |
| 6 | Cold start | not measured on papertopia (pythscript baseline: <50 ms / ~1.1 KB vs Pyodide 6.5 MB) | ⏳ edge-deploy (#12) |
| 7 | Memory footprint | expected parity (same runtime) | ⏳ profiling harness |

Headline: PythScript wins the **source** metrics (LOC, tokens) and is at
**rough parity / slightly larger** on shipped bundle for this app. Lead the
README with developer-experience + LOC/token savings; do **not** claim a bundle
reduction.

---

## `.psc` compression layer (added 2026-05-30)

Every `.ps` file now has a `.psc` (compressed PythScript) sibling — **21 files**.
`.psc` is a token-lean superset that expands deterministically to canonical `.ps`
before compilation. Authored per the `compressing-pythscript-to-psc` skill;
**every `.psc` round-trips byte-identically to its `.ps`** (the Iron Rule) and
**compiles to byte-identical JS** — verified for all 21.

| Metric (`.ps` → `.psc`, 21 files) | Total | Δ |
|---|---|---:|
| Source bytes | 87,865 → 86,265 | **−1.8%** |
| Source tokens (cl100k) | 23,288 → 23,151 | **−0.6%** |
| Round-trip byte-identical | 21 / 21 | ✅ |
| Compiles to identical JS | 21 / 21 | ✅ |

**Why the delta is modest here (honest read):** the skill's high-leverage tiers
don't fit this codebase. `R*`/`T*` **import presets** only round-trip when the
file imports the *full* preset — most papertopia files import a strict subset
(`from pyths.react import component, use_state`), so the preset would change the
import line and break the round-trip → written canonically instead. **Tier C
(PSX angle-bracket DSL)** expands to the *curried* call form `tag(p=v)(child)`,
but this codebase is **flat-form** `tag(p=v, child)` (per `feedback_psx_flat_form_default`)
→ Tier C would change the canonical form → skipped. So only the always-safe
aliases applied: decorators (`@component`→`@c`), hook calls (`use_state(`→`us(`),
kwarg positions (`style=`→`st=`, `on_click=`→`oc=`…), and `$API`/`$LOAD`/`$BACK`
dictionary literals. The `.psc` win is real but small on already-terse flat-form
`.ps`; it compounds with the `.ps`-vs-React source savings, and a curried-form or
preset-heavy codebase would compress substantially more.

Live proof: **`/psc`** route renders `Counter.psc` (imported as `.psc`,
expanded+compiled by `vite-plugin-pyths` in the real Vite build). `Counter.psc`
also passes the full dual-track Counter contract in-suite (15 tests).

---

## Parity

Both specs proven by the dual-track Vitest suite (one shared contract per
component pair). Full frontend suite: **84/84**.

---

## Pending metric axes (unlocked by future frontend specs)

| Axis | Blocker | Unlocked by |
|---|---|---|
| Net tree-shaken bundle Δ vs React+TS | two Vite entry points to isolate each track + shared `pyths-runtime` dedupe | benchmark-harness / edge-deploy spec |
| WASM codegen size/perf (numeric → `call_indirect`) | no numeric-heavy component yet | **paper-chunk-viewer + similarity** (#6) |
| React-library compat + lib-bundle | no chart/markdown lib in use yet | **chart-gen + writer + figure UI** (#8) |
| File-I/O boundary (multipart, blob) | no upload/export surface yet | **paper-upload + export** (#10) |
| `.psc` compression Δ | full-app `.psc` pipeline not run | **edge-deploy + .psc** (#12) |
| Cold start (`k6`/`vegeta`) | no edge deploy | **edge-deploy + .psc** (#12) |
| Lighthouse FCP/TTI/LCP · pixel parity · memory | preview deploy + browser tooling | benchmark-harness spec |
