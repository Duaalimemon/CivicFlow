# CityFix — Smart Civic Complaint Triage System (Hackathon SC-01)
## Production-Quality Frontend MVP Specification & Execution Plan

---

## 1. System Overview & Problem Statement

**CityFix** is a smart civic complaint management and triage platform engineered for municipal administrations and urban residents. Traditional civic reporting suffers from bureaucratic backlogs, duplicate work-orders, vague prioritization, and opaque resolution tracking.

CityFix addresses this with:
1. **Deterministic Algorithmic Triage**: Automatic keyword extraction, safety hazard weighting, and sector-based prioritization (scoring 0–100).
2. **Geospatial & Text Duplicate Detection**: Proximity analysis (within 400m) and NLP keyword overlap to prevent duplicate work-orders.
3. **5-Stage Chronological Audit Ledger**: Transparent accountability from submission to photo-verified field resolution.
4. **Role-Adaptive Perspectives**: Seamless toggle between Citizen Intake and Municipal Operations Cockpit.

---

## 2. Technology Stack & Design System

- **Frontend Core**: React 18.3, Vite 6.1, TypeScript 5.7
- **Styling & Design Tokens**: Tailwind CSS 3.4
  - **Dark Canvas (Default)**: `#060913`
  - **Dark Cards & Panels**: `#0B101D`
  - **Hairline Borders**: `#1E293B`
  - **Accents**: Electric Cyan (`#00F2FE`) & Civic Teal (`#4FACFE`)
  - **Light Canvas**: `#F8FAFC`, Surface `#FFFFFF`, Borders `#E2E8F0`
- **Navigation & Routing**: `react-router-dom` v7 with client-side SPA fallback
- **Data Analytics**: `recharts` for category distribution donuts and monthly intake/resolution trends
- **Geospatial Mapping**: `leaflet` with CartoDB Dark Matter & OpenStreetMap tile sets
- **State & Persistence**: React Context (`AppContext.tsx`) with automatic `localStorage` caching and safe seed restore

---

## 3. Verified Application Routes & Screen Matrix

| Route | Screen Name | Perspective | Key Functionality |
| :--- | :--- | :--- | :--- |
| `/` | **Public Landing Page** | Public / Citizen | Live dynamic statistics, category directory, problem statement hero, how-it-works workflow, interactive map radar preview. |
| `/report` | **Complaint Intake Wizard** | Citizen | 4-step wizard: (1) Title/Description + real-time AI category suggestion, (2) Leaflet pin location picker with coordinates, (3) Photo dropzone, (4) Priority breakdown review & official tracking ID (`CF-2026-XXXX`). |
| `/my-complaints` | **My Complaints & Tracking** | Citizen | Search and status filter pills, complaint card stream, side inspection drawer, photo evidence, and 5-stage vertical timeline. |
| `/admin` | **Executive Operations Cockpit** | Municipal Official | Live KPI counters, category distribution donut, monthly submission vs resolution velocity, department workload progress bars, priority queue, and immutable audit ledger. |
| `/admin/complaints` | **Complaint Management Table** | Municipal Official | Multi-faceted search and filter bar (sector, status, priority), column sorting, pagination, and quick inspect actions. |
| `/admin/complaints/:id` | **Incident Triage & Assignment** | Municipal Official | Deep inspection, mini-map, priority score breakdown, duplicate suggestion review/dismissal, department & staff assignment controls, status milestone advancement, and internal staff notes. |
| `/map` | **Geospatial Radar** | Both Roles | Fullscreen OpenStreetMap with status-colored pins (Urgent ping, High amber, Medium blue, Resolved emerald), filter strip, preview card, and Quick Dispatch authorization. |
| `/login` & `/register` | **Demo Authentication** | Both Roles | Fast-fill 1-click profiles (Alex Rivera / Resident vs. Dir. Arthur Pendelton / Official), password visibility toggle, and role-based redirects. |

---

## 4. Triage & Prioritization Algorithm (`utils/triage.ts`)

- **Intake Baseline**: +20 points
- **Sector Weight**:
  - Critical Infrastructure (Water Supply, Traffic Signals): +15 points
  - Mobility & Public Transit (Roads, Street Lighting): +10 points
- **Citizen Safety Hazard Flag**: +30 points review flag
- **Urgency Signals**: Evaluates critical terms (`danger`, `accident`, `burst`, `flood`, `spark`, `collapsed`) up to +25 points
- **Priority Thresholds**:
  - `0 – 34`: Low Priority
  - `35 – 54`: Medium Priority
  - `55 – 74`: High Priority
  - `75 – 100`: Urgent Priority (triggers pulsating radar marker & dispatch queue alert)
- **Duplicate Clustering**: Evaluates same sector + shared description tokens + geospatial distance (<= 400m).

---

## 5. Local Execution Commands

```bash
# In the client directory:
npm run dev

# Or from project root:
npm run dev:client
```
The application will launch immediately on `http://127.0.0.1:5173/`.

---

## 6. Demonstration Script for Hackathon Judges

1. **Step 1 (The Problem & Landing Page)**:
   - Start on `/`. Show the deep navy dark aesthetic with electric cyan accents.
   - Point to the 4 live metrics (Total Intake, Active Open, Verified Resolved, SLA). Explain that they calculate dynamically from shared state.
2. **Step 2 (Citizen Reporting Flow)**:
   - Click **"File a Complaint"** to enter `/report`.
   - Type `"Broken water pipe flooding street"`. Point out the automated suggestion banner dynamically proposing *Water Supply & Hydrology*.
   - Check the **"Flag as immediate public safety hazard"** box.
   - Proceed through Location (pinpoint on the map), attach photo evidence, and review the algorithmic score breakdown.
   - Click **Submit Complaint** to see the generated official tracking ID (e.g. `CF-2026-8942`).
3. **Step 3 (Citizen Tracking)**:
   - Click **"Track in My Complaints"** (`/my-complaints`).
   - Click the submitted complaint to open the side drawer and show the 5-stage chronological audit timeline.
4. **Step 4 (Role Switch to Municipal Official)**:
   - Click **"Municipal Staff"** in the top navigation role switcher.
   - Navigate to `/admin`. Show the Recharts sector distribution donut and workload capacity meters.
5. **Step 5 (Triage & Dispatch)**:
   - Open `/admin/complaints`, select the urgent incident, assign it to a field engineer (e.g. Priya Patel), post an internal confidential staff note, and advance status to *In Progress*.
6. **Step 6 (Geospatial Radar)**:
   - Navigate to `/map` to show the live city radar, click the incident pin, and show the Quick Dispatch confirmation action.
