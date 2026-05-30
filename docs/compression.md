# Compressed PythScript (`.psc`)

`.psc` is an opt-in compressed superset of PythScript designed for **token-efficient code emission by LLMs**. A `.psc` file expands deterministically into canonical `.ps` source before the normal compiler pipeline runs. Every Phase 1 guarantee — lexer, parser, type checker, codegen — applies unchanged to the expanded output.

If you're authoring code by hand, **keep using `.ps`**. `.psc` exists so AI agents emitting code through a token-constrained tool boundary can ship fewer tokens per equivalent program.

## Why `.psc`

PythScript already saves **−15.1% tokens** versus equivalent React+TS source on the cl100k corpus (see `technical_summary.md` §2.4). `.psc` adds **another 8.0% cl100k savings / 18.7% byte savings** on top, measured across a 34,486-byte React + CRM benchmark corpus.

The savings come from five orthogonal tiers, each optional and individually disable-able:

| Tier | What it compresses | Example |
|------|---|---|
| **A** | Import presets + decorator aliases | `R*` → `from pyths.react import component, use_state, …` |
| **B** | Kwarg-position aliases + hook-call shorthand | `oc=` → `on_click=`, `us(` → `use_state(` |
| **C** | PSX tag-DSL | `<div .foo>{x}</div>` → `div(className="foo")(x)` |
| **D** | PySON JSON-AST | machine-readable program shape for tool-use |
| **Dictionary** | `$NAME` string-literal aliases | `$c1` → `"#9ca3af"`, `$pad` → `"padding"` |

## Quick start

Save a file with the `.psc` extension and pass it to `pyths compile`:

```python
# greeting.psc
R*

@c
def Greeting():
    name, set_name = us("world")
    return <div .greeting>
        <h1>{f"Hello, {name}"}</h1>
        <button oc=(lambda: set_name("PythScript"))>{"Switch"}</button>
    </div>
```

```bash
pyths compile greeting.psc -o greeting.js
```

The CLI auto-detects the `.psc` extension, runs the expander pipeline, then feeds canonical PythScript into the existing parse → codegen chain. Output is identical to what you'd get by writing the canonical form by hand.

To see what `.psc` expands to without compiling:

```bash
pyths expand greeting.psc            # to stdout
pyths expand greeting.psc -o greeting.ps   # to file
```

This is the recommended workflow for AI agents that emit `.psc`: a human can `pyths expand` to verify what the compiler will actually see before trusting AI-generated compressed source.

## The `--expand` flag

The CLI's `--expand` flag controls when the expander runs. Default is `auto`.

| Mode | `.ps` input | `.psc` input |
|------|---|---|
| `auto` *(default)* | Pass through unchanged | Expand, then compile |
| `always` | Expand, then compile | Expand, then compile |
| `never` | Pass through unchanged | Pass through (likely fails to parse) |

```bash
pyths compile foo.psc --expand=never    # Debug raw .psc lexing
pyths compile foo.ps  --expand=always   # Test alias sugar in a canonical file
```

The `auto` default is the load-bearing modularity guarantee: **if you don't write `.psc`, the expander never touches your code**. There is no behavior change for existing `.ps` projects after this layer landed.

## Tier A: import presets and decorator aliases

A preset marker that occupies a whole line expands to a canonical import statement:

| Marker | Expands to |
|---|---|
| `R*` | `from pyths.react import component, use_state, use_effect, use_callback, use_memo` |
| `R+` | (with `forwardRef`, `memo`, `Suspense`, `lazy`) |
| `T*` | `from dataclasses import dataclass` |
| `T+` | `from dataclasses import dataclass, Field` |
| `A*` | `from pyths.asyncio import gather, sleep` |
| `D*` | `from pyths.dom import query, query_all, get_element_by_id, set_text, get_text, add_event_listener` |
| `W*` | `from pyths.web import handler, Response` |

Decorator aliases work at the `@` slot:

| Alias | Canonical |
|---|---|
| `@c` | `@component` |
| `@d` | `@dataclass` |
| `@v` | `@validator` |
| `@h` | `@handler` |
| `@k` | `@check` |

Call forms work too: `@d(coerce=True)` expands to `@dataclass(coerce=True)`.

## Tier B: kwarg-position aliases and hook shorthand

These substitute **only** in function-call argument position (after `(` or `,`, before `=`). The expander runs a state machine that refuses to substitute inside string literals, comments, f-strings, or top-level statements.

| Alias | Canonical kwarg |
|---|---|
| `st=` | `style=` |
| `cn=` | `class_name=` |
| `cl=` | `className=` |
| `oc=` | `on_click=` |
| `oh=` | `on_change=` |
| `os=` | `on_submit=` |
| `oa=` | `on_blur=` |
| `ph=` | `placeholder=` |
| `dis=` | `disabled=` |

Hook-call shorthand requires a following `(` (so `us` as a bare identifier stays untouched):

| Alias | Canonical |
|---|---|
| `us(` | `use_state(` |
| `ue(` | `use_effect(` |
| `um(` | `use_memo(` |
| `uc(` | `use_callback(` |
| `ur(` | `use_ref(` |
| `ux(` | `use_context(` |

## Tier C: PSX tag-DSL

JSX-like angle-bracket syntax that expands to the canonical PSX call form:

```python
<div .foo #main st={"padding": "4px"}>{label}</div>
```

expands to:

```python
div(className="foo", id="main", style={"padding": "4px"})(label)
```

