// content.js

console.log("[Trust Checker] 콘텐츠 스크립트 로드됨");

//버튼 실행을 위한 전역변수 선언
let analysisTriggered = false;
let lastVideoId = null;

// 전역 분석 결과 객체
window.analysisResults = {
  title: null,
  videoId: null,
  channel: null,
  captions: null,
};

function insertOverlayTriggerButton(onClickCallback) {
  const existingBtn = document.getElementById("trust-checker-btn");
  if (existingBtn) return;

  // ✅ 신뢰도 확인 버튼
  const btn = document.createElement("button");
  btn.id = "trust-checker-btn";
  btn.innerText = "신뢰도 확인 🔎";
  Object.assign(btn.style, {
    position: "fixed",
    top: "20px",
    right: "130px",
    zIndex: "10000",
    padding: "10px 15px",
    backgroundColor: "#2f80ed",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    fontSize: "14px",
    cursor: "pointer"
  });
  btn.addEventListener("click", onClickCallback);
  document.body.appendChild(btn);

  // ✅ 닫기 버튼
  const closeBtn = document.createElement("button");
  closeBtn.id = "trust-close-btn";
  closeBtn.innerText = "닫기 ❌";
  Object.assign(closeBtn.style, {
    position: "fixed",
    top: "20px",
    right: "20px",
    zIndex: "10000",
    padding: "10px 15px",
    backgroundColor: "#eb5757",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    fontSize: "14px",
    cursor: "pointer"
  });
  closeBtn.addEventListener("click", () => {
    const ids = ["trust-overlay", "article-overlay", "keyword-overlay"];
    ids.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.remove();
    });
  });
  document.body.appendChild(closeBtn);
}



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

// 주기적으로 URL 변경 감지
setInterval(() => {
  const currentVideoId = new URLSearchParams(location.search).get("v");
  if (analysisTriggered && currentVideoId !== lastVideoId) {
    console.log("[♻️] 새로운 영상 감지됨. 오버레이 갱신 실행");
    lastVideoId = currentVideoId;
    runAnalysis();
  }
}, 1000);

/* 자동 분석 트리거
const observer = new MutationObserver((mutations, obs) => {
  if (document.querySelector("#title h1")) {
    console.log("[🔍] 영상 요소 감지됨");
    obs.disconnect();
    runAnalysis();
  }
});*/

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

  //오버레이 분할
  //알고리즘 완성하면 {analysisResults.trustScore} 형식으로 변수 변경 필요
  const overlay1 = showOverlay(
    "trust-overlay",
    "✨ 신뢰도",
    "📌 신뢰도 점수",
    `<p>${analysisResults.title}</p>`,
    "80px",
  );

  const overlay2 = showOverlay(
    "article-overlay",
    "✨ 관련 기사",
    "📌 기사 링크",
    `<p>${analysisResults.channel}</p>`,
    "220px",
  );

  const overlay3 = showOverlay(
    "keyword-overlay",
    "✨ 키워드",
    "📌 연관 키워드",
    `<p>${analysisResults.captions}</p>`,
    "360px",
  );
}
  /* 이상은이 추가한 부분 (오버레이)
  const dummySummary = `
  <p><strong>📌 제목</strong></p>
  <p>${analysisResults.title}</p>
  <p><strong>📌 채널</strong></p>
  <p>${analysisResults.channel}</p>
  <p><strong>📌 전체 자막</strong></p>
  <p>${analysisResults.captions}</p>` || `${"자막이 없습니다."}`;

  showOverlay(dummySummary);
}
  추가 부분 끝 */

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

/* 초기 실행
if (document.querySelector("#title h1")) {
  runAnalysis();
} else {
  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
}*/

// 초기 실행 시 버튼 삽입
insertOverlayTriggerButton(() => {
  console.log("[🟦] 신뢰도 확인 버튼 클릭됨");
  analysisTriggered = true;
  runAnalysis();
});

//ON/OFF 기능
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "TOGGLE_BUTTONS") {
    const display = message.show ? "block" : "none";

    const btn = document.getElementById("trust-checker-btn");
    const closeBtn = document.getElementById("trust-close-btn");

    if (btn) btn.style.display = display;
    if (closeBtn) closeBtn.style.display = display;

    const overlayIds = ["trust-overlay", "article-overlay", "keyword-overlay"];
    overlayIds.forEach(id => {
      const overlay = document.getElementById(id);
      if (overlay) overlay.style.display = display;
    });

    console.log(`⚙️ 버튼 및 오버레이 표시 상태: ${display}`);
  }
});


