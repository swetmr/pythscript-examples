import { useState } from 'react'

// React reference Counter. Dual-track-paired with Counter.ps; both should
// render identical DOM for the first formal parity check (Counter.test.tsx).
// Intentionally style-free so parity isn't sensitive to inline-style attr
// differences while pyths.style() integration is out of scaffold scope.
export default function Counter() {
  const [count, setCount] = useState(0)
  return (
    <div>
      <button onClick={() => setCount((c) => c - 1)}>-</button>
      <span>{count}</span>
      <button onClick={() => setCount((c) => c + 1)}>+</button>
    </div>
  )
}
