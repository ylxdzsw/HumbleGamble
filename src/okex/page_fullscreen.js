const ready = () => {
    return $("#priceIndex .indexNumber > em") != null
}

const observe_index = (cb) => {
    const el = $("#priceIndex .indexNumber > em")
    const observer = new MutationObserver(() => cb(parseFloat(el.textContent.replace(',', ''))))
    observer.observe(el, { childList: true })
}

const init_fullscreen = async () => {
    await wait_until(ready)
    observe_index(on_index_update)
}

