# gosélaz
Goselaz Home Dashboard

# Pi Dashboard MVP Task Board

## Phase 1 – Hardware, OS, and Kiosk

### Raspberry Pi prep
- [ ] Flash Raspberry Pi OS (Lite or Desktop) to SD card.
- [ ] Boot Pi, run `raspi-config`:
  - [ ] Set locale, keyboard, timezone.
  - [ ] Configure Wi‑Fi or Ethernet.
  - [ ] Enable SSH.
- [ ] Verify Pi hostname and local network access.

### Baseline software
- [ ] Update system packages (`sudo apt update && sudo apt upgrade`).
- [ ] Install Chromium (`sudo apt install chromium-browser`).
- [ ] Install Node.js LTS (via `nvm` or official repo).
- [ ] Install Git.

### Kiosk mode
- [ ] Create a startup script to launch Chromium in kiosk mode:
  - [ ] Point to `http://localhost:3000`.
  - [ ] Use fullscreen flags (e.g., `--kiosk` and any needed Pi-specific flags).
- [ ] Create a `systemd` unit or autostart entry for the kiosk script.
- [ ] Test reboot → confirm Chromium auto‑launches in fullscreen.
- [ ] Confirm exit path (keyboard shortcut or SSH) for maintenance.

---

## Phase 2 – Project Skeleton

### Repo and structure
- [ ] Create `pi-dashboard/` repository.
- [ ] Initialize Node project:
  - [ ] `npm init` for `server/`.
  - [ ] `.gitignore` (node_modules, logs, DB, etc.).
- [ ] Create base folder structure:
  - [ ] `app/server/src`
  - [ ] `app/client/src`
  - [ ] `app/client/public`
  - [ ] `app/data`
  - [ ] `app/server/src/db`, `lib`, `routes`, `services`.

### Minimal server
- [ ] Install Express (or Fastify) for server.
- [ ] Implement `index.js`:
  - [ ] `GET /health` route returning `{ status: 'ok' }`.
  - [ ] Serve static assets from `client/public`.
  - [ ] Serve main dashboard page at `GET /dashboard` or `/`.
- [ ] Add basic logging middleware (timestamps + URL).
- [ ] Add error handling middleware (catch exceptions, return 500).

### Basic client shell
- [ ] Create `index.html` in `client/public`:
  - [ ] Root `<div id="app">`.
  - [ ] Link to main CSS and JS.
- [ ] Create `main.js` in `client/src`:
  - [ ] Render a basic “Pi Dashboard” layout.
- [ ] Implement placeholder card components (even if just functions/templates):
  - [ ] `ClockCard`
  - [ ] `WeatherCard`
  - [ ] `SportsCard`
  - [ ] `CalendarCard`
  - [ ] `CountdownCard`
  - [ ] `BirthdaysCard`
  - [ ] `AnnouncementsCard`

---

## Phase 3 – Local Data and Persistence

### SQLite setup
- [ ] Install SQLite on Pi (`sudo apt install sqlite3`).
- [ ] Add `sqlite3` Node driver (e.g., `better-sqlite3` or `sqlite3`).
- [ ] Create `schema.sql` with tables:
  - [ ] `locations`
  - [ ] `favorite_teams`
  - [ ] `countdowns`
  - [ ] `birthdays`
  - [ ] `announcements`
- [ ] Write a DB initialization script:
  - [ ] Run `schema.sql` on first startup if DB file is missing.
  - [ ] Log schema creation.

### Seed data
- [ ] Insert initial `locations` (e.g., Knoxville, a couple other spots).
- [ ] Insert initial `favorite_teams` (sport, league, name, external IDs placeholder).
- [ ] Insert a few `countdowns` (next trip, event).
- [ ] Insert some `birthdays` (family/friends).
- [ ] Insert some `announcements` (trash day, recurring notes).

