# PythScript vs TypeScript — which JavaScript defects actually survive TypeScript

A design-philosophy essay: of JavaScript's well-known defects, **which persist after TypeScript** — i.e. where PythScript differentiates *beyond* TS, and where it honestly does not. Framed against the classic *["The Top 10 Things Wrong With JavaScript"](https://medium.com/javascript-non-grata/the-top-10-things-wrong-with-javascript-58f440d6b3d8)*.

## The one principle

**TypeScript is compile-time-only — its types are erased at runtime.** So every defect that is a *runtime* problem survives TypeScript; the *authoring/tooling* defects are largely gone. PythScript is different in kind: it carries semantics **into the runtime** — real arbitrary-precision `int`, true `i32/i64/f64` on the WASM-routed numeric path, and Python's strict fail-loud model — so it closes runtime classes TS structurally cannot.

In one line: *TypeScript checks, then erases; PythScript changes the runtime.*

## The table

Legend — ✗ persists · ◐ partially fixed (compile-time / authoring only) · ✓ fixed.

| # | JS complaint | After TypeScript | After PythScript |
|---|---|---|---|
| 1 | **No integer type** (precision loss past 2⁵³, `NaN`) | ✗ **Persists** — `number` is IEEE-754 float; `bigint` exists but isn't the default | ✓ **Integer type fixed** — real arbitrary-precision `int` (`2**53 + 1` → `9007199254740993`, exact; hybrid `Number`/`BigInt`); numeric code auto-routed to **WASM** runs on true `i32/i64/f64`. *Caveat: float literals stay IEEE-754 — `0.1 + 0.2` is still `0.30000000000000004`. PythScript fixes the missing **integer** type, not floating-point rounding.* |
| 2 | **Loose typing / coercion** (`[] + {}`) | ◐ **Partly** — caught at compile time, but erased at runtime; `==`, `any`, and JSON/DOM boundaries still coerce | ✓ **Avoided at the language level** — `[] + []` is `[]` (not `""`); `1 + "1"` is a compile-time type error, not `"11"` |
| 3 | **Automatic Semicolon Insertion** | ✗ **Persists** — TS is a JS superset; same ASI rules | ✓ **Gone** — you write Python (no ASI); the compiler emits correct JS |
| 4 | **Abused language / module hacks** | ✓ Fixed — ES/TS modules | ✓ Clean (Python imports) — *not a differentiator (dated complaint)* |
| 5 | **Implied globals / bad scoping** | ✓ Fixed — strict mode + `let`/`const` | ✓ Clean (explicit scope, `NameError`, no `var` hoisting) — *marginal differentiator* |
| 6 | **Silent failures** | ◐ **Partly** — compile-time typos caught; runtime silent `undefined`/`NaN` propagation remains | ✓ **Reduced** — Python fails loud: `items[10]` raises `IndexError`, `d["missing"]` raises `KeyError` (CPython-matching messages) instead of returning `undefined` |
| 7 | **Prototype inheritance / `this`** | ◐ **Authoring fixed** (`class`, generics); runtime prototype + `this`-binding quirks remain | ✓ Cleaner — real classes, explicit `self`, no `this`-rebinding footgun |
| 8 | **Callback hell / async mess** | ✓ Fixed by modern JS (`async/await`) | ✓ Parity — Python `async/await` — *not a differentiator* |
| 9 | **"Not actually Lisp"** (no macros / homoiconicity) | ✗ Not fixed | ✗ **Also not fixed** — Python isn't homoiconic either; *we don't claim this one* |
| 10 | **Framework instability / "transpile from a better language"** | ✗ Doesn't fix ecosystem churn | ◐ **PythScript's thesis** — churn persists for anyone targeting the JS ecosystem, but PythScript lets you *author* in a stable language |

> Every behavioral claim above is checked by the differential test suite (CPython semantic corpus + runtime-helper tests). See the repository's test layers.

## What this means (three buckets)

1. **Genuinely persist after TypeScript → the real "even vs TypeScript" wins:** **#1 integer precision** (TS keeps IEEE-754; PythScript has a real `int`), **#3 ASI** (you never write JS), and the **runtime halves of #2 and #6** — coercion and silent `undefined`/`NaN` at every untyped boundary, because TS erases types at runtime.
2. **Already solved by TS / modern JS → drop from any "vs TS" claim:** #4, #5, #7 (authoring), #8. Leading with these reads as dated.
3. **Don't claim at all:** #9 (Python isn't Lisp either); #10 is a *tailwind for the thesis*, not a defect PythScript fixes.

## Honesty guardrails

- Frame it as **"the classes TypeScript structurally can't fix,"** never "zero JS errors ever."
- The integer guarantee is the **integer type** + the WASM-routed numeric path. **Floating-point rounding is unchanged** — `0.1 + 0.2` is still imprecise; that is IEEE-754, not a language defect PythScript claims to fix.
- PythScript can't police the **FFI boundary** — data from the DOM, `JSON.parse`, or third-party JS is untyped at runtime; the strong-typing claim is for PythScript-authored code, not the wire.
- Claim the **mechanism**, not a flat "we fix JavaScript."

## The defensible framing

> *"TypeScript checks types at compile time, then erases them — so JavaScript's runtime footguns (the missing integer type, coercion, silent `undefined`/`NaN` at every untyped boundary) survive it. PythScript carries semantics into the runtime: a real arbitrary-precision `int`, true `i32/i64/f64` on the WASM path, Python's fail-loud errors. We fix the classes TypeScript can't."*