Class and ID shortcuts: `.foo` → `className="foo"`, `#main` → `id="main"`. Multiple classes: `.foo .bar` → `className="foo bar"`. Self-closing tags: `<input oh=set/>` → `input(on_change=set)`.

PSX inside strings, comments, and comparisons (`x < 7`) is detected and left alone via the same scanner family that protects Tier B.

## Tier D: PySON (program shape as JSON)

For schema-constrained tool-use, where an LLM must emit code through a JSON tool call, PySON gives the model a machine-checkable program shape. Each AST node is one JSON object:

```json
{"tag": "div", "attrs": {"className": "metric-card"}, "children": [
  {"tag": "h3", "children": "Latency"},
  {"tag": "p",  "children": "12ms"}
]}
```

Trades some compression (+13.2% tokens in our benchmark) for **structural reliability** — the model cannot emit malformed Python under a schema gate. Use when reliability matters more than density (e.g., automated pipelines that re-prompt on parse failure).

## Tier Dictionary: `$NAME` string-literal aliases

A `$NAME` token expands to a canonical string literal. The bundled dictionary is seeded from the corpus frequency analysis of the React + CRM benchmark:

| Alias | Canonical |
|---|---|
| `$c1` | `"#9ca3af"` (gray-400, most common) |
| `$c2` | `"#ffffff"` |
| `$c4` | `"#3b82f6"` (blue-500) |
| `$p1` | `"12px"` (most common px size) |
| `$p4` | `"16px"` |
| `$pad` | `"padding"` (CSS property key) |
| `$bg` | `"background"` |
| `$ff` | `"system-ui, sans-serif"` |
| `$gtc` | `"grid_template_columns"` (very long canonical) |

See `crates/pyths_expand/src/strings.rs` for the full bundled table.

Because `$` is not a valid Python token character, there is zero risk of colliding with user identifiers. Unknown `$NAME` aliases pass through verbatim, so the downstream lexer produces a clear error.

## Project-local dictionary overrides

Add user aliases by dropping a `pyths.toml` at your project root:

```toml
[expand.dictionary]
BRAND_GRAY = "#9ca3af"
LOGO_URL = "/static/logo.svg"
API_BASE = "https://api.example.com"
```

Then in `.psc`:

```python
url = $API_BASE
```

User entries override bundled aliases of the same name. The expander walks upward from CWD looking for `pyths.toml` (Cargo-style discovery), so the same config applies to every `.psc` in the project.

Values may be plain (`BRAND_GRAY = "#9ca3af"`) or pre-quoted (`Y = "'foo'"` emits single-quoted output, useful for escape sequences).

## Choosing what to alias — the BPE wall

When adding your own dictionary entries, **target long string literals, not short identifiers**. cl100k_base (and most modern BPE tokenizers) has already merged common identifiers into single tokens at training time. Replacing them with a shorter alias gains bytes but not tokens, and can even regress:

| Canonical → alias | cl100k Δ tokens | Notes |
|---|---:|---|
| `"http://localhost:8000"` → `$API` | **+6** | Long URLs fragment into many BPE pieces; the alias collapses to ~3 |
| `"← Back to papers"` → `$BACK` | **+3** | Multi-byte `←` adds tokens to the canonical |
| `"Loading..."` → `$LOAD` | +1 | Marginal — short strings are already 2-3 tokens |
| `div(` → `dv(` | **0** | `div` is already 1 token in cl100k |
| `lambda` → `lm` | **0** | Both are 1 token |
| `Link(` → `Lk(` | **−1** | **Regression** — `Lk` falls outside the merged vocab and splits to 3 tokens |

If you're tracking cl100k tokens as your primary metric (the LLM-billing case), aliasing identifier-call patterns is rarely worth the teaching cost. The Tier Dictionary `$NAME` mechanism wins because URLs, copy strings, and multi-byte literals genuinely tokenize to many BPE pieces — that's where the savings concentrate.

If you're tracking bytes (storage, transmission, character-level models), the calculus is different — any shorter alias trivially helps. **Measure both metrics; don't extrapolate one from the other.**

See `docs/compression-future-work.md` for the full empirical analysis and the audit scripts at `examples/cloudflare-bench/bench/`.

## Build integration

Both build plugins handle `.psc` automatically once installed:

- **Vite** (`vite-plugin-pyths`): the `transform` hook matches both `.ps` and `.psc`. Same source-map and HMR behavior.
- **Next.js** (`next-plugin-pyths`): webpack rule `test: /\.psc?$/` and `pageExtensions` includes both. Use `app/page.psc` exactly like you'd use `app/page.ps`.

No plugin configuration changes are needed — just save your file as `.psc`.

## When NOT to use `.psc`

- **Human-authored code**: stick with `.ps`. The aliases save tokens, not human time; readability is preserved but takes a moment to learn.
- **Performance-critical hot paths**: `.psc` adds ~50 µs per file for the expander pass. Negligible for whole programs, irrelevant for AI-emitted source.
- **Debugging the lexer or parser**: use `--expand=never` to see the raw token stream.

## Specification and reference

- Bundled dictionary: `crates/pyths_expand/src/strings.rs`
- Tier-by-tier rationale and corpus measurements: `phase2_design.md`
- Per-iteration changelog: `docs/phase2_changelog.md`
- Library tests (154+): `crates/pyths_expand/src/lib.rs`
- CLI integration tests: `crates/pyths_cli/tests/cli_test.rs` (search for `psc_`)
