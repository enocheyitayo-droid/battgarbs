import {chromium} from '@playwright/test';
const browser=await chromium.launch({channel:'chrome',headless:true});
const page=await browser.newPage({viewport:{width:1200,height:900}});
await page.goto('https://battgarbs-atelier-7d4c2a.netlify.app/',{waitUntil:'networkidle'});
const logo=page.locator('.footer-brand img');await logo.scrollIntoViewIfNeeded();await page.waitForTimeout(900);
await logo.screenshot({path:'outputs/footer-logo-live.png'});
console.log(await logo.evaluate(el=>({background:getComputedStyle(el).backgroundColor,filter:getComputedStyle(el).filter,loaded:el.complete&&el.naturalWidth>0})));
await browser.close();
