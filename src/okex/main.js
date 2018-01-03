"use strict"

const on_index_update = (index) => {
    const pulse = { index, ...collect_info(), time: + new Date }
    is_recording() ? savedata('pulse', [pulse]) : console.log(pulse)
    chrome.runtime.sendMessage({ action: 'pulse', data: pulse }, handle_rpc)
}

const get_kline = async () => {
    if (get_kline.kline && Date.now() - get_kline.kline[get_kline.kline.length-1].time < 120 * 1000) {
        return get_kline.kline
    }

    if (!get_kline.queue) {
        const path = "/future_kline.do?symbol=btc_usd&type=1min&contract_type=this_week" +
                     (get_kline.kline ? "&since=" + get_kline.kline[get_kline.kline.length-1].time : '')

        get_kline.queue = okget(path).then((data) => {
            const kline = JSON.parse(data).map(([time, open, high, low, close, volume]) => ({ time, high, low, close, volume })).slice(0, -1)

            is_recording() && savedata('kline', kline)
            delete get_kline.queue
            return get_kline.kline = (get_kline.kline || []).concat(kline).slice(-2644)
        })
    }

    return get_kline.queue
}

const on_candle = async () => {
    const kline = await get_kline()
    const latency = (Date.now() - kline[kline.length-1].time) / 1000

    if (latency > 120) {
        await sleep(1)
        return on_candle()
    }

    chrome.runtime.sendMessage({ action: 'candle', data: kline }, handle_rpc)
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

const handle_rpc = (rpcs) => {
    for (const {action, data} of rpcs) {
        switch (action) {
            case 'prediction':
                display_pred(data)
                break

            case 'suggestion':
                display_suggestion(data)
                break

            case 'gamble':
                is_gambling() && gamble(data)
                break

            default:
                throw new Error("unknown action " + action)
        }
    }
}

const dispatch = async () => {
    if (location.href == "https://www.okex.com/future/futureFullNew.do?symbol=0") {
        init_fullscreen()
    }
}

setTimeout(dispatch, 0)
