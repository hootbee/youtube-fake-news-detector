// service.js

console.log("[Trust Checker] 백그라운드 스크립트 로드됨");

// 공통 fetch 함수
async function sendRequest(url, method, body) {
  try {
    const response = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("❌ 요청 실패:", error);
    throw error;
  }
}

// 메시지 리스너
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("📡 수신된 메시지:", message);

  if (message.action === "SEND_TEXT_DATA") {
    sendRequest("http://localhost:3000/api/analysis/text", "POST", {
      data: message.data,
    })
      .then((textDataResult) => {
        console.log("✅ 텍스트 데이터 응답:", textDataResult);

        // analyze API 호출
        return sendRequest(
          "http://localhost:3000/api/analysis/analyze",
          "POST",
          {
            videoId: message.videoId,
            youtubeText: message.data, // or textDataResult.something
          }
        );
      })
      .then((analyzeResult) => {
        console.log("📊 전체 분석 결과:", analyzeResult);
        sendResponse({ status: "success", analyzeResult });
      })
      .catch((error) => {
        sendResponse({ status: "error", error: error.message });
      });

    return true;
  }
});
