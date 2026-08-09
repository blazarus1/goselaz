# Pi Household Dashboard Checklist

## Phase 0 – Planning

- [ ] Confirm Raspberry Pi 3B+ hardware, power supply, monitor, keyboard, and network connection.
- [ ] Decide primary display resolution.
- [ ] Choose initial dashboard locations.
- [ ] List preferred sports teams and leagues.
- [ ] List Google Calendars to display.
- [ ] Gather initial birthdays, countdowns, and household announcements.
- [ ] Create Git repository for `pi-dashboard`.

---

## Phase 1 – MacBook Development Setup

- [ ] Install Visual Studio Code.
- [ ] Install Git.
- [ ] Install Node.js LTS.
- [ ] Open/create the project folder in VS Code.
- [ ] Initialize Git repository.
- [ ] Create `.gitignore`.
- [ ] Create `.env.example`.
- [ ] Create `client/`, `server/`, `data/`, and `scripts/` folders.
- [ ] Confirm local Node and npm versions:

```bash
node --version
npm --version
git --version
```

- [ ] Create Preact + Vite client.
- [ ] Create Node.js + Express server.
- [ ] Add a `GET /health` endpoint.
- [ ] Confirm client and server run locally.
- [ ] Configure Vite proxy from `/api` to local Node server.
- [ ] Create mock API responses for early UI development.

---

## Phase 2 – Raspberry Pi Setup

- [ ] Back up anything needed from current microSD card.
- [ ] Flash Raspberry Pi OS 64-bit Desktop to microSD card.
- [ ] Configure Wi-Fi, SSH, locale, timezone, hostname, and username in Raspberry Pi Imager.
- [ ] Boot Raspberry Pi.
- [ ] Update packages:

```bash
sudo apt update
sudo apt full-upgrade -y
```

- [ ] Verify Pi is using 64-bit OS:

```bash
uname -m
dpkg --print-architecture
```

- [ ] Confirm expected results:

```text
aarch64
arm64
```

- [ ] Install Chromium.
- [ ] Install Git.
- [ ] Install Node.js LTS.
- [ ] Install build tools:

```bash
sudo apt install -y build-essential python3 make g++
```

- [ ] Confirm Node and npm installation.
- [ ] Confirm SSH access from MacBook to Raspberry Pi.
- [ ] Check available storage:

```bash
df -h /
```

- [ ] Preserve at least 2–3 GB free on the 16 GB microSD card.

---

## Phase 3 – Preact Dashboard Shell

- [ ] Create main dashboard layout.
- [ ] Create app-level theme and global CSS.
- [ ] Add readable large typography for wall-display viewing.
- [ ] Add dashboard card layout.
- [ ] Create placeholder components:
  - [ ] ClockCard
  - [ ] WeatherCard
  - [ ] SportsCard
  - [ ] CalendarCard
  - [ ] CountdownCard
  - [ ] BirthdaysCard
  - [ ] AnnouncementsCard
- [ ] Test dashboard layout locally at monitor/TV resolution.
- [ ] Keep animations minimal for Pi 3B+ performance.
- [ ] Add loading, empty, and error states for every card.

---

## Phase 4 – Local Data and SQLite

- [ ] Install SQLite dependencies.
- [ ] Create database initialization script.
- [ ] Create database schema.
- [ ] Add tables:
  - [ ] `locations`
  - [ ] `favorite_teams`
  - [ ] `countdowns`
  - [ ] `birthdays`
  - [ ] `announcements`
  - [ ] `cached_responses`
- [ ] Seed initial local data.
- [ ] Implement local API endpoints:
  - [ ] `GET /api/countdowns`
  - [ ] `GET /api/birthdays`
  - [ ] `GET /api/announcements`
- [ ] Connect local API endpoints to Preact cards.
- [ ] Add “last updated” timestamp where useful.

---

## Phase 5 – Weather

- [ ] Select weather API provider.
- [ ] Create weather API account.
- [ ] Add API key to `.env`.
- [ ] Add preferred locations with latitude and longitude.
- [ ] Create server-side weather service.
- [ ] Implement weather response cache.
- [ ] Set weather cache expiration to approximately 15 minutes.
- [ ] Implement `GET /api/weather`.
- [ ] Connect WeatherCard to API.
- [ ] Display location, temperature, condition, icon, and updated time.
- [ ] Test weather fallback behavior when API is unavailable.

