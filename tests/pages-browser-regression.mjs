const {chromium} = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
import {readFile} from 'node:fs/promises';
const {entries}=JSON.parse(await readFile(process.env.PAGES_MANIFEST || 'pages-history/versions.json'));
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH,headless:true,args:['--no-sandbox']});
const base = process.env.PAGES_TEST_URL || 'http://127.0.0.1:4180/MyOffice/';
const context=await browser.newContext();const main=await context.newPage();
await main.goto(base);await main.waitForFunction(()=>document.querySelector('#root')?.textContent.length>100);
await main.evaluate(()=>localStorage.setItem('regression-main','preserved'));
for(const entry of entries.filter(e=>e.status==='ready')){
const page=await context.newPage();const errors=[];page.on('pageerror',error=>errors.push(error.message));
await page.goto(`${base}versoes/${entry.sha}/`);await page.waitForFunction(()=>document.querySelector('#root')?.textContent.length>100);
const isolated=await page.evaluate(()=>{const absent=localStorage.getItem('regression-main')===null;localStorage.setItem('test-preview','own');const indexed=Object.keys(localStorage).includes('test-preview');localStorage.clear();return absent&&indexed&&localStorage.length===0;});
if(!isolated||errors.length)throw Error(JSON.stringify({sha:entry.sha,isolated,errors}));await page.close();
}
if(await main.evaluate(()=>localStorage.getItem('regression-main'))!=='preserved')throw Error('Main data changed');
const catalog=await context.newPage();await catalog.goto(`${base}versoes/`);await catalog.locator('#search').fill(entries[0].sha.slice(0,7));if(await catalog.locator('article:visible').count()!==1)throw Error('Search failed');
await catalog.setViewportSize({width:390,height:844});if(await catalog.evaluate(()=>document.documentElement.scrollWidth>innerWidth))throw Error('Mobile overflow');
console.log(`${entries.filter(e=>e.status==='ready').length} previews rendered without JavaScript errors; storage isolation, search and mobile layout passed.`);await browser.close();
