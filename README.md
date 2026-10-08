# Mercury Showroom TV

Frontend-only digital signage for Mercury Computers Limited. React, TypeScript, Vite, Tailwind CSS, Framer Motion and Lucide. No backend or admin dashboard.

## Run locally

Use Node.js 22.12+ (tested with Node 26) and npm.

```sh
cd mercury-tv
npm install
npm run dev
```

Open http://localhost:5173. The display starts automatically after a 1.8-second brand intro. Build with `npm run build`; serve the production build with `npm run preview`. Serve `dist/` on a static web server; do not open index.html as a file.

## TV operation

Designed for 1920×1080, 2560×1440 and 3840×2160. The four zones fill the viewport without scrolling. Other aspect ratios adapt, but landscape is recommended for viewing at a distance.

- Normal preview: `/` — product selector dots, next media, mute toggle and fullscreen control.
- TV mode: `/?mode=display` — automatic playback, hidden media controls and cursor hiding after three seconds.
- Diagnostics: `/?debug=true` — media/product indexes, next media deadline, resolution and connection status.
- Screen assignment: `/?mode=display&screen=showroom-main` (or `counter-01`).
- Parameters can be combined, including `debug=true` in display mode.

Click the fullscreen icon in normal mode, or use the browser's fullscreen/kiosk command for display mode. Fullscreen and audible autoplay are subject to browser user-gesture rules. Videos start muted; unmuting may require another gesture on some TVs. Disable the device's sleep/screensaver in its own settings for all-day use. Logo position shifts subtly every minute; this reduces static exposure but is not a burn-in guarantee.

## Content and configuration

- `src/config/signageConfig.ts`: feature/ticker/campaign/transition timing, loading timeouts, clock, contact strip and future API base URL. Media `duration` is in **seconds**; config durations are in **milliseconds**.
- `src/config/company.ts`: website, optional phone/address, tagline and Africa/Kampala clock timezone.
- `src/data/mockProducts.ts`: 20 demo products across all requested categories. **Prices, specs, availability and promotions are illustrative, not official offers.** Replace and approve these before showing customers.
- `src/data/mockCampaigns.ts`: campaign copy, imagery and announcements.
- `src/data/mockMedia.ts`: ordered campaign / YouTube / custom video playlist.
- `src/utils/currency.ts`: shared UGX formatting.
- `public/mercury-logo.png`: actual logo sourced from the supplied public Mercury website; replace freely. Missing/unreadable logo uses a text wordmark.
- `public/products/`: bundled public Mercury product photography and illustrative SVG monitor/accessory placeholders. The image source is https://www.mercurycomputerslimited.com/. Monitor/accessory drawings are placeholders, not model photography.
- `public/videos/mercury-promo.webm`: locally generated eight-second Mercury typography demo film. Replace with approved footage. The native player accepts browser-supported MP4/WebM via playlist URLs.

The YouTube entry is a Big Buck Bunny **sample**, not a Mercury advertisement; replace it with an approved embeddable video. Playback needs internet access and may be blocked by embedding restrictions, TV browser policies or the network. `rel=0` limits related content but cannot remove all YouTube branding or recommendations.

## Future API replacement

Components consume typed service results, not endpoint details:

```ts
getProducts();
getFeaturedProducts();
getMediaPlaylist();
getCampaigns();
getAnnouncements();
```

Set `apiBaseUrl` in `signageConfig` (e.g. `https://signage.example.com`, or `window.location.origin` for same-origin APIs). Requests then go through `src/services/contentService.ts`, including `?screen=<screenId>`:

| Endpoint                     | JSON response                |
| ---------------------------- | ---------------------------- |
| `/api/signage/products`      | `{ "products": [...] }`      |
| `/api/signage/media`         | `{ "playlist": [...] }`      |
| `/api/signage/campaigns`     | `{ "campaigns": [...] }`     |
| `/api/signage/announcements` | `{ "announcements": [...] }` |

Return the interfaces in `src/types/`. Requests time out after eight seconds. Successful responses cache in localStorage per screen; failures use cached content, then bundled mocks. With the API base empty, all services use bundled mocks. Content loads at startup; reload the display to fetch edits. CORS/authentication and live refresh can be added in the service layer later.

