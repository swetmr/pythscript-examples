# Correctness vs. TypeScript — verification examples

Runnable artifacts that **substantiate** PythScript's "what survives TypeScript" claim — each honest about
its boundary, because the argument only works if we don't over-reach.

**Why JavaScript appears in a "vs TypeScript" folder.** The competitor is **TypeScript**. JavaScript shows up
because TypeScript checks types at compile time, then **erases** them — TS-compiled code *is* plain JS at
runtime. So each demo is a **3-way** comparison: **PythScript**, what `tsc` does at **compile time**, and the
**runtime** value (identical for TypeScript and JavaScript, since TS erased). Captured output:
[`RESULTS.txt`](./RESULTS.txt). Full breakdown: the [PythScript vs TypeScript essay](../../docs/pythscript-vs-typescript.md).

> **The claim, precisely:** TypeScript erases its types at runtime, so JavaScript's *runtime* footguns survive
> it. PythScript carries semantics into the runtime. **We are not claiming "more type-safe than TypeScript"**
> (TS's static type system is richer than Python's hints) — only that *runtime semantics* differ, and that
> TS's compile-time guarantee disappears the moment data is `any` / from JSON / the DOM / a cast.

| # | Deliverable | PythScript | TypeScript | JavaScript |
|---|---|---|---|---|
| **D1** integer precision | [`01_integer_precision.ps`](./01_integer_precision.ps) · [TS contrast](./01_integer_precision.contrast.ts) | ✅ `121932631112635269` (exact) | ❌ `tsc` no error → runtime `…260` | ❌ `…260` |
| **D2** fail-loud | [`02_fail_loud.ps`](./02_fail_loud.ps) · [TS contrast](./02_fail_loud.contrast.ts) | ✅ throws `KeyError` | ◐ catches *typed* (`TS7053`); **erases** → `undefined` on `any`/JSON/DOM | ❌ `undefined` |
| **D3** bundle cost | [`03_bundle_cost.md`](./03_bundle_cost.md) | owns the measured +7.7% bundle (honest trade) | — | — |

## D1 — Integer precision (no integer type in JS *or* TS)

Not `0.1 + 0.2` — that is **floating-point**, which Python shares (don't claim it). The JS-specific defect is
**no integer type**: `number` loses precision above 2⁵³. **TypeScript adds no integer type** — `tsc --strict`
on [`01_integer_precision.contrast.ts`](./01_integer_precision.contrast.ts) reports **no error**, and the
erased JS prints the wrong value, identical to plain JavaScript. PythScript's real `int` (Number/BigInt on the
JS path; WASM `i64` on the auto-routed path) is the only one exact.

- **Boundary:** `factorial(20)` is *coincidentally* float-exact, so all three agree — it's **not** a
  precision-loss demo; `big_product` is.

## D2 — Fail-loud (the one where TypeScript *partly* helps — stated honestly)

- **Case A — precisely-typed value:** TypeScript **catches** `data["email"]` at compile time
  (`error TS7053: Property 'email' does not exist`). Credit where due. PythScript's `pyths check` does too.
- **Case B — `any` (JSON.parse / DOM / fetch / a cast):** TypeScript **erases** and does **not** catch — `tsc`
  reports no error and the runtime returns silent `undefined`, exactly like JS. PythScript **raises**
  `KeyError` at runtime regardless of the static type.

That's the honest line: *the runtime classes TypeScript erases*, not "more type-safe than TypeScript."

## D3 — The bundle-size cost (own it)

Those runtime guards cost bundle size — the [dual-track benchmark](../../README.md#the-dual-track-benchmark)
reports a measured **~+7.7%**. [`03_bundle_cost.md`](./03_bundle_cost.md) attributes its character and states
the trade plainly. We don't hide it.

---

## Reproduce

```bash
pyths run 01_integer_precision.ps                      # PythScript → 121932631112635269 (exact int)
pyths run 02_fail_loud.ps                              # PythScript → throws KeyError: 'email'
tsc --strict --noEmit *.contrast.ts                    # TypeScript: no error → it does NOT catch these
node -e "console.log(123456789 * 987654321)"           # TS/JS runtime → 121932631112635260 (wrong)
```
