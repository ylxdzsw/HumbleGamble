const pack_kline = (kline) => {
    const len = kline.length
    const frame = new Mat(len, 4)
    for (let i = 0; i < len; i++) {
        frame.data[i]           = kline[i].close  / 10000
        frame.data[i + len]     = kline[i].high   / 10000
        frame.data[i + len * 2] = kline[i].low    / 10000
        frame.data[i + len * 3] = kline[i].volume / 10000
    }
    return frame
}

const pack_pulse = (pulse) => {
    return new Mat(8, 1, [pulse.index/10000, pulse.last_price/10000, pulse.total_hold/10000, pulse.amount24h/10000,
                          pulse.ask1/10000, pulse.bid1/10000, pulse.askd, pulse.bidd])
}

let state, w, hist = []

chrome.runtime.onMessage.addListener((data, sender, respond) => {
    if (!w)
        w = load_weights()

    switch (data.action) {
        case 'candle':
            frame = pack_kline(data.data)
            state = kline_conv(frame, w[0])

            hist.push([])
            hist.length > 4 && hist.shift()

            for (const pulses of hist)
                for (const pulse of pulses)
                    state = pulse_recur(state, pulse, w[1])

            return respond({ action: 'pred', data: final(state, w[2]) })

        case 'pulse':
            if (!state) {
                return respond({ action: 'nop' })
            } else {
                pulse = pack_pulse(data.data)
                hist[hist.length-1].push(pulse)
                state = pulse_recur(state, pulse, w[1])
                return respond({ action: 'pred', data: final(state, w[2]) })
            }

        default:
            throw new Error("fuck")
    }
})
