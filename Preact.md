# Client Setup – Preact + Vite

## Phase A – Tooling and Project Init

### Create client project
- [ ] From `pi-dashboard/app/client`, initialize a Vite + Preact app:
  - [ ] Run `npm create vite@latest` or `pnpm create vite` with:
    - [ ] Project name: `pi-dashboard-client`.
    - [ ] Template: `preact`.
- [ ] Confirm structure:
  - [ ] `index.html`
  - [ ] `src/main.tsx` or `src/main.jsx`
  - [ ] `src/app.tsx` or `src/App.jsx`
- [ ] Install dependencies:
  - [ ] `preact`
  - [ ] `@preact/signals` (optional, for simple state).
  - [ ] Any CSS tooling (e.g., PostCSS/Tailwind if desired).

### Configure build output for server
- [ ] In `vite.config`, set:
  - [ ] `build.outDir` to something like `../server/public` so server can serve built assets.
  - [ ] `base` as `/` (since served from root).
- [ ] Add build scripts:
  - [ ] `"build": "vite build"`
  - [ ] `"dev": "vite dev"`
  - [ ] `"preview": "vite preview"` (optional sanity check).

---

## Phase B – App Shell and Routing

### Main entry and app page
- [ ] Update `src/main.jsx`:
  - [ ] Render `<App />` into `#app` in `index.html`.
  - [ ] Wrap with any global providers (theme, signals store, etc.).
- [ ] Define `App` layout:
  - [ ] Top‑level grid/flex layout for dashboard.
  - [ ] Simple “Dashboard” route (no full router needed for MVP).

### Component structure
- [ ] Create `src/components/` with:
  - [ ] `ClockCard.jsx`
  - [ ] `WeatherCard.jsx`
  - [ ] `SportsCard.jsx`
  - [ ] `CalendarCard.jsx`
  - [ ] `CountdownCard.jsx`
  - [ ] `BirthdaysCard.jsx`
  - [ ] `AnnouncementsCard.jsx`
- [ ] Create `src/pages/`:
  - [ ] `Dashboard.jsx` (main wall view).
  - [ ] `Admin.jsx` (admin panel view).
- [ ] (Optional) Tiny router:
  - [ ] Implement a simple hash‑based router or a `view` signal that switches between `Dashboard` and `Admin`.

---

## Phase C – Data Fetching and State

### API layer
- [ ] Create `src/api/client.ts` or `src/api/index.js`:
  - [ ] Helper for `fetchJSON(url)` with error handling.
  - [ ] Base URL (likely relative: `/api/...`).
- [ ] Create specific API modules:
  - [ ] `src/api/weather.js` – calls `/api/weather`.
  - [ ] `src/api/sports.js` – calls `/api/sports`.
  - [ ] `src/api/calendar.js` – calls `/api/calendar?view=...`.
  - [ ] `src/api/localData.js` – calls `/api/countdowns`, `/api/birthdays`, `/api/announcements`.

### State management
- [ ] Decide on state approach:
  - [ ] Simple `useState` / `useEffect` in each card; or
  - [ ] `@preact/signals` store for shared data.
- [ ] Implement signals or hooks:
  - [ ] `weatherSignal`, `sportsSignal`, `calendarSignal`, etc.
  - [ ] `localDataSignal` for countdowns/birthdays/announcements.
- [ ] Add polling or refresh triggers:
  - [ ] `useEffect` with intervals for refetch (e.g., 5–15 minutes).
  - [ ] Make sure intervals are cleared on unmount.

---

## Phase D – Card Implementations

### ClockCard
- [ ] Use local time via `setInterval` in a Preact effect:
  - [ ] Show current time (HH:MM) and date.
  - [ ] Use large typography suitable for viewing at a distance.
- [ ] Ensure interval cleanup to avoid leaks.

### WeatherCard
- [ ] On mount, call `/api/weather`.
- [ ] Map locations to a small grid of cards:
  - [ ] Show location name, temp, condition icon/text.
  - [ ] Show “Updated at HH:MM”.
- [ ] Handle loading and error states:
  - [ ] Skeleton or “Loading weather…”.
  - [ ] “Unable to load weather, using last known data” message if server indicates stale cache.

### SportsCard
- [ ] On mount, call `/api/sports`.
- [ ] Display each favorite team with:
  - [ ] Last game result line.
  - [ ] Next scheduled game line.
