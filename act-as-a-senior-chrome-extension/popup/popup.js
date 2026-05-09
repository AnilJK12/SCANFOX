const popupTitle = document.getElementById("popupTitle");
const popupMessage = document.getElementById("popupMessage");
const dashboard = document.getElementById("dashboard");
const classificationValue = document.getElementById("classificationValue");
const productiveCount = document.getElementById("productiveCount");
const neutralCount = document.getElementById("neutralCount");
const distractionCount = document.getElementById("distractionCount");
const openSettings = document.getElementById("openSettings");

openSettings.addEventListener("click", () => {
  chrome.runtime.openOptionsPage();
});

loadPopup();

async function loadPopup() {
  const data = await chrome.storage.local.get([
    "setupComplete",
    "profession",
    "goal",
    "strictnessLevel",
    "lastContentClassification",
    "currentSessionStats"
  ]);

  if (!data.setupComplete) {
    popupTitle.textContent = "Setup needed";
    popupMessage.textContent = "Complete the first-time onboarding to start using Privacy Balance.";
    dashboard.classList.add("hidden");
    openSettings.textContent = "Open Setup";
    return;
  }

  popupTitle.textContent = `Hi, ${data.profession}`;
  popupMessage.textContent = `Goal: ${data.goal}. Strictness: ${data.strictnessLevel}.`;
  dashboard.classList.remove("hidden");
  openSettings.textContent = "Open Settings";

  const classification = data.lastContentClassification || {};
  const sessionStats = data.currentSessionStats || {};

  classificationValue.textContent = classification.category || "neutral";
  productiveCount.textContent = sessionStats.productive || 0;
  neutralCount.textContent = sessionStats.neutral || 0;
  distractionCount.textContent = sessionStats.distraction || 0;
}
