# DrillSight Prototype

DrillSight is an interactive exploration sample triage demo built as an independent portfolio project by Reinaldo Pang. It accepts a structured CSV, validates the data in-browser, calculates normalized assay signals, and ranks intervals for review.

## CSV format

Required columns: `hole_id`, `depth_m`, `gold_gpt`, `copper_pct`, `latitude`, and `longitude`.

## Technical approach

- Next.js, React, and TypeScript
- Recharts for responsive assay visualization
- Client-side CSV parsing and validation
- Deterministic, explainable priority scoring
- Responsive and keyboard-accessible interface

The included dataset is synthetic. The scoring model is a product-prototyping demonstration, not a geological prediction or operational recommendation.
