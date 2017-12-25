"use strict"

const fuck = async (data) => new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(data, resolve)
})

const init = async () => {
    data = await fuck({})
    console.log(data)
}

setTimeout(init, 0)
