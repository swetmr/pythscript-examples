# Pure-numeric cosine similarity + top-K ranking (PythScript port of similarity.ts).
#
# dot / norm / cosine are list[float]->float with no exceptions, so they are
# WASM-eligible (spec #6, Phase-3 cell #1 auto-routing). cosine calls dot + norm
# inside WASM (cell #5, call_indirect). top_k uses dicts/strings/sorted so it
# stays in JS and calls cosine across the JS<->WASM boundary.

from math import sqrt


def dot(a: list[float], b: list[float]) -> float:
    total = 0.0
    for i in range(len(a)):
        total += a[i] * b[i]
    return total


def norm(a: list[float]) -> float:
    return sqrt(dot(a, a))


def cosine(a: list[float], b: list[float]) -> float:
    na = norm(a)
    nb = norm(b)
    if na == 0.0 or nb == 0.0:
        return 0.0
    return dot(a, b) / (na * nb)


def top_k(query, corpus, k):
    scored = [{"id": cid, "score": cosine(query, vec)} for cid, vec in corpus]
    ranked = sorted(scored, key=lambda s: s["score"], reverse=True)
    return ranked[:k]
