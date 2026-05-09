chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason !== "install") {
    return;
  }

  const data = await chrome.storage.local.get(["setupComplete"]);

  if (!data.setupComplete) {
    chrome.runtime.openOptionsPage();
  }
});
