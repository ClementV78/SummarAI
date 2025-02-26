chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log("Message received in content script:", message);
    
    if (message.action === "showSummaryFrame") {
        let frame = document.getElementById("summarAI-frame");
        if (!frame) {
            frame = document.createElement("div");
            frame.id = "summarAI-frame";
            frame.style.position = "fixed";
            frame.style.top = "0";
            frame.style.right = "0";
            frame.style.width = "350px";
            frame.style.height = "100%";
            frame.style.backgroundColor = "white";
            frame.style.borderLeft = "1px solid #ccc";
            frame.style.padding = "10px";
            frame.style.zIndex = "10000";
            frame.style.overflowY = "auto";
            frame.style.boxShadow = "0 0 10px rgba(0, 0, 0, 0.5)";
            frame.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <h3>SummarAI Summary</h3>
                    <button id="close-summary-frame" style="background: none; border: none; font-size: 16px; cursor: pointer;">✖</button>
                </div>
                <textarea id="frame-prompt" placeholder="Enter your custom prompt"></textarea>
                <input type="number" id="frame-maxTokens" min="80" max="500" value="150">
                <button id="frame-summarize">Summarize</button>
                <p id="summary-content">Waiting for input...</p>
                <div id="summary-logs" style="font-size: 12px; color: #666; margin-top: 10px;"></div>
            `;
            document.body.appendChild(frame);

            document.getElementById("close-summary-frame").addEventListener("click", () => {
                frame.remove();
            });

            document.getElementById("frame-summarize").addEventListener("click", async () => {
                const prompt = document.getElementById("frame-prompt").value;
                const maxTokens = parseInt(document.getElementById("frame-maxTokens").value, 10);
                document.getElementById("summary-content").innerText = "Loading...";
                document.getElementById("summary-logs").innerText = "Starting summarization process...";
                chrome.storage.local.set({ prompt, maxTokens });
                await summarizeText(prompt, maxTokens);
            });

            chrome.storage.local.get(["prompt", "maxTokens"], (result) => {
                if (result.prompt) {
                    document.getElementById("frame-prompt").value = result.prompt;
                }
                if (result.maxTokens) {
                    document.getElementById("frame-maxTokens").value = result.maxTokens;
                }
            });
        }
        sendResponse({ status: "frame shown" });
    }

    if (message.action === "updateSummary") {
        let frame = document.getElementById("summarAI-frame");
        if (frame) {
            document.getElementById("summary-content").innerText = message.summary;
        }
        sendResponse({ status: "summary updated" });
    }

    if (message.action === "log") {
        let frame = document.getElementById("summarAI-frame");
        if (frame) {
            const logs = document.getElementById("summary-logs");
            logs.innerText += `\n${message.log}`;
        }
    }
});

async function summarizeText(prompt, maxTokens) {
    const apiKey = await getApiKey();
    const model = await detectAvailableModel(apiKey);
    logToFrame("Using model: " + model);

    try {
        logToFrame("Sending request to OpenAI...");
        const text = getTextFromPage();
        logToFrame("Extracting text...");

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

async function detectAvailableModel(apiKey) {
    try {
        const response = await fetch("https://api.openai.com/v1/models", {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${apiKey}`
            }
        });

        if (!response.ok) {
            throw new Error("Failed to fetch available models.");
        }

        const data = await response.json();
        const models = data.data.map(m => m.id);

        return models.includes("gpt-4o") ? "gpt-4o" : (models.includes("gpt-4o-mini") ? "gpt-4o-mini" : "gpt-3.5-turbo");
    } catch (error) {
        logToFrame("Error detecting available model: " + error.message);
        return "gpt-3.5-turbo"; // Default fallback
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

function getTextFromPage() {
    return window.getSelection().toString() || document.body.innerText;
}
