import { createFeedbackHandler } from '../server/feedback.mjs'

// Vercel's Node function is the only public entrypoint. Feedback records are
// private and there is deliberately no endpoint that lists or reads them.
export default createFeedbackHandler()
