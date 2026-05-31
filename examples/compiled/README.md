# Compiled output — checked in for proof

These files are the **actual compiler output** for the two examples one directory
up. They are committed so you can see *Python in → JavaScript + WebAssembly out*
by scrolling, with no server, no build step, and no compiler access required.

Regenerate them yourself (with the published `pyths` binary):

```bash
pyths compile          examples/Counter.ps     -o examples/compiled/Counter.js
pyths compile --target js+wasm examples/similarity.ps -o examples/compiled/similarity.js
```

| Source | Output here | What it proves |
|---|---|---|
| [`../Counter.ps`](../Counter.ps) | [`Counter.js`](./Counter.js) | A Python `@component` → an idiomatic React `createElement` function. No interpreter, no runtime shipped. |
| [`../similarity.ps`](../similarity.ps) | [`similarity.js`](./similarity.js) + [`similarity.glue.js`](./similarity.glue.js) + `similarity.wasm` | Auto-routing: the numeric core (`dot` / `norm` / `cosine`, `list[float] → float`) compiles to a **291-byte** `.wasm` module; `top_k` (dicts/strings/sort) stays in JS. `glue.js` is the generated JS↔WASM bridge. |

**The `.wasm` is a real, valid module** — its header begins `\0asm` and it
exports `dot`, `norm`, `cosine` (visible in a hexdump). `cosine` calls `dot` and
`norm` *inside* WASM (a cross-WASM `call_indirect`); the WASM result matches a
pure-JS reference ranking within `1e-9`.

> Counter has **no** WASM output — it's a UI component with no numeric functions,
> so everything correctly stays in JS. That's auto-routing working as designed:
> WASM only where it pays off.
