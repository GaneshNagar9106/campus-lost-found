/* ============================================================
   Campus Lost & Found — script.js
   Shared across index.html, report.html and item.html.
   All data lives in localStorage under the key CLF_STORAGE_KEY.
   No backend — this file IS the "backend".
   ============================================================ */

const CLF_STORAGE_KEY = "clf_items_v1";

/* Category -> emoji icon shown on cards when no photo is uploaded */
const CATEGORY_ICONS = {
  Electronics: "🎧",
  "ID Cards": "🪪",
  Books: "📘",
  Accessories: "🎒",
  Other: "📦",
};

const LOCATIONS = [
  "CSE Block",
  "Library",
  "Main Gate",
  "Cafeteria",
  "Auditorium",
  "Parking Area",
  "Hostel Block",
  "Sports Ground",
];

/* ---------------- Storage helpers ---------------- */

function getItems() {
  const raw = localStorage.getItem(CLF_STORAGE_KEY);
  return raw ? JSON.parse(raw) : [];
}

function saveItems(items) {
  localStorage.setItem(CLF_STORAGE_KEY, JSON.stringify(items));
}

function addItem(item) {
  const items = getItems();
  items.unshift(item);
  saveItems(items);
}

function updateItem(id, changes) {
  const items = getItems();
  const idx = items.findIndex((i) => i.id === id);
  if (idx === -1) return null;
  items[idx] = { ...items[idx], ...changes };
  saveItems(items);
  return items[idx];
}

function deleteItem(id) {
  const items = getItems().filter((i) => i.id !== id);
  saveItems(items);
}

function makeId() {
  return "item_" + Date.now() + "_" + Math.random().toString(36).slice(2, 7);
}

/* ---------------- Seed data (first run only) ---------------- */

function seedIfEmpty() {
  if (getItems().length > 0) return;

  const today = new Date();
  const daysAgo = (n) => {
    const d = new Date(today);
    d.setDate(d.getDate() - n);
    return d.toISOString().slice(0, 10);
  };

  const seed = [
    {
      type: "lost",
      name: "Black Wireless Earbuds",
      category: "Electronics",
      location: "CSE Block",
      date: daysAgo(1),
      description:
        "Lost my black earbuds (in a small charging case) somewhere near the CSE Block labs after the 2nd hour lecture. Case has a small dent on the lid.",
      status: "unclaimed",
    },
    {
      type: "found",
      name: "Student ID Card",
      category: "ID Cards",
      location: "Library",
      date: daysAgo(2),
      description:
        "Found a student ID card near the library issue counter. Handed it to the library desk temporarily but noting it here too.",
      status: "unclaimed",
    },
    {
      type: "lost",
      name: "Blue Notebook",
      category: "Books",
      location: "Auditorium",
      date: daysAgo(3),
      description:
        "A4 size blue ruled notebook with DSA notes, left behind after the CSI orientation session in the auditorium.",
      status: "unclaimed",
    },
    {
      type: "found",
      name: "Laptop Charger",
      category: "Electronics",
      location: "CSE Block",
      date: daysAgo(1),
      description:
        "Found a 65W laptop charger (black, Dell brand) plugged into a socket in the 2nd floor CSE Block classroom after class.",
      status: "unclaimed",
    },
    {
      type: "lost",
      name: "Grey Backpack",
      category: "Accessories",
      location: "Cafeteria",
      date: daysAgo(4),
      description:
        "Grey and orange backpack left under a table in the cafeteria during lunch. Has a water bottle and a calculator inside.",
      status: "claimed",
    },
    {
      type: "found",
      name: "Digital Watch",
      category: "Accessories",
      location: "Sports Ground",
      date: daysAgo(2),
      description:
        "Picked up a black digital sports watch near the running track after evening practice.",
      status: "unclaimed",
    },
    {
      type: "lost",
      name: "Scientific Calculator",
      category: "Electronics",
      location: "Main Gate",
      date: daysAgo(5),
      description:
        "Casio fx-991 calculator, dropped somewhere between the main gate and the CSE Block, possibly near the bike stand.",
      status: "unclaimed",
    },
    {
      type: "found",
      name: "Water Bottle",
      category: "Other",
      location: "Parking Area",
      date: daysAgo(1),
      description:
        "Steel water bottle (green) found near the two-wheeler parking area, left on a bike handle.",
      status: "unclaimed",
    },
    {
      type: "lost",
      name: "Hostel Room Key",
      category: "Other",
      location: "Hostel Block",
      date: daysAgo(2),
      description:
        "Single room key with a red keychain tag, misplaced somewhere between the hostel block and the mess.",
      status: "unclaimed",
    },
    {
      type: "found",
      name: "Physics Textbook",
      category: "Books",
      location: "Library",
      date: daysAgo(6),
      description:
        "1st year Engineering Physics textbook found on a reading table on the library's first floor. Name written inside the cover is smudged.",
      status: "claimed",
    },
  ].map((it) => ({ ...it, id: makeId(), image: null, createdAt: Date.now() }));

  saveItems(seed);
}

