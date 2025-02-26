document.addEventListener("DOMContentLoaded", () => {
    console.log("Popup loaded");
    loadSettings();
});

document.getElementById("saveApiKey").addEventListener("click", () => {
    const apiKey = document.getElementById("apiKey").value.trim();
    if (!apiKey) {
        alert("Please enter your OpenAI API Key.");
        return;
    }
    saveSettings(apiKey);
});

document.getElementById("openSummarizeFrame").addEventListener("click", () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const tabId = tabs[0].id;
        showSummaryFrame(tabId);
    });
});

function showSummaryFrame(tabId) {
    console.log("Showing summary frame");
    chrome.scripting.executeScript({
        target: { tabId },
        files: ['content.js']
    }, () => {
        if (chrome.runtime.lastError) {
            console.error("Error injecting content script:", chrome.runtime.lastError.message);
        } else {
            chrome.tabs.sendMessage(tabId, { action: "showSummaryFrame" }, (response) => {
                if (chrome.runtime.lastError) {
                    console.error("Error sending message to content script:", chrome.runtime.lastError.message);
                } else {
                    console.log("Frame show message sent successfully.");
                }
            });
        }
    });
}

function saveSettings(apiKey) {
    chrome.storage.local.set({ apiKey }, () => {
        console.log("Settings saved.");
    });
}

function loadSettings() {
    chrome.storage.local.get(["apiKey"], (result) => {
        console.log("Settings loaded:", result);
        if (chrome.runtime.lastError) {
            console.error("Error accessing chrome.storage:", chrome.runtime.lastError);
        }

        if (result.apiKey) {
            document.getElementById("apiKey").value = result.apiKey;
        }
    });
}
