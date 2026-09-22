import { chromium } from '/Users/zhuoxuanli/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright-core/index.mjs'
import { mkdir, writeFile, mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
const out = new URL('../artifacts/refinement/final/', import.meta.url).pathname
await mkdir(out, { recursive: true })
const base = 'http://localhost:5174'
const url = `${base}/data/rev133e-x43-dlp-500m?guide=1&variable=optical_depth&from=133625.75&to=133881.75&version=1.1.0`
const b = await chromium.launch({ channel: 'chrome', headless: true })
const c = await b.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' })
const p = await c.newPage()
async function snapshot(name, fullPage = false) { await p.evaluate(() => scrollTo({ top: 0, behavior: 'instant' })); await p.screenshot({ path: join(out, name), fullPage, animations: 'disabled' }) }
await p.goto(base, { waitUntil: 'networkidle' }); await snapshot('home.png'); await p.locator('.hero-illustration').screenshot({ path: join(out, 'annotations.png') }); await p.locator('.research-module-grid').screenshot({ path: join(out, 'home-cards.png') })
await p.goto(`${base}/research`, { waitUntil: 'networkidle' }); await p.locator('.research-module-grid').screenshot({ path: join(out, 'research-cards.png') })
await p.goto(url); await p.locator('canvas[role=slider]').waitFor(); await snapshot('exact-guide.png')
await p.locator('canvas[role=slider]').focus(); await p.locator('canvas[role=slider]').press('Home'); await p.locator('canvas[role=slider]').press('ArrowRight'); await snapshot('exact-inspected.png')
await p.goto(`${base}/data/rev133e-x43-dlp-500m?guide=0&version=1.1.0`); await p.getByRole('button',{name:'Add a note',exact:true}).click(); await p.getByLabel('Observations and limitations').fill('A broad region to revisit before choosing individual samples.'); await p.getByRole('button',{name:'Save exploration',exact:true}).click(); await p.getByText('Exploration saved.',{exact:true}).waitFor(); await snapshot('overview-saved.png', true)
await p.goto(`${base}/explorations`,{waitUntil:'networkidle'}); await snapshot('notebook-saved.png', true)
const d = await b.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' }); const q=await d.newPage(); await q.goto(url); await q.getByRole('button',{name:'Add a note',exact:true}).click(); await q.getByLabel('Observations and limitations').fill('An unfinished question about this region.'); await q.goto(`${base}/explorations`); await q.getByRole('link',{name:'Resume draft',exact:true}).waitFor(); await q.screenshot({path:join(out,'notebook-draft-only.png'),fullPage:true,animations:'disabled'}); await d.close()
await p.goto(`${base}/resources`,{waitUntil:'networkidle'}); for(const img of await p.locator('img').all()){await img.scrollIntoViewIfNeeded();await img.evaluate(e=>e.decode())} await snapshot('resources.png',true)
await b.close()
const profile=await mkdtemp(join(tmpdir(),'cassini-final-zoom-'));await mkdir(join(profile,'Default'));await writeFile(join(profile,'Default','Preferences'),JSON.stringify({partition:{default_zoom_level:{x:Math.log(2)/Math.log(1.2)}}}))
const z=await chromium.launchPersistentContext(profile,{channel:'chrome',headless:true,viewport:null,reducedMotion:'reduce',args:['--window-size=1440,1000']})
try{const page=z.pages()[0];for(const[name,path]of[['home',base],['workbench',url],['resources',`${base}/resources`]]){
 await page.goto(path,{waitUntil:'networkidle'}); if(name==='workbench'){await page.locator('canvas[role=slider]').waitFor();await page.getByRole('button',{name:'Add a note',exact:true}).click()}
 for(const img of await page.locator('img').all()){await img.scrollIntoViewIfNeeded();await img.evaluate(e=>e.decode())}
 await page.evaluate(()=>scrollTo({top:0,behavior:'instant'}));await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));const cdp=await z.newCDPSession(page);const{contentSize}=await cdp.send('Page.getLayoutMetrics');const shot=await cdp.send('Page.captureScreenshot',{format:'png',captureBeyondViewport:true,fromSurface:true,clip:{x:0,y:0,width:contentSize.width,height:contentSize.height,scale:1}});await writeFile(join(out,`zoom-200-${name}.png`),Buffer.from(shot.data,'base64'));await cdp.detach()
}}finally{await z.close();await rm(profile,{recursive:true,force:true})}
console.log('Captured final app states and native Chrome 200% zoom with loaded teaching images.')
