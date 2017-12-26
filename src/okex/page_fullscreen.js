const ready = () => ["#priceIndex .indexNumber > em", ".orderListBody > .topData"].map($).every(x=>x)

const observe_index = (cb) => {
    const el = $("#priceIndex .indexNumber > em")
    const observer = new MutationObserver(() => cb(parse_money(el.textContent)))
    observer.observe(el, { childList: true })
}

const collect_info = () => {
    const last_price = parse_money($("#priceIndex .lastPrice > em").textContent)
    const total_hold = parse_money($("#holdAmount").textContent.slice(1))
    // TODO: depth
    return { last_price, total_hold }
}

const clear_hist = () => {
    const hist = $("#tradeDepths")
    for (let i = hist.children.length; i > 20; i--) {
        hist.removeChild(hist.lastChild)
    }
}

const inject_elements = () => {
    const gambling = document.createElement("span")
    gambling.setAttribute('class', "topDataSpan")
    gambling.innerHTML = `
        <input type="checkbox" id="auto_gambling" style="position: relative; top: 3px" />
        <label for="auto_gambling"> Auto Gambling </label>
    `
    $(".orderListBody > .topData").appendChild(gambling)

    const record = document.createElement("span")
    record.setAttribute('class', "topDataSpan")
    record.innerHTML = `
        <input type="checkbox" id="record" style="position: relative; top: 3px" />
        <label for="record"> Record </label>
    `
    $(".orderListBody > .topData").appendChild(record)

    const probability = document.createElement("span")
    probability.setAttribute('class', "topDataSpan")
    $(".orderListBody > .topData").appendChild(probability)
}

const is_recording = () => $("#record") && $("#record").checked

const init_fullscreen = async () => {
    await wait_until(ready)
    observe_index(on_index_update)
    inject_elements()
    setInterval(clear_hist, 120 * 1000)
}

