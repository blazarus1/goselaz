# Pi Household Dashboard

A customizable household dashboard that runs in Chromium kiosk mode on a Raspberry Pi 3B+.

## MVP Features

- Current time and date
- Weather for selected locations
- Recent scores and upcoming games for favorite teams
- Google Calendar day and week outlook
- Countdowns
- Birthdays
- Household announcements

## Future Features

- Rotating personal photos
- Grocery list
- Voice-to-text grocery entry
- Remote/mobile admin access
- Automated backups

---

# Project Decisions and Reminders

## Raspberry Pi

- Hardware: Raspberry Pi 3B+
- Storage: 16 GB microSD card
- Recommended OS: Raspberry Pi OS **64-bit with Desktop**
- Browser/display: Chromium in kiosk mode
- Server: Node.js + Express
- Front end: Preact + Vite
- Local database: SQLite

## Why 64-bit Raspberry Pi OS

The Raspberry Pi 3B+ has a 64-bit ARM CPU. Use Raspberry Pi OS 64-bit because it provides a better long-term Node.js package path.

The prior 32-bit Raspberry Pi OS reports architecture `armhf`, which is no longer supported by the current NodeSource installation scripts. A 64-bit installation reports `arm64`, allowing a normal modern Node.js installation.

After installing 64-bit Raspberry Pi OS, verify:

```bash
uname -m
dpkg --print-architecture
```

Expected output:

```text
aarch64
arm64
```

## SD Card Notes

The current 16 GB microSD card is sufficient for the MVP.

Avoid using the Pi SD card for:

- Large photo libraries
- Large local backups
- Docker images
- Multiple old builds
- Unbounded logs

Check free space periodically:

```bash
df -h /
```

Try to keep at least 2–3 GB free.

Useful cleanup commands:

```bash
sudo apt autoremove -y
sudo apt clean
npm cache clean --force
```

Upgrade to a 32 GB A1/A2 or high-endurance card later if adding photos, large backups, or voice-processing models.

---

# Architecture

```text
MacBook Development Environment
  ├── VS Code
  ├── Git repository
  ├── Node.js
  ├── Preact + Vite development server
  ├── Express API server
  ├── Mock API data
  └── Local SQLite database

Raspberry Pi Production Environment
  ├── Raspberry Pi OS 64-bit Desktop
  ├── Node.js + Express server
  ├── SQLite database
  ├── Chromium kiosk mode
  ├── systemd services
  └── Dashboard at http://localhost:3000
```

## Development Workflow

1. Build and test features locally on the MacBook in VS Code.
2. Use mock API responses while building the Preact UI.
3. Commit working changes to Git.
4. Deploy the project to the Raspberry Pi.
5. Build the production Preact bundle on the Pi or deploy the built assets.
6. Test Chromium kiosk behavior, boot behavior, and screen readability on the Pi.

Local MacBook development is not strictly required, but it is strongly recommended because development, debugging, browser inspection, and Git work are much faster than working directly on the Pi.

---

# Project Structure

```text
pi-dashboard/
├── README.md
├── .gitignore
├── .env.example
│
├── client/
│   ├── package.json
│   ├── vite.config.js
│   ├── index.html
│   ├── src/
│   │   ├── main.jsx
│   │   ├── App.jsx
│   │   ├── api/
│   │   │   ├── client.js
│   │   │   ├── weather.js
│   │   │   ├── sports.js
│   │   │   ├── calendar.js
│   │   │   └── household.js
│   │   ├── components/
│   │   │   ├── ClockCard.jsx
│   │   │   ├── WeatherCard.jsx
│   │   │   ├── SportsCard.jsx
│   │   │   ├── CalendarCard.jsx
│   │   │   ├── CountdownCard.jsx
│   │   │   ├── BirthdaysCard.jsx
│   │   │   └── AnnouncementsCard.jsx
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx
│   │   │   └── Admin.jsx
│   │   └── styles/
│   │       ├── global.css
│   │       └── theme.css
│   └── dist/
│
├── server/
│   ├── package.json
│   ├── public/
│   └── src/
│       ├── index.js
│       ├── routes/
│       ├── services/
│       ├── jobs/
│       ├── db/
│       │   ├── schema.sql
│       │   └── migrations/
│       └── lib/
│
├── data/
│   ├── dashboard.db
│   ├── backups/
│   └── photos/
│
└── scripts/
    ├── deploy-to-pi.sh
    └── backup-db.sh
```

---

# Environment Variables

Create `.env.example`:

