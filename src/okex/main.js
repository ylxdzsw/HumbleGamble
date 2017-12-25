"use strict"

const on_index_update = (index) => {
    console.log(new Date)
    console.log({index, ...collect_info()})
}

const fuck = async (data) => new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(data, resolve)
})

const dispatch = async () => {
    if (location.href == "https://www.okex.com/future/futureFullNew.do?symbol=0") {
        init_fullscreen()
    }
}

setTimeout(dispatch, 0)
