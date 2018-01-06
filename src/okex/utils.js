const $ = x => document.querySelector(x)

const sleep = x => new Promise(resolve => setTimeout(resolve, 1000 * x))

const download = (str, name) => {
    const url = URL.createObjectURL(new Blob([str], { type: "application/json" }))
    const el = document.createElement('a')
    el.download = name + '.json'
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

const parse_money = x => parseFloat(x.replace(',', ''))

const initdb = (cb) => {
    const req = indexedDB.open('humblegamble', 1)
    req.onerror = e => console.error(e)
    req.onupgradeneeded = (e) => {
        const db = req.result
        db.createObjectStore('kline', { keyPath: ["contract", "time"] })
        db.createObjectStore('pulse', { keyPath: ["contract", "time"] })
    }
    req.onsuccess = (e) => {
        cb(req.result)
    }
}

const getdb = () => new Promise((cb) => {
    if (!getdb.db) {
        if (!getdb.queue) {
            getdb.queue = [cb]
            initdb((db) => {
                getdb.db = db
                for (const cb of getdb.queue) {
                    cb(db)
                }
                delete getdb.queue
            })
        } else {
            getdb.queue.push(cb)
        }
    } else {
        cb(getdb.db)
    }
})

const getstore = async (store, flag) => (await getdb()).transaction(store, flag).objectStore(store)

const savedata = async (store, data) => {
    store = await getstore(store, 'readwrite')

    let overlapped = false
    for (const record of data) {
        const req = store.add(record)
        req.onerror = (e) => {
            if (req.error.code == 0) { // DOMException: Key already exists in the object store.
                e.preventDefault()
                overlapped = true
            } else {
                throw e
            }
        }
    }

    return new Promise((resolve, reject) => {
        store.transaction.oncomplete = e => resolve(overlapped)
    })
}

const export_data = async () => {
    const data = Object.create(null)

    for (const store of ['kline', 'pulse']) {
        const contracts = new Set()

        await new Promise(async (resolve, reject) => {
            (await getstore(store)).openCursor().onsuccess = (e) => {
                const cursor = event.target.result
                if (cursor) {
                    const contract = cursor.value.contract
                    if (!contracts.has(contract)) {
                        data[contract] = (data[contract] || '') + `=== ${store} ===\n`
                        contracts.add(contract)
                    }

                    delete cursor.value.contract
                    data[contract] += JSON.stringify(cursor.value) + '\n'
                    cursor.continue()
                } else {
                    resolve()
                }
            }
        })
    }

    for (const contract in data) {
        download(data[contract], contract)
    }
}

const alignInterval = async (sec, phase, f) => {
    const now = Date.now() / 1000 - phase
    const n = 1 + now / sec | 0

    await sleep(sec * n - now)
    try {
        f(n)
    } finally {
        alignInterval(sec, phase, f)
    }
}
