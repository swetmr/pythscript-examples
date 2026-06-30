// D1 contrast — TypeScript has no integer type either.
//
// Run:  tsc --strict --noEmit 01_integer_precision.contrast.ts
//   -> NO error (exit 0). `number` is a valid type for this multiply, so TypeScript
//      never flags the precision loss. TS adds static types, not an integer type.
//
// At RUNTIME, TypeScript erases to JavaScript, so this prints the SAME wrong value
// as plain JS. PythScript's real `int` is the only one that stays exact.

const a: number = 123456789;
const b: number = 987654321;
const product: number = a * b;
console.log(product);
//  TypeScript / JavaScript runtime:  121932631112635260   ❌ wrong (number is IEEE-754)
//  PythScript int (01_integer_precision.ps):  121932631112635269   ✅ exact
