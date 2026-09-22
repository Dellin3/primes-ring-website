import { chromium } from '/Users/zhuoxuanli/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright-core/index.mjs'
import fs from 'node:fs/promises'
const out='/Users/zhuoxuanli/primes-ring-website/artifacts/refinement/home'
await fs.mkdir(out,{recursive:true})
const browser=await chromium.launch({headless:true,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'})
const reports=[]
async function metrics(page){return page.evaluate(()=>{
 const rect=e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,right:r.right,bottom:r.bottom}}
 const labels=[...document.querySelectorAll('.hero-figure-labels span')].map(e=>({text:e.innerText,box:rect(e)}))
 const cards=[...document.querySelectorAll('.research-module-card')].map(e=>({number:rect(e.querySelector('.module-number')),title:rect(e.querySelector('h3')),body:rect(e.querySelector('p')),link:rect(e.querySelector('a'))}))
 const copy=document.querySelector('.hero-copy'),fig=document.querySelector('.hero-illustration'),viewport=document.querySelector('.hero-scene-viewport')
 return {width:innerWidth,scrollWidth:document.documentElement.scrollWidth,labels,cards,copy:copy&&rect(copy),figure:fig&&rect(fig),viewport:viewport&&rect(viewport),leaders:[...document.querySelectorAll('[data-leader]')].map(e=>({name:e.dataset.leader,d:e.getAttribute('d')})),header:{background:getComputedStyle(document.querySelector('.site-header')).backgroundColor,color:getComputedStyle(document.querySelector('.primary-nav')).color},sceneReady:!!document.querySelector('.is-webgl-ready')}
})}
for(const [width,height] of [[1440,900],[1280,800],[390,844]]){
 const context=await browser.newContext({viewport:{width,height}})
 const page=await context.newPage(); const errors=[];const req=[]
 page.on('pageerror',e=>errors.push(String(e)));page.on('request',r=>req.push(r.url()))
 await page.goto('http://127.0.0.1:5174/',{waitUntil:'networkidle'})
 await page.screenshot({path:`${out}/home-${width}.png`})
 await page.locator('.hero-illustration').screenshot({path:`${out}/annotations-static-${width}.png`})
 const report={width,height,static:await metrics(page),initial3dRequested:req.some(u=>/ScientificHeroScene|react-three/.test(u)),errors}
 const before=await page.locator('.project-hero').boundingBox()
 await page.keyboard.press('Tab')
 report.skip={focused:await page.locator('.skip-link').evaluate(e=>e===document.activeElement),before,after:await page.locator('.project-hero').boundingBox()}
 await page.keyboard.press('Enter')
 report.skip.target=await page.evaluate(()=>document.activeElement.tagName)
 await page.locator('.research-module-grid').scrollIntoViewIfNeeded()
 await page.locator('.research-module-grid').screenshot({path:`${out}/home-cards-${width}.png`})
 report.cards=await metrics(page)
 await page.evaluate(()=>window.scrollTo(0,350))
 report.scrolledHeader=await page.locator('.site-header').evaluate(e=>({background:getComputedStyle(e).backgroundColor,color:getComputedStyle(e).color}))
 await page.goto('http://127.0.0.1:5174/research',{waitUntil:'networkidle'})
 await page.locator('.research-module-grid').screenshot({path:`${out}/research-cards-${width}.png`})
 report.research=await metrics(page)
 if(width===1440 || width===390){
  await page.goto('http://127.0.0.1:5174/',{waitUntil:'networkidle'})
  await page.getByRole('button',{name:'Animate illustration',exact:true}).click()
  await page.locator('.is-webgl-ready').waitFor({timeout:20000})
  report.animation=[]
  for(let frame=0;frame<=4;frame++){
   if(frame)await page.waitForTimeout(4100)
   await page.locator('.hero-illustration').screenshot({path:`${out}/annotations-animated-${width}-${frame}.png`})
   report.animation.push(await metrics(page))
  }
  await page.getByRole('button',{name:'Show static illustration',exact:true}).click()
  report.paused=await metrics(page)
  await page.getByRole('button',{name:'Animate illustration',exact:true}).click()
  await page.locator('.is-webgl-ready').waitFor({timeout:20000})
  report.restarted=await metrics(page)
 }
 if(width===1440){
  report.textScale=[]
  for(const scale of [1.25,1.5,2]){
   await page.evaluate(scale=>document.documentElement.style.fontSize=`${16*scale}px`,scale)
   await page.locator('.hero-illustration').screenshot({path:`${out}/annotations-text-${scale}.png`})
   report.textScale.push({scale,...await metrics(page)})
  }
 }
 reports.push(report)
 await context.close()
}
await fs.writeFile(`${out}/visual-checks.json`,JSON.stringify(reports,null,2))
console.log(JSON.stringify(reports.map(r=>({width:r.width,initial3dRequested:r.initial3dRequested,overflow:r.static.scrollWidth-r.static.width,skipShift:r.skip.after.y-r.skip.before.y,skipTarget:r.skip.target,sceneFrames:r.animation?.length,errors:r.errors})),null,2))
await browser.close()
