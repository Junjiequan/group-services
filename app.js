const CONFIG_URL = "services.yaml";
const EDGE_GAP = 16;

// Tiny element builder; always sets text via textContent so config values can't inject HTML.
function h(tag, attrs = {}, ...children) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v != null) el.setAttribute(k, v);
  }
  for (const c of children.flat()) {
    if (c == null || c === false) continue;
    el.append(c instanceof Node ? c : document.createTextNode(String(c)));
  }
  return el;
}

const extLink = (url, text, cls) =>
  h("a", { href: url, target: "_blank", rel: "noopener noreferrer", class: cls }, text ?? url);

function repoProvider(repo) {
  if (repo.provider) return repo.provider;
  const host = new URL(repo.url).hostname;
  if (host.includes("github")) return "github";
  if (host.includes("gitlab")) return "gitlab";
  return "other";
}

const initials = (name) =>
  name.split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase();

function renderLogo(p) {
  const fallback = h("span", { class: "logo-fallback" }, initials(p.name));
  if (!p.logo) return h("div", { class: "logo" }, fallback);
  const img = h("img", { src: p.logo, alt: "", loading: "lazy" });
  img.addEventListener("error", () => img.replaceWith(fallback));
  return h("div", { class: "logo" }, img);
}

function section(title, items) {
  if (!items?.length) return null;
  return [h("div", { class: "section-title" }, title), h("ul", {}, items.map((i) => h("li", {}, i)))];
}

function renderPopover(p) {
  const actions = [
    p.website && extLink(p.website, "Website", "btn"),
    p.docs && extLink(p.docs, "Docs", "btn secondary"),
  ].filter(Boolean);

  const contacts = (p.contacts ?? []).map((c) =>
    h("span", {},
      c.email ? h("a", { href: `mailto:${c.email}` }, c.name) : c.name,
      c.role && h("span", { class: "muted" }, ` · ${c.role}`),
      c.chat && [" · ", extLink(c.chat, "chat")],
    ),
  );

  const repos = (p.repositories ?? []).map((r) =>
    h("span", {},
      h("span", { class: "badge" }, repoProvider(r)),
      extLink(r.url, r.name ?? r.url.replace(/^https?:\/\//, "")),
    ),
  );

  const links = (p.links ?? []).map((l) => extLink(l.url, l.label));

  return h("div", { class: "popover", role: "tooltip" },
    h("div", { class: "popover-card" },
      h("h3", {}, p.name),
      p.description && h("p", {}, p.description),
      p.tags?.length && h("div", { class: "tags" }, p.tags.map((t) => h("span", { class: "tag" }, t))),
      actions.length && h("div", { class: "actions" }, actions),
      section("Contacts", contacts),
      section("Repositories", repos),
      section("Links", links),
    ),
  );
}

// Keep the popup inside the viewport: shift it sideways near the edges and
// flip it above the tile when there isn't room below.
function placePopover(tile) {
  const pop = tile.querySelector(".popover");
  pop.style.setProperty("--shift", "0px");
  pop.classList.remove("above");

  const r = pop.getBoundingClientRect();
  let shift = 0;
  if (r.left < EDGE_GAP) shift = EDGE_GAP - r.left;
  else if (r.right > innerWidth - EDGE_GAP) shift = innerWidth - EDGE_GAP - r.right;
  pop.style.setProperty("--shift", `${shift}px`);

  const tileRect = tile.getBoundingClientRect();
  if (r.bottom > innerHeight && tileRect.top > r.height) pop.classList.add("above");
}

function renderTile(p) {
  const tile = h("article", { class: "tile", id: p.id, tabindex: "0", "aria-label": p.name },
    renderLogo(p),
    h("h2", {}, p.name),
    renderPopover(p),
  );
  tile.addEventListener("mouseenter", () => placePopover(tile));
  tile.addEventListener("focusin", () => placePopover(tile));
  tile.addEventListener("keydown", (e) => {
    if (e.key === "Escape") document.activeElement.blur();
  });
  return tile;
}

function showError(msg) {
  document.getElementById("projects").replaceChildren(h("pre", { class: "error" }, msg));
}

async function main() {
  let config;
  try {
    const res = await fetch(CONFIG_URL, { cache: "no-cache" });
    if (!res.ok) throw new Error(`HTTP ${res.status} loading ${CONFIG_URL}`);
    config = jsyaml.load(await res.text());
  } catch (err) {
    const hint = location.protocol === "file:"
      ? "\n\nOpen this page through a web server, e.g. `python3 -m http.server`."
      : "";
    return showError(`Could not load ${CONFIG_URL}: ${err.message}${hint}`);
  }

  if (config?.group?.name) {
    document.getElementById("group-name").textContent = config.group.name;
    document.title = config.group.name;
  }
  document.getElementById("group-description").textContent = config?.group?.description ?? "";

  const projects = (config?.projects ?? []).filter((p) => p?.name);
  const tiles = projects.map(renderTile);
  document.getElementById("projects").replaceChildren(...tiles);

  // Match against everything in the project's config (name, tags, contacts, repos, …).
  const haystacks = projects.map((p) => JSON.stringify(p).toLowerCase());
  const search = document.getElementById("search");
  const empty = document.getElementById("empty");
  search.addEventListener("input", () => {
    const q = search.value.trim().toLowerCase();
    let shown = 0;
    tiles.forEach((tile, i) => {
      tile.hidden = q !== "" && !haystacks[i].includes(q);
      if (!tile.hidden) shown++;
    });
    empty.hidden = shown > 0;
  });
}

main();
