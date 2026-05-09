const ENTERTAINMENT_SITES = [
  "youtube",
  "netflix",
  "instagram",
  "facebook",
  "reddit",
  "tiktok",
  "hotstar"
];

const PRODUCTIVE_KEYWORDS = [
  "learn",
  "study",
  "tutorial",
  "course",
  "lecture",
  "lesson",
  "education",
  "documentation",
  "docs",
  "practice",
  "project",
  "assignment",
  "research",
  "exam",
  "coding",
  "programming"
];

const DISTRACTION_KEYWORDS = [
  "funny",
  "meme",
  "prank",
  "reaction",
  "gaming",
  "gameplay",
  "shorts",
  "reels",
  "trending",
  "viral",
  "celebrity",
  "gossip",
  "entertainment",
  "binge",
  "challenge",
  "comedy"
];

const MAX_VISIBLE_TEXT_LENGTH = 4000;
const MAX_HASHTAGS = 20;
const SCAN_DELAY_MS = 1200;
const MUTATION_SCAN_DELAY_MS = 2000;
const PRODUCTIVE_THRESHOLD = 5;
const DISTRACTION_THRESHOLD = -2;
const REMINDER_INTERVAL_SECONDS = 120;
const HIGH_DISTRACTION_COUNT = 5;
const HIGH_DISTRACTION_RATIO = 0.6;
const PRODUCTIVE_ITEMS_PER_CHILL_ITEM = 3;
const CHILL_ITEMS_EARNED = 1;
const STRICTNESS_LIMITS_SECONDS = {
  relaxed: 900,
  balanced: 600,
  strict: 300
};

let lastScannedUrl = "";
let lastCountedSignature = "";
let scanTimer = null;
let mutationScanTimer = null;
let currentUserData = null;
let currentClassification = null;
let distractionSeconds = 0;
let reminderSnoozedUntil = 0;
let distractionTimer = null;
let sessionStats = {
  productive: 0,
  neutral: 0,
  distraction: 0,
  total: 0
};
let usedChillItems = 0;

startContentScript();

async function startContentScript() {
  const data = await chrome.storage.local.get([
    "setupComplete",
    "goal",
    "interests",
    "strictnessLevel"
  ]);

  if (!data.setupComplete) {
    return;
  }

  currentUserData = data;
  scanCurrentPage(data);
  watchForPageChanges(data);
  watchForVisibleContentChanges(data);
  startDistractionTimer();
}

function watchForPageChanges(data) {
  window.setInterval(() => {
    if (window.location.href === lastScannedUrl) {
      return;
    }

    window.clearTimeout(scanTimer);
    scanTimer = window.setTimeout(() => {
      scanCurrentPage(data);
    }, SCAN_DELAY_MS);
  }, 1000);
}

function watchForVisibleContentChanges(data) {
  if (!isEntertainmentHost() || !document.body) {
    return;
  }

  const observer = new MutationObserver(() => {
    window.clearTimeout(mutationScanTimer);
    mutationScanTimer = window.setTimeout(() => {
      scanCurrentPage(data);
    }, MUTATION_SCAN_DELAY_MS);
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
    characterData: true
  });
}

async function scanCurrentPage(data) {
  lastScannedUrl = window.location.href;

  const pageSignals = collectPageSignals();
  const contentScore = classifyContent(pageSignals, data);
  applyBalanceRule(contentScore);
  currentClassification = contentScore;

  if (shouldCountNewItem(pageSignals)) {
    updateSessionStats(contentScore.category);
  }

  await chrome.storage.local.set({
    lastPageSignals: pageSignals,
    lastContentClassification: contentScore,
    currentSessionStats: sessionStats
  });

  if (!shouldCountAsActiveDistraction(contentScore)) {
    distractionSeconds = 0;
  }
}

function collectPageSignals() {
  const visibleText = getVisibleText();
  const title = getPageTitle();
  const captions = getVisibleCaptions();
  const hashtags = getHashtags(`${title} ${visibleText}`);

  return {
    url: window.location.href,
    hostname: window.location.hostname,
    title,
    captions,
    hashtags,
    visibleText,
    isEntertainmentPage: isEntertainmentHost(),
    scannedAt: new Date().toISOString()
  };
}

