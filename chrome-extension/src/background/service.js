// service.js

console.log("[Trust Checker] 백그라운드 스크립트 로드됨");

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("📡 수신된 메시지:", message);

  // SEND_TEXT_DATA 메시지 처리
  if (message.action === "SEND_TEXT_DATA") {
    sendRequest("http://localhost:3000/api/analysis/text", "POST", {
      data: message.data,
    })
      .then((textDataResult) => {
        console.log("✅ 텍스트 데이터 응답:", textDataResult);

        // SEND_TEXT_DATA 응답 전송
        sendResponse({ status: "success", textDataResult });

        // 추가로 ANALYZE_DATA 메시지 전송
        chrome.runtime.sendMessage({
          action: "ANALYZE_DATA",
          videoId: message.videoId,
          youtubeText: message.data, // 또는 textDataResult에서 필요한 데이터 사용
        });
      })
      .catch((error) => {
        sendResponse({ status: "error", error: error.message });
      });

    return true;
  }

  // ANALYZE_DATA 메시지 처리
  if (message.action === "ANALYZE_DATA") {
    sendRequest("http://localhost:3000/api/analysis/analyze", "POST", {
      videoId: message.videoId,
      youtubeText: message.youtubeText,
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
