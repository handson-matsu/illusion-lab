/* Development-only browser check. Run with Playwright available in NODE_PATH.
   CHROME_PATH can point to an installed Chrome. Start the static server first. */
const {chromium} = require('playwright');
const assert = require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||undefined});
 const page=await browser.newPage({viewport:{width:1440,height:1100}, reducedMotion:'reduce'});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(process.env.APP_URL||'http://127.0.0.1:8765');
 const spec=await page.evaluate(()=>QUESTIONS.map(q=>({id:q.id,key:answerKey(q),type:q.type,metric:q.metric,d:dimensions(q),angle:q.angle,larger:q.larger})));
 assert.equal(spec.length,15);assert(spec.some(q=>q.key==='same'));assert(spec.some(q=>q.key!=='same'));
 await page.screenshot({path:'/tmp/illusion-desktop.png',fullPage:true});
 for(let i=0;i<15;i++){
   const q=spec[i];
   assert.equal(await page.locator('#verification').isVisible(),false);
   assert.equal(await page.locator('#next').count(),0);
   await page.locator(`[data-answer="${q.key}"]`).click();
   assert.equal(await page.locator('.verdict').innerText(),'正解');
   assert.equal(await page.locator('#verification').isVisible(),false);
   assert.equal(await page.locator('#next').count(),0);
   await page.locator('#verify').click();
   assert.equal(await page.locator('#figure').getAttribute('class'),'figure verified');
   assert(await page.locator('#verification').isVisible());
   // Compare rendered geometry, after CSS transforms, against data.
   if(['muller','ponzo','vertical','ebbinghaus'].includes(q.type)) {
     const boxes=await page.locator('#figure .target').evaluateAll(els=>els.map(el=>{const b=el.getBoundingClientRect();return {x:b.x,y:b.y,w:b.width,h:b.height};}));
     if(q.type==='ebbinghaus') {
       assert(Math.abs((boxes[0].x+boxes[0].w/2)-(boxes[1].x+boxes[1].w/2))<.1);
       assert(Math.abs(boxes[0].w/boxes[1].w-q.d.a/q.d.b)<.001);
     }else{
       assert(Math.abs(boxes[0].x-boxes[1].x)<.1);
       assert(Math.abs(boxes[0].w/boxes[1].w-q.d.a/q.d.b)<.001);
       assert(boxes.every(b=>b.h<.1));
     }
   }
   if(q.type==='color'||q.type==='brightness'){
     const boxes=await page.locator('#figure .target rect').evaluateAll(els=>els.map(el=>{const b=el.getBoundingClientRect();return {left:b.left,right:b.right,fill:getComputedStyle(el).fill};}));
     assert(Math.abs(boxes[0].right-boxes[1].left)<.1);
     assert.equal(boxes[0].fill===boxes[1].fill,q.larger==='same');
   }
   await page.locator('#figure').screenshot({path:`/tmp/illusion-verify-${i+1}.png`});
   await page.locator('#toggle-view').click();assert.equal(await page.locator('#figure').getAttribute('class'),'figure');
   await page.locator('#toggle-view').click();
   await page.locator('#next').click();
 }
 assert.match(await page.locator('#result-title').innerText(),/15問中15問/);
 assert.equal(await page.locator('details').count(),15);
 await page.locator('summary').first().click();await page.locator('.review-toggle').first().click();
 assert.equal(await page.locator('.review-body .figure').first().getAttribute('class'),'figure');
 await page.locator('#restart').click();
 // All-same strategy must fail and review counter must agree.
 let expected=spec.filter(q=>q.key==='same').length;
 for(let i=0;i<15;i++){await page.locator('[data-answer="same"]').click();await page.locator('#verify').click();await page.locator('#next').click();}
 assert.match(await page.locator('#result-title').innerText(),new RegExp(`15問中${expected}問`));
 assert.match(await page.locator('.review-stat').nth(1).innerText(),new RegExp(`${15-expected}`));
 await page.screenshot({path:'/tmp/illusion-results.png',fullPage:true});
 await page.locator('#restart').click();
 for(const [name,width,height] of [['phone',375,812],['small-phone',320,740],['ipad',768,1024]]){
   await page.setViewportSize({width,height});
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
   await page.screenshot({path:`/tmp/illusion-${name}.png`,fullPage:true});
   await page.locator('[data-answer="same"]').click();await page.locator('#verify').click();
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
   await page.screenshot({path:`/tmp/illusion-${name}-verified.png`,fullPage:true});
   await page.goto(process.env.APP_URL||'http://127.0.0.1:8765');
 }
 // Exercise normal animation and all mobile question layouts too.
 await page.setViewportSize({width:375,height:812});
 await page.emulateMedia({reducedMotion:'no-preference'});
 await page.locator('[data-answer="same"]').click();await page.locator('#verify').click();
 await page.waitForTimeout(1400);
 const animationState=await page.locator('#figure .target').evaluateAll(els=>els.map(el=>getComputedStyle(el).transform));
 assert(animationState.every(value=>value!=='none'));
 await page.goto(process.env.APP_URL||'http://127.0.0.1:8765');
 await page.emulateMedia({reducedMotion:'reduce'});
 for(let i=0;i<15;i++){
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
   await page.locator('#figure').screenshot({path:`/tmp/illusion-mobile-question-${i+1}.png`});
   await page.locator('[data-answer="same"]').click();await page.locator('#verify').click();
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
   await page.locator('#figure').screenshot({path:`/tmp/illusion-mobile-verify-${i+1}.png`});
   await page.locator('#next').click();
 }
 await page.locator('#restart').click();
 await page.locator('#help').click();assert(await page.locator('dialog').isVisible());await page.keyboard.press('Escape');assert(!(await page.locator('dialog').isVisible()));
 assert.deepEqual(errors,[]);
 console.log(JSON.stringify({questions:15,perfectScore:15,allSameScore:expected,viewports:['1440','768','375','320'],errors},null,2));
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
