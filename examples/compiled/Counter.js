import { createElement } from "react";
import { useState } from "react";
import { component } from "pyths-runtime/react";
export function Counter() {
    const [count, set_count] = useState(0);
    return createElement("div", null, createElement("button", {onClick: () => set_count((count - 1))}, "-"), createElement("span", null, String(count)), createElement("button", {onClick: () => set_count((count + 1))}, "+"));
}
