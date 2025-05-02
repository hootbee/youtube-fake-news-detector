// content.js

console.log("[Trust Checker] 콘텐츠 스크립트 로드됨");

// 전역 분석 결과 객체
window.analysisResults = {
  title: null,
  videoId: null,
  channel: null,
  captions: null,
  comments: [],
};

// 댓글, 자막 등 동적 로딩 대응을 위한 waitForElement 함수 추가
async function waitForElement(selector, timeout = 5000) {
  return new Promise((resolve) => {
    if (document.querySelector(selector)) {
      return resolve(document.querySelector(selector));
    }
    const observer = new MutationObserver(() => {
      if (document.querySelector(selector)) {
        observer.disconnect();
        resolve(document.querySelector(selector));
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
    setTimeout(() => {
      observer.disconnect();
      resolve(null);
    }, timeout);
  });
}

// 자동 분석 트리거
const observer = new MutationObserver((mutations, obs) => {
  if (document.querySelector("#title h1")) {
    console.log("[🔍] 영상 요소 감지됨");
    obs.disconnect();
    runAnalysis();
  }
});

// 수동 테스트용 함수 (콘솔에서 직접 실행)
window.testAnalysis = async () => {
  console.group("[🔧] 수동 분석 시작");
  await runAnalysis();
  console.groupEnd();
};

// 주요 분석 로직
async function runAnalysis() {
  try {
    console.group("[🔎] 분석 진행 중");

    // 1. 기본 정보 추출
    analysisResults.videoId = new URLSearchParams(location.search).get("v");
    analysisResults.title = document.querySelector("#title h1")?.innerText;

    // 채널 정보 (2024년 7월 기준)
    const channelElement =
      document.querySelector('a[href^="/@"]') ||
      document.querySelector('a[href^="/channel/"]') ||
      document.querySelector("#owner-container yt-formatted-string a");
    analysisResults.channel = channelElement?.href;

    console.log("📌 기본 정보:", {
      제목: analysisResults.title,
      영상ID: analysisResults.videoId,
      채널: analysisResults.channel,
    });

    // 2. 자막 추출
    analysisResults.captions = await getCaptions();
    if (analysisResults.captions) {
      console.log("📜 전체 자막:\n" + analysisResults.captions);
    } else {
      console.log("📜 자막 없음");
    }

    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.action === "REQUEST_STT") {
        fetch("http://localhost:3000/api/analysis/stt", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ videoId: message.videoId }),
        })
          .then((res) => res.json())
          .then((data) => sendResponse(data))
          .catch((err) => console.error(err));

        return true; // 비동기 응답을 위해 true 반환
      }
    });

    // 4. 최종 결과
    console.log("✅ 분석 완료:", analysisResults);
  } catch (error) {
    console.error("❌ 분석 실패:", error);
  } finally {
    console.groupEnd();
  }

  chrome.runtime.sendMessage(
    {
      action: "SEND_TEXT_DATA",
      data: analysisResults,
    },
    (response) => {
      console.log("백엔드 응답:", response);
    }
  );
}
// 자막 추출 로직
async function getCaptions() {
  // 1. DOM 기반 자막 (2024년 8월 기준)
  const domCaptions =
    Array.from(
      document.querySelectorAll(
        "#segments-container yt-formatted-string, .ytp-caption-segment"
      )
    )
      .map((n) => n.textContent?.trim())
      .filter(Boolean)
      .join("\n") || null;

  if (domCaptions) {
    console.log("✅ DOM 자막 추출 성공");
    return domCaptions;
  }
}

// 초기 실행
if (document.querySelector("#title h1")) {
  runAnalysis();
} else {
  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
}
