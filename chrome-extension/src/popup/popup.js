// 백그라운드와 통신
chrome.runtime.onMessage.addListener((message) => {
  if (message.action === "UPDATE_UI") {
    updateUI(message.data);
  }
});

function updateUI(data) {
  document.querySelector(".trust-score").textContent = `${Math.round(
    data.confidence * 100
  )}%`;

  const label = document.querySelector(".trust-label");
  label.className = `trust-label ${data.label.toLowerCase()}`;
  label.textContent =
    data.label === "REAL" ? "신뢰할 수 있는 콘텐츠" : "의심스러운 콘텐츠";

  const articlesContainer = document.getElementById("articles-container");
  articlesContainer.innerHTML = data.relatedArticles
    .map(
      (article) => `
      <div class="article-item">
        <a href="${article.url}" target="_blank">${article.title}</a>
        <div class="source">${article.source}</div>
      </div>
    `
    )
    .join("");
}

// 초기 데이터 요청
chrome.runtime.sendMessage({ action: "GET_ANALYSIS" });