`displayPriority` 1–10 provides bounded repetition of featured products; `displayStart` and `displayEnd` are typed future scheduling fields, not active scheduling rules. No backend scheduling is implemented.

## Playback resilience

Products and ticker groups rotate independently. Next product/campaign images and next native video are preloaded. Native `ended` and YouTube state 0 advance immediately; explicit duration also advances, with a guard against duplicate events. Loading timeout, playback error or autoplay rejection skips and quarantines the bad item for this session. A network-online event permits retry. Unspecified video duration has a three-minute watchdog, configurable for longer videos.

If every playlist entry fails, local product campaigns rotate. Campaign branding stays under loading video surfaces. Missing images show a Mercury placeholder. A React error boundary switches to bundled product campaigns on rendering errors. Timers, player instances, preloads and listeners are cleaned up.

Bundled assets keep an already loaded display useful without a network. There is no service worker: **a fresh offline launch still needs access to the static app server**, and browser memory/disk caching is not a guaranteed offline installation. No monitoring backend or overnight hardware soak test is included.

## Verification

```sh
npm run build
npm run dev
# In a second terminal (Google Chrome installed):
npm test
```

Browser tests cover TV dimensions, unusual aspect ratios, real asset loading, rotation, media failures, fallback imagery, display/debug modes, fullscreen, audio controls and offline continuity. The Playwright config uses the locally installed Chrome channel. To use Playwright Chromium instead, remove `channel: 'chrome'` and run `npx playwright install chromium`.

`scripts/preview.mjs` saves a Full HD screenshot in `/tmp`. `scripts/create-demo-video.mjs` regenerates the bundled demo using Chrome's Canvas and MediaRecorder APIs; both require a running development server.

---

# Mercury Signage Control Center

The same Vite application now serves a complete frontend admin workspace at **`/admin`**, alongside the existing TV player at **`/`**. Both apps are TypeScript/React; the admin bundle is loaded separately. If port 5173 is already occupied, Vite prints the next available port.

## Development login

- Email: `admin@mercury.local`
- Password: `admin123`

This is deliberately **mock authentication**. Sessions last eight hours; “Remember me” stores the mock session in localStorage instead of sessionStorage. Seeded accounts `sarah@mercury.local`, `daniel@mercury.local`, `grace@mercury.local` and `alex@mercury.local` also use `admin123` and demonstrate Marketing, Content, Store, and Viewer permissions. Passwords are not real credentials and no email is sent by this frontend.

The owner account remains active with the Super Admin role. Frontend role checks prevent accidental demo edits; a production backend must authorize every request, protect sessions and enforce CSRF, password recovery, rate limiting and token rotation.

## Admin capabilities

- Overview with derived screen/content counts, screen statuses, upcoming schedule, activity and quick actions. Playback metrics and hardware status are explicitly simulated.
- Product library with validation, image upload, specifications, price controls, draft/ready states, search, category/brand/availability/featured filters, sorting, pagination, column selection, bulk selection, assignments, JSON import and CSV export.
- Media grid/list with local uploads, metadata inspection, YouTube ID/thumbnail extraction, playback settings, usage indicators and file-type/size validation. Referenced media cannot be deleted until removed from playlists.
- Campaign creation, artwork/headline/CTA editing, draft/published/paused states, preview, duplication and version restore.
- Playlist editor with native drag/drop **and accessible move buttons**, per-item duration and trim points, transition preference, mute, loop, shuffle, fallback and preloading controls. Published playlists feed the actual TV player.
- Screens and devices with registration, six-digit mock pairing PIN, branch/group assignment, playlist/theme/layout selection, featured/ticker product selection, rotation settings, clock/prices, configuration export and local command simulation.
- Screen groups, branches, product categories, announcements, emergency overrides, users and a permission matrix.
- Schedule calendar with day/week/month views, date/time validation, repeat rules, priorities and assignments. These are **planning rules**; a future server scheduler must execute timed changes and resolve overlaps across remote devices.
- Theme presets and custom colors (HEX, RGB, HSL), bundled Inter/Manrope/Montserrat/DM Sans fonts, typography, shadows, radius and animation preferences. Admin light/dark/system appearance is separate from signage themes.
- Six configurable display layouts. Previews use an iframe containing the **actual TV renderer**, not a separate approximation.
- Content/screen analytics with simulated date-range data, CSV export and print/PDF-ready styling; logs, notifications, help and system health.
- Global search/command palette (`Cmd/Ctrl + K`), modal focus handling, toasts, role-aware controls, unsaved-change warnings, error recovery and mobile navigation.

