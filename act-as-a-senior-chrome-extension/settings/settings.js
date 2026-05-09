const form = document.getElementById("onboardingForm");
const pageTitle = document.getElementById("pageTitle");
const pageIntro = document.getElementById("pageIntro");
const professionInput = document.getElementById("profession");
const goalInput = document.getElementById("goal");
const interestsInput = document.getElementById("interests");
const strictnessLevelInput = document.getElementById("strictnessLevel");
const saveButton = document.getElementById("saveButton");
const resetButton = document.getElementById("resetButton");
const statusMessage = document.getElementById("statusMessage");

let hasCompletedSetup = false;

loadSavedSetup();

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const profession = professionInput.value.trim();
  const goal = goalInput.value.trim();
  const interests = interestsInput.value
    .split(",")
    .map((interest) => interest.trim())
    .filter(Boolean);
  const strictnessLevel = strictnessLevelInput.value;

  if (!profession || !goal || interests.length === 0 || !strictnessLevel) {
    statusMessage.textContent = "Please complete all fields.";
    return;
  }

  await chrome.storage.local.set({
    profession,
    goal,
    interests,
    strictnessLevel,
    setupComplete: true,
    lastUpdatedAt: new Date().toISOString()
  });

  if (!hasCompletedSetup) {
    await chrome.storage.local.set({
      entertainmentMinutesToday: 0,
      productiveMinutesToday: 0,
      lastTrackedDate: new Date().toDateString()
    });
  }

  hasCompletedSetup = true;
  showSettingsMode();
  statusMessage.textContent = "Saved locally. Privacy Balance is ready.";
});

resetButton.addEventListener("click", async () => {
  const shouldReset = window.confirm("Reset your saved setup and start again?");

  if (!shouldReset) {
    return;
  }

  await chrome.storage.local.remove([
    "profession",
    "goal",
    "interests",
    "strictnessLevel",
    "setupComplete",
    "lastUpdatedAt",
    "entertainmentMinutesToday",
    "productiveMinutesToday",
    "lastTrackedDate",
    "lastPageSignals",
    "lastContentClassification",
    "currentSessionStats"
  ]);

  hasCompletedSetup = false;
  form.reset();
  strictnessLevelInput.value = "balanced";
  showOnboardingMode();
  statusMessage.textContent = "Reset complete. You can enter new details now.";
});

async function loadSavedSetup() {
  const data = await chrome.storage.local.get([
    "setupComplete",
    "profession",
    "goal",
    "interests",
    "strictnessLevel"
  ]);

  if (!data.setupComplete) {
    showOnboardingMode();
    return;
  }

  hasCompletedSetup = true;
  professionInput.value = data.profession || "";
  goalInput.value = data.goal || "";
  interestsInput.value = Array.isArray(data.interests) ? data.interests.join(", ") : "";
  strictnessLevelInput.value = data.strictnessLevel || "balanced";
  showSettingsMode();
}

function showOnboardingMode() {
  pageTitle.textContent = "Set up your browsing balance";
  pageIntro.textContent = "Answer these once. Your information stays locally in this browser.";
  saveButton.textContent = "Save and Start";
  resetButton.classList.add("hidden");
  statusMessage.textContent = "";
}

function showSettingsMode() {
  pageTitle.textContent = "Privacy Balance settings";
  pageIntro.textContent = "Update your saved preferences. Your information stays locally in this browser.";
  saveButton.textContent = "Save Changes";
  resetButton.classList.remove("hidden");
}
