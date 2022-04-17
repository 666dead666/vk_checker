'use strict';
const fs = require('fs');
const puppeteer = require('puppeteer');
const useProxy = require('puppeteer-page-proxy');

async function check(proxy) {
    console.log('start', proxy)
    const browser = await puppeteer.launch({
        headless: false
    });
    try {
        const page = await browser.newPage();
        await useProxy(page, `http://${proxy}`);
        await page.goto('https://www.whatismyip.com/');
        await page.waitForTimeout(10000);
        await page.screenshot({ path: `test/${pr}.png`, fullPage: true });

        await browser.close();
        console.log('success', proxy)
    }
    catch (er) {
        await browser.close();
        console.log(er, 'fail')
    }


}

const proxies = fs.readFileSync('proxies.txt', 'utf8').toString().split('\n');
console.log(proxies);

(async () => {
    for (let i = 0; i < proxies.length; i++) {
        await check(proxies[i]);
    }
})()