```env
PORT=3000
TZ=America/New_York

OPENWEATHER_API_KEY=

SPORTS_PROVIDER=thesportsdb
THESPORTSDB_API_KEY=

GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=http://localhost:3000/auth/google/callback

ADMIN_PASSWORD_HASH=
```

Create separate `.env` files on the MacBook and Raspberry Pi.

Do not commit `.env` files to Git.

---

# Phase 0 – Local MacBook and VS Code Development

## Local development setup

- [ ] Install Visual Studio Code on the MacBook.
- [ ] Install Git.
- [ ] Install Node.js LTS.
- [ ] Confirm the local tools work:

```bash
node --version
npm --version
git --version
```

- [ ] Create a local project folder:

```bash
mkdir -p ~/Projects/pi-dashboard
cd ~/Projects/pi-dashboard
git init
```

- [ ] Add `.gitignore` entries for:

```gitignore
node_modules/
.env
*.log
data/*.db
client/dist/
.DS_Store
```

- [ ] Open the project in VS Code:

```bash
code .
```

- [ ] Use the VS Code integrated terminal for project commands.

## Preact client setup

- [ ] Create a Preact + Vite application:

```bash
npm create vite@latest client -- --template preact
cd client
npm install
npm run dev
```

- [ ] Confirm the Preact application loads locally.
- [ ] Create initial components:
  - [ ] `ClockCard`
  - [ ] `WeatherCard`
  - [ ] `SportsCard`
  - [ ] `CalendarCard`
  - [ ] `CountdownCard`
  - [ ] `BirthdaysCard`
  - [ ] `AnnouncementsCard`

## Local Node server setup

- [ ] Create `server/` folder.
- [ ] Initialize Node.js project:

```bash
cd ../
mkdir server
cd server
npm init -y
```

- [ ] Install server dependencies:

```bash
npm install express
npm install --save-dev nodemon
```

- [ ] Add a development script to `server/package.json`.
- [ ] Implement `GET /health` returning:

```json
{
  "status": "ok"
}
```

- [ ] Add logging middleware.
- [ ] Add error-handling middleware.
- [ ] Confirm local server runs at:

```text
http://localhost:3000/health
```

## Local client/server integration

- [ ] Configure Vite proxy in `client/vite.config.js`:

```js
import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';

export default defineConfig({
  plugins: [preact()],
  server: {
    proxy: {
      '/api': 'http://localhost:3000'
    }
  }
});
```

- [ ] Create mock API payloads for:
  - [ ] Weather
  - [ ] Sports
  - [ ] Calendar
  - [ ] Countdowns
  - [ ] Birthdays
  - [ ] Announcements
- [ ] Build the dashboard UI against mock data first.
- [ ] Test UI in a MacBook browser before deploying to Pi.
- [ ] Test at dashboard-like screen sizes, especially 1920×1080.
- [ ] Build production assets:

```bash
cd client
npm run build
```

---

# Phase 1 – Hardware, OS, and Kiosk

## Raspberry Pi prep

- [ ] Back up any files needed from the existing SD card.
- [ ] Flash Raspberry Pi OS **64-bit Desktop** to the 16 GB microSD card.
- [ ] Use Raspberry Pi Imager advanced settings to set:
  - [ ] Hostname
  - [ ] Username and password
  - [ ] Wi-Fi credentials
  - [ ] Locale
  - [ ] Keyboard layout
  - [ ] Timezone
  - [ ] SSH enabled
- [ ] Boot the Pi.
- [ ] Verify hostname and local network connectivity.
- [ ] Verify 64-bit architecture:

```bash
uname -m
dpkg --print-architecture
```

## Baseline software

- [ ] Update system packages:

```bash
sudo apt update
sudo apt full-upgrade -y
sudo reboot
```

- [ ] Install Chromium:

```bash
sudo apt install -y chromium-browser
```

- [ ] Install Git:

```bash
sudo apt install -y git
```

- [ ] Install Node.js LTS.
- [ ] Install build dependencies for native npm packages:

```bash
sudo apt install -y build-essential python3 make g++
```

- [ ] Verify Node.js:

```bash
node --version
npm --version
```

## Kiosk mode

- [ ] Create a startup script to launch Chromium.
- [ ] Configure Chromium to open:

```text
http://localhost:3000
```

- [ ] Use kiosk/fullscreen flags such as:

```bash
chromium-browser --kiosk --noerrdialogs --disable-infobars http://localhost:3000
```

- [ ] Create a `systemd` unit or desktop autostart entry for kiosk mode.
- [ ] Test reboot behavior.
- [ ] Confirm Chromium
