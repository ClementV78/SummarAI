chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log("Message received in content script:", message);
});

async function summarizeText(prompt, maxTokens, model) {
    const apiKey = await getApiKey();
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
            throw new Error(`Invalid API response: No choices returned.`);
        }

        logToFrame("Summary received.");
        document.getElementById("summary-content").innerText = data.choices[0].message.content.trim();
    } catch (error) {
        logToFrame("Error fetching summary: " + error.message);
        document.getElementById("summary-content").innerText = `Error: ${error.message}`;
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