### Local data APIs
- [ ] Implement `GET /api/countdowns`:
  - [ ] Query active countdowns.
  - [ ] Order by soonest `target_date`.
- [ ] Implement `GET /api/birthdays`:
  - [ ] Query birthdays.
  - [ ] Compute upcoming birthdays and return in next N days.
- [ ] Implement `GET /api/announcements`:
  - [ ] Filter current announcements by time window.
- [ ] Plug these endpoints into UI:
  - [ ] Countdown card reads `/api/countdowns`.
  - [ ] Birthdays card reads `/api/birthdays`.
  - [ ] Announcements card reads `/api/announcements`.
- [ ] Add simple “last updated” times on these cards (based on server time).

---

## Phase 4 – Admin Page (Local Data)

### Auth and routing
- [ ] Add simple password‑protected admin route:
  - [ ] `GET /admin` serves admin HTML.
  - [ ] Lightweight auth (e.g., one shared password from `.env`).
- [ ] Implement basic session or token mechanism for admin login (only on LAN).

### Admin UI
- [ ] Build basic admin layout with sections:
  - [ ] Manage Countdowns.
  - [ ] Manage Birthdays.
  - [ ] Manage Announcements.
  - [ ] Manage Locations.
  - [ ] Manage Favorite Teams (sports).
- [ ] For each section, implement:
  - [ ] List view of records.
  - [ ] Simple forms for create/update/delete.
  - [ ] Submit actions calling appropriate API endpoints.

### Admin APIs
- [ ] Implement POST/PUT/DELETE endpoints:
  - [ ] `POST /api/countdowns`, `PUT`, `DELETE`.
  - [ ] `POST /api/birthdays`, `PUT`, `DELETE`.
  - [ ] `POST /api/announcements`, `PUT`, `DELETE`.
  - [ ] `POST /api/locations`, `PUT`, `DELETE`.
  - [ ] `POST /api/favorite-teams`, `PUT`, `DELETE`.
- [ ] Add validation and basic error responses.
- [ ] Protect these routes with admin auth middleware.

---

## Phase 5 – Weather Integration (OpenWeather)

### Config and keys
- [ ] Sign up for OpenWeather and obtain API key.
- [ ] Add `OPENWEATHER_API_KEY` to `.env`.
- [ ] Add config for measurement units (metric/imperial).

### Weather service
- [ ] Create `weatherService.js`:
  - [ ] Function to fetch current weather per location (lat/long or city). [ ] Use OpenWeather current API. [16][17]
  - [ ] Parse and normalize response (temperature, description, icon, feels-like, etc.).
- [ ] Implement caching:
  - [ ] Add `cached_responses` table or file‑based cache.
  - [ ] Cache key pattern: `weather:<location_id>`.
  - [ ] Store `payload_json`, `fetched_at`, `expires_at`.
- [ ] Add refresh interval logic:
  - [ ] Refresh weather at least every 15 minutes.
  - [ ] Use `node-cron` or in‑process interval to update cache.

### Weather API and UI wiring
- [ ] Implement `GET /api/weather`:
  - [ ] Reads all active `locations`.
  - [ ] Uses cache or fetch to return weather data array.
- [ ] Wire WeatherCard:
  - [ ] Display each location name.
  - [ ] Show current temp, condition, small icon.
  - [ ] Show last updated timestamp.

---

## Phase 6 – Sports Scores and Upcoming Games

### Provider and config
- [ ] Sign up or configure TheSportsDB API key for free tier (if needed). [24][27][21]
- [ ] Add `SPORTS_PROVIDER` and `THESPORTSDB_API_KEY` to `.env`.

### Sports service
- [ ] Create `sportsService.js`:
  - [ ] Lookup team IDs (by name or manual config).
  - [ ] Fetch recent events (last game) for each favorite team. [24][27]
  - [ ] Fetch upcoming fixtures for each favorite team.
  - [ ] Normalize to:
    - [ ] `lastGame`: date, opponent, score, result.
    - [ ] `nextGame`: date, opponent, venue.
