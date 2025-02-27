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
            frame.innerHTML = "<h3>SummarAI Summary</h3><p>Loading...</p>";
            document.body.appendChild(frame);
        }
    }

    if (message.action === "updateSummary") {
        let frame = document.getElementById("summarAI-frame");
        if (frame) {
            frame.innerHTML = `<h3>SummarAI Summary</h3><p>${message.summary}</p>`;
        }
    }
});
