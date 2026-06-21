# Cireta Analytics Dashboard — Portfolio Demo

A public, read-only portfolio fork of the Cireta marketing analytics dashboard.

**Original:** built at [BIG IMMERSIVE](https://www.bigimmersive.com) by [Muhammad Bilal](https://bilal-pf.vercel.app).
The production version pulls live Google Analytics 4 + Google Sheets data for the Cireta marketing site.

**This fork:** identical UI and code paths, but Google Analytics credentials are intentionally not provided. The API routes automatically fall back to synthetic mock data that preserves the same shape, KPI mix, and trend direction as the real dashboard, with magnitudes adjusted so no production metrics leak.

## Stack
- Vite + React 19
- Tailwind v4
- Recharts (KPI charts, time-series, geo)
- Tiptap (Blog CMS editor)
- Vercel serverless functions (`api/ga/*.js`) calling `@google-analytics/data`
- Deployed on Vercel

## What it shows
- Traffic Overview — KPIs (users, sessions, page views, events, bounce, duration), monthly trend, top countries, device split
- Activity Stats, Custom Events, Demographics, Countries, Traffic Sources
- Social overview (LinkedIn, X)
- Email Campaigns (from Google Sheets feed)
- Blog CMS (Tiptap-based authoring)

## Running locally
```bash
npm install
npm run dev
```
Without `GA_CLIENT_EMAIL` / `GA_PRIVATE_KEY` env vars, all `/api/ga/*` endpoints return mock data — same as the deployed portfolio demo.

## Links
- Portfolio: https://bilal-pf.vercel.app
- LinkedIn: https://www.linkedin.com/in/mobilal951
