chrome.runtime.onInstalled.addListener(() => {
    console.log("SummarAI installed and background service started.");
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log("Message received in background.js:", message);
});
