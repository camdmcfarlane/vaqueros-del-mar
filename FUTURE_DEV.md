# Future Development Notes

## MapaTab — Interactive Farm Map
An interactive map tab was scaffolded but never completed. The component existed in App.js and showed a "coming soon" placeholder with GPS coordinate progress by region. Needs: confirmed GPS coordinates for all active systems, a map library (e.g. Leaflet or Mapbox), and wiring into the tab nav for director/consultor roles.

## REGION_SUPERVISORS — On-Site Supervisor Tracking
`constants.js` contains a `REGION_SUPERVISORS` mapping (region → supervisor name/initials: Adomis/Tobobe, Valerio/Playa Verde, Barnal/Bahía Azul, Charlie/Playa Roja, Viquez/Cayo de Agua). This was imported but never used in the app. Future use: display the responsible supervisor alongside each region in the dashboard, or add a supervisor role to the task assignment flow.

## TASK_CADENCES — Automated Task Scheduling
`constants.js` contains `TASK_CADENCES` (vigilancia: 1 day, limpieza: 3 days, siembra: 30 days, cosecha: 45 days). These cadences are defined but the app does not enforce them. Future use: auto-generate assigned tasks based on cadence rather than requiring the director to manually assign each week via PlanSemanal.

## calcHoras — Employee Clock-In / Clock-Out
`helpers.js` exports `calcHoras(checkIn, checkOut)` which calculates hours worked from two "HH:MM" strings. Intended for automatic timecard tracking: first sync upload of the day = clock-in, last sync upload = clock-out. `seed.js` also contains a duplicate of this function (line 164). Future use: wire into the sync pipeline to auto-populate timecards without requiring manual entry.