/* ---------------- Formatting helpers ---------------- */

function formatDate(dateStr) {
  const d = new Date(dateStr + "T00:00:00");
  if (isNaN(d)) return dateStr;
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function truncate(str, n) {
  return str.length > n ? str.slice(0, n - 1).trim() + "…" : str;
}

/* ---------------- Toast ---------------- */

function showToast(message) {
  let toast = document.querySelector(".toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.className = "toast";
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => toast.classList.remove("show"), 2600);
}

/* ---------------- Mobile nav toggle (shared) ---------------- */

function setupNavToggle() {
  const toggle = document.querySelector(".nav-toggle");
  const links = document.querySelector(".nav-links");
  if (!toggle || !links) return;
  toggle.addEventListener("click", () => links.classList.toggle("open"));
}

/* ============================================================
   INDEX PAGE — browse, search, filter
   ============================================================ */

function initHomePage() {
  const grid = document.getElementById("itemGrid");
  if (!grid) return; // not on this page

  const searchInput = document.getElementById("searchInput");
  const typeFilter = document.getElementById("typeFilter");
  const categoryFilter = document.getElementById("categoryFilter");
  const locationFilter = document.getElementById("locationFilter");
  const statusFilter = document.getElementById("statusFilter");
  const dateFilter = document.getElementById("dateFilter");
  const clearBtn = document.getElementById("clearFiltersBtn");
  const resultCount = document.getElementById("resultCount");

  // Populate location dropdown from the fixed campus location list
  LOCATIONS.forEach((loc) => {
    const opt = document.createElement("option");
    opt.value = loc;
    opt.textContent = loc;
    locationFilter.appendChild(opt);
  });

  function currentFilters() {
    return {
      q: searchInput.value.trim().toLowerCase(),
      type: typeFilter.value,
      category: categoryFilter.value,
      location: locationFilter.value,
      status: statusFilter.value,
      date: dateFilter.value,
    };
  }

  function applyFilters(items, f) {
    return items.filter((item) => {
      if (f.q) {
        const hay = (item.name + " " + item.description).toLowerCase();
        if (!hay.includes(f.q)) return false;
      }
      if (f.type && item.type !== f.type) return false;
      if (f.category && item.category !== f.category) return false;
      if (f.location && item.location !== f.location) return false;
      if (f.status && item.status !== f.status) return false;
      if (f.date && item.date !== f.date) return false;
      return true;
    });
  }

  function cardHTML(item) {
    const icon = item.image
      ? `<img src="${item.image}" alt="${item.name}" style="width:100%;height:100%;object-fit:cover;">`
      : CATEGORY_ICONS[item.category] || "📦";
    const statusClass = item.status === "claimed" ? "claimed" : "unclaimed";
    const statusLabel = item.status === "claimed" ? "Claimed" : "Unclaimed";

    return `
      <article class="item-card">
        <div class="card-media">
          <span class="tag ${item.type}">${item.type}</span>
          <span class="badge ${statusClass}">${statusLabel}</span>
          ${icon}
        </div>
        <div class="card-body">
          <h3>${item.name}</h3>
          <div class="card-meta">
            <span>${item.category}</span>
            <span>${item.location}</span>
            <span>${formatDate(item.date)}</span>
          </div>
          <div class="card-footer">
            <a class="btn btn-outline btn-block" href="item.html?id=${item.id}">View details</a>
          </div>
        </div>
      </article>`;
  }

  function render() {
    const items = getItems().sort((a, b) => b.createdAt - a.createdAt);
    const filtered = applyFilters(items, currentFilters());

    resultCount.textContent = `${filtered.length} of ${items.length} item${
      items.length === 1 ? "" : "s"
    }`;

    if (filtered.length === 0) {
      grid.innerHTML = `
        <div class="empty-state">
          <h3>No matching items</h3>
          <p>Try clearing a filter or searching a different keyword.</p>
        </div>`;
      return;
    }

    grid.innerHTML = filtered.map(cardHTML).join("");
  }

  [searchInput, typeFilter, categoryFilter, locationFilter, statusFilter, dateFilter].forEach(
    (el) => el.addEventListener("input", render)
  );

  clearBtn.addEventListener("click", () => {
    searchInput.value = "";
    typeFilter.value = "";
    categoryFilter.value = "";
    locationFilter.value = "";
    statusFilter.value = "";
    dateFilter.value = "";
    render();
  });

  // Hero stats
  const items = getItems();
  const lostCount = items.filter((i) => i.type === "lost").length;
  const foundCount = items.filter((i) => i.type === "found").length;
  const claimedCount = items.filter((i) => i.status === "claimed").length;
  const setStat = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  };
  setStat("statLost", lostCount);
  setStat("statFound", foundCount);
  setStat("statClaimed", claimedCount);

  render();

  // Show a one-time toast if we just came from the report form
  const flash = sessionStorage.getItem("clf_flash");
  if (flash) {
    showToast(flash);
    sessionStorage.removeItem("clf_flash");
  }
}

