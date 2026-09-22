import assert from 'node:assert/strict'
import { chromium } from '/Users/zhuoxuanli/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright-core/index.mjs'
import { writeFile, readFile, mkdir } from 'node:fs/promises'
const output = new URL('../artifacts/refinement/download-policy/', import.meta.url).pathname
await mkdir(output,{recursive:true})
const browser=await chromium.launch({channel:'chrome',headless:true})
const context=await browser.newContext({acceptDownloads:true})
const page=await context.newPage()
const session=await browser.newBrowserCDPSession()
const {browserContextIds}=await session.send('Target.getBrowserContexts')
const browserContextId=browserContextIds[0]
const results=[]
try{
 await page.goto('http://localhost:5174/data/rev133e-x43-dlp-500m?guide=1&variable=optical_depth&from=133625.75&to=133881.75&version=1.1.0');await page.locator('canvas[role=slider]').waitFor();await page.getByRole('button',{name:'Add a note',exact:true}).click();await page.getByLabel('Observations and limitations').fill('Browser-denied downloads preserve this note.')
 for(const [label,selector]of[['Export notes','.exploration-notes .download-status'],['Download selected data','.workbench-plot-column .download-status']]){
  await session.send('Browser.setDownloadBehavior',{behavior:'deny',browserContextId})
  let waiting=page.waitForEvent('download');await page.getByRole('button',{name:label,exact:true}).click();const denied=await waiting;const failure=await denied.failure();assert.ok(failure)
  const feedback=await page.locator(selector).innerText();assert.match(feedback,/prepared for download/);assert.equal(/saved to|completed|finished/.test(feedback),false)
  await session.send('Browser.setDownloadBehavior',{behavior:'allow',browserContextId,downloadPath:output})
  waiting=page.waitForEvent('download');await page.getByRole('button',{name:label,exact:true}).click();const retried=await waiting;assert.equal(await retried.failure(),null);const path=`${output}/${retried.suggestedFilename()}`;const content=await readFile(path,'utf8');assert.ok(label==='Export notes'?content.includes('Browser-denied downloads preserve this note.'):content.includes('sample_index,ring_radius_km'))
  results.push({label,deniedFailure:failure,feedback,retryFailure:null,suggestedFilename:retried.suggestedFilename()})
 }
 await writeFile(`${output}/results.json`,JSON.stringify({at:new Date().toISOString(),browser:browser.version(),method:'Real Chrome download denied by isolated CDP browser policy, then allowed and retried. This is not a test of clicking Safari’s native Cancel button.',results},null,2));console.log(JSON.stringify(results,null,2))
}finally{await browser.close()}
