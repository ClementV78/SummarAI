document.addEventListener("DOMContentLoaded", () => {
    console.log("Side panel loaded");
    loadSettings();

    document.getElementById("frame-summarize").addEventListener("click", async () => {
        const prompt = document.getElementById("frame-prompt").value;
        const maxTokens = parseInt(document.getElementById("frame-maxTokens").value, 10);
        const model = document.getElementById("frame-modelSelect").value;
        document.getElementById("summary-content").innerText = "Loading...";
        document.getElementById("summary-logs").innerText = "Starting summarization process...";
        chrome.storage.local.set({ prompt, maxTokens, model });
        await summarizeText(prompt, maxTokens, model);
    });

    const closeButton = document.getElementById("close-sidepanel");
    if (closeButton) {
        closeButton.addEventListener("click", async () => {
            // Send message to content script to remove the side panel
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                const tabId = tabs[0].id;
                chrome.tabs.sendMessage(tabId, { action: "removeSidePanel" }).catch(error => console.error("Could not send removeSidePanel message:", error));
            });
        });
    } else {
        console.error("Close button not found!");
    }
});

async function summarizeText(prompt, maxTokens, model) {
    const apiKey = await getApiKey();
    logToFrame("Using model: " + model);

    try {
        logToFrame("Sending request to OpenAI...");
        const text = await getTextFromPage();
        logToFrame("Extracted text...");

        const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: model,
                messages: [
                    { "role": "system", "content": "You are an AI assistant that summarizes texts." },
                    { "role": "user", "content": `${prompt}\n\n${text}` }
                ],
                max_tokens: maxTokens
            })
        });

        logToFrame("Request sent to OpenAI.");

        const responseText = await response.text();
        logToFrame("API Response received.");

        if (!response.ok) {
            throw new Error(`API Error: ${response.status} ${response.statusText}`);
        }

        const data = JSON.parse(responseText);
        if (!data.choices || data.choices.length === 0) {
            throw new Error("Invalid API response: No choices returned.");
        }

        logToFrame("Summary received.");
        document.getElementById("summary-content").innerText = data.choices[0].message.content.trim();
    } catch (error) {
        logToFrame("Error fetching summary: " + error.message);
        document.getElementById("summary-content").innerText = "Error: " + error.message;
    }
}

async function getApiKey() {
    return new Promise((resolve, reject) => {
        chrome.storage.local.get(["apiKey"], (result) => {
            if (chrome.runtime.lastError) {
                reject(chrome.runtime.lastError);
            } else {
                resolve(result.apiKey);
            }
        });
    });
}

function logToFrame(log) {
    const logs = document.getElementById("summary-logs");
    if (logs) {
        logs.innerText += `\n${log}`;
    }
}

async function getTextFromPage() {
    return new Promise((resolve, reject) => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            const tabId = tabs[0].id;
            chrome.scripting.executeScript({
                target: { tabId },
                func: () => {
                    return window.getSelection().toString() || document.body.innerText;
                }
            }, (results) => {
                if (chrome.runtime.lastError) {
                    reject(chrome.runtime.lastError);
                } else {
                    resolve(results[0].result);
                }
            });
        });
    });
}

function loadSettings() {
    chrome.storage.local.get(["apiKey", "maxTokens", "prompt", "model"], (result) => {
        if (result.prompt) {
            document.getElementById("frame-prompt").value = result.prompt;
        }
        if (result.maxTokens) {
            document.getElementById("frame-maxTokens").value = result.maxTokens;
        }
        if (result.model) {
            document.getElementById("frame-modelSelect").value = result.model;
        }
    });
}