/* ============================================================
   REPORT PAGE — form + validation
   ============================================================ */

function initReportPage() {
  const form = document.getElementById("reportForm");
  if (!form) return;

  const fields = {
    name: document.getElementById("f-name"),
    category: document.getElementById("f-category"),
    location: document.getElementById("f-location"),
    date: document.getElementById("f-date"),
    description: document.getElementById("f-description"),
    image: document.getElementById("f-image"),
  };

  // Populate location + set max date to today
  LOCATIONS.forEach((loc) => {
    const opt = document.createElement("option");
    opt.value = loc;
    opt.textContent = loc;
    fields.location.appendChild(opt);
  });
  fields.date.max = new Date().toISOString().slice(0, 10);

  function setError(field, message) {
    const wrap = field.closest(".field");
    wrap.classList.toggle("error", Boolean(message));
    const errEl = wrap.querySelector(".field-error");
    if (errEl) errEl.textContent = message || "";
  }

  function validate() {
    let ok = true;

    if (!form.querySelector('input[name="itemType"]:checked')) {
      document.getElementById("typeToggleError").style.display = "block";
      ok = false;
    } else {
      document.getElementById("typeToggleError").style.display = "none";
    }

    if (!fields.name.value.trim()) {
      setError(fields.name, "Item name is required.");
      ok = false;
    } else {
      setError(fields.name, "");
    }

    if (!fields.category.value) {
      setError(fields.category, "Choose a category.");
      ok = false;
    } else {
      setError(fields.category, "");
    }

    if (!fields.location.value) {
      setError(fields.location, "Choose a location.");
      ok = false;
    } else {
      setError(fields.location, "");
    }

    if (!fields.date.value) {
      setError(fields.date, "Pick a date.");
      ok = false;
    } else if (fields.date.value > fields.date.max) {
      setError(fields.date, "Date can't be in the future.");
      ok = false;
    } else {
      setError(fields.date, "");
    }

    if (!fields.description.value.trim() || fields.description.value.trim().length < 10) {
      setError(fields.description, "Add at least 10 characters of description.");
      ok = false;
    } else {
      setError(fields.description, "");
    }

    return ok;
  }

  function readImage() {
    return new Promise((resolve) => {
      const file = fields.image.files[0];
      if (!file) return resolve(null);
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(file);
    });
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!validate()) return;

    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = "Submitting…";

    const image = await readImage();
    const type = form.querySelector('input[name="itemType"]:checked').value;

    addItem({
      id: makeId(),
      type,
      name: fields.name.value.trim(),
      category: fields.category.value,
      location: fields.location.value,
      date: fields.date.value,
      description: fields.description.value.trim(),
      image,
      status: "unclaimed",
      createdAt: Date.now(),
    });

    sessionStorage.setItem(
      "clf_flash",
      type === "lost" ? "Lost item reported. We'll keep an eye out!" : "Found item reported. Thanks for helping out!"
    );
    window.location.href = "index.html";
  });

  form.addEventListener("reset", () => {
    Object.values(fields).forEach((f) => setError(f, ""));
    document.getElementById("typeToggleError").style.display = "none";
  });
}

