from pyths.react import component, use_state


@c
def Counter():
    count, set_count = us(0)
    return div(
        button(oc=lambda: set_count(count - 1), "-"),
        span(str(count)),
        button(oc=lambda: set_count(count + 1), "+"),
    )
