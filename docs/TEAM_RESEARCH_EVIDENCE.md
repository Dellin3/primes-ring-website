# Team research evidence — 2026-09-22

## Source and review boundary

The owner supplied `Saturn_s_Rings___PRIMES_2026___Master_Doc (40).pdf` (23 pages).
SHA-256: `0c9f5def3d105adcf6a635f87c561c1f291f0244e34dc632042beb62fb18e14b`.
This is a working manuscript, not evidence of publication. PDF metadata dates are
not publication dates. The full PDF is not copied into the repository or preview.
This update summarizes it for the owner's review; it does not publish production.

Title-page authors: Dell Li, Maiya Qiu, Yutong Zhao. Mentor: Dr. Ryan Maguire.
The acknowledgment on p. 3 attributes §§4–6 to Dell Li, least-squares/PAC and
compilation to Maiya Qiu, and Padé/adaptive least-squares to Yutong Zhao. The
public-facing research page presents the combined team workflow.

## Method source map

| Page / section | Website content | Scope |
| --- | --- | --- |
| pp. 10–14, §3.1 | Low-order Padé and adaptive least-squares starting candidates | Synthetic / phase-like examples; not a full data benchmark |
| pp. 14–16, §3.1 | Pseudo-arclength tangent prediction, constrained Newton correction, PCHIP | Synthetic continuation demonstrations |
| pp. 16–17, §3.2 | Halley correction on the original function; residual and stability checks | No general 1e-12 guarantee asserted |
| pp. 17–18, §4 | Circular one-to-one branch association and five test cases | Noiseless synthetic roots, ten samples per case |
| pp. 18–19, §5 / Table 2 | Generic-fold derivatives and squared-separation slopes | Stated scalar Fresnel geometry |
| pp. 19–21, §6 / Table 3 / Figure 18 | Eight-offset local-integral discrepancy comparison | Windowed angular contribution, not final optical-depth reconstruction |

## Data provenance distinction

The explorer contains six DLP products (Rev 007, 028, 044, 064, 123, 133), totaling
1,566,902 source rows at 0.25 km sampling. This is archive coverage, not the count
of records to which the paper's new methods were applied. Sampling is not resolution.

The scalar tests use constants from a Rev 133 working draft. The manuscript cites
the earlier product `RSS_2010_170_X34_E_GEO`. Do not silently substitute X43, or
identify that geometry file with the explorer's `X43_E_DLP_500M` profile.
The paper does not independently verify the PDS-to-vector azimuth convention.
20 m / 50 m are motivating targets, not demonstrated final resolutions.

## Table 3 transcription and conclusion conflict

All errors below are **percent**, not fractions.

| Offset μ (km) | Ordinary SPA | Switched | Evaluator |
| ---: | ---: | ---: | --- |
| 0.001 | 59.5629 | 2.01e-10 | Simpson |
| 0.003 | 49.6822 | 2.17e-10 | Simpson |
| 0.01 | 36.5413 | 2.01e-10 | Simpson |
| 0.03 | 22.1027 | 8.67e-11 | Simpson |
| 0.1 | 6.2333 | 8.00e-11 | Simpson |
| 0.3 | 2.2872 | 2.2872 | SPA |
| 1 | 0.2756 | 0.2756 | SPA |
| 3 | 0.0242 | 0.0242 | SPA |

SPA + labels and SPA + flags equal ordinary SPA at all eight offsets.
The conclusion on p. 21 calls 0.0242% the new maximum. This conflicts with
Table 3, the p. 20 text (59.56% → 2.29%), and Figure 18. The website uses
the supported maximum **2.2872%** at μ = 0.3 km. The source PDF is unmodified.

Error definition: `abs(I_method − I_ref) / (abs(I_method) + abs(I_ref))`,
multiplied by 100 for percent. The preset pair-phase-gap threshold χ ≤ 1 selects
quadrature at five offsets. At μ = 0.3 km, χ ≈ 3.60 retains SPA; there is no
1% guarantee over this grid. The local taper is one inside 0.4 degrees and zero
beyond 0.8 degrees, with a cosine transition.

16,385 samples per Simpson evaluation yield 81,925 direct integrand samples plus
six saddle evaluations, versus 131,080 samples for all-quadrature. The 37.5%
reduction measures integrand sampling work, not elapsed runtime. The paper says
the hybrid still costs more than ordinary SPA. Adaptive Gauss–Kronrod reference
was checked against 131,073-point Simpson and trapezoid rules. Numerical
reference agreement is not a physical uncertainty bound.

## Other reported results

Fold: ρc = 121069.150400 km, φc = 93.063921 degrees. Predicted and measured
squared-separation slopes are 0.07598542 and 0.07598439 deg²/km, respectively.
The manuscript reports a relative difference of 0.001345%; do not recompute it
from the rounded displayed slopes. At μ = −0.01 / +0.01 km there are zero / two
local roots. The earlier 501-radius no-fold scan is a different investigation.

Branch matching: five noiseless synthetic cases, ten samples each, 0.28-radian
gate. One-to-one assignment removes nine wrong links and nine false predecessor
flags for close parallel tracks. Prediction adds no improvement in these cases.
All methods still lose three identities beyond the gate. Same-root relabeling
changes the complex sum by at most 8.88e-16, at rounding scale; it does not improve
the SPA approximation itself.

## Implementation and verification boundary

`src/content/paperEvidence.js` holds transcribed values. The interactive plot
connects the eight reported samples with logarithmic axes; it generates no new
measurement or smooth inferred root trajectory. Regression tests guard the
whole-table maximum and sample-work denominator, including the unchanged SPA
points. Website tests and builds do not independently reproduce the research.

Earlier availability audits describe their historical source inventory. They
are not rewritten to imply this manuscript was available before it was supplied.
