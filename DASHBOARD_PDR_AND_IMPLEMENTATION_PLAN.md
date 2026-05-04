# Measurement Dashboard PDR and Implementation Plan

## Product Requirements

The dashboard supports the environmental IoT monitoring project described in `project_documentation.pdf`. The system represents a smart-city style monitoring platform where distributed autonomous measuring stations send environmental measurements to a central online interface.

### Goals

- Provide an online dashboard for real-time visibility into environmental measurements.
- Show current values for every active measuring station.
- Present minute-level measurement trends on charts.
- Provide daily and monthly summary views.
- Support comparison between different station locations.
- Keep the frontend read-only and suitable for Vercel deployment.

### Target Measurements

The dashboard is based on the Supabase schema in `SUPABASE_SCHEMA.md` and displays:

- Noise level in `dBA`
- Air pollution:
  - `PM2.5`
  - `PM10`
- Temperature in Celsius
- Battery voltage
- Measurement timestamp
- Station quality flag

### Data Sources

The frontend reads from Supabase using the public anon key.

- `latest_measurements`
  - Used for current station cards.
  - Includes station metadata, location, latest timestamp, latest sensor values, battery, and quality flag.
- `measurements`
  - Used for recent time-series charts.
  - Displays minute-level trends for the last 24 hours.
- `daily_measurement_summary`
  - Used for daily and monthly trend summaries.
  - Displays averages for noise, PM2.5, and PM10.

### User Interface Requirements

- The first screen must be the actual dashboard, not a landing page.
- UI language is Macedonian.
- Layout must work on desktop and mobile.
- Dashboard must include:
  - Header with project title and last refresh time.
  - Station selector.
  - Manual refresh button.
  - Current station cards.
  - Metric selector for charts.
  - 24-hour time-series chart.
  - Daily/monthly summary chart.
  - Location comparison chart.
- The interface must handle:
  - Loading state.
  - Empty datasets.
  - Missing Supabase environment variables.
  - Supabase query/access errors.

### Configuration

The dashboard expects these browser-safe environment variables:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

An example is provided in `.env.example`.

### Assumptions

- The app lives at the repository root.
- Supabase remains in the existing `supabase/` directory.
- The dashboard is read-only.
- No authentication UI is required for the first version.
- Supabase Row Level Security, if enabled, must allow anon `select` access to the required views/tables.
- The existing ingestion edge function is not changed by this frontend implementation.

## Implementation Plan

### App Initialization

- Convert the root `package.json` into a Vercel-ready Next.js app.
- Preserve the existing Supabase CLI dependency.
- Add scripts:
  - `npm run dev`
  - `npm run build`
  - `npm run start`
  - `npm run lint`
- Add dependencies:
  - `next`
  - `react`
  - `react-dom`
  - `@supabase/supabase-js`
  - `recharts`
  - `lucide-react`
- Add development dependencies:
  - `typescript`
  - `eslint`
  - `eslint-config-next`
  - React and Node type packages.

### Frontend Structure

- Use Next.js App Router.
- Add:
  - `app/layout.tsx`
  - `app/page.tsx`
  - `app/globals.css`
  - `next.config.ts`
  - `tsconfig.json`
  - `eslint.config.mjs`
  - `next-env.d.ts`
  - `.env.example`

### Data Loading

- Create a Supabase browser client using:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Fetch data client-side from:
  - `latest_measurements`
  - `measurements`
  - `daily_measurement_summary`
- Load recent measurement data for the last 24 hours.
- Load summary data for the last 31 days.
- Refresh automatically every 60 seconds.
- Provide a manual refresh button.

### Dashboard Behavior

- Current station cards show:
  - Station ID
  - Group name
  - Location name
  - Quality flag
  - Noise
  - PM2.5
  - PM10
  - Temperature
  - Battery voltage
  - Measurement time
- Station selector supports:
  - All stations
  - Individual station IDs from `latest_measurements`
- Metric selector supports:
  - Noise
  - PM2.5
  - PM10
  - Temperature
- The 24-hour trend chart uses `measurements`.
- The comparison chart uses latest values from `latest_measurements`.
- The daily/monthly summary chart uses `daily_measurement_summary`.
- Temperature is excluded from the summary chart because the current summary view does not expose average temperature.

### Styling

- Use a responsive dashboard layout.
- Use cards only for station summaries and dashboard panels.
- Use restrained, work-focused visual styling.
- Use icons from `lucide-react`.
- Avoid decorative landing-page elements.
- Ensure mobile layout does not overlap or truncate key text.

### Validation and Error Handling

- Show a configuration warning when Supabase env vars are missing.
- Show a query error message when Supabase returns an error.
- Show loading state while fetching data.
- Show empty states when views/tables return no rows.
- Keep all dashboard interactions read-only.

## Implemented Files

- `app/layout.tsx`
- `app/page.tsx`
- `app/globals.css`
- `.env.example`
- `next.config.ts`
- `tsconfig.json`
- `eslint.config.mjs`
- `next-env.d.ts`
- `package.json`
- `package-lock.json`
- `.gitignore`

## Verification Plan

Run:

```bash
npm run lint
npm run build
npm run dev
```

Manual checks:

- Open `http://localhost:3000`.
- Confirm dashboard renders.
- Confirm missing env vars show a useful warning.
- Add Supabase env vars and confirm data loads.
- Confirm station cards display latest values.
- Confirm metric selector changes all charts.
- Confirm station selector filters the trend and summary charts.
- Confirm empty/error states do not crash the page.
- Confirm mobile layout remains readable.

## Current Verification Result

- `npm run lint` passed.
- `npm run build` passed.
- `npm run dev` started successfully at `http://localhost:3000` after port-binding approval.

## Known Notes

- `npm install` reported 2 moderate vulnerabilities in the dependency tree.
- `npm audit fix --force` was not run because it can introduce breaking dependency changes.
- Existing Supabase edge function behavior was left unchanged.
- Existing unrelated repository changes were not reverted.
