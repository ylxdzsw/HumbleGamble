const ready = () => ["#priceIndex .indexNumber > em", ".orderListBody > .topData", ".contract.cur"].map($).every(x=>x)

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
    for (let i = hist.children.length; i > 30; i--) {
        hist.removeChild(hist.lastChild)
    }
}

const inject_elements = () => {
    const gambling = document.createElement('span')
    gambling.setAttribute('class', "topDataSpan title2")
    gambling.innerHTML = `
        <input type="checkbox" id="gambling" style="position: relative; top: 3px" ${sessionStorage.getItem('gambling') ? 'checked' : ''} />
        <label for="gambling"> Auto Gamble </label>
    `
    $(".orderListBody > .topData").appendChild(gambling)
    $("#gambling").onchange = e => e.target.checked ? sessionStorage.setItem('gambling', '1') : sessionStorage.removeItem('gambling')

    const recording = document.createElement('span')
    recording.setAttribute('class', "topDataSpan title2")
    recording.innerHTML = `
        <input type="checkbox" id="recording" style="position: relative; top: 3px" ${sessionStorage.getItem('recording') ? 'checked' : ''} />
        <label for="recording"> Record </label>
    `
    $(".orderListBody > .topData").appendChild(recording)
    $("#recording").onchange = e => e.target.checked ? sessionStorage.setItem('recording', '1') : sessionStorage.removeItem('recording')

    const exportdata = document.createElement('span')
    exportdata.setAttribute('class', "topDataSpan title2")
    exportdata.innerHTML = `<a id="export" href="#" onclick="return false"> Export </a>`
    $(".orderListBody > .topData").appendChild(exportdata)
    $("#export").onclick = export_data

    const probability = document.createElement('span')
    probability.setAttribute('class', "topDataSpan title2")
    probability.setAttribute('style', "line-height: 125%; font-size: 9px; float: right; margin-right: 10px")
    probability.innerHTML = `
        <span id="p0"></span> &nbsp; <span id="p1"></span> &nbsp; <span id="p2"></span> &nbsp; <span id="p3"></span><br/>
        <span id="p8"></span> &nbsp; <span id="p9"></span> &nbsp; <span id="p10"></span> &nbsp; <span id="p11"></span><br/>
        <span id="p16"></span> &nbsp; <span id="p17"></span> &nbsp; <span id="p18"></span> &nbsp; <span id="p19"></span>
    `
    $(".orderListBody > .topData").appendChild(probability)

    const suggestion = document.createElement('span')
    suggestion.setAttribute('id', "suggestion")
    suggestion.setAttribute('style', "margin-left: 40px")
    $('#positionTab').after(suggestion)
}

const ensure_BBO = () => $("#match_price").checked || $("#match_price").click()
const set_amount = (x) => $("#amount").value = x.toFixed(2)

const is_recording = () => $("#recording") && $("#recording").checked
const is_gambling = () => $("#gambling") && $("#gambling").checked

const disable_buttons = () => {
    is_recording() && $("#recording").click()
    $("#recording").disabled = true

    is_gambling() && $("#gambling").click()
    $("#gambling").disabled = true

    init_backend()
}

const current_contract = () => {
    const el = $(".contract.cur")
    if (el.getAttribute('type') != '1') {
        disable_buttons()
        throw new Error("not weekly contract")
    }

    const m = (new Date).toISOString().match(/\d{4}-(\d\d)-(\d\d)T(\d\d)/)
    const contract = el.textContent
    if (m[1]+m[2] == contract.slice(3) && (m[3] >= '02' || m[3] <= '09')) {
        disable_buttons()
        throw new Error("around delivery")
    }

    return contract
}

const long = async () => {
    let open = true

    for (const x of $("#positoin").children) {
        switch (x.children[2].textContent) {
            case 'Long':
                open = false
                break

            case 'Short':
                x.querySelector(".close_market").click()
                await wait_until(()=>!$("#futureFullTipsPop").getAttribute('style').includes("none"))
                $("#sure").click()
                break

            default:
                throw new Error("Unknown contract type")
        }
    }

    if (open) {
        ensure_BBO()
        set_amount(0.05) // this don't work for OKEx's bug. short() works well.
        $("[value='Open Long']").click()
    }
}

const short = async () => {
    let open = true

    for (const x of $("#positoin").children) {
        switch (x.children[2].textContent) {
            case 'Short':
                open = false
                break

            case 'Long':
                x.querySelector(".close_market").click()
                await wait_until(()=>!$("#futureFullTipsPop").getAttribute('style').includes("none"))
                $("#sure").click()
                break

            default:
                throw new Error("Unknown contract type")
        }
    }

    if (open) {
        ensure_BBO()
        set_amount(0.05)
        $("[value='Open Short']").click()
    }
}

const display_pred = (pred) => {
    for (let i = 0; i < pred.length; i++) {
        if ($("#p"+i)) {
            $("#p"+i).textContent = pred[i].toFixed(4)
        }
    }
}

const display_suggestion = (suggestion) => {
    const el = [
        { color: 'lime',   text: "Long",  onclick: long },
        { color: 'yellow', text: "Hold",  onclick: () => 0 },
        { color: 'red',    text: "Short", onclick: short }
    ][suggestion.reduce((iMax, x, i, arr) => x > arr[iMax] ? i : iMax, 0)]

    $("#suggestion").innerHTML = `<a id="execute" href="#" onclick="return false" style="color: ${el.color}"> Suggestion: ${el.text} </a>
                                  <span style="font-size: 10px; margin-left: 20px"> ${suggestion.map(x=>x.toFixed(4)).join(' &nbsp; ')} </span>`
    $("#execute").onclick = el.onclick
}

const gamble = (order) => [long, () => 0, short][order]()

const init_fullscreen = async () => {
    await wait_until(ready)
    observe_index(on_index_update)
    inject_elements()
    alignInterval(60, 2, on_candle)
    alignInterval(120, 0, clear_hist)
    on_candle()
}
