# NeuroBridge

**Open-source brain organoid analysis platform.** Scientific toolkit for biological neural networks (in-vitro MEA recordings).

[![Live Demo](https://img.shields.io/badge/demo-live-brightgreen)](https://neurocomputers.io)
[![API Docs](https://img.shields.io/badge/api-swagger-blue)](https://api.neurocomputers.io/docs)
[![Deployed on Vercel](https://img.shields.io/badge/deployed-vercel-black?logo=vercel)](https://vercel.com/luckyguybizs-projects/neurobridge)
[![License: MIT](https://img.shields.io/badge/license-MIT-yellow)](LICENSE)

---

## What is NeuroBridge?

NeuroBridge is a web-based analytics platform for researchers working with biological neural networks (brain organoids). It provides real-time visualization, 25+ analysis modules, and AI-powered insights for data from [FinalSpark](https://finalspark.com), [Cortical Labs](https://corticallabs.com), and university MEA platforms.

**Think AWS CloudWatch, but for living neurons.**

### Key Features

- **6 Interactive Visualizations** — Raster plots, firing rate heatmaps, spike waveforms, ISI histograms, cross-correlograms, connectivity graphs (all D3.js)
- **25 Analysis Modules** — From standard spike sorting to novel Organoid IQ scoring, attractor landscape mapping, and causal emergence measurement
- **60+ API Endpoints** — Full REST API with Swagger documentation
- **Real-time Dashboard** — Upload data or generate synthetic spikes, see results instantly
- **Animated Landing Page** — Canvas-based neural network background, scroll-reveal animations, Framer Motion

---

## Screenshots

### Landing Page
Animated neural network background with live spike trace, scroll-reveal capabilities section.

### Dashboard
6 interactive D3.js visualizations with live data from the analysis API. Generate synthetic data or upload real recordings.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router, Turbopack) |
| UI | React 19, TypeScript |
| Visualization | D3.js v7, Canvas API |
| Animation | Framer Motion |
| Styling | Tailwind CSS v4 |
| Backend | [NeuroBridge API](https://github.com/Luckyguybiz/neurobridge-api) (FastAPI, Python) |

---

## Getting Started

### Prerequisites
- Node.js 20+
- [NeuroBridge API](https://github.com/Luckyguybiz/neurobridge-api) running on port 8847

### Installation

```bash
git clone https://github.com/Luckyguybiz/neurobridge.git
cd neurobridge
npm install
npm run dev
# Open http://localhost:3000
```

The dashboard auto-connects to the API at `localhost:8847`. For production, it detects the hostname and connects to `{hostname}:8847`.

---

## Project Structure

```
neurobridge/
├── app/
│   ├── page.tsx              # Landing page
│   ├── dashboard/page.tsx    # Analytics dashboard
│   ├── layout.tsx            # Root layout
│   └── globals.css           # Global styles
├── components/
│   ├── dashboard/            # D3.js visualization components
│   │   ├── RasterPlot.tsx
│   │   ├── FiringRateHeatmap.tsx
│   │   ├── SpikeWaveforms.tsx
│   │   ├── ISIHistogram.tsx
│   │   ├── CrossCorrelogram.tsx
│   │   └── ConnectivityGraph.tsx
│   └── landing/              # Animated landing components
│       ├── NeuralBackground.tsx
│       ├── LiveSpikeTrace.tsx
│       ├── AnimatedText.tsx
│       └── ScrollReveal.tsx
└── lib/
    ├── api.ts                # Backend API client
    ├── types.ts              # TypeScript interfaces
    └── synthetic-data.ts     # Local spike generator
```

---

## Dashboard Visualizations

| Visualization | Description |
|--------------|-------------|
| **Raster Plot** | Spike events across electrodes over time |
| **Firing Rate Heatmap** | Color-coded spike frequency (Inferno scale) |
| **Spike Waveforms** | Overlaid waveform shapes per electrode |
| **ISI Histogram** | Inter-spike interval distribution (log scale) |
| **Cross-Correlogram** | Temporal correlation between electrode pairs |
| **Connectivity Graph** | Force-directed network of functional connections |

---

## API Integration

The frontend connects to the [NeuroBridge API](https://github.com/Luckyguybiz/neurobridge-api) for:

- Synthetic data generation
- File upload (CSV, HDF5, Parquet, JSON, NWB)
- 25+ analysis modules (spike sorting, burst detection, connectivity, IQ scoring, etc.)
- Data export (CSV, JSON)

See the [API documentation](https://github.com/Luckyguybiz/neurobridge-api) for the full endpoint reference.

---

## Deployment

```bash
npm run build
# rsync to server
rsync -avz --exclude node_modules --exclude .next ./ user@server:/path/
# On server:
npm install && npm run build
pm2 start npm --name neurobridge -- start -- -p 3847
```

---

## Related

- [NeuroBridge API](https://github.com/Luckyguybiz/neurobridge-api) — Backend with 25 analysis modules
- [FinalSpark Neuroplatform](https://finalspark.com) — Remote access to living brain organoids
- [Cortical Labs](https://corticallabs.com) — CL1 biological computer

---

## License

MIT

---

*NeuroBridge — Biocomputing-as-a-Service*
