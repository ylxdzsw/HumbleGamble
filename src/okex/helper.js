const sleep = x => new Promise(resolve => setTimeout(resolve, 1000 * x))

const getdb = () => {
    return new Promise((cb) => {
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
}

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

const download = (str) => {
    const url = URL.createObjectURL(new Blob([str], { type: "application/json" }))
    const el = document.createElement('a')
    el.download = "etrader.json"
    el.href = url
    el.click()
}
