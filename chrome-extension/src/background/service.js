// service.js

console.log("[Trust Checker] 백그라운드 스크립트 로드됨");

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("📡 수신된 메시지:", message);

  if (message.action === "REQUEST_STT") {
    // STT 요청 처리
    fetch("http://localhost:3000/api/analysis/stt", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ videoId: message.videoId }),
    })
      .then((res) => res.json())
      .then((data) => {
        console.log("📄 STT 응답:", data);
        sendResponse({ transcript: data.transcript });
      })
      .catch((error) => {
        console.error("STT 요청 실패:", error);
        sendResponse({ transcript: null });
      });

    // 비동기 응답 처리
    return true;
  }

  if (message.action === "SEND_TEXT_DATA") {
    // 분석 텍스트 데이터 전송
    fetch("http://localhost:3000/api/analysis/text", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ data: message.data }),
    })
      .then((res) => res.json())
      .then((data) => {
        console.log("✅ 텍스트 데이터 응답:", data);
        sendResponse({ status: "success", data });
      })
      .catch((error) => {
        console.error("텍스트 데이터 전송 실패:", error);
        sendResponse({ status: "error", error });
      });

    // 비동기 응답 처리
    return true;
  }
});
