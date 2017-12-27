const ready = () => ["#priceIndex .indexNumber > em", ".orderListBody > .topData"].map($).every(x=>x)

const observe_index = (cb) => {
    const el = $("#priceIndex .indexNumber > em")
    const observer = new MutationObserver(() => cb(parse_money(el.textContent)))
    observer.observe(el, { childList: true })
}

const parse_depth = (li) => {
    return [].map.call(li, x => ({
        price: parse_money(x.querySelector(".priceSpan").textContent),
        cumulative: parseFloat(x.querySelector(".amountBtcSpan").textContent)
    }))
}

const depth_info = (asks, bids) => {
    const askd = asks[asks.length-1].cumulative
    const bidd = bids[bids.length-1].cumulative

    let ask1 = asks[asks.length-1].price
    for (const {price, cumulative} of asks) {
        if (cumulative > 1) {
            ask1 = price
            break
        }
    }

    let bid1 = bids[bids.length-1].price
    for (const {price, cumulative} of bids) {
        if (cumulative > 1) {
            bid1 = price
            break
        }
    }

    return { ask1, bid1, askd: askd / (askd + bidd), bidd: bidd / (askd + bidd)}
}

const collect_info = () => {
    const last_price = parse_money($("#priceIndex .lastPrice > em").textContent)
    const amount24h = parse_money($("#amount24h").textContent.slice(1))
    const total_hold = parse_money($("#holdAmount").textContent.slice(1))
    const bids = parse_depth(document.querySelectorAll("#buyDepth  > :not([style])"))
    const asks = parse_depth(document.querySelectorAll("#sellDepth > :not([style])")).reverse()

    return { last_price, amount24h, total_hold, ...depth_info(asks, bids) }
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
        <input type="checkbox" id="gambling" style="position: relative; top: 3px" ${sessionStorage.getItem('gambling') ? 'checked' : ''} />
        <label for="gambling"> Auto Gamble </label>
    `
    $(".orderListBody > .topData").appendChild(gambling)
    $("#gambling").onchange = e => sessionStorage.setItem('gambling', e.target.checked)

    const probability = document.createElement("span")
    probability.setAttribute('class', "topDataSpan")
    $(".orderListBody > .topData").appendChild(probability)

    const recording = document.createElement("span")
    recording.setAttribute('class', "topDataSpan")
    recording.innerHTML = `
        <input type="checkbox" id="recording" style="position: relative; top: 3px" ${sessionStorage.getItem('recording') ? 'checked' : ''} />
        <label for="recording"> Record </label>
    `
    $(".orderListBody > .topData").appendChild(recording)
    $("#recording").onchange = e => e.target.checked ? sessionStorage.setItem('recording', '1') : sessionStorage.removeItem('recording')

    const exportdata = document.createElement("span")
    exportdata.setAttribute('class', "topDataSpan")
    exportdata.innerHTML = `<a id="export" href="#" onclick="return false"> Export </a>`
    $(".orderListBody > .topData").appendChild(exportdata)
    $("#export").onclick = export_data
}

const ensure_BBO = () => $("#match_price").checked || $("#match_price").click()

const is_recording = () => $("#recording") && $("#recording").checked
const is_gambling = () => $("#gambling") && $("#gambling").checked

const init_fullscreen = async () => {
    await wait_until(ready)
    observe_index(on_index_update)
    inject_elements()
    setInterval(clear_hist, 120 * 1000)
}

