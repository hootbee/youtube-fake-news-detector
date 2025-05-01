// background/service.js

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "REQUEST_STT") {
    fetch("http://localhost:3000/api/stt", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ videoId: request.videoId }),
    })
      .then((r) => r.json())
      .then((data) => sendResponse(data))
      .catch((error) => sendResponse({ error }));
    return true; // 비동기 응답을 위해 필요
  }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "SEND_TEXT_DATA") {
    fetch("http://localhost:3000/api/analysis/text", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request.data),
    })
      .then((r) => r.json())
      .then((data) => sendResponse(data))
      .catch((error) => sendResponse({ error }));

    return true;
  }
});

async function processVideoAnalysis(data) {
  try {
    // 서버 분석 요청
    const analysisResult = await fetch("https://your-backend.com/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }).then((r) => r.json());

    // UI 업데이트 명령 전송
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.scripting.executeScript({
        target: { tabId: tabs[0].id },
        func: injectResultsUI,
        args: [analysisResult],
      });
    });
  } catch (error) {
    console.error("Analysis failed:", error);
  }
}

function injectResultsUI(result) {
  // 동적 UI 생성
  const overlay = document.createElement("div");
  overlay.id = "trust-overlay";
  overlay.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 9999;
      background: rgba(0,0,0,0.8);
      color: white;
      padding: 1rem;
      border-radius: 8px;
      max-width: 300px;
      backdrop-filter: blur(5px);
    `;

  overlay.innerHTML = `
      <h3 style="margin:0 0 1rem 0; color: ${
        result.label === "FAKE" ? "#ff4444" : "#00C851"
      }">
        ${result.label} News (${Math.round(result.confidence * 100)}%)
      </h3>
      ${result.relatedArticles
        .map(
          (article) => `
        <div style="margin-bottom: 0.5rem;">
          <a href="${article.url}" target="_blank" style="color: #33b5e5; text-decoration: none;">
            ${article.title}
          </a>
          <div style="font-size: 0.8em; color: #aaa;">${article.source}</div>
        </div>
      `
        )
        .join("")}
    `;

  // 기존 오버레이 제거 후 새로 추가
  const existing = document.getElementById("trust-overlay");
  if (existing) existing.remove();

  document.body.appendChild(overlay);
}
