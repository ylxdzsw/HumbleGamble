const kline_conv = (frame, w) => {
    return frame.im2col().mul(w[0]).add(w[4]).sigm()
                .im2col().mul(w[1]).add(w[5]).sigm()
                .im2col().mul(w[2]).add(w[6]).sigm()
                .im2col().mul(w[3]).add(w[7]).sigm().flat()
}

const final = (state, w) => {
    return w[1].mul(state).add(w[2])
}

const pulse_recur = (state, pulse, w) => {
    for (const p of pulse) {
        state.add(w[2].mul(w[1].mul(state.cat(p)).sigm()))
    }
    return state
}
