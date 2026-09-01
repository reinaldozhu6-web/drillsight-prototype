# DrillSight

DrillSight is an interactive exploration sample-triage prototype that turns structured drill data into a prioritized review queue. It was built as an independent portfolio project to demonstrate rapid product prototyping, client-side data processing, explainable scoring, and clear technical communication.

## What it does

- Loads a realistic synthetic drill-sample dataset on first visit.
- Accepts user-uploaded CSV files and validates required columns and numeric values.
- Calculates normalized gold and copper signals for every sample interval.
- Produces an explainable priority score and review status.
- Visualizes assay results and presents a ranked review table.
- Keeps uploaded data in the browser; no data is sent to a server.

## Tech stack

- Next.js 16 and React 19
- TypeScript
- Recharts
- Tailwind CSS 4
- Lucide icons

## Run locally

Requirements: Node.js 22.13 or newer.

```bash
git clone https://github.com/reinaldozhu6-web/drillsight-prototype.git
cd drillsight-prototype
npm install
npm run dev
```

Open the local address printed in the terminal, normally [http://localhost:3000](http://localhost:3000).

## CSV format

The upload expects these columns:

| Column | Description | Example |
| --- | --- | --- |
| `hole_id` | Drill-hole identifier | `DH-004` |
| `depth_m` | Interval depth in metres | `106` |
| `gold_gpt` | Gold grade in grams per tonne | `4.12` |
| `copper_pct` | Copper grade as a percentage | `0.93` |
| `latitude` | Sample latitude | `49.2864` |
| `longitude` | Sample longitude | `-123.1223` |

A compatible example is available at [`public/sample-drill-data.csv`](public/sample-drill-data.csv).

## Scoring approach

The prototype calculates z-scores for gold and copper values relative to the uploaded dataset, then combines them into a bounded 0–100 priority score. It also attaches plain-language reasons such as `Elevated gold`, `Elevated copper`, and `Deep interval`.

The model is deterministic and intentionally explainable. It is a software-prototyping demonstration—not a geological prediction or operational recommendation. The included data is synthetic.

## Project structure

```text
app/
  globals.css       Dashboard styling and responsive layout
  layout.tsx        Metadata and application shell
  page.tsx          CSV parsing, scoring logic, charts, and interface
public/
  sample-drill-data.csv
```

## Design decisions

- **Client-side processing:** protects uploaded data and keeps the prototype deployable without a backend.
- **Transparent scoring:** every priority result can be explained from observable assay values.
- **Action-first interface:** users can upload data immediately and inspect ranked results without navigating multiple screens.
- **Graceful validation:** invalid file types, missing columns, and non-numeric data return clear messages.

## Author

Built by **Reinaldo Pang**, Software Engineering Technology student at Centennial College.
