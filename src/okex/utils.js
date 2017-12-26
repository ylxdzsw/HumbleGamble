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
        console.log("not yet")
        await sleep(0.02)
    }
}

const parse_money = x => parseFloat(x.replace(',', ''))

const initdb = (cb) => {
    const req = indexedDB.open('humblegamble', 1)
    req.onerror = e => console.error(e)
    req.onupgradeneeded = (e) => {
        const db = req.result
        db.createObjectStore('kline', { keyPath: "time" })
        db.createObjectStore('pulse', { keyPath: "time" })
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
    let text = ""

    const stores = [].slice.call((await getdb()).objectStoreNames)
    for (const store of stores) {
        text += `=== ${store} ===\n`
        await new Promise(async (resolve, reject) => {
            (await getstore(store)).openCursor().onsuccess = (e) => {
                const cursor = event.target.result
                if (cursor) {
                    text += JSON.stringify(cursor.value) + '\n'
                    cursor.continue()
                } else {
                    resolve()
                }
            }
        })
    }

    download(text)
}
