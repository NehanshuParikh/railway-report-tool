const {chromium}=require('playwright');const fs=require('node:fs');const path=require('node:path');const assert=require('node:assert/strict');
(async()=>{
 const credentials=JSON.parse(fs.readFileSync(process.env.LOGIN_TEST_CREDENTIALS,'utf8'));
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
 try{
  const context=await browser.newContext();
  if(process.env.RAILWAY_CDN_CACHE){
   await context.route('https://cdn.jsdelivr.net/npm/exceljs/dist/exceljs.min.js',r=>r.fulfill({path:path.join(process.env.RAILWAY_CDN_CACHE,'exceljs.js'),contentType:'application/javascript'}));
   await context.route('https://cdn.jsdelivr.net/npm/xlsx/dist/xlsx.full.min.js',r=>r.fulfill({path:path.join(process.env.RAILWAY_CDN_CACHE,'xlsx.js'),contentType:'application/javascript'}));
  }
  const page=await context.newPage();const errors=[];page.on('pageerror',error=>errors.push(error.message));
  const url=process.env.RAILWAY_BASE_URL||'http://127.0.0.1:8002';
  await page.goto(url);assert.equal(await page.locator('#reportApp').isVisible(),false);
  await page.getByRole('textbox',{name:'User ID',exact:true}).fill('Parikh');await page.locator('#loginPassword').fill('wrong-password');await page.getByRole('button',{name:'Log in',exact:true}).click();
  await page.waitForFunction(()=>document.querySelector('#loginMessage').textContent.includes('Incorrect'));
  assert.equal(await page.locator('#reportApp').isVisible(),false);
  for(const record of credentials){
   await page.getByRole('textbox',{name:'User ID',exact:true}).fill(record.username.toLowerCase());await page.locator('#loginPassword').fill(record.password);await page.getByRole('button',{name:'Log in',exact:true}).click();
   await page.locator('#reportApp').waitFor({state:'visible'});assert.equal(await page.locator('#sessionUser').textContent(),record.username);
   assert.match(await page.locator('#sessionCountdown').textContent(),/^0[56]:/);
   await page.getByRole('button',{name:'Log out',exact:true}).click();await page.locator('#loginScreen').waitFor({state:'visible'});
  }
  await page.clock.install();await require('./login-helper.cjs').loginForTests(page);
  const expiresAt=await page.evaluate(()=>JSON.parse(localStorage.getItem('railway-report.login.v1')).expiresAt);
  await page.clock.fastForward(3600000);
  await page.reload();await page.locator('#reportApp').waitFor({state:'visible'});
  assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('railway-report.login.v1')).expiresAt),expiresAt);
  assert.match(await page.locator('#sessionCountdown').textContent(),/^0[45]:/);
  const second=await context.newPage();await second.goto(url);await second.locator('#reportApp').waitFor({state:'visible'});
  await page.getByRole('button',{name:'Log out',exact:true}).click();await second.locator('#loginScreen').waitFor({state:'visible'});await second.close();
  await require('./login-helper.cjs').loginForTests(page);
  await page.evaluate(()=>{const popup=document.createElement('div');popup.id='failureSummaryPopup';document.body.appendChild(popup);window._sheetRows=[['previous-report']];});
  await page.clock.fastForward(21601000);await page.locator('#loginScreen').waitFor({state:'visible'});
  assert.equal(await page.locator('#failureSummaryPopup').count(),0);assert.deepEqual(await page.evaluate(()=>window._sheetRows),[]);assert.equal(await page.evaluate(()=>localStorage.getItem('railway-report.login.v1')),null);
  const blockedOperations=await page.evaluate(async()=>({rows:await uploadRows('unused',[],'trainIssue'),wr:await uploadWRFaults([]),reports:await submitReports()}));
  assert.deepEqual(blockedOperations,{rows:false,wr:false,reports:false});
  await require('./login-helper.cjs').loginForTests(page);await page.locator('#reportApp').waitFor({state:'visible'});
  await page.evaluate(()=>localStorage.setItem('railway-report.login.v1','broken'));await page.reload();await page.locator('#loginScreen').waitFor({state:'visible'});
  assert.deepEqual(errors,[]);
  const isolated=await browser.newContext();
  await isolated.addInitScript(()=>{for(const name of ['localStorage','sessionStorage'])Object.defineProperty(window,name,{get(){throw new Error('Storage blocked');}});});
  if(process.env.RAILWAY_CDN_CACHE){
   await isolated.route('https://cdn.jsdelivr.net/npm/exceljs/dist/exceljs.min.js',r=>r.fulfill({path:path.join(process.env.RAILWAY_CDN_CACHE,'exceljs.js'),contentType:'application/javascript'}));
   await isolated.route('https://cdn.jsdelivr.net/npm/xlsx/dist/xlsx.full.min.js',r=>r.fulfill({path:path.join(process.env.RAILWAY_CDN_CACHE,'xlsx.js'),contentType:'application/javascript'}));
  }
  const restricted=await isolated.newPage();await restricted.goto(url);await require('./login-helper.cjs').loginForTests(restricted);
  assert.match(await restricted.locator('#sessionNotice').textContent(),/storage is unavailable/);
  await restricted.reload();await restricted.locator('#loginScreen').waitFor({state:'visible'});await isolated.close();
  console.log('PASS: all five users, incorrect credentials, six-hour countdown, refresh without extension, cross-tab logout, expiry cleanup, re-login, invalid-session recovery.');
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exit(1)});
