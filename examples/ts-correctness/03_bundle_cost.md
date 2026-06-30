# D3 — The bundle-size cost of runtime safety (own it)

**Deliverable type:** measurement + one honest sentence. Not a runtime demo.

## Why this exists

D1 (real integers) and D2 (fail-loud) are only true because PythScript **emits runtime guards and
semantics that JavaScript developers deliberately omit for speed.** That safety is not free — it costs
bundle size. A skeptical reviewer who likes TypeScript will (correctly) point out the trade. The credible
move is to **state it first**, not let them find it — the same discipline as reporting the LOC/token deltas
as honest ranges in the [dual-track benchmark](../../README.md#the-dual-track-benchmark).

## What the benchmark already shows

The dual-track benchmark ships PythScript at a **~+7.7%** larger min+gzip bundle on the papertopia app
([benchmarks](../../benchmarks)). That figure is reported openly in the README's *"how to read these numbers
honestly"* — and a portion of it is exactly the safety surface these two demos exercise:

| Cost source | What it buys | Notes |
|---|---|---|
| Dict-access guard (`pyDictGet` / `KeyError`) | D2 fail-loud on missing keys | a small shared runtime helper, tree-shakeable when unused |
| No-coercion arithmetic + Python-faithful ops | D2 (no silent `1 + "a"`), Python `%`, `==`, truthiness | call-site lowering |
| Arbitrary-precision `int` (Number/BigInt) | D1 exact integers past 2⁵³ | only where integer math is present |
| Call-site codegen wrappers | (not safety) | survive minification — an upstream compiler improvement on the roadmap, **not** the safety cost |

A clean "guards-on vs guards-off" delta would need an unchecked compiler mode (not currently exposed), so we
do **not** publish a fabricated isolated number here. What is real and measured is the **+7.7% aggregate**,
reported in the benchmark; this file attributes its character.

## The honest framing

> Real integers and fail-loud behaviour cost bundle size — JavaScript chose speed, we chose to carry the
> semantics into the runtime. We measure the aggregate cost (+7.7% on this app) and don't hide it; part of
> that figure is an upstream codegen improvement on our roadmap, not the safety cost. The win is correctness
> on the classes TypeScript can't fix; the price is a few KB. Buyers pick the trade knowingly.

*Sibling deliverables D1 / D2 (with captured runtime output) live in this folder; see [`RESULTS.txt`](./RESULTS.txt).*
