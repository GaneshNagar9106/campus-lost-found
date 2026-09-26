# Campus Lost & Found

A responsive web app to report and find lost/found items on campus, built for the **CSI AITR Software Development recruitment task (Web Development Task 2)**.

## Problem statement

Students lose and find items around campus all the time (earbuds in a lab, an ID card at the library desk, a notebook in the auditorium) with no shared place to post about it. This app is a simple digital noticeboard: anyone can report a lost or found item, and anyone else can search and filter the list to find a match.

## Features

- **Report an item** — a validated form to log a lost or found item with name, category, location, date, description and an optional photo.
- **Browse & search** — a home page listing every item as a card, with live search over the name and description.
- **Filters** — filter by Lost/Found, category, location, status and date, all combinable, plus a "Clear filters" button.
- **Item details page** — a dedicated page per item with the full description and an action to mark it **Claimed** (or back to **Unclaimed**).
- **Status tracking** — every item is either *Unclaimed* or *Claimed*. This is the app's version of the brief's "Found / Claimed" status: *Unclaimed* means the item is still waiting to be matched with its owner, *Claimed* means it's been returned/collected.
- **Persistence** — everything (new reports, claims, deletes) is saved to `localStorage`, so it survives a page refresh with no backend or database.
- **Responsive, polished UI** — sticky navbar with a mobile menu, a hero section with live stats, empty states, toast confirmations, and hover/focus states throughout.
- **Seeded data** — the app ships with 10 realistic dummy items (earbuds, ID card, notebook, charger, backpack, watch, calculator, water bottle, hostel key, textbook) across real campus locations, so it never opens empty.

## Technologies used

- HTML5
- CSS3 (custom properties, CSS Grid/Flexbox, no framework)
- Vanilla JavaScript (ES6+, no libraries)
- Browser `localStorage` as the only data layer

No React, no Node backend, no database — exactly as specified in the task.

## Project structure

```
campus-lost-found/
│
├── index.html      # Browse / search / filter page (home)
├── report.html     # Report a lost or found item (form)
├── item.html       # Item details page
├── style.css       # All styling
├── script.js       # All logic: storage, seeding, rendering, filters, forms
├── README.md
└── assets/
    └── csi-logo.png
```

This matches the structure suggested in the task brief exactly, so there's nothing to explain there.

## How to run locally

1. Download / clone the project folder.
2. Open `index.html` directly in any modern browser (double-click it, or right-click → "Open with" your browser).
   - No build step, no `npm install`, no server needed — it's plain static files.
3. Optional: for a nicer local dev loop, use the VS Code **Live Server** extension:
   - Open the folder in VS Code.
   - Right-click `index.html` → **Open with Live Server**.

## How the dummy data / localStorage works

- On the very first load, `script.js` checks `localStorage` for a key called `clf_items_v1`. If it's empty, it seeds 10 dummy items so the site looks populated.
- Every new report from `report.html` is added to the same array and saved back to `localStorage`.
- Marking an item **Claimed**/**Unclaimed** or **deleting** a listing updates that same array in `localStorage`.
- Because it's `localStorage`, data persists across refreshes but is **local to your browser** — clearing site data (or opening in another browser) resets it back to the 10 seeded items.
- Uploaded photos are stored as base64 data URLs inside the same JSON object, so they also persist without any server.

## How each major feature works (for your interview / viva)

- **Rendering**: `initHomePage()` in `script.js` reads all items, applies the current filters, and re-builds the `#itemGrid` HTML with a `.map().join("")` on every change — no framework needed for this scale.
- **Search & filters**: each filter input has an `input`/`change` listener that just re-runs the same `render()` function; `applyFilters()` is a plain array `.filter()` chain, so it's easy to explain line by line.
- **Form validation**: `validate()` checks each field manually and toggles an `.error` class + inline message — no external validation library.
- **Image upload**: the `FileReader` API converts the chosen photo into a base64 data URL before saving it, since `localStorage` can only store strings.
- **Detail page**: `item.html` reads the item's `id` from the URL query string (`?id=...`) and looks it up from the same `localStorage` array.
- **Claim action**: updates just that one item's `status` field and re-renders the detail card in place.

## How to test every requirement

| Requirement | How to test |
|---|---|
| Report lost/found item | Go to **Report an item**, fill the form, submit — you land back on Browse with a toast and the new card at the top. |
| Search | Type part of an item's name or description in the search bar — the grid updates live. |
| Filter by category/location/date/status/lost-found | Pick any filter (or combine several) and watch the grid and the result count update. |
| Clear filters | Set a few filters, click **Clear filters** — everything resets. |
| Item details page | Click **View details** on any card. |
| Mark as Claimed | On a details page, click **Mark as claimed** — the badge updates and it persists after refresh. |
| Data persists | Refresh the page after reporting/claiming an item — nothing is lost. |
| Responsive | Resize the browser or open dev tools' device toolbar (try iPhone SE and iPad widths) — the nav collapses into a hamburger, filters stack, cards reflow to one column. |
| Empty states | Filter down to nothing (e.g. search "zzz") — you'll see the "No matching items" state. |
| Form validation | Try submitting the report form empty — every required field shows an inline error. |

## How to deploy it using GitHub Pages

1. Create a new GitHub repository (e.g. `campus-lost-found`).
2. Push this folder's contents to the repository's `main` branch:
   ```bash
   git init
   git add .
   git commit -m "Campus Lost & Found - CSI AITR task"
   git branch -M main
   git remote add origin https://github.com/<your-username>/campus-lost-found.git
   git push -u origin main
   ```
3. On GitHub, open the repo → **Settings** → **Pages**.
4. Under **Build and deployment**, set **Source** to **Deploy from a branch**, branch **main**, folder **/(root)** → **Save**.
5. GitHub gives you a live URL shortly after, in the form:
   `https://<your-username>.github.io/campus-lost-found/`
6. Use that link in your CSI submission.

## Screenshots / recording to include in your submission

- Home page (desktop) showing the hero, stats and populated item grid.
- Home page with filters applied and the result count changed.
- Empty state after searching for something that doesn't exist.
- Report form, both empty (showing validation errors after an empty submit) and filled in.
- Item details page, before and after clicking **Mark as claimed**.
- Mobile view (device toolbar or an actual phone) showing the collapsed hamburger menu and stacked cards.
- A short screen recording (30–60s) walking through: report an item → find it via search/filter → open details → mark claimed.

## Future improvements

- Real backend (Node/Express + a database) so items are shared across users instead of per-browser.
- User accounts, so only the reporter (or an admin) can edit/delete/claim a listing.
- Email/notification when a found item matches a lost report.
- Pagination or infinite scroll once the item count grows large.
- Image compression before saving to keep `localStorage` usage low.