---

## Phase 6 – Sports

- [ ] Select sports data provider.
- [ ] Add sports API credentials to `.env`, if required.
- [ ] Add favorite teams to database.
- [ ] Store external team IDs for each favorite team.
- [ ] Create sports service.
- [ ] Retrieve most recent completed game.
- [ ] Retrieve next scheduled game.
- [ ] Normalize sports data into dashboard-friendly format.
- [ ] Cache sports results.
- [ ] Implement `GET /api/sports`.
- [ ] Connect SportsCard to API.
- [ ] Handle off-season and no-upcoming-game states.

---

## Phase 7 – Google Calendar

- [ ] Create Google Cloud project.
- [ ] Enable Google Calendar API.
- [ ] Configure OAuth consent screen.
- [ ] Create OAuth client credentials.
- [ ] Add local MacBook callback URL.
- [ ] Add Raspberry Pi production callback URL.
- [ ] Add Google credentials to `.env`.
- [ ] Implement Google OAuth authorization flow.
- [ ] Store refresh token securely.
- [ ] Implement token refresh behavior.
- [ ] Build calendar service.
- [ ] Retrieve today’s events.
- [ ] Retrieve current week’s events.
- [ ] Implement:
  - [ ] `GET /api/calendar?view=day`
  - [ ] `GET /api/calendar?view=week`
- [ ] Connect CalendarCard to API.
- [ ] Display event times, titles, and locations.
- [ ] Handle no-events state.

---

## Phase 8 – Admin Page

- [ ] Create admin page route.
- [ ] Add simple local-network authentication.
- [ ] Create CRUD interface for countdowns.
- [ ] Create CRUD interface for birthdays.
- [ ] Create CRUD interface for announcements.
- [ ] Create CRUD interface for weather locations.
- [ ] Create CRUD interface for favorite teams.
- [ ] Add input validation.
- [ ] Add friendly error messages.
- [ ] Test edits from MacBook browser.
- [ ] Confirm dashboard refreshes after admin changes.

---

## Phase 9 – Deploy to Pi

- [ ] Clone repository onto Raspberry Pi.
- [ ] Create production `.env` file on Pi.
- [ ] Install server dependencies.
- [ ] Install client dependencies.
- [ ] Build Preact production files:

```bash
cd client
npm run build
```

- [ ] Configure server to serve built Preact files.
- [ ] Confirm dashboard works at:

```text
http://localhost:3000
```

- [ ] Test dashboard from another device on local network.
- [ ] Confirm all API integrations work on Pi.

---

## Phase 10 – Kiosk Mode and Reliability

- [ ] Configure Chromium to open dashboard URL in kiosk mode.
- [ ] Create Node dashboard `systemd` service.
- [ ] Configure service to restart on failure.
- [ ] Configure Chromium kiosk startup service.
- [ ] Ensure kiosk starts after network and Node server are available.
- [ ] Reboot Pi and confirm dashboard auto-launches.
- [ ] Test Node server restart.
- [ ] Test Chromium restart.
- [ ] Test network loss and recovery.
- [ ] Configure log rotation.
- [ ] Document service restart commands.
- [ ] Create database backup process.

---

## Phase 11 – MVP Validation

- [ ] Clock and date are accurate.
- [ ] Weather displays for all configured locations.
- [ ] Sports scores and next games display for favorite teams.
- [ ] Google Calendar day view displays.
- [ ] Google Calendar week view displays.
- [ ] Countdowns display correctly.
- [ ] Upcoming birthdays display correctly.
- [ ] Announcements display correctly.
- [ ] Dashboard handles external API failures gracefully.
- [ ] Dashboard restarts successfully after Pi reboot.
- [ ] Dashboard remains usable and readable at intended monitor distance.

---

## Future Enhancements

- [ ] Add rotating local photo slideshow.
- [ ] Add photo upload/enable controls to admin page.
- [ ] Add manual grocery-list module.
- [ ] Add mobile-friendly grocery-list access.
- [ ] Add grocery categories.
- [ ] Add press-to-talk grocery entry.
- [ ] Evaluate cloud or local speech-to-text options.
- [ ] Add USB/NAS storage for photos and backups.
- [ ] Upgrade microSD card to 32 GB or larger if storage becomes constrained.
