# Correctness vs. TypeScript — verification examples

Three runnable artifacts that **substantiate** PythScript's "what survives TypeScript" claim. They exist so
the claim holds with **skeptical reviewers** — each one is honest about its boundary, because the argument
only works if we don't over-reach. Captured runtime output is in [`RESULTS.txt`](./RESULTS.txt); the
full breakdown is the [PythScript vs TypeScript essay](../../docs/pythscript-vs-typescript.md).

> **The claim, precisely:** TypeScript checks types at compile time, then **erases** them — so JavaScript's
> *runtime* footguns survive it. PythScript carries semantics **into the runtime**. These demos prove the
> runtime difference is real, not rhetorical. **We are not claiming "more type-safe than TypeScript"**
> (TS's static type system is richer than Python's hints) — only that *runtime semantics* differ.

| # | Deliverable | Proves | Status |
|---|---|---|---|
| **D1** | [`01_integer_precision.ps`](./01_integer_precision.ps) | Integer precision beyond 2⁵³ that JS `number` silently loses — exact via PythScript's `int` (BigInt on the JS path; i64 on the WASM path) | ✅ verified — `121932631112635269` (exact) vs JS `121932631112635260` |
| **D2** | [`02_fail_loud.ps`](./02_fail_loud.ps) | Compiled code **throws** on a missing key at runtime, not silent `undefined` | ✅ verified — throws `Error [KeyError]: 'email'` vs JS `undefined` |
| **D3** | [`03_bundle_cost.md`](./03_bundle_cost.md) | The bundle-size **cost** of those runtime guards — owned, not hidden | ✅ owned — part of the measured +7.7% bundle |

## D1 — Integer precision (the honest version)

**Demo it correctly.** The famous `0.1 + 0.2 ≠ 0.3` is a **floating-point** issue that **Python shares**
(Python floats are IEEE-754 too) — *do not* use it as the example. The genuine, JS-specific defect is
**no integer type**: JS `number` loses precision above `Number.MAX_SAFE_INTEGER` (2⁵³−1 ≈ 9.007e15).
PythScript has a real `int` that stays exact (Number/BigInt on the JS path; auto-routed WASM `i64` for
pure-numeric functions).

- **Result:** `big_product(123456789, 987654321)` → `121932631112635269` (exact); the same multiply in JS
  `number` → `121932631112635260` (wrong). Ship both so the contrast is undeniable.
- **Boundary (stated, not hidden):** `factorial(20)` is *coincidentally* exact in float64, so JS gets it
  right too — it is **not** a precision-loss demo. `i64` covers up to ~9.2e18; beyond that the int's
  arbitrary-precision promise is the BigInt path. Off the WASM path, plain emitted JS uses BigInt for exact
  integers.

## D2 — Fail-loud runtime semantics

Python **raises** (`KeyError`, `TypeError`); JavaScript **silently** returns `undefined` or coerces
(`1 + "a" → "1a"`). This only counts if compiled PythScript actually emits the runtime guard rather than
lowering `d[k]` to a plain JS property access.

- **Result:** running the compiled output **throws** `Error [KeyError]: 'email'`; the JS one-liner returns
  `undefined` / coerces silently.
- **Boundary:** the guarantee is for **PythScript-authored values** — PythScript **can't police the FFI
  boundary** (`JSON.parse`, DOM, third-party JS arrive untyped). And the guards have a cost → D3.

## D3 — The bundle-size cost (own it)

Fail-loud guards and runtime checks are what JS developers omit for speed — so they cost bundle size. The
[dual-track benchmark](../../README.md#the-dual-track-benchmark) already reports PythScript shipping a
**~+7.7%** larger bundle; D3 attributes its character and states the trade plainly: *"we chose runtime
safety; here's the price."* See [`03_bundle_cost.md`](./03_bundle_cost.md).

---

## Reproduce

```bash
pyths run 01_integer_precision.ps     # → 121932631112635269  (exact int)
pyths run 02_fail_loud.ps             # → throws KeyError: 'email'
node -e "console.log(123456789 * 987654321)"   # → 121932631112635260  (JS number, wrong)
```

*The honest line is "PythScript fixes the runtime classes TypeScript erases" — not "we beat TypeScript on
type-safety." Demonstrated and bounded as above, the claim survives a critical room.*