/* ============================================================
   ITEM DETAIL PAGE
   ============================================================ */

function initItemPage() {
  const root = document.getElementById("itemDetailRoot");
  if (!root) return;

  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");
  const item = getItems().find((i) => i.id === id);

  if (!item) {
    root.innerHTML = `
      <div class="empty-state">
        <h3>Item not found</h3>
        <p>This item may have been removed. Go back to browse current listings.</p>
        <a class="btn btn-primary" href="index.html">Back to browse</a>
      </div>`;
    return;
  }

  function render() {
    const icon = item.image
      ? `<img src="${item.image}" alt="${item.name}" style="width:100%;height:100%;object-fit:cover;">`
      : CATEGORY_ICONS[item.category] || "📦";
    const statusLabel = item.status === "claimed" ? "Claimed" : "Unclaimed";

    root.innerHTML = `
      <div class="detail-card">
        <div class="detail-media">
          <span class="tag ${item.type}">${item.type}</span>
          <span class="badge ${item.status === "claimed" ? "claimed" : "unclaimed"}">${statusLabel}</span>
          ${icon}
        </div>
        <div class="detail-body">
          <div class="detail-head">
            <h1>${item.name}</h1>
          </div>
          <p>${item.description}</p>
          <div class="detail-grid">
            <div><span>Category</span>${item.category}</div>
            <div><span>Location</span>${item.location}</div>
            <div><span>Date</span>${formatDate(item.date)}</div>
            <div><span>Status</span>${statusLabel}</div>
          </div>
          <div class="detail-actions">
            ${
              item.status === "claimed"
                ? `<button class="btn btn-ghost" id="unclaimBtn">Mark as unclaimed</button>`
                : `<button class="btn btn-primary" id="claimBtn">Mark as claimed</button>`
            }
            <button class="btn btn-danger" id="deleteBtn">Delete listing</button>
          </div>
        </div>
      </div>`;

    const claimBtn = document.getElementById("claimBtn");
    const unclaimBtn = document.getElementById("unclaimBtn");
    const deleteBtn = document.getElementById("deleteBtn");

    if (claimBtn) {
      claimBtn.addEventListener("click", () => {
        updateItem(item.id, { status: "claimed" });
        item.status = "claimed";
        render();
        showToast("Item marked as claimed.");
      });
    }
    if (unclaimBtn) {
      unclaimBtn.addEventListener("click", () => {
        updateItem(item.id, { status: "unclaimed" });
        item.status = "unclaimed";
        render();
        showToast("Item marked as unclaimed.");
      });
    }
    deleteBtn.addEventListener("click", () => {
      if (confirm("Delete this listing? This can't be undone.")) {
        deleteItem(item.id);
        sessionStorage.setItem("clf_flash", "Listing deleted.");
        window.location.href = "index.html";
      }
    });
  }

  render();
}

/* ---------------- Boot ---------------- */

document.addEventListener("DOMContentLoaded", () => {
  seedIfEmpty();
  setupNavToggle();
  initHomePage();
  initReportPage();
  initItemPage();
});
