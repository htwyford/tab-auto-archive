"use strict";

// Tab Auto-Archive
//
// storage.local: settings { afterHours: number (0 = never), keepGrouped: bool,
//                           keepAudible: bool, excludedSites: string[] }
//                archive  [{ url, title, favIconUrl, archivedAt }] newest first

const DEFAULTS = { afterHours: 12, keepGrouped: true, keepAudible: true, excludedSites: [] };
const ALARM = "sweep";
const SWEEP_MINUTES = 15;
const ARCHIVE_LIMIT = 1000;
const BLANK_URLS = new Set(["about:blank", "about:newtab", "about:home", "about:privatebrowsing"]);

async function getSettings() {
  const { settings = {} } = await browser.storage.local.get("settings");
  return { ...DEFAULTS, ...settings };
}

function isExcluded(url, excludedSites) {
  let host;
  try {
    host = new URL(url).hostname;
  } catch {
    return false;
  }
  return excludedSites.some((s) => host === s || host.endsWith("." + s));
}

async function addToArchive(tabs) {
  const entries = tabs
    .filter((t) => !BLANK_URLS.has(t.url))
    .map((t) => ({
      url: t.url,
      title: t.title || t.url,
      // data: favicons can be large; skip them rather than bloat storage.
      favIconUrl: t.favIconUrl?.startsWith("data:") ? null : t.favIconUrl ?? null,
      archivedAt: Date.now(),
    }));
  if (!entries.length) return;
  const { archive = [] } = await browser.storage.local.get("archive");
  const urls = new Set(entries.map((e) => e.url));
  const next = [...entries, ...archive.filter((e) => !urls.has(e.url))].slice(0, ARCHIVE_LIMIT);
  await browser.storage.local.set({ archive: next });
}

async function archiveTabs(tabs) {
  if (!tabs.length) return;
  await addToArchive(tabs);
  await browser.tabs.remove(tabs.map((t) => t.id));
}

async function sweep() {
  const s = await getSettings();
  if (!s.afterHours) return;
  const cutoff = Date.now() - s.afterHours * 3600 * 1000;

  const tabs = (await browser.tabs.query({ windowType: "normal" })).filter((t) => !t.incognito);
  const byWindow = Map.groupBy(tabs, (t) => t.windowId);
  const stale = [];

  for (const windowTabs of byWindow.values()) {
    const candidates = windowTabs.filter(
      (t) =>
        !t.pinned &&
        !t.active &&
        t.lastAccessed < cutoff &&
        !(s.keepAudible && t.audible) &&
        !(s.keepGrouped && t.groupId != null && t.groupId !== -1) &&
        !isExcluded(t.url, s.excludedSites)
    );
    // Closing every tab would close the window; keep the most recent one.
    if (candidates.length === windowTabs.length) {
      candidates.sort((a, b) => b.lastAccessed - a.lastAccessed).shift();
    }
    stale.push(...candidates);
  }

  await archiveTabs(stale);
}

async function ensureAlarm() {
  if (!(await browser.alarms.get(ALARM))) {
    browser.alarms.create(ALARM, { delayInMinutes: 1, periodInMinutes: SWEEP_MINUTES });
  }
}

browser.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === ALARM) sweep();
});

browser.runtime.onStartup.addListener(ensureAlarm);
browser.runtime.onInstalled.addListener(ensureAlarm);

browser.runtime.onMessage.addListener((msg) => {
  switch (msg?.type) {
    case "archive-tab":
      return browser.tabs.get(msg.tabId).then((tab) => archiveTabs([tab]));
    case "sweep-now":
      return sweep();
  }
});

ensureAlarm();