Some fields (for example automated backups, alternate logo variants, email preferences, production screen commands, schedule execution and backend storage limits) are saved configuration hooks for the future backend. They do not pretend to operate remote services. Analytics are not measurements of customer behavior.

## Draft → preview → publish → TV

The local workflow is implemented end to end:

1. Edit content and **Save Draft**. This never updates the published TV.
2. **Mark ready to publish** makes a content record eligible for publication. New draft records are excluded; an unfinished edit to an existing record retains its previous ready version.
3. Save playlist and screen assignments; preview the configuration.
4. **Review & publish** chooses concrete screens and creates a new snapshot for each. Appearance also offers an explicit **Apply & publish** step for all screens, a group or one screen.
5. Open `/?screen=MERCURY-KLA-001&mode=display`. It consumes that screen’s published snapshot.

Editing a theme or screen configuration after publishing leaves the prior snapshot intact. Browser storage events update open local TV tabs/iframes when a new snapshot is published. Archived/deleted content remains in an existing published snapshot until that screen is republished. Deleting a screen removes its snapshot.

The configuration identity matches the requested architecture:

```json
{
  "screenId": "MERCURY-KLA-001",
  "theme": "mercury-dark",
  "layout": "classic",
  "playlist": "main-showroom",
  "featuredProducts": ["P001", "P002", "P003"],
  "tickerProducts": ["P004", "P005", "P006"],
  "settings": {
    "showClock": true,
    "showPrices": true,
    "featuredRotation": 10000,
    "tickerRotation": 8000
  }
}
```

`ScreenConfiguration` holds IDs and settings. `PublishedScreen` extends it with a version, timestamp, resolved `themeData`, `layoutData`, `products`, `media`, `campaigns`, `announcements`, company branding and an optional expiring emergency message. See `src/types/screenConfig.ts` and `src/admin/services/configCompiler.ts`.

```text
Admin dashboard
    ↓ save drafts / explicit publish
Mock repository today → REST API / database later
    ↓ versioned screen configuration
GET /api/signage/config?screen=MERCURY-KLA-001
    ↓
Mercury TV renderer
```

A future backend should make publishing atomic, resolve assignment/schedule precedence, maintain authoritative versions and notify each screen. Keep the TV read API separate from authenticated admin mutation endpoints.

## Storage and data

Seed data contains **30 products, 20 media assets, 6 campaigns, 5 playlists, 8 screens, 3 groups, 2 branches, 5 users, 15 activity events and 8 notifications**. Products P001–P003 and the requested screen/playlist IDs are included. All prices and inventory are illustrative.

- `localStorage["mercury-admin-v1"]`: versioned demo repository, records, bounded audit/version history and published screen snapshots.
- IndexedDB `mercury-assets`: uploaded binary files. Persistent asset IDs are resolved to temporary object URLs in each browser context.
- `mercury-preview:<id>`: transient draft preview snapshots, removed when the preview unmounts.
- Configuration export downloads JSON, not uploaded binary files. CSV exports escape spreadsheet-formula prefixes.

This is browser-local persistence, not a shared database. Other computers will not see these edits until an API and shared file storage are connected. Browsers can clear or evict storage; export configuration and keep originals of important media. The development reset restores records and snapshots; unused binary uploads can be cleared through browser site-data settings.

## Admin source structure

```text
src/admin/
  AdminApp.tsx                 Router and QueryClient
  components/                  Shell, tables, modal, editor, TV preview
  contexts/AdminContext.tsx    Authenticated query state, permissions, feedback
  data/seed.ts                 Typed demo content and appearance presets
  hooks/useUnsaved.tsx         Route and browser-exit guards
  pages/                      All admin screens
  services/
    apiClient.ts               Central HTTP client
    adminService.ts            Mutation/publish/command contracts
    mockStore.ts               Local repository and mock permissions
    configCompiler.ts          Draft records → published TV configuration
    assetService.ts            IndexedDB uploads and URL hydration
    authService.ts             Mock/server auth boundary
    realtimeService.ts         Replaceable realtime adapter
    *Service.ts                Domain service facades
  types/models.ts              Domain, role, device and repository types
  utils/export.ts              JSON/CSV downloads
src/services/screenConfigService.ts  TV configuration loading and subscriptions
src/types/screenConfig.ts            Shared admin/TV contract
```

