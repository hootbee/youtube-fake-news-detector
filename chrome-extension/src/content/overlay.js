// 오버레이 표시 함수수(이상은이 추가함)

function showOverlay(summaryText) {
    const existing = document.getElementById("trust-overlay");
    if (existing) existing.remove();
  
    const overlay = document.createElement("div");
    overlay.id = "trust-overlay";
    overlay.innerText = summaryText || "요약 정보 없음";
    overlay.style.position = "absolute";
    overlay.style.top = "100px";
    overlay.style.right = "50px";
    overlay.style.backgroundColor = "rgba(0, 0, 0, 0.8)";
    overlay.style.color = "white";
    overlay.style.padding = "12px";
    overlay.style.borderRadius = "10px";
    overlay.style.zIndex = "9999";
    overlay.style.maxWidth = "400px";
    overlay.style.fontSize = "16px";
    overlay.style.lineHeight = "1.4";
    overlay.style.whiteSpace = "pre-line";
  
    document.body.appendChild(overlay);
  }
  