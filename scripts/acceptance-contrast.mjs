import { chromium } from '/Users/zhuoxuanli/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright-core/index.mjs'
import { writeFile } from 'node:fs/promises'
const b = await chromium.launch({ channel: 'chrome', headless: true })
const p = await b.newPage({ viewport: { width: 1440, height: 1000 } })
const report = []
async function measure(path, selectors) {
  await p.goto(`http://localhost:5174${path}`, { waitUntil: 'networkidle' })
  if (path.startsWith('/data/rev')) await p.getByRole('button', { name: 'Add a note', exact: true }).click()
  report.push(...await p.evaluate(selectors => {
    const rgba = text => { const a = text.match(/[\d.]+/g)?.map(Number) || [0, 0, 0, 0]; return [a[0], a[1], a[2], a[3] ?? 1] }
    const over = (fg, bg) => [0,1,2].map(i => fg[i] * fg[3] + bg[i] * (1-fg[3])).concat(1)
    const luminance = rgb => rgb.slice(0,3).map(c => { c/=255; return c <= .04045 ? c / 12.92 : ((c + .055) / 1.055)**2.4 }).reduce((sum,v,i)=>sum+v*[.2126,.7152,.0722][i],0)
    const ratio = (a,b) => (Math.max(luminance(a),luminance(b))+.05)/(Math.min(luminance(a),luminance(b))+.05)
    return selectors.flatMap(selector => [...document.querySelectorAll(selector)].filter(e => e.getBoundingClientRect().width && e.getBoundingClientRect().height).map(e => {
      const cs = getComputedStyle(e); const chain=[]; let node=e; while(node){chain.unshift(node);node=node.parentElement}
      let bg=[255,255,255,1], opacity=1; const gradients=[]
      for(const node of chain){const style=getComputedStyle(node);bg=over(rgba(style.backgroundColor),bg);opacity*=Number(style.opacity);if(style.backgroundImage!=='none')gradients.push(style.backgroundImage)}
      const fg=rgba(cs.color);fg[3]*=opacity;const composite=over(fg,bg),value=ratio(composite,bg)
      const threshold=Number.parseFloat(cs.fontSize)>=24 || (Number.parseFloat(cs.fontSize)>=18.66 && Number(cs.fontWeight)>=700) ? 3 : 4.5
      const border = rgba(cs.borderTopColor),borderRatio=ratio(over(border,bg),bg)
      return { path: location.pathname, selector, text: e.textContent.trim().slice(0,80), color: cs.color, background: bg.slice(0,3), fontSize: cs.fontSize, fontWeight: cs.fontWeight, opacity, contrast: +value.toFixed(2), threshold, status: value >= threshold ? 'pass' : 'fail', borderColor: cs.borderTopColor, borderRatio: +borderRatio.toFixed(2), gradients }
    }))
  }, selectors))
}
await measure('/', ['.primary-nav a','.hero-figure-labels span','.hero-start-note','.hero-summary','.hero-illustration-toggle','.research-module-card h3','.research-module-card p','.research-module-card .text-link'])
await measure('/data/rev133e-x43-dlp-500m?guide=0&version=1.1.0',['.primary-nav a','.workbench-observation-select select','.workbench-header h1','.observation-source-meta','.axis-explainer','.guide-strip > span','.exact-range-form label','.exact-range-form input','.exploration-notes label','.exploration-notes input','.exploration-notes textarea','.exploration-notes .button','.download-explanation','.workbench-plot-column button:disabled','.context-tabs button'])
await measure('/explorations',['.explorations-page > p','.saved-draft h3','.saved-draft p','.saved-draft a'])
await measure('/resources',['.resource-status-placeholder p','.resources-page h1','.resources-page h2','.resources-page p','.resource-preview-link'])
await writeFile(new URL('../artifacts/refinement/contrast.json',import.meta.url),JSON.stringify({method:'Computed styles, alpha composited against ancestor backgrounds. Gradient ancestors listed for separate visual/worst-stop review; no all-page WCAG certification implied.',results:report},null,2))
console.log(JSON.stringify({count:report.length,failures:report.filter(r=>r.status==='fail'),minimum:Math.min(...report.map(r=>r.contrast))},null,2))
await b.close()
