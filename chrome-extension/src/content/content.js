// content.js

console.log("[Trust Checker] 콘텐츠 스크립트 로드됨");

let analysisTriggered = false;
let lastVideoId = null;
let alreadyAnalyzedTitle = null;

window.analysisResults = {
  title: null,
  videoId: null,
  channel: null,
  captions: null,
};

// 버튼 삽입
function insertOverlayTriggerButton(onClickCallback) {
  if (document.getElementById("trust-checker-btn")) return;

  const btn = document.createElement("button");
  btn.id = "trust-checker-btn";
  btn.innerText = "신뢰도 확인 🔎";
  Object.assign(btn.style, {
    position: "fixed", top: "20px", right: "130px", zIndex: "10000",
    padding: "10px 15px", backgroundColor: "#2f80ed", color: "#fff",
    border: "none", borderRadius: "6px", fontSize: "14px", cursor: "pointer",
  });
  btn.addEventListener("click", onClickCallback);
  document.body.appendChild(btn);

  const closeBtn = document.createElement("button");
  closeBtn.id = "trust-close-btn";
  closeBtn.innerText = "닫기 ❌";
  Object.assign(closeBtn.style, {
    position: "fixed", top: "20px", right: "20px", zIndex: "10000",
    padding: "10px 15px", backgroundColor: "#eb5757", color: "#fff",
    border: "none", borderRadius: "6px", fontSize: "14px", cursor: "pointer",
  });
  closeBtn.addEventListener("click", () => {
    ["trust-overlay", "article-overlay", "keyword-overlay", "rebuttal-overlay"].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.remove();
    });
  });
  document.body.appendChild(closeBtn);
}

// 오버레이 출력 함수
/*function showOverlay(id, title, subtitle, content, top) {
  let existing = document.getElementById(id);
  if (existing) existing.remove();

  const wrapper = document.createElement("div");
  wrapper.id = id;
  Object.assign(wrapper.style, {
    position: "fixed", right: "20px", top, zIndex: 10000,
    backgroundColor: "#fff", padding: "15px", borderRadius: "8px",
    boxShadow: "0 0 10px rgba(0,0,0,0.3)", width: "360px",
    maxHeight: "400px", overflowY: "auto", fontSize: "14px",
  });

  wrapper.innerHTML = `
    <h3>${title}</h3>
    <p><strong>${subtitle}</strong></p>
    ${content}
  `;
  document.body.appendChild(wrapper);
}*/

// YouTube 자막 추출
async function getCaptions() {
  const domCaptions = Array.from(
    document.querySelectorAll("#segments-container yt-formatted-string, .ytp-caption-segment")
  ).map(n => n.textContent?.trim()).filter(Boolean).join("\n") || null;
  if (domCaptions) return domCaptions;

  const videoId = new URLSearchParams(location.search).get("v");
  const html = await fetch(`https://www.youtube.com/watch?v=${videoId}&hl=ko`).then(res => res.text());
  const match = html.match(/"captionTracks":(\[.*?\])/);
  if (!match) return null;

  const captionTracks = JSON.parse(match[1]);
  const captionUrl = captionTracks.find(t => t.languageCode === "ko")?.baseUrl || captionTracks[0]?.baseUrl;
  if (!captionUrl) return null;

  const res = await fetch(captionUrl);
  return (await res.text()).replace(/<[^>]*>/g, "");
}

// 분석 실행
async function runAnalysis() {
  try {
    const videoId = new URLSearchParams(location.search).get("v");
    const title = document.querySelector("#title h1")?.innerText;
    if (title === alreadyAnalyzedTitle) return;

    analysisTriggered = true;
    lastVideoId = videoId;
    alreadyAnalyzedTitle = title;

    const channel = document.querySelector('a[href^="/@"]')?.href;
    const captions = await getCaptions();

    const data = {
      videoId, title, channel, captions,
    };

    chrome.runtime.sendMessage({
      action: "SEND_TEXT_DATA",
      videoId,
      data
    }, async (response) => {
      const {
        trustLevel,
        averageTrustScore,
        searchKeyword,
        topArticles,
        rebuttal,
        status
      } = response?.analyzeResult || {};

      // 오버레이 1: 신뢰도
      let trustLabel = "";
      if (typeof averageTrustScore === "number") {
        if (averageTrustScore*100 >= 80) trustLabel = "🟢 신뢰";
        else if (averageTrustScore*100 >= 50) trustLabel = "🟡 불확실";
        else if (averageTrustScore*100 >= 20) trustLabel = "🟠 의심";
        else trustLabel = "🔴 불신";
      }
      showOverlay(
        "trust-overlay",
        "✨ 신뢰도",
        "📌 유사도 기반 신뢰도",
        `<p>${trustLabel} (${(averageTrustScore * 100).toFixed(2)}%)</p>`,
        "80px"
      );

      // 오버레이 2: 기사 리스트
      showOverlay(
        "article-overlay",
        "✨ 관련 기사",
        "📌 신뢰도 TOP 5",
        topArticles?.map(
          (a, i) =>
            `<p><strong>${i + 1}. ${a.press}</strong> - <a href="${a.link}" target="_blank">${a.title}</a><br/>
            🧠 신뢰점수: ${a.trustScore ?? "?"} | 🆕 최신도: ${a.freshness ?? "?"} | 🤝 유사도: ${a.similarity ?? "?"}</p>`
        ).join("") || "<p>관련 기사 없음</p>",
        "220px"
      );

      // 오버레이 3: 키워드
      showOverlay(
        "keyword-overlay",
        "✨ 키워드",
        "📌 연관 키워드",
        `<p>${searchKeyword || "키워드 없음"}</p>`,
        "550px"
      );

      // 오버레이 4: 반박 기사
      if (status === "rebuttal_success" && rebuttal) {
        showOverlay(
          "rebuttal-overlay",
          "❌ 반증 발견",
          `📌 반박 기사 (키워드: ${rebuttal.searchKeyword})`,
          `<p><strong>${rebuttal.press}</strong> - <a href="${rebuttal.link}" target="_blank">${rebuttal.title}</a><br/>
          💬 ${rebuttal.rebuttalSentence}</p>`,
          "650px"
        );
      } else if (status === "inconclusive") {
        showOverlay(
          "rebuttal-overlay",
          "❓ 판단 보류",
          "📌 반박 기사 없음",
          `<p>3회 재검색에도 반박 기사를 찾지 못했습니다.</p>`,
          "500px"
        );
      }
    });
  } catch (err) {
    console.error("❌ 분석 중 오류 발생:", err);
  }
}

// 초기 버튼 삽입
insertOverlayTriggerButton(() => {
  console.log("[🟦] 신뢰도 확인 버튼 클릭됨");
  runAnalysis();
});

// ON/OFF 수신 리스너
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "TOGGLE_BUTTONS") {
    const display = message.show ? "block" : "none";
    ["trust-checker-btn", "trust-close-btn"].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.style.display = display;
    });
    ["trust-overlay", "article-overlay", "keyword-overlay", "rebuttal-overlay"].forEach(id => {
      const overlay = document.getElementById(id);
      if (overlay) overlay.style.display = display;
    });
    console.log(`⚙️ 버튼 및 오버레이 표시 상태: ${display}`);
  }
});