- [ ] Add caching and scheduling:
  - [ ] Cache key pattern: `sports:<team_id>`.
  - [ ] Refresh more often during evening, less often during day.
  - [ ] Basic interval (e.g., every 10–15 minutes).

### Sports API and UI
- [ ] Implement `GET /api/sports`:
  - [ ] Read `favorite_teams` from DB.
  - [ ] Use service + cache to return scoreboard payload.
- [ ] Wire SportsCard:
  - [ ] List each favorite team.
  - [ ] Show last game result line.
  - [ ] Show upcoming game line.
  - [ ] Handle off‑season / no upcoming games gracefully.

---

## Phase 7 – Google Calendar Day/Week Outlook

### Google Calendar API setup
- [ ] Create Google Cloud project.
- [ ] Enable Calendar API. [22]
- [ ] Configure OAuth consent screen (internal/personal).
- [ ] Create OAuth client credentials (type Web app).
- [ ] Set redirect URI (e.g., `http://localhost:3000/auth/google/callback`).
- [ ] Store `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI` in `.env`.

### Calendar auth flow
- [ ] Implement `auth.js`:
  - [ ] Initiate OAuth flow for your account.
  - [ ] Handle callback and store tokens securely (DB or encrypted file).
  - [ ] Support token refresh logic using Google’s refresh token mechanism. [1][2]
- [ ] Implement `GET /auth/google` and `GET /auth/google/callback` endpoints.

### Calendar service
- [ ] Create `calendarService.js`:
  - [ ] Use tokens to call `Events.list` on chosen calendar(s) within date window (today + current week). [22]
  - [ ] Normalize events to:
    - [ ] Start datetime.
    - [ ] End datetime.
    - [ ] Summary/title.
    - [ ] Location (if any).
  - [ ] Filter cancelled or past events as appropriate.
- [ ] Add caching:
  - [ ] Cache key pattern: `calendar:<calendar_id>:<window>`.
  - [ ] Refresh every 5 minutes or on explicit user action.

### Calendar APIs and UI
- [ ] Implement `GET /api/calendar?view=day`:
  - [ ] Return today’s events list.
- [ ] Implement `GET /api/calendar?view=week`:
  - [ ] Return grouped events by day for the current week.
- [ ] Wire CalendarCard:
  - [ ] Show “Today” events in a list.
  - [ ] Show quick week overview (per‑day chips with counts or summaries).

---

## Phase 8 – UI Polishing and Reliability

### Layout and visual design
- [ ] Refine dashboard layout:
  - [ ] Top row: time/date, short “today” summary.
  - [ ] Left: weather.
  - [ ] Center: calendar.
  - [ ] Right: sports.
  - [ ] Bottom: countdowns, birthdays, announcements.
- [ ] Implement consistent theme:
  - [ ] Color palette (soft/cute, readable).
  - [ ] Typography (large, high contrast for distance).
  - [ ] Card styles, spacing, icon usage.

### Fallbacks and error handling
- [ ] Add “last updated” labels on weather, sports, calendar cards.
- [ ] Show fallback messages when APIs fail (e.g., “Using last known data”).
- [ ] Log errors with clear source tags (weather, sports, calendar).
- [ ] Make sure local data cards still render even if external APIs are down.

### Boot and service reliability
- [ ] Create `pi-dashboard.service` `systemd` unit for Node server:
  - [ ] Autostart at boot.
  - [ ] Restart on failure.
- [ ] Confirm kiosk service starts only after network and server are up.
- [ ] Test:
  - [ ] Reboot scenarios.
  - [ ] Network loss and recovery.
  - [ ] Manual restart of Node service.

### Documentation
- [ ] Write README sections:
  - [ ] Setup steps for Pi.
  - [ ] How to configure locations, teams, calendars via admin.
  - [ ] How to restart services.
  - [ ] Known limitations for MVP.
