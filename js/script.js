/* =========================================================
   SOOF'S ZINE MACHINE — site logic
   The whole page is one machine: tag buttons filter the cover
   window, clicking a cover loads it into the built-in viewer
   screen, and clicking the header resets everything. Data comes
   from data/zines.json — see README.md to add new zines.
   ========================================================= */

(function () {
  "use strict";

  const state = {
    zines: [],
    activeTags: new Set(),
    query: "",
    reader: { slug: null, pageIndex: 0 },
  };

  const els = {};

  document.addEventListener("DOMContentLoaded", init);

  async function init() {
    cacheEls();
    wireHeader();
    wireControls();
    wireViewer();

    try {
      state.zines = await loadZines();
    } catch (err) {
      console.error("Could not load data/zines.json", err);
      els.emptyState.hidden = false;
      els.emptyState.textContent =
        "Couldn't load the zine library. If you're opening this file directly from your computer, some browsers block local JSON loading — try running a tiny local server (see README.md) or publishing it online.";
      return;
    }

    buildTagDirectory();
    render();
  }

  function cacheEls() {
    els.header = document.getElementById("machineHeader");
    els.searchInput = document.getElementById("searchInput");
    els.clearFilters = document.getElementById("clearFilters");
    els.tagDirectory = document.getElementById("tagDirectory");
    els.grid = document.getElementById("zineGrid");
    els.resultCount = document.getElementById("resultCount");
    els.emptyState = document.getElementById("emptyState");

    els.viewerPanel = document.getElementById("viewerPanel");
    els.viewerIdle = document.getElementById("viewerIdle");
    els.viewerActive = document.getElementById("viewerActive");
    els.viewerMeta = document.getElementById("viewerMeta");
    els.readerImg = document.getElementById("readerImg");
    els.readerPrev = document.getElementById("readerPrev");
    els.readerNext = document.getElementById("readerNext");
    els.readerTitle = document.getElementById("readerTitle");
    els.readerBlurb = document.getElementById("readerBlurb");
    els.readerTags = document.getElementById("readerTags");
    els.readerPageNum = document.getElementById("readerPageNum");
  }

  async function loadZines() {
    const res = await fetch("data/zines.json", { cache: "no-store" });
    if (!res.ok) throw new Error("HTTP " + res.status);
    const data = await res.json();
    return data.slice().sort((a, b) => {
      const ya = parseInt(a.year, 10) || 0;
      const yb = parseInt(b.year, 10) || 0;
      if (yb !== ya) return yb - ya;
      return a.title.localeCompare(b.title);
    });
  }

  /* ---------------- header: reset to main dispenser view ---------------- */

  function wireHeader() {
    els.header.addEventListener("click", () => {
      state.activeTags.clear();
      state.query = "";
      els.searchInput.value = "";
      closeViewer();
      syncClearButton();
      buildTagDirectory();
      render();
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  /* ---------------- search + tag controls ---------------- */

  function wireControls() {
    els.searchInput.addEventListener("input", () => {
      state.query = els.searchInput.value.trim().toLowerCase();
      syncClearButton();
      render();
    });

    els.clearFilters.addEventListener("click", () => {
      state.query = "";
      state.activeTags.clear();
      els.searchInput.value = "";
      syncClearButton();
      buildTagDirectory();
      render();
    });
  }

  function syncClearButton() {
    const hasFilters = state.query.length > 0 || state.activeTags.size > 0;
    els.clearFilters.hidden = !hasFilters;
  }

  function buildTagDirectory() {
    const counts = new Map();
    state.zines.forEach((z) => {
      (z.tags || []).forEach((t) => counts.set(t, (counts.get(t) || 0) + 1));
    });
    const tags = Array.from(counts.keys()).sort((a, b) => a.localeCompare(b));

    els.tagDirectory.innerHTML = "";
    tags.forEach((tag) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "tag-pill" + (state.activeTags.has(tag) ? " active" : "");
      btn.textContent = `#${tag}`;
      btn.setAttribute("aria-pressed", state.activeTags.has(tag) ? "true" : "false");
      btn.addEventListener("click", () => {
        if (state.activeTags.has(tag)) {
          state.activeTags.delete(tag);
        } else {
          state.activeTags.add(tag);
        }
        syncClearButton();
        buildTagDirectory();
        render();
      });
      els.tagDirectory.appendChild(btn);
    });
  }

  /* ---------------- filtering + grid render ---------------- */

  function matches(zine) {
    const tags = zine.tags || [];
    if (state.activeTags.size > 0) {
      const hasAll = Array.from(state.activeTags).every((t) => tags.includes(t));
      if (!hasAll) return false;
    }
    if (state.query) {
      const haystack = [zine.title, zine.blurb, zine.year, ...tags]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(state.query)) return false;
    }
    return true;
  }

  function render() {
    const results = state.zines.filter(matches);

    els.resultCount.textContent =
      results.length === state.zines.length
        ? `${state.zines.length} in stock`
        : `${results.length} of ${state.zines.length}`;

    els.grid.innerHTML = "";
    els.emptyState.hidden = results.length > 0;

    results.forEach((zine) => {
      els.grid.appendChild(renderCard(zine));
    });
  }

  function renderCard(zine) {
    const card = document.createElement("article");
    card.className = "zine-card" + (zine.slug === state.reader.slug ? " selected" : "");

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "zine-card-btn";
    btn.setAttribute("aria-label", `Read ${zine.title}`);
    btn.addEventListener("click", () => openViewer(zine.slug));

    const coverWrap = document.createElement("div");
    coverWrap.className = "zine-cover-wrap";
    const img = document.createElement("img");
    img.src = zine.cover;
    img.alt = `Cover of ${zine.title}`;
    img.loading = "lazy";
    coverWrap.appendChild(img);

    const title = document.createElement("p");
    title.className = "zine-card-title";
    title.textContent = zine.title;

    const year = document.createElement("p");
    year.className = "zine-card-year";
    year.textContent = zine.year || "";

    btn.appendChild(coverWrap);
    btn.appendChild(title);
    btn.appendChild(year);
    card.appendChild(btn);
    return card;
  }

  /* ---------------- viewer screen (built into the machine) ---------------- */

  function wireViewer() {
    els.readerPrev.addEventListener("click", () => stepReader(-1));
    els.readerNext.addEventListener("click", () => stepReader(1));

    document.addEventListener("keydown", (e) => {
      if (!state.reader.slug) return;
      if (e.key === "ArrowLeft") stepReader(-1);
      if (e.key === "ArrowRight") stepReader(1);
    });
  }

  function findZine(slug) {
    return state.zines.find((z) => z.slug === slug);
  }

  function openViewer(slug) {
    state.reader.slug = slug;
    state.reader.pageIndex = 0;

    els.viewerIdle.hidden = true;
    els.viewerActive.hidden = false;
    els.viewerMeta.hidden = false;

    els.viewerActive.classList.add("dispensing");
    setTimeout(() => els.viewerActive.classList.remove("dispensing"), 350);

    renderReaderPage();
    render(); // refresh grid to show the "selected" highlight

    // on narrow screens, bring the viewer into view since it sits below the fold
    if (window.innerWidth <= 860) {
      els.viewerPanel.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  function closeViewer() {
    state.reader.slug = null;
    state.reader.pageIndex = 0;
    els.viewerIdle.hidden = false;
    els.viewerActive.hidden = true;
    els.viewerMeta.hidden = true;
  }

  function stepReader(delta) {
    const zine = findZine(state.reader.slug);
    if (!zine) return;
    const next = state.reader.pageIndex + delta;
    if (next < 0 || next >= zine.pages.length) return;
    state.reader.pageIndex = next;
    renderReaderPage();
  }

  function renderReaderPage() {
    const zine = findZine(state.reader.slug);
    if (!zine) return;
    const idx = state.reader.pageIndex;
    const page = zine.pages[idx];

    els.readerImg.src = page;
    els.readerImg.alt = `${zine.title} — page ${idx + 1} of ${zine.pages.length}`;
    els.readerTitle.textContent = zine.title;
    els.readerBlurb.textContent = zine.blurb || "";
    els.readerPageNum.textContent = `page ${idx + 1} / ${zine.pages.length}`;

    els.readerTags.innerHTML = "";
    (zine.tags || []).forEach((t) => {
      const span = document.createElement("span");
      span.className = "mini-tag";
      span.textContent = `#${t}`;
      els.readerTags.appendChild(span);
    });

    els.readerPrev.disabled = idx === 0;
    els.readerNext.disabled = idx === zine.pages.length - 1;
  }
})();
