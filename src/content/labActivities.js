// Guided activities for the measurement lab in the data explorer. Expected
// values are re-measured from the exact Cassini chunks by
// tests/lab-activity.test.mjs, so the text and the data cannot drift apart.

export const labActivities = {
  'encke-width': {
    id: 'encke-width',
    title: 'Is the Encke Gap the same width in every observation?',
    question: 'Is the Encke Gap the same width in every Cassini observation on this site?',
    range: [133250, 133950],
    variableId: 'optical_depth',
    threshold: 0.1,
    baselineSlug: 'rev123e-x63-dlp-500m',
    compareSlug: 'rev044e-x63-dlp-500m',
    steps: [
      'Measure the gap in Rev 123 with the threshold set to 0.1, then save it as your baseline.',
      'Open Rev 044 at the same window and measure again with the same threshold. Compare the widths.',
      'Lower the threshold to 0.05 and measure Rev 044 again. Why does the width change so much?',
      'Write your answer, then save the comparison to your notebook or copy the reproduction record.',
    ],
    // Gap widths at threshold 0.1 in every observation that covers the window.
    expectedWidths: {
      'rev007e-x43-dlp-500m': 317.75,
      'rev028i-x43-dlp-500m': 305.5,
      'rev044e-x63-dlp-500m': 309,
      'rev064e-x43-dlp-500m': 314.5,
      'rev123e-x63-dlp-500m': 320,
      'rev133e-x43-dlp-500m': 335.25,
    },
    lowThreshold: { threshold: 0.05, slug: 'rev044e-x63-dlp-500m', width: 72.75 },
    finding: 'At a threshold of 0.1 the six observations give widths from about 306 to 335 km. Lowering the threshold to 0.05 shrinks Rev 044’s width to about 73 km, because a few noise spikes inside the gap rise above 0.05 and break the run.',
    interpretation: 'Differences between observations can come from where along the ring each signal crossed, from noise in each profile, and from the threshold you choose. These profiles alone cannot tell those causes apart, so compare widths only at the same threshold.',
  },
}

export const getActivity = (id) => labActivities[id] ?? null

export function activityHref(activity, slug = activity.baselineSlug, version = '1.1.0') {
  const params = new URLSearchParams({ variable: activity.variableId, from: String(activity.range[0]), to: String(activity.range[1]), version, threshold: String(activity.threshold), activity: activity.id })
  return `/data/${slug}?${params}`
}
