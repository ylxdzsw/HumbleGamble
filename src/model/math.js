class Mat {
    constructor(nrow, ncol) {
        this.nrow = nrow
        this.ncol = ncol
        this.data = new Float64Array(n * d)
    }

    get(r, c) {
        this.data[this.ncol * r + c]
    }

    sigm() {
        for (let i = 0; i < this.data.length; i++) {
            this.data[i] = 1 / (1 + Math.exp(-this.data[i]))
        }

        return this
    }

    mul(b) {
        const a = this

        if (a.ncol != b.nrow) {
            throw new Error(`dimention not match ${a.nrow}x${a.ncol} * ${b.nrow}x${b.ncol}`)
        }


    }
}