function shouldCountNewItem(pageSignals) {
  const signature = createPageSignature(pageSignals);

  if (signature === lastCountedSignature) {
    return false;
  }

  lastCountedSignature = signature;
  return true;
}

function createPageSignature(pageSignals) {
  const textSample = pageSignals.visibleText.slice(0, 250);

  return `${pageSignals.hostname}|${pageSignals.url}|${pageSignals.title}|${textSample}`;
}

function getPageTitle() {
  const heading = document.querySelector("h1");

  if (heading && heading.innerText.trim()) {
    return heading.innerText.trim();
  }

  return document.title.trim();
}

function getVisibleCaptions() {
  const captionSelectors = [
    ".ytp-caption-segment",
    "[class*='caption']",
    "[aria-label*='caption' i]"
  ];

  const captions = [];

  captionSelectors.forEach((selector) => {
    document.querySelectorAll(selector).forEach((element) => {
      const text = element.innerText && element.innerText.trim();

      if (text && !captions.includes(text)) {
        captions.push(text);
      }
    });
  });

  return captions.slice(0, 10);
}

function getHashtags(text) {
  const matches = text.match(/#[a-zA-Z0-9_]+/g) || [];
  const uniqueTags = [...new Set(matches)];

  return uniqueTags.slice(0, MAX_HASHTAGS);
}

function getVisibleText() {
  const blockedTags = new Set(["SCRIPT", "STYLE", "NOSCRIPT", "IFRAME", "SVG"]);
  const walker = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode(node) {
        const parent = node.parentElement;

        if (!parent || blockedTags.has(parent.tagName)) {
          return NodeFilter.FILTER_REJECT;
        }

        if (!isElementVisible(parent)) {
          return NodeFilter.FILTER_REJECT;
        }

        const text = node.textContent.trim();

        if (!text) {
          return NodeFilter.FILTER_REJECT;
        }

        return NodeFilter.FILTER_ACCEPT;
      }
    }
  );

  const parts = [];
  let totalLength = 0;
  let node = walker.nextNode();

  while (node && totalLength < MAX_VISIBLE_TEXT_LENGTH) {
    const text = node.textContent.trim().replace(/\s+/g, " ");

    parts.push(text);
    totalLength += text.length;
    node = walker.nextNode();
  }

  return parts.join(" ").slice(0, MAX_VISIBLE_TEXT_LENGTH);
}

function isElementVisible(element) {
  const styles = window.getComputedStyle(element);

  if (
    styles.display === "none" ||
    styles.visibility === "hidden" ||
    Number(styles.opacity) === 0
  ) {
    return false;
  }

  const rect = element.getBoundingClientRect();

  return rect.width > 0 && rect.height > 0;
}

function isEntertainmentHost() {
  const hostname = window.location.hostname.toLowerCase();

  return ENTERTAINMENT_SITES.some((site) => hostname.includes(site));
}

function classifyContent(pageSignals, userData) {
  const goalKeywords = createKeywords(userData.goal);
  const interestKeywords = Array.isArray(userData.interests)
    ? userData.interests.flatMap(createKeywords)
    : [];
  const allUserKeywords = [...new Set([...goalKeywords, ...interestKeywords])];

  const titleText = pageSignals.title.toLowerCase();
  const hashtagText = pageSignals.hashtags.join(" ").toLowerCase();
  const captionText = pageSignals.captions.join(" ").toLowerCase();
  const visibleText = pageSignals.visibleText.toLowerCase();
  const combinedText = `${titleText} ${hashtagText} ${captionText} ${visibleText}`;

  let score = 0;
  const matchedGoalOrInterest = [];
  const matchedProductive = [];
  const matchedDistraction = [];

  allUserKeywords.forEach((keyword) => {
    if (keyword.length < 3) {
      return;
    }

    if (titleText.includes(keyword)) {
      score += 3;
      matchedGoalOrInterest.push(keyword);
      return;
    }

    if (hashtagText.includes(keyword) || captionText.includes(keyword)) {
      score += 2;
      matchedGoalOrInterest.push(keyword);
      return;
    }

    if (visibleText.includes(keyword)) {
      score += 1;
      matchedGoalOrInterest.push(keyword);
    }
  });

  PRODUCTIVE_KEYWORDS.forEach((keyword) => {
    if (combinedText.includes(keyword)) {
      score += 1;
      matchedProductive.push(keyword);
    }
  });

  DISTRACTION_KEYWORDS.forEach((keyword) => {
    if (combinedText.includes(keyword)) {
      score -= 1;
      matchedDistraction.push(keyword);
    }
  });

  if (pageSignals.isEntertainmentPage) {
    score -= 2;
  }

  if (
    pageSignals.isEntertainmentPage &&
    matchedGoalOrInterest.length === 0 &&
    score > DISTRACTION_THRESHOLD
  ) {
    score = DISTRACTION_THRESHOLD;
  }

  return {
    category: getCategoryFromScore(score),
    score,
    matchedGoalOrInterest: [...new Set(matchedGoalOrInterest)],
    matchedProductive: [...new Set(matchedProductive)],
    matchedDistraction: [...new Set(matchedDistraction)]
  };
}

