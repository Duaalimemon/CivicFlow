# CivicSense AI: Institutional Municipal Command & Telemetry Engine

**CivicSense AI** is an institutional-grade municipal intelligence command center engineered with Swiss modern design aesthetics, data-dense situational awareness, and an orchestrated Google Gemini multi-agent triage system.

---

## 1. System Architecture & Design System Adherence

- **Primary (Deep Navy)**: `#17324D` — Dominant top institutional navigation, headers, primary buttons.
- **Secondary (Civic Teal)**: `#0F9D92` — Live telemetry status beacons, active intelligence triggers, and confirmed state indicators.
- **Tertiary (Informational Cobalt)**: `#2563EB` — Inspection triggers and system telemetry notices.
- **Neutral Canvas**: `#F5F7FA` — Minimalist, high-clarity background canvas.
- **Surface Clean**: `#FFFFFF` — Data cards, inputs, and tabular structures.
- **Subtle Stroke**: `#E4E7EC` — Hairline architectural dividers and borders.
- **Typography**: Inter exclusively with tabular figures (`tabular-nums` / `font-feature-settings: 'tnum' 1`) for high-precision temporal and sensor readings.
- **Shape & Elevation**: `4px` base up to `12px` for dialogs and modals, crisp borders, subtle shadows.

---

## 2. Project Directory Structure

```text
new project/
├── client/                                # React + Vite + Tailwind CSS
│   ├── src/
│   │   ├── components/
│   │   │   ├── modules/
│   │   │   │   ├── AITriageDrawer.tsx     # Google Gemini 3-Agent inspection drawer
│   │   │   │   ├── IncidentReportModal.tsx# 12px rounded corner incident reporting modal
│   │   │   │   └── TelemetryGrid.tsx      # Real-time municipal sensor grid
│   │   │   └── ui/
│   │   │       ├── Button.tsx             # Design system button variants
│   │   │       ├── DataTable.tsx          # Data-dense tabular incident stream
│   │   │       ├── FormInput.tsx          # Clean hairline inputs with Civic Teal focus
│   │   │       ├── KpiMetricCard.tsx      # High-density KPI cards with tabular figures
│   │   │       └── StatusBadge.tsx        # Semantic priority and status indicators
│   │   ├── types/                         # Shared TypeScript interface definitions
│   │   ├── App.tsx                        # Executive Command Center Cockpit
│   │   ├── index.css                      # Tailwind & Swiss typography tokens
│   │   └── main.tsx
│   ├── tailwind.config.js                 # Precision color and radius token mapping
│   ├── vite.config.ts                     # Dev server and reverse proxy setup
│   └── package.json
│
├── server/                                # Node.js + Express + TypeScript
│   ├── prisma/
│   │   └── schema.prisma                  # PostgreSQL production database schema
│   ├── src/
│   │   ├── controllers/                   # Reports, Telemetry, AI, and Analytics
│   │   ├── db/
│   │   │   └── store.ts                   # In-memory high-fidelity data engine
│   │   ├── routes/v1/                     # RESTful API routing
│   │   ├── services/
│   │   │   └── gemini.service.ts          # Google Gemini GenAI multi-agent triad
│   │   ├── types/                         # Server data models and contracts
│   │   └── server.ts                      # Express API gateway with Helmet and Rate Limiting
│   ├── .env                               # Environment configurations
│   └── package.json
└── package.json                           # Root orchestration scripts
```

---

## 3. Google Gemini Multi-Agent Analytical Module

When an incident is reported, the AI pipeline activates three specialized analytical agents:

1. **Agent 1: Infrastructure Triage Specialist**
   - Assesses physical failure modes, structural vulnerabilities, and immediate hazards.
2. **Agent 2: Civic Sentiment & Risk Analyst**
   - Evaluates citizen distress, community disruption potential, and panic vectors.
3. **Agent 3: Municipal Dispatch Commander**
   - Synthesizes department routing (Water Board, Power Grid, Transit Authority, Emergency Services), work-order protocols, and crew tier requirements.

---

## 4. Local Execution & Commands

### Prerequisites
- Node.js `v20+` or `v24+`
- npm `v10+`

### Quick Start
To run both the server and client concurrently:
```bash
# In the root directory:
npm run dev:server   # Starts API on http://localhost:5000
npm run dev:client   # Starts Command Cockpit on http://localhost:5173
```

### Live Endpoints
- **Frontend Command Cockpit**: [http://localhost:5173/](http://localhost:5173/)
- **Backend Health Check**: [http://localhost:5000/api/v1/health](http://localhost:5000/api/v1/health)
- **Civic Reports API**: [http://localhost:5000/api/v1/reports](http://localhost:5000/api/v1/reports)
- **Live Sensor Telemetry**: [http://localhost:5000/api/v1/telemetry](http://localhost:5000/api/v1/telemetry)
- **Simulate Telemetry Spike**: `POST http://localhost:5000/api/v1/telemetry/simulate`
- **Analytics Overview**: [http://localhost:5000/api/v1/analytics/overview](http://localhost:5000/api/v1/analytics/overview)
