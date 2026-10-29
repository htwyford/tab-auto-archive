"use strict";

const DEFAULTS = { afterHours: 12, keepGrouped: true, keepAudible: true, excludedSites: [] };
const $ = (id) => document.getElementById(id);

async function load() {
  const { settings = {} } = await browser.storage.local.get("settings");
  return { ...DEFAULTS, ...settings };
}

async function save(patch) {
  const settings = { ...(await load()), ...patch };
  await browser.storage.local.set({ settings });
}

load().then((s) => {
  $("afterHours").value = String(s.afterHours);
  $("keepGrouped").checked = s.keepGrouped;
  $("keepAudible").checked = s.keepAudible;
  $("excludedSites").value = s.excludedSites.join("\n");
});

document.addEventListener("change", (e) => {
  const { id } = e.target;
  if (id === "afterHours") save({ afterHours: Number(e.target.value) });
  if (id === "keepGrouped" || id === "keepAudible") save({ [id]: e.target.checked });
  if (id === "excludedSites") {
    const excludedSites = e.target.value
      .split("\n")
      .map((s) => s.trim().toLowerCase().replace(/^www\./, ""))
      .filter(Boolean);
    save({ excludedSites });
  }
});

$("sweepNow").addEventListener("click", async () => {
  $("sweepNow").disabled = true;
  await browser.runtime.sendMessage({ type: "sweep-now" });
  $("sweepNow").textContent = "Done";
});