function createKeywords(value) {
  if (!value) {
    return [];
  }

  return String(value)
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .map((word) => word.trim())
    .filter((word) => word.length >= 3);
}

function getCategoryFromScore(score) {
  if (score >= PRODUCTIVE_THRESHOLD) {
    return "productive";
  }

  if (score <= DISTRACTION_THRESHOLD) {
    return "distraction";
  }

  return "neutral";
}

function startDistractionTimer() {
  if (distractionTimer) {
    window.clearInterval(distractionTimer);
  }

  distractionTimer = window.setInterval(() => {
  if (!currentUserData || !currentClassification) {
    return;
  }

  if (document.hidden) {
    return;
  }

  updateDailyTimeTracking();

  if (!shouldCountAsActiveDistraction(currentClassification)) {
    return;
  }

  distractionSeconds += 1;

  if (shouldShowReminder()) {
    showReminderOverlay(currentUserData.goal);
  }
}, 1000);
}

async function updateDailyTimeTracking() {
  if (!currentClassification) {
    return;
  }

  const today = new Date().toDateString();
  const data = await chrome.storage.local.get([
    "lastTrackedDate",
    "productiveMinutesToday",
    "entertainmentMinutesToday"
  ]);

  if (data.lastTrackedDate !== today) {
    await chrome.storage.local.set({
      lastTrackedDate: today,
      productiveMinutesToday: 0,
      entertainmentMinutesToday: 0
    });
    return;
  }

  if (currentClassification.category === "productive") {
    await chrome.storage.local.set({
      productiveMinutesToday: (data.productiveMinutesToday || 0) + 1 / 60
    });
  }

  if (currentClassification.category === "distraction") {
    await chrome.storage.local.set({
      entertainmentMinutesToday: (data.entertainmentMinutesToday || 0) + 1 / 60
    });
  }
}

function shouldShowReminder() {
  const strictnessLevel = currentUserData.strictnessLevel || "balanced";
  const baseLimitSeconds = STRICTNESS_LIMITS_SECONDS[strictnessLevel] || STRICTNESS_LIMITS_SECONDS.balanced;
  const limitSeconds = isDistractionHigh() ? Math.floor(baseLimitSeconds / 2) : baseLimitSeconds;

  return (
    distractionSeconds >= limitSeconds &&
    Date.now() > reminderSnoozedUntil &&
    !document.getElementById("privacy-balance-overlay")
  );
}

function updateSessionStats(category) {
  if (!Object.prototype.hasOwnProperty.call(sessionStats, category)) {
    return;
  }

  sessionStats = {
    ...sessionStats,
    [category]: sessionStats[category] + 1,
    total: sessionStats.total + 1
  };
}

function applyBalanceRule(contentScore) {
  contentScore.balance = getBalanceStatus();

  if (contentScore.category !== "distraction") {
    contentScore.allowedByBalance = false;
    return;
  }

  if (getRemainingChillItems() <= 0) {
    contentScore.allowedByBalance = false;
    return;
  }

  usedChillItems += 1;
  contentScore.allowedByBalance = true;
  contentScore.balance = getBalanceStatus();
}

function getBalanceStatus() {
  return {
    productiveItemsPerChillItem: PRODUCTIVE_ITEMS_PER_CHILL_ITEM,
    chillItemsEarned: CHILL_ITEMS_EARNED,
    earnedChillItems: getEarnedChillItems(),
    usedChillItems,
    remainingChillItems: getRemainingChillItems()
  };
}