TanStack Query owns server/repository state. React state owns UI and draft forms. React Hook Form + Zod validate record editors. The shared renderer remains in `src/components/signage`.

## Connecting the API

Copy `.env.example` to `.env.local`, set `VITE_API_BASE_URL`, and restart Vite. Leave it empty for mock mode. **Never put private keys in a Vite environment variable; these values are public browser code.**

The current HTTP adapter expects:

| Operation                        | Contract                                                            |
| -------------------------------- | ------------------------------------------------------------------- |
| Login / current session / logout | `POST /api/auth/login`, `GET /api/auth/me`, `POST /api/auth/logout` |
| Initial admin state              | `GET /api/admin/bootstrap` → `Database` shape                       |
| Save domain record               | `PUT /api/admin/:collection/:id`                                    |
| Bulk delete                      | `POST /api/admin/:collection/bulk-delete` with `{ids}`              |
| Publish snapshots                | `POST /api/admin/publish` with `{screenIds}`                        |
| Save/apply themes                | `PUT /api/themes/:id`, `POST /api/themes/apply`                     |
| Save layouts/settings            | `PUT /api/layouts/:id`, `PUT /api/admin/settings`                   |
| Device commands                  | `POST /api/screens/commands` with `{ids, command}`                  |
| Mark notifications read          | `POST /api/admin/notifications/read` with `{ids}`                   |
| Read TV configuration            | `GET /api/signage/config?screen=...` → `PublishedScreen`            |

Requests use credentials/cookies and a 10-second timeout. Adapt the domain service methods if your API uses POST/PATCH resource endpoints instead of PUT. The Settings → API connection button is explicitly simulated; saving that field does not dynamically trust or connect an arbitrary host.

Before enabling API mode, replace IndexedDB uploads with shared object-storage URLs, connect server audit/version/restore/reset operations, replace simulated analytics, and connect the `RealtimeAdapter`. The present local restore/reset/analytics implementations are demo helpers; they need server counterparts. The TV polls remote configuration every 30 seconds and retains its last loaded view on transient errors; implement durable device caching and authentication with your backend.

Possible realtime events are typed for screen connection, disconnection, content changes, sync completion, campaign publication and playlist updates. No WebSocket server, database, remote screenshot capture, actual TV restart or email service is implemented.

## Pairing and multi-screen operation

Open `/?pair=true` (or Screens → Pair a display) to show an expiring six-digit TV pairing code. Register a screen using that PIN from another tab on the same browser/origin; the pairing screen detects the match and opens the assigned TV URL. Registration also generates a stable screen ID and demonstration PIN. The TV URL selects that screen. Future pairing should issue short-lived server PINs, verify the device, exchange them for scoped device credentials, and record heartbeats. Group and branch IDs are modeled separately so the API can operate many branches/screens without changing page components.

## Verification and preview

```sh
npm run build
npm run dev
# Separate terminal, Google Chrome installed:
npm test
# If the development server is on a different port:
PLAYWRIGHT_BASE_URL=http://localhost:5174 npm test
```

Tests cover protected navigation, all major pages, role restrictions, table filtering, creation/validation, local uploads, playlist order, draft isolation, actual theme preview, publish-to-TV settings, screen registration, schedule validation, unsaved changes, emergency expiry and the original TV resilience suite.

The application is a frontend deliverable. Remote services, hardware health, all-day TV behavior, server scheduling and production authentication require backend/device integration and deployment validation.

YouTube playlists: open **Playlists → Create playlist → Add YouTube links**, paste one video URL per line, and add the videos. Continuous looping is enabled automatically. YouTube items default to **Play full video**, advancing on the player's ended event rather than a fixed slide timer. Turn that option off to use a timed slot; optional start/end times trim a video. Mark the playlist ready, select it in a screen's configuration, and publish to that screen. Links must allow embedding; internet access is required. Failed or stalled videos are skipped. Autoplay starts muted for browser compatibility.
