const puppeteer = require('puppeteer-extra')
const process = require('process')
const cp = require('child_process')
const fs = require('fs')
const path = require('path')

puppeteer.use(require('puppeteer-extra-plugin-stealth')())

// 这两个文件位置替换为自己的
const v2rayPath = 'C:\\Users\\rockxsj\\scoop\\apps\\v2ray\\current'
const chromeExe = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'

async function getLastShadowSocks(currentConfig) {
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
    const ths = await page.$$('#tbss > thead > tr > th')
    const propertyIndex = {}
    for (let i = 0; i < ths.length; i++) {
        const text = await page.evaluate(el => el.innerHTML, ths[i]);
        propertyIndex[text] = i + 1
    }
    const trs = await page.$$('#tbss > tbody > tr')
    const okCountry = ['SG', 'JP', 'HK', 'RU', 'TW']
    const okQuality = '10↑/10↑/10↑/10↑'
    const okMethod = 'aes-256-cfb'
    let ret
    for (let i = 0; i < trs.length; i++) {
        const quality = await trs[i].$eval(`td:nth-child(${propertyIndex['V/T/U/M']})`, node => node.innerText)
        const country = await trs[i].$eval(`td:nth-child(${propertyIndex['<i class="fa fa-globe" aria-hidden="true"></i>']})`, node => node.innerText)
        const method = await trs[i].$eval(`td:nth-child(${propertyIndex['Method']})`, node => node.innerText)
        if (quality !== okQuality || !okCountry.includes(country) || method !== okMethod) {
            continue
        }
        const address = await trs[i].$eval(`td:nth-child(${propertyIndex['Address']})`, node => node.innerText)
        const port = await trs[i].$eval(`td:nth-child(${propertyIndex['Port']})`, node => node.innerText)
        const password = await trs[i].$eval(`td:nth-child(${propertyIndex['Password']})`, node => node.innerText)
        ret = {
            address, port: parseInt(port), password, method
        }
        if (!currentConfig) {
            break
        }
        if (currentConfig.address === ret.address && currentConfig.port === ret.port) {
            continue
        }
        break
    }
    await browser.close()
    return ret
}

function getCurrentConfig() {
    const config = JSON.parse(fs.readFileSync(path.join(v2rayPath, "config.json")))
    let server
    config.outbounds.forEach(each => {
        if (each.protocol !== 'shadowsocks') {
            return
        }
        server = each.settings.servers[0]
    })
    return server
}

function updateConfig(server) {
    if (!server) {
        console.warn('没有抓取到符合条件的服务器')
        return
    }
    const config = JSON.parse(fs.readFileSync(path.join(v2rayPath, "config.json")))
    config.outbounds.forEach(each => {
        if (each.protocol !== 'shadowsocks') {
            return
        }
        each.settings.servers[0] = server
    })
    fs.writeFileSync(path.join(v2rayPath, "config.json"), JSON.stringify(config))
}

function restartV2ray() {
    const v2ray = process.platform === 'win32' ? 'v2ray.exe' : 'v2ray'
    const cmd = process.platform === 'win32' ? 'tasklist' : `ps aux | grep ${v2ray}`
    const taskList = cp.execSync(cmd)
    taskList.toString().split('\n').filter(function (line) {
        const p = line.trim().split(/\s+/), pname = p[0], pid = p[1]
        if (pname.toLowerCase().indexOf(v2ray) >= 0 && parseInt(pid)) {
            console.info('之前v2ray进程pid：', pid)
            try {
                process.kill(pid)
            } catch (error) {
                console.log('kill进程出错：', error)
            }
        }
    })
    const configTest = cp.execSync(path.join(v2rayPath, v2ray) + ' -test')
    if (configTest.indexOf('Configuration OK.') === -1) {
        console.error('验证配置失效，配置为：', getCurrentConfig())
        process.exit(1)
    }
    cp.spawn(path.join(v2rayPath, v2ray), {
        detached: true
    })
    setTimeout(() => {
        process.exit(0)
    }, 200)
}

(async () => {
    const currentConfig = getCurrentConfig()
    const server = await getLastShadowSocks(currentConfig)
    updateConfig(server)
    restartV2ray()
})()
