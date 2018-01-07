// tested 2018.1.6
const kline_conv = (frame, w) => {
    return frame.im2col().mul(w[0]).addv(w[4]).sigm()
                .im2col().mul(w[1]).addv(w[5]).sigm()
                .im2col().mul(w[2]).addv(w[6]).sigm()
                .im2col().mul(w[3]).addv(w[7]).sigm().flat()
}

// tested 2018.1.6
const final = (state, w) => w[0].mul(state).add(w[1])

const pulse_recur = (state, pulse, w) => state.add(w[1].mul(w[0].mul(state.cat(pulse)).add(w[2]).sigm()))

const decide = (pred, w) => [].slice.call(w[2].mul(w[0].mul(pred).add(w[1]).sigm()).add(w[3]).data)

const predict = (pred) => {
    pred = [].slice.call(pred.data)
    for (let i = 0; i < 5; i++) {
        const s = softmax(pred.slice(4 * i, 4 * i + 3))
        for (let j = 0; j < 3; j++) {
            pred[4 * i + j] = s[j]
        }
    }
    return pred
}

const softmax = (x, t=1) => {
    x = x.map(x=>Math.exp(x / t))
    const s = x.reduce((x, y) => x + y)
    return x.map(x => x / s)
}
