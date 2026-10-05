# FixIt — Campus maintenance reporting

Integrated React + Express + SQLite prototype based on the campus maintenance problem statement. Requires Node.js 22.13+ (tested on Node 26).

## Run locally

```sh
npm install
npm run dev
```

Open http://localhost:3000. Both frontend and API run on the same origin. The SQLite database is created at `data/fixit.sqlite` and survives restarts.

```sh
npm run build
npm start
npm test
```

## Demo access

| Portal | Email | Password |
|---|---|---|
| User | student@fixit.demo | Campus@123 |
| Authority | admin@fixit.demo | Admin@123 |

The login page also has demo buttons. Public registration always creates a user account; submitting an authority role in a request cannot elevate privileges.

## Features and permissions

- 50 classrooms, 20 staff cabins, 20 washrooms, and eight illustrative reports seeded on first launch.
- Users submit category, description, title, and location; reports start as Pending with Medium priority.
- Users add follow-up updates to their own reports. These notes do not change official progress.
- Authorities alone can set priority and status: Pending, In Progress, Resolved.
- Authorities can add notes to any report; reports show an attributed activity timeline.
- Search by issue title, identifier, location, or building, with category/status filters.
- Campus directory, resolution statistics, category insights, and user-specific reports.
- Responsive interface, keyboard-focusable controls, modal focus containment, validation/error states, and 30-second dashboard refresh.
- Password hashing with scrypt, expiring HTTP-only cookie sessions, same-origin mutation checks, login throttling, validated inputs, and parameterized SQL.

## Structure

- `src/main.jsx`, `src/style.css`: frontend and responsive design.
- `server/app.js`: authentication and reporting API; authoritative permissions enforced here.
- `server/db.js`: relational schema and prototype seeds.
- `server/index.js`: development/production server.
- `tests/api.test.js`: integration coverage for reporting, location totals, registration escalation, ownership, status authorization, timeline, and logout.

## Connecting university data later

Locations are normalized in their own table; reports reference `location_id`, not hardcoded names. The frontend reads the location API. Import actual campus records into the locations table while preserving referenced IDs, or migrate prototype records to new university IDs. User accounts can later be mapped to university SSO. Replace seeded demo data before real use; do not delete referenced locations without migrating their reports.

This is a local prototype, not a publicly deployed university service. Before public deployment, remove the demo credentials/buttons and sample reports, configure HTTPS and `COOKIE_SECURE=true`, provision authority accounts through a trusted process, and choose university identity, hosting, backup, and access policies. All signed-in members can currently see campus reports and reporter display names. Database writes run locally; no external services are required. Fonts optionally load from Google Fonts with local fallbacks.

`PORT` defaults to 3000. `DB_PATH` may point to another database file (create its parent directory first). The server binds to `0.0.0.0` for cloud hosting compatibility.

## Deploying to a Live Cloud Server

### Option A: Deploy on Render
1. Push this repository to GitHub or GitLab.
2. Sign in to [Render](https://render.com) and click **New > Blueprint** (or **New > Web Service**).
3. Connect your repository. Render will automatically detect [`render.yaml`](file:///Users/kishangv/Desktop/fixit/render.yaml).
4. If setting up manually as a Web Service:
   - **Runtime**: Node
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Environment Variables**:
     - `NODE_ENV=production`
     - `NODE_VERSION=22`
     - `COOKIE_SECURE=true`
     - `DB_PATH=/data/fixit.sqlite` (if using Render Persistent Disk mounted at `/data`, or omit to use default `data/fixit.sqlite`)

### Option B: Deploy on Railway
1. Push this repository to GitHub.
2. Sign in to [Railway](https://railway.app) and select **New Project > Deploy from GitHub repo**.
3. Railway automatically uses the included [`Dockerfile`](file:///Users/kishangv/Desktop/fixit/Dockerfile) and [`railway.json`](file:///Users/kishangv/Desktop/fixit/railway.json).
4. In the service settings, click **Add Volume** and mount it to `/data` so your SQLite database (`/data/fixit.sqlite`) persists across all deployments.
5. In **Networking**, click **Generate Domain** to get your public live HTTPS URL.

