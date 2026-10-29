"use strict";

const $ = (id) => document.getElementById(id);
let archive = [];

function dayLabel(ts) {
  const d = new Date(ts);
  const today = new Date();
  const yesterday = new Date(Date.now() - 864e5);
  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" });
}

function entryEl(entry) {
  const li = document.createElement("li");
  li.className = "entry";
  li.title = entry.url;

  let icon;
  if (entry.favIconUrl) {
    icon = document.createElement("img");
    icon.src = entry.favIconUrl;
    icon.onerror = () => icon.replaceWith(Object.assign(document.createElement("span"), { className: "noicon" }));
  } else {
    icon = Object.assign(document.createElement("span"), { className: "noicon" });
  }

  const text = document.createElement("div");
  text.className = "text";
  const title = Object.assign(document.createElement("div"), { className: "title", textContent: entry.title });
  const url = Object.assign(document.createElement("div"), { className: "url", textContent: entry.url });
  text.append(title, url);

  const remove = Object.assign(document.createElement("button"), {
    className: "remove",
    textContent: "×",
    title: "Remove from archive",
  });
  remove.addEventListener("click", async (e) => {
    e.stopPropagation();
    await saveArchive(archive.filter((a) => a !== entry));
  });

  li.addEventListener("click", async (e) => {
    await browser.tabs.create({ url: entry.url, active: !(e.metaKey || e.ctrlKey) });
    await saveArchive(archive.filter((a) => a !== entry));
    if (!(e.metaKey || e.ctrlKey)) window.close();
  });

  li.append(icon, text, remove);
  return li;
}

function render() {
  const q = $("search").value.trim().toLowerCase();
  const matches = q
    ? archive.filter((e) => e.title.toLowerCase().includes(q) || e.url.toLowerCase().includes(q))
    : archive;

  const items = [];
  let lastDay = null;
  for (const entry of matches) {
    const day = dayLabel(entry.archivedAt);
    if (day !== lastDay) {
      items.push(Object.assign(document.createElement("h3"), { textContent: day }));
      lastDay = day;
    }
    items.push(entryEl(entry));
  }
  $("list").replaceChildren(...items);
  $("empty").hidden = matches.length > 0;
  $("empty").textContent = q ? "No matches." : "Nothing archived yet.";
}

async function saveArchive(next) {
  archive = next;
  await browser.storage.local.set({ archive });
  render();
}

async function renderStatus() {
  const { settings = {} } = await browser.storage.local.get("settings");
  const hours = settings.afterHours ?? 12;
  $("status").textContent = hours
    ? `Archiving after ${hours >= 24 ? `${hours / 24} day${hours === 24 ? "" : "s"}` : `${hours} hours`}`
    : "Auto-archive off";
}

$("search").addEventListener("input", render);

$("archiveCurrent").addEventListener("click", async () => {
  const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
  if (tab) await browser.runtime.sendMessage({ type: "archive-tab", tabId: tab.id });
  window.close();
});

$("settings").addEventListener("click", () => {
  browser.runtime.openOptionsPage();
  window.close();
});

$("clear").addEventListener("click", async () => {
  if (window.confirm("Remove every tab from the archive?")) await saveArchive([]);
});

browser.storage.local.get("archive").then(({ archive: a = [] }) => {
  archive = a;
  render();
});
renderStatus();
