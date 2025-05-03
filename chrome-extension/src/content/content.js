// content.js

console.log("[Trust Checker] 콘텐츠 스크립트 로드됨");

// 전역 분석 결과 객체
window.analysisResults = {
  title: null,
  videoId: null,
  channel: null,
  captions: null,
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
      videoId: analysisResults.videoId,
      data: analysisResults,
    },
    (response) => {
      console.log("백엔드 응답:", response);
    }
  );
}
// 자막 추출 로직
async function getCaptions() {
  // 1️⃣ DOM 자막 먼저 시도
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

  // 2️⃣ YouTube API 자막 시도
  const videoId = new URLSearchParams(location.search).get("v");
  const apiCaptions = await getApiCaptions(videoId);

  if (apiCaptions) {
    console.log("✅ API 자막 추출 성공");
    return apiCaptions;
  }

  // 둘 다 없으면 null 반환
  console.log("❌ 자막 없음");
  return null;
}

// 📌 YouTube API 자막 추출 함수
// 📌 YouTube API 자막 추출 함수
async function getApiCaptions(videoId) {
  try {
    const apiUrl = `https://www.youtube.com/watch?v=${videoId}&hl=ko`;
    const response = await fetch(apiUrl);
    const html = await response.text();

    // 자막 URL 파싱
    const captionUrlMatch = html.match(/"captionTracks":(\[.*?\])/);
    if (!captionUrlMatch) return null;

    const captionTracks = JSON.parse(captionUrlMatch[1]);
    const captionTrack =
      captionTracks.find((track) => track.languageCode === "ko") ||
      captionTracks[0];

    const captionUrl = captionTrack?.baseUrl;
    if (captionUrl) {
      const captionResponse = await fetch(captionUrl);
      let captions = await captionResponse.text();

      // 🔥 <...> 태그 제거
      captions = captions.replace(/<[^>]*>/g, "");

      return captions;
    }
  } catch (error) {
    console.error("⚠️ API 자막 오류:", error);
  }

  return null;
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
