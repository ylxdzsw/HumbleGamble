const $ = x => document.querySelector(x)

const sleep = x => new Promise(resolve => setTimeout(resolve, 1000 * x))

const download = (str) => {
    const url = URL.createObjectURL(new Blob([str], { type: "application/json" }))
    const el = document.createElement('a')
    el.download = "data.json"
    el.href = url
    el.click()
}

const okget = path => new Promise((resolve, reject) => {
    const req = new XMLHttpRequest()
    req.open('GET', "/api/v1" + path)
    req.onreadystatechange = () => {
        if (req.readyState == XMLHttpRequest.DONE) {
            (req.status == 200 ? resolve : reject)(req.responseText)
        }
    }
    req.send()
})

const wait_time_out = (p, t=2) => new Promise((resolve, reject) => {
    const handle = setTimeout(() => {
        reject(new Error("promise time out"))
    }, 1000 * t)

    p.then(resolve).catch(reject)
})

const wait_until = async (cond) => {
    while (!cond()) {
        await sleep(0.02)
    }
}
