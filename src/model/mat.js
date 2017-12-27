// col major!!!
class Mat {
    constructor(m, n, data) {
        this.m = m
        this.n = n
        this.data = new Float64Array(data ? data : m * n)
    }

    sigm() {
        for (let i = 0; i < this.data.length; i++) {
            this.data[i] = 1 / (1 + Math.exp(-this.data[i]))
        }

        return this
    }

    mul(b) {
        const a = this

        if (a.n != b.m) {
            throw new Error(`dimention not match ${a.m}x${a.n} * ${b.m}x${b.n}`)
        }

        const r = new Mat(a.m, b.n)

        for (const i = 0; i < r.m; i++) {
            for (const j = 0; j < r.n; j++) {
                const dot = 0
                for (const k = 0; k < a.n; k++){
                    dot += a.data[i, a.m * k] * b.data[k, b.m * j]
                }
                r.data[i + r.m * j]
            }
        }
    }

    map(f) {
        this.data.map(f)
    }
}
