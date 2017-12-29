"use strict"

const on_index_update = (index) => {
    const pulse = { index, ...collect_info(), time: + new Date }
    is_recording() ? savedata('pulse', [pulse]) : console.log(pulse)
    chrome.runtime.sendMessage({ action: 'pulse', data: pulse }, ({action, data}) => {
        action == "pred" && on_pred(data)
    })
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

    chrome.runtime.sendMessage({ action: 'candle', data: kline }, ({action, data}) => {
        action == "pred" && on_pred(data)
    })
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

const make_suggestion = (pred) => {
    if ([0, 4, 8, 12, 16].map(x=>pred[x]>0.3).reduce((x,y)=>x+y) >= 4) {
        return 2
    }

    if ([2, 6, 10, 14, 18].map(x=>pred[x]>0.3).reduce((x,y)=>x+y) >= 4) {
        return -2
    }

    if (pred[0] > 0.3 && pred[4] > 0.3) {
        return 1
    }

    if (pred[2] > 0.3 && pred[6] > 0.3) {
        return -1
    }

    return 0
}

const on_pred = (pred) => {
    display_pred(pred)
    display_suggestion(make_suggestion(pred))
}

const dispatch = async () => {
    if (location.href == "https://www.okex.com/future/futureFullNew.do?symbol=0") {
        init_fullscreen()
    }
}

setTimeout(dispatch, 0)
