import { pySlice, pySorted } from "pyths-runtime";

import { sqrt } from "pyths-runtime/stdlib/math";
export function top_k(query, corpus, k) {
    let scored = corpus.map(([cid, vec]) => ({"id": cid, "score": cosine(query, vec)}));
    let ranked = pySorted(scored, {key: (s) => s["score"], reverse: true});
    return pySlice(ranked, null, k, null);
}

import { cosine, dot, norm } from "./similarity.glue.js";
export { cosine, dot, norm };