- [ ] Handle off‑season / no upcoming games:
  - [ ] “No upcoming games” or “Off‑season” badge.
- [ ] Loading/error handling same pattern as weather.

### CalendarCard
- [ ] On mount, call `/api/calendar?view=day` and `/api/calendar?view=week`.
- [ ] Display:
  - [ ] “Today” events list with start time + title.
  - [ ] Simple weekly strip (days with event count or summary).
- [ ] Time formatting respecting your local timezone.
- [ ] Clear messaging when there are no events.

### CountdownCard
- [ ] On mount, call `/api/countdowns`.
- [ ] Compute days remaining client‑side or use server‑provided.
- [ ] Show top N countdowns (e.g., 3–6) with title and D‑day label.
- [ ] Highlight “today/0 days” events differently.

### BirthdaysCard
- [ ] On mount, call `/api/birthdays`.
- [ ] Display upcoming birthdays within configured window (e.g., next 30 days).
- [ ] Show name, date, age (if year present), and days until.

### AnnouncementsCard
- [ ] On mount, call `/api/announcements`.
- [ ] Show current announcements with title and optional details.
- [ ] Distinguish priority levels with subtle styling (color or icon).

---

## Phase E – Admin UI in Preact

### Admin layout
- [ ] Build an `Admin` page that uses the same Preact app:
  - [ ] Simple navigation toggle between Dashboard/Admin views.
- [ ] Sections:
  - [ ] Countdowns.
  - [ ] Birthdays.
  - [ ] Announcements.
  - [ ] Locations.
  - [ ] Favorite teams.

### CRUD forms and lists
- [ ] For each entity:
  - [ ] List existing items.
  - [ ] Add “Add new” form.
  - [ ] Edit and delete buttons.
- [ ] Connect forms to server APIs:
  - [ ] Use POST/PUT/DELETE to `/api/...`.
  - [ ] Refresh the list after successful changes.
- [ ] Basic validation on client:
  - [ ] Required fields.
  - [ ] Date format checks.
  - [ ] Friendly error messages.

### Admin auth flow
- [ ] Implement a simple login component:
  - [ ] Username/password or just password.
  - [ ] Calls `/api/admin/login` to get a short‑lived token.
- [ ] Store token in memory (not localStorage for kiosk; session‑based is fine).
- [ ] Attach token to subsequent admin API requests (e.g., `Authorization` header).

---

## Phase F – Styling and Performance

### Styling approach
- [ ] Decide on CSS:
  - [ ] Plain CSS modules or CSS file imports; or
  - [ ] Tailwind if you prefer utility classes.
- [ ] Define global styles:
  - [ ] Body background, font family, text colors.
  - [ ] Grid layout for main dashboard.
  - [ ] Card styles (border radius, shadow, padding).
- [ ] Create a theme file:
  - [ ] Color palette tokens.
  - [ ] Spacing tokens.
  - [ ] Font size scale for wall readability.

### Performance and Pi 3 considerations
- [ ] Minimize heavy animations and transitions.
- [ ] Avoid unnecessary re‑renders:
  - [ ] Use signals or memoization where helpful.
- [ ] Build for production (`vite build`) and serve built assets from Node server.
- [ ] Test performance on Pi:
  - [ ] Initial load time.
  - [ ] Smoothness of time updates.
  - [ ] Responsiveness of admin page.

---

## Phase G – Integration with Node Server

### Serving built client
- [ ] Ensure Node server serves `server/public` (or chosen outDir) as static files.
- [ ] Map root route `/` to `index.html` produced by Vite.
- [ ] Confirm:
  - [ ] Preact app loads via kiosk Chromium on Pi.
  - [ ] All `/api/...` calls resolve correctly to server endpoints.

### End‑to‑end test
- [ ] On dev machine:
  - [ ] Run server + client build.
  - [ ] Hit app in browser, validate all cards.
- [ ] On Pi:
  - [ ] Start Node service.
  - [ ] Verify Chromium kiosk loads dashboard.
  - [ ] Confirm:
    - [ ] Clock / date.
    - [ ] Weather.
    - [ ] Sports.
    - [ ] Calendar.
    - [ ] Countdowns/birthdays/announcements.
    - [ ] Admin editing flows.
