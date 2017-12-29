const kline_conv = (frame, w) => {
    return frame.im2col().mul(w[0]).addv(w[4]).sigm()
                .im2col().mul(w[1]).addv(w[5]).sigm()
                .im2col().mul(w[2]).addv(w[6]).sigm()
                .im2col().mul(w[3]).addv(w[7]).sigm().flat()
}

const final = (state, w) => {
    pred = w[0].mul(state).add(w[1]).data
    for (let i = 0; i < 5; i++) {
        s = softmax(pred.slice(4 * i, 4 * i + 3))
        for (let j = 0; j < 3; j++) {
            pred[4 * i + j] = s[j]
        }
    }
    return [].slice.call(pred)
}

const pulse_recur = (state, pulse, w) => {
    state.add(w[1].mul(w[0].mul(state.cat(pulse)).add(w[2]).sigm()))
    return state
}

const softmax = (x) => {
    x = x.map(Math.exp)
    s = x.reduce((x, y) => x + y)
    return x.map(x=>x/s)
}