function getEarnedChillItems() {
  return Math.floor(sessionStats.productive / PRODUCTIVE_ITEMS_PER_CHILL_ITEM) * CHILL_ITEMS_EARNED;
}

function getRemainingChillItems() {
  return Math.max(getEarnedChillItems() - usedChillItems, 0);
}

function shouldCountAsActiveDistraction(contentScore) {
  return contentScore.category === "distraction" && !contentScore.allowedByBalance;
}

function isDistractionHigh() {
  if (sessionStats.total === 0) {
    return false;
  }

  const distractionRatio = sessionStats.distraction / sessionStats.total;

  return (
    sessionStats.distraction >= HIGH_DISTRACTION_COUNT ||
    distractionRatio >= HIGH_DISTRACTION_RATIO
  );
}

function showReminderOverlay(goal) {
  if (document.getElementById("privacy-balance-overlay")) {
    return;
  }

  const highDistraction = isDistractionHigh();
  const title = highDistraction ? "Distraction is running high" : "Quick check-in";
  const message = highDistraction
    ? `You have seen ${sessionStats.distraction} distracting items this session. You said your goal is <strong>${escapeHtml(goal)}</strong>. Are you sure you want to continue?`
    : `You said your goal is <strong>${escapeHtml(goal)}</strong>. Are you sure you want to continue?`;

  const overlay = document.createElement("div");
  overlay.id = "privacy-balance-overlay";
  overlay.innerHTML = `
    <section id="privacy-balance-dialog" role="dialog" aria-modal="true" aria-labelledby="privacy-balance-title">
      <p id="privacy-balance-label">Privacy Balance</p>
      <h2 id="privacy-balance-title">${title}</h2>
      <p id="privacy-balance-message">${message}</p>
      <p id="privacy-balance-stats">Session: ${sessionStats.productive} productive, ${sessionStats.neutral} neutral, ${sessionStats.distraction} distracting.</p>
      <div id="privacy-balance-actions">
        <button type="button" id="privacy-balance-continue">Continue</button>
        <button type="button" id="privacy-balance-skip">Skip</button>
      </div>
    </section>
  `;

  const style = document.createElement("style");
  style.textContent = `
    #privacy-balance-overlay {
      position: fixed;
      z-index: 2147483647;
      inset: 0;
      display: grid;
      place-items: center;
      padding: 20px;
      background: rgba(15, 23, 42, 0.44);
      color: #172033;
      font-family: Arial, Helvetica, sans-serif;
    }

    #privacy-balance-dialog {
      width: min(420px, 100%);
      padding: 24px;
      border: 1px solid #dbe3ef;
      border-radius: 8px;
      background: #ffffff;
      box-shadow: 0 24px 70px rgba(15, 23, 42, 0.28);
    }

    #privacy-balance-label {
      margin: 0 0 8px;
      color: #2563eb;
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
    }

    #privacy-balance-title {
      margin: 0 0 10px;
      color: #172033;
      font-size: 22px;
      font-weight: 700;
    }

    #privacy-balance-message {
      margin: 0;
      color: #4b5563;
      font-size: 15px;
      line-height: 1.4;
    }

    #privacy-balance-stats {
      margin: 12px 0 0;
      color: #64748b;
      font-size: 13px;
      line-height: 1.4;
    }

    #privacy-balance-actions {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      margin-top: 20px;
    }

    #privacy-balance-actions button {
      border: 0;
      border-radius: 6px;
      padding: 10px 12px;
      font: inherit;
      font-weight: 700;
      cursor: pointer;
    }

    #privacy-balance-continue {
      background: #e5e7eb;
      color: #111827;
    }

    #privacy-balance-skip {
      background: #2563eb;
      color: #ffffff;
    }
  `;

  document.head.appendChild(style);
  document.body.appendChild(overlay);

  document.getElementById("privacy-balance-continue").addEventListener("click", () => {
    reminderSnoozedUntil = Date.now() + REMINDER_INTERVAL_SECONDS * 1000;
    overlay.remove();
    style.remove();
  });

  document.getElementById("privacy-balance-skip").addEventListener("click", () => {
    const searchQuery = encodeURIComponent(`${goal} tutorial`);
    window.location.href = `https://www.google.com/search?q=${searchQuery}`;
  });
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
