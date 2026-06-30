// D2 contrast — what TypeScript does, honestly: where it helps, and where it can't.
//
// Case A — precisely-typed value: TypeScript CATCHES this at COMPILE time.
//     const typed: { name: string } = { name: "Alice" };
//     typed["email"];
//   tsc --strict  ->  error TS7053: Property 'email' does not exist on type
//                     '{ name: string; }'
//   Credit where due: with a precise static type, TS flags the missing key before
//   runtime. PythScript does too (`pyths check`), so on precisely-typed values the
//   two agree at compile time.
//
// Case B — `any` data (JSON.parse / DOM / fetch / a cast): TypeScript ERASES and
//          does NOT catch. This is the common real case — and where the runtime
//          difference is decisive.

const data: any = JSON.parse('{"name":"Alice"}');   // `any`, like DOM / fetch / a cast
console.log(data["email"]);     // tsc --strict -> NO error;  runtime -> undefined   (silent)
console.log(1 + ("a" as any));  // tsc --strict -> NO error;  runtime -> "1a"        (coerced)
//  TypeScript / JavaScript runtime:  undefined, "1a"        ❌ silent
//  PythScript (02_fail_loud.ps):     Error [KeyError]: 'email'  ✅ raises at runtime
//
// => TypeScript catches the precisely-typed case, then erases — so on any/JSON/DOM
//    data the runtime is silently `undefined`, exactly like JS. PythScript raises at
//    runtime regardless of the static type. Honest claim: "the runtime classes
//    TypeScript erases," not "more type-safe than TypeScript."
