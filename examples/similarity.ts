// Pure-numeric cosine similarity + top-K ranking.
//
// React-reference (oracle) for the PythScript `similarity.ps` port. Kept
// dependency-free and strictly numeric so the `.ps` version is WASM-eligible
// (spec #6, Phase-3 cells #1 auto-routing + #5 call_indirect): `topK` calls
// `cosine` per corpus entry.

export function dot(a: number[], b: number[]): number {
  let s = 0
  for (let i = 0; i < a.length; i++) {
    s += a[i] * b[i]
  }
  return s
}

export function norm(a: number[]): number {
  return Math.sqrt(dot(a, a))
}

export function cosine(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error(`dim mismatch: ${a.length} vs ${b.length}`)
  }
  const na = norm(a)
  const nb = norm(b)
  if (na === 0 || nb === 0) return 0
  return dot(a, b) / (na * nb)
}

export type Scored = { id: string; score: number }

export function topK(
  query: number[],
  corpus: [string, number[]][],
  k: number,
): Scored[] {
  const scored: Scored[] = []
  for (const [id, vec] of corpus) {
    scored.push({ id, score: cosine(query, vec) })
  }
  scored.sort((x, y) => y.score - x.score)
  return scored.slice(0, k)
}
