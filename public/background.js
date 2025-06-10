// Background script for Chrome Extension (service worker)
// Ensure chrome APIs are available
if (typeof chrome === "undefined") {
  console.error("Chrome APIs not available");
} else {
  console.log("Chrome APIs loaded successfully");
}

// Method 1: Enable side panel for all sites on installation
chrome.runtime.onInstalled.addListener(() => {
  console.log("Extension installed, enabling side panel");
  try {
    // Enable the side panel for all sites
    chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
  } catch (error) {
    console.error("Error setting panel behavior:", error);
  }
});

// Method 2: Open side panel when action is clicked
chrome.action.onClicked.addListener(async (tab) => {
  try {
    await chrome.sidePanel.open({ tabId: tab.id });
    console.log("Side panel opened for tab:", tab.id);
  } catch (error) {
    console.error("Failed to open side panel:", error);
  }
});

// Method 3: Enable side panel for specific sites
chrome.tabs.onUpdated.addListener(async (tabId, info, tab) => {
  if (!tab.url || info.status !== "complete") return;

  // Enable for all HTTP/HTTPS sites
  if (tab.url.startsWith("http://") || tab.url.startsWith("https://")) {
    try {
      await chrome.sidePanel.setOptions({
        tabId,
        path: "index.html", // Use relative path from dist folder
        enabled: true,
      });
    } catch (error) {
      console.error("Failed to set side panel options:", error);
    }
  }
});

// Method 4: Keep side panel always available
chrome.runtime.onStartup.addListener(() => {
  console.log("Browser started, enabling side panel");
  try {
    chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
  } catch (error) {
    console.error("Error on startup:", error);
  }
});
