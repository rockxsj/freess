const puppeteer = require('puppeteer-extra')
const process = require('process')
const cp = require('child_process')
const fs = require('fs')

puppeteer.use(require('puppeteer-extra-plugin-stealth')())

// 这两个文件位置替换为自己的
const v2rayPath = 'C:\\Users\\rockxsj\\scoop\\apps\\v2ray\\current'
const chromeExe = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'

async function getLastShadowSocks() {
    const browser = await puppeteer.launch({
        executablePath: chromeExe,
        headless: true,
        defaultViewport: {
            width: 2880,
            height: 1800,
            deviceScaleFactor: 2
        }
    })
    const page = await browser.newPage()
    await page.goto('https://free-ss.site/')
    await page.waitForSelector('#tbss_wrapper')
    const trs = await page.$$('#tbss > tbody > tr')
    const okCountry = ['SG', 'JP', 'HK']
    const okQuality = '10↑/10↑/10↑/10↑'
    let ret
    for (let i = 0; i < trs.length; i++) {
        const quality = await trs[i].$eval('td:nth-child(1)', node => node.innerText)
        const country = await trs[i].$eval('td:nth-child(7)', node => node.innerText)
        if (quality !== okQuality || !okCountry.includes(country)) {
            continue
        }
        const address = await trs[i].$eval('td:nth-child(2)', node => node.innerText)
        const port = await trs[i].$eval('td:nth-child(3)', node => node.innerText)
        const password = await trs[i].$eval('td:nth-child(4)', node => node.innerText)
        const method = await trs[i].$eval('td:nth-child(5)', node => node.innerText)
        ret = {
            address, port: parseInt(port), password, method
        }
        break
    }
    await browser.close()
    return ret
}

function updateConfig(server) {
    const config = JSON.parse(fs.readFileSync(`${v2rayPath}\\config.json`))
    config.outbounds.forEach(each => {
        if (each.protocol !== 'shadowsocks') {
            return
        }
        each.settings.servers[0] = server
    })
    fs.writeFileSync(`${v2rayPath}\\config.json`, JSON.stringify(config))
}

function restartV2ray() {
    const cmd = process.platform === 'win32' ? 'tasklist' : 'ps aux'
    const v2ray = process.platform === 'win32' ? 'v2ray.exe' : 'v2ray'
    cp.exec(cmd, function (err, stdout, stderr) {
        if (err) {
            return console.log(err)
        }
        stdout.split('\n').filter(function (line) {
            const p = line.trim().split(/\s+/), pname = p[0], pid = p[1]
            if (pname.toLowerCase().indexOf(v2ray) >= 0 && parseInt(pid)) {
                try {
                    process.kill(pid)
                } catch (error) {
                    console.log('kill进程出错：', error)
                }
            }
        })
    })
    cp.spawn(`${v2rayPath}\\${v2ray}`, {
        detached: true
    })
    process.exit(0)
}

(async () => {
    const server = await getLastShadowSocks()
    updateConfig(server)
    restartV2ray()
})()
