import { useMemo } from 'react'
import katex from 'katex'
import 'katex/dist/katex.min.css'

// Expressions are author-owned strings, never visitor input. Keep semantic
// MathML alongside KaTeX's visual output for assistive technologies.
export default function ResearchMath({ children, display = false }) {
  const html = useMemo(() => katex.renderToString(children, {
    displayMode: display,
    output: 'htmlAndMathml',
    throwOnError: true,
    trust: false,
    strict: 'error',
  }), [children, display])
  return <span className={`research-math${display ? ' research-math-display' : ''}`} dangerouslySetInnerHTML={{ __html: html }} />
}
