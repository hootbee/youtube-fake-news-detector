// DOM 요소 추적을 위한 MutationObserver
const observer = new MutationObserver((mutations) => {
  if (document.querySelector("#title h1")) {
    initAnalysis();
    observer.disconnect();
  }
});

observer.observe(document.body, {
  childList: true,
  subtree: true,
});

async function initAnalysis() {
  // 영상 메타데이터 추출
  const videoId = new URLSearchParams(window.location.search).get("v");
  const title = document.querySelector("#title h1").innerText;
  const channel = document.querySelector("#owner-container a").href;

  // 자막 데이터 추출 (3가지 방식 병행)
  const captions = await Promise.any([
    getApiCaptions(videoId),
    getDomCaptions(),
    getAudioTranscript(videoId),
  ]);

  // 댓글 데이터 수집
  const comments = Array.from(
    document.querySelectorAll("#contents ytd-comment-renderer")
  ).map((comment) => ({
    author: comment.querySelector("#author-text").textContent,
    content: comment.querySelector("#content-text").textContent,
  }));

  // 서버 전송
  chrome.runtime.sendMessage({
    action: "ANALYZE_VIDEO",
    data: { videoId, title, channel, captions, comments },
  });
}

// YouTube API를 통한 자막 추출
async function getApiCaptions(videoId) {
  const response = await fetch(
    `https://www.youtube.com/api/timedtext?v=${videoId}`
  );
  return response.ok ? await response.text() : null;
}

// DOM 기반 자막 추출
function getDomCaptions() {
  return Array.from(
    document.querySelectorAll("#segments-container yt-formatted-string")
  )
    .map((node) => node.textContent.trim())
    .join("\n");
}

// 오디오 스트림 STT 대체 수집
async function getAudioTranscript(videoId) {
  const audioUrl = await fetch(
    `https://your-backend.com/api/audio-url/${videoId}`
  ).then((r) => r.json());

  return await fetch(audioUrl)
    .then((r) => r.arrayBuffer())
    .then((buffer) => {
      const audioContext = new AudioContext();
      return audioContext.decodeAudioData(buffer);
    })
    .then((audioBuffer) => {
      // Whisper STT 처리 로직
      // ...
    });
}
