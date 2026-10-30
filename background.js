"use strict";

// Auto-Close Old Tabs
//
// storage.local: settings { afterHours: number (0 = never), keepGrouped: bool,
//                           keepAudible: bool, excludedSites: string[] }
//
// Tabs are simply closed; Firefox's History and Recently Closed Tabs
// are where you find them again.

const DEFAULTS = { afterHours: 12, keepGrouped: true, keepAudible: true, excludedSites: [] };
const ALARM = "sweep";
const SWEEP_MINUTES = 15;

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

  if (stale.length) await browser.tabs.remove(stale.map((t) => t.id));
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
browser.runtime.onInstalled.addListener(() => {
  ensureAlarm();
  // 1.0 kept its own list of archived tabs for the toolbar popup.
  browser.storage.local.remove("archive");
});

browser.runtime.onMessage.addListener((msg) => {
  if (msg?.type === "sweep-now") return sweep();
});

ensureAlarm();
