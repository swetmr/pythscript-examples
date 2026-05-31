# PythScript — Examples & Benchmarks

[![examples checks](https://github.com/swetmr/pythscript-examples/actions/workflows/ci.yml/badge.svg)](https://github.com/swetmr/pythscript-examples/actions/workflows/ci.yml)

**Write frontends in Python. Ship JavaScript + WebAssembly.**

PythScript is a Rust-native compiler that turns Python source into JavaScript and WebAssembly with ~99% React + Next.js feature parity — so Python developers can build production web frontends without dealing with or debugging JavaScript.

This repository holds **public examples, documentation, and the dual-track benchmark** for PythScript. The core compiler is currently private — see [Access](#access) below.

- 📦 **Examples:** annotated `.ps` and `.psc` components in [`/examples`](./examples)
- 📊 **Benchmark + methodology:** [`/benchmarks`](./benchmarks)
- 📚 **Docs:** [`/docs`](./docs)

> A hosted playground and benchmark dashboard are on the roadmap; until then, everything here is reproducible locally against published compiler binaries.

---

## Proof, by scrolling

No server, no deploy, no compiler access needed — the evidence is checked into this repo:

1. **Input → output, side by side.** [`examples/Counter.ps`](./examples/Counter.ps) sits next to its real compiled [`examples/compiled/Counter.js`](./examples/compiled/Counter.js); [`examples/similarity.ps`](./examples/similarity.ps) next to its compiled [`similarity.js`](./examples/compiled/similarity.js) **+ a real 291-byte `similarity.wasm`** + the generated [JS↔WASM bridge](./examples/compiled/similarity.glue.js). Python in, JS + WASM out — see [`examples/compiled/`](./examples/compiled).
2. **Measured benchmark + parity, honest ranges.** The [dual-track benchmark](#the-dual-track-benchmark) reports LOC / token / bundle deltas as ranges across real code types — including where PythScript ships a *slightly larger* bundle. Functional parity is **102/102 tests green** ([run log](./proof/dual-track-parity-summary.txt)): each component built twice (React oracle + PythScript) through one shared contract. Nothing cherry-picked.
3. **Third-party-verifiable CI.** The `examples checks` badge above runs the repo's checks on every push (compiled-output drift + `.psc` round-trip on pre-expanded fixtures) — green without any private code.
4. **937 compiler tests passing.** `cargo test --workspace` on the private compiler repo: **937 passed, 0 failed** across 8 test layers (CPython differential, browser pixel parity, auto-route E2E, fuzz). Full per-crate summary (lines sum to 937): [`proof/cargo-test-summary.txt`](./proof/cargo-test-summary.txt) — *private compiler repo, access on request*.

---

## What is PythScript?

| | |
|---|---|
| **Headline** | Build React/Next.js apps in Python — ~99% feature parity, no JavaScript required |
| **Edge-native** | ~1 KB gzipped runtime, <50 ms cold start — fits the Cloudflare Workers / Deno / Vercel Edge envelope |
| **Auto-routing** | Pure-numeric functions compile to WebAssembly; everything else to JS — same source file, decided by signature analysis |
| **`.psc` compression** | Optional token-lean superset (`.psc`) that expands deterministically to canonical `.ps` — every `.psc` round-trips byte-identically and compiles to identical JS |
| **Production-grade** | 900+ passing compiler tests · 124K LOC/sec compile · runtime ~7,750× smaller than Pyodide |

PythScript is **not** an in-browser interpreter (no 5–10 MB Pyodide-style runtime) and **not** a limited transpiler. It is a real compiler: Python in, idiomatic JS + WASM out.

---

## Design Philosophy

Language is deeply connected to how people think and feel — syntax, semantics, and readability matter as much as aesthetics. PythScript is designed to eliminate the syntactic struggle and reduce cognitive load for Python developers, who can now pick up frontend work in far less time by learning React or Next.js rather than a new language (the framework matters more than the language).

The elegant way is usually also the more concise one. On a real application, PythScript compiles from ~9% fewer lines of code (up to ~34% on typed, logic-heavy code) and — depending on code character — from near-parity up to ~17% fewer source tokens than the equivalent TypeScript, while keeping JavaScript idioms such as optional chaining (`?.`) and nullish coalescing (`??`) available in Python syntax. An optional `.psc` compression layer adds further token savings on top. These efficiencies are a *bonus, not the headline* — the reason to reach for PythScript is staying in Python with React-grade parity.

The hybrid compilation to JS and WASM serves compute-heavy work and edge/serverless deployments, where the ~1 KB runtime fits envelopes that interpreter-based tools blow.

Finally, even if AI-generated code is the future, readability, efficiency, and aesthetics still matter.

---

## Hello, counter

A small component in Python ([`examples/Counter.ps`](./examples/Counter.ps)):

```python
from pyths.react import component, use_state


@component
def Counter():
    count, set_count = use_state(0)
    return div(
        button(on_click=lambda: set_count(count - 1), "-"),
        span(str(count)),
        button(on_click=lambda: set_count(count + 1), "+"),
    )
```

Compiles to a React-style JS component plus, where applicable, an auto-routed WASM module for numeric paths. The same component in compressed form is [`Counter.psc`](./examples/Counter.psc); the React+TS reference is [`Counter.tsx`](./examples/Counter.tsx).

More examples live in [`/examples`](./examples).

---

## The dual-track benchmark

We don't claim numbers — we measure them, in the open, against a real application.

The frontend of **papertopia** (a multi-agent app) is built **twice**: once in React/TypeScript (the *oracle* — built first, the known-good reference) and once in PythScript (the *system under test*). Every component pair is checked by a shared contract test, and the deltas are reported as **ranges across code types**, never a single cherry-picked number.

### Real-app aggregate (16 components)

| Metric | Result | Notes |
|---|---|---|
| Lines of code | **−8.7%** | range −1% … −40%; biggest wins on markup-heavy code |
| Source tokens (cl100k) | **−1.5%** | range −0.6% (presentational) … −16.8% (typed/logic-heavy) |
| Shipped bundle (min+gzip) | **+7.7%** | PythScript ships *slightly larger* here — see below |
| Functional parity | **102 / 102 tests green** | shared-contract React-vs-PythScript suite ([log](./proof/dual-track-parity-summary.txt)) |

Two synthetic corpora bracket the high end of the token range: a typed ops
dashboard (**−16.8%**) and a CRM with validation (**−14.3%**) — typed,
logic-heavy code is where Python's token edge is largest.

### How to read these numbers honestly

- **PythScript wins the source metrics** (lines of code always; tokens up to −17% on typed/logic-heavy code). On purely presentational, inline-style-heavy UI, source tokens are near parity.
- **PythScript ships a slightly larger bundle** for this app. We report this openly: call-site codegen wrappers survive minification. It's an upstream compiler improvement on our roadmap, not a config fix — and we do **not** claim a bundle-size reduction.
- **Token/LOC savings are a bonus, not the headline.** The reason to use PythScript is the developer experience: staying in Python with React-grade parity. The size deltas are a measured side effect, reported as ranges.

Full per-component tables and methodology: [`/benchmarks`](./benchmarks).

---

## WASM auto-routing, exercised in a real app

Auto-routing isn't a toy target — it runs in the app's similarity feature. A
pure-numeric `.ps` core (`dot` / `norm` / `cosine`, all `list[float] → float`)
compiles to WebAssembly via `pyths compile --target js+wasm`, while the
surrounding glue (dicts, strings, sorting) stays in JS:

- **3 functions → WASM**, emitted as a **291-byte** `.wasm` sidecar + JS loader
- `cosine` calls `dot` + `norm` **inside WASM** (a cross-WASM `call_indirect`)
- the WASM result matches a pure-JS reference ranking within `1e-9` (parity test)

Eligibility is opt-in via `--target {wasm, js+wasm, wasm-edge, wasi, deno}`
(default `js` ships no WASM). Eligible types are `int / float / bool / str` plus
`list / dict / tuple` of eligible elements — so `list[float]` numeric kernels
route to WASM; anything touching closures, classes, or `async` stays in JS.

---

## `.psc` — optional token-lean source

Every `.ps` can be written as a `.psc` (compressed PythScript): a superset with
import/decorator/kwarg/hook aliases and a project string dictionary, expanded
deterministically to canonical `.ps` before compilation.

The **Iron Rule**: every `.psc` must expand byte-identically to its `.ps`. On the
papertopia app, all **21** `.ps` files were ported to `.psc` and verified:

- **21 / 21** round-trip byte-identically (`pyths expand` == canonical `.ps`)
- **21 / 21** compile to **byte-identical JS** as their `.ps` source

`.psc` savings are codebase-dependent and additive on top of the source numbers
above — modest on already-terse, flat-form components, larger on
import-heavy or curried-form code. It's an opt-in layer (handy for AI-emitted
code at a tool boundary), never required.

**Reproduce it yourself:**

```bash
git clone https://github.com/swetmr/pythscript-examples
cd pythscript-examples
npm install
npm run benchmark      # LOC + byte deltas vs the React+TS oracles (no compiler needed)
npm run ci             # compiler-free checks (what the CI badge runs)
npm test               # .psc round-trip + compile — needs the published `pyths`
                       #   (set PYTHS_BIN or put pyths on PATH; skips cleanly if absent)
```

> **Tooling:** LOC + bytes measured by the bundled `scripts/benchmark.mjs` (zero
> dependencies). Token (cl100k) and shipped-bundle (min+gzip) numbers in
> [`/benchmarks`](./benchmarks) were measured with `tiktoken` + Vite against the
> private compiler. Deltas are `(pythscript − react) / react`; negative = PythScript smaller.

---

## Why PythScript exists

Millions of Python developers increasingly have to ship web frontends — and that means leaving Python for React and JavaScript they don't want to write or maintain. Existing Python-in-the-browser tools (Pyodide, Brython, py2wasm, RustPython) ship multi-megabyte interpreters and blow the edge-runtime envelope.

PythScript takes a different path: **compile** Python to JS + WASM ahead of time, ship a ~1 KB runtime, and meet React/Next.js parity — so Python developers get a first-class frontend story without changing languages.

---

## Repository layout

```
/examples
  Counter.{ps,psc,tsx}       — the hello-counter, all three tracks
  similarity.{ps,psc,ts}     — numeric core that auto-routes to WASM
  dashboard_500.{ps,psc}     — typed ops dashboard (high end of the token range)
  app_1000.{ps,psc}          — CRM + validation (high end of the token range)
  react-equivalent/          — hand-written React+TS oracles for the above
/benchmarks    — dual-track React-vs-PythScript measurements + methodology
/docs          — SKILL.md language guide, WASM + .psc reference
```

The two large synthetic samples (`dashboard_500`, `app_1000`) are the
typed/logic-heavy end of the token range (−16.8% / −14.3%); the papertopia
real-app components in `/benchmarks` are the presentational-to-mixed end. Together
they bracket the **2–20% codebase-dependent** band.

---

## Access

The **core PythScript compiler** is currently a private repository. If you're a design partner, investor, or evaluator and would like read access to the compiler source, open an issue on this repository and we'll follow up.

The examples and benchmarks in this repository are public and reproducible without the compiler source (they run against published compiler binaries).

---

## Status

PythScript is in active development toward a public v3.0 release. The compiler is production-grade (900+ tests, ~99% React + Next.js parity); the developer cloud, hosted playground, edge-deploy tooling, and broader library support are on the near-term roadmap.

For access or to follow along, open an issue on this repository.

---

## License

The contents of this repository (examples, benchmark code, docs) are released under the **MIT License** — see [`LICENSE`](./LICENSE). The core compiler is separately licensed; terms will be published with the v3.0 release.

---

*PythScript — let Python developers build frontends without dealing with or debugging JavaScript.*
