// col major!!!
// tested 2017.12.29
class Mat {
    constructor(m, n, data) {
        this.m = m
        this.n = n
        this.data = new Float64Array(data ? data : m * n)
    }

    sigm() {
        for (let i = 0; i < this.data.length; i++)
            this.data[i] = 1 / (1 + Math.exp(-this.data[i]))

        return this
    }

    mul(b) {
        const a = this

        if (a.n != b.m)
            throw new Error(`dimension not match ${a.m}x${a.n} * ${b.m}x${b.n}`)

        const r = new Mat(a.m, b.n)

        for (let i = 0; i < r.m; i++) {
            for (let j = 0; j < r.n; j++) {
                let dot = 0

                for (let k = 0; k < a.n; k++)
                    dot += a.data[i + a.m * k] * b.data[k + b.m * j]

                r.data[i + r.m * j] = dot
            }
        }

        return r
    }

    im2col() { // this could be more efficient if we transpose p
        const p = new Mat(this.m / 4 - 1, 8 * this.n)

        for (let k = 0; k < this.n; k++)
            for (let j = 0; j < 8; j++)
                for (let i = 0; i < p.m; i++)
                    p.data[i + p.m * (j + 8 * k)] = this.data[4 * i + j + this.m * k]

        return p
    }

    add(b) {
        for (let i = 0; i < this.data.length; i++)
            this.data[i] += b.data[i / this.m | 0]

        return this
    }

    flat() {
        this.m = this.data.length
        this.n = 1
        return this
    }

    cat(b) {
        const a = this

        if (a.n != b.n)
            throw new Error(`dimension not match cat(${a.m}x${a.n}, ${b.m}x${b.n})`)

        const p = new Mat(a.m + b.m, a.n)

        for (let j = 0; j < p.n; j++)
            for (let i = 0; i < p.m; i++)
                p.data[i + p.m * j] = i < a.m ? a.data[i + a.m * j] : b.data[i - a.m + b.m * j]

        return p
    }
}
