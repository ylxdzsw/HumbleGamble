"use strict"

const on_index_update = (index) => {
    const pulse = { index, ...collect_info(), time: + new Date }
    get_kline()
    is_recording() ? savedata('pulse', [pulse]) : console.log(pulse)
}

const get_kline = async () => {
    const now = + new Date

    if (get_kline.kline && now - get_kline.kline[get_kline.kline.length-1][0] < 60 * 1000) {
        return get_kline.kline
    }

    if (!get_kline.queue) {
        const path = "/future_kline.do?symbol=btc_usd&type=1min&contract_type=this_week" +
                     (get_kline.kline ? "&since=" + get_kline.kline[get_kline.kline.length-1][0] : '')

        get_kline.queue = okget(path).then((data) => {
            const kline = JSON.parse(data).map(([time, open, high, low, close, volume]) => ({ time, high, low, close, volume }))

            is_recording() && savedata('kline', kline)
            delete get_kline.queue
            return get_kline.kline = (get_kline.kline || []).concat(kline).slice(-2880)
        })
    }

    return get_kline.queue
}

const fuck = async (data) => new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(data, resolve)
})

const dispatch = async () => {
    if (location.href == "https://www.okex.com/future/futureFullNew.do?symbol=0") {
        init_fullscreen()
    }
}

setTimeout(dispatch, 0)
