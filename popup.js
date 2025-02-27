document.addEventListener("DOMContentLoaded", () => {
    console.log("Popup loaded");
    loadSettings();
    document.getElementById("openSidePanel").addEventListener("click", openSidePanel);
});

async function saveApiKey() {
    const apiKey = document.getElementById("apiKey").value.trim();
    if (!apiKey) {
        alert("Please enter your OpenAI API Key.");
        return;
    }
    saveSettings(apiKey);
}

function openSidePanel() {
    chrome.windows.getCurrent((window) => {
        chrome.sidePanel.open({ windowId: window.id }, () => {
            // Open redirect page and close popup
            chrome.windows.create({
                url: chrome.runtime.getURL("redirect.html"),
                type: "popup",
                width: 1,
                height: 1,
                left: 9999,
                top: 9999,
                focused: false
            });
        });
    });
}

function saveSettings(apiKey) {
    const maxTokens = parseInt(document.getElementById("maxTokens").value, 10);
    chrome.storage.local.set({ apiKey, maxTokens }, () => {
        console.log("Settings saved.");
    });
}

function loadSettings() {
    chrome.storage.local.get(["apiKey", "maxTokens"], (result) => {
        console.log("Settings loaded:", result);
        if (chrome.runtime.lastError) {
            console.error("Error accessing chrome.storage:", chrome.runtime.lastError);
        }

        if (result.apiKey) {
            document.getElementById("apiKey").value = result.apiKey;
        }
        if (result.maxTokens) {
            document.getElementById("maxTokens").value = result.maxTokens;
        }
    });
}
