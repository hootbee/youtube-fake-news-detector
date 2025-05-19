function showOverlay(id, mainTitle, subTitle, content, topOffset = "80px") {
  const existing = document.getElementById(id);
  if (existing) existing.remove();

  const overlay = document.createElement("div");
  overlay.id = id;
  overlay.innerHTML = `
    <div class="overlay-header">
      <span><strong>${mainTitle}</strong></span>
      <button class="overlay-close">&times;</button>
    </div>
    <div class="overlay-subtitle">
      <em>${subTitle}</em>
    </div>
    <div class="overlay-body">
      ${content || "<p>요약 정보 없음</p>"}
    </div>
  `;

  Object.assign(overlay.style, {
    position: "fixed",
    top: topOffset,
    right: "5%",
    backgroundColor: "rgba(99, 143, 255, 0.85)",
    color: "#ffffff",
    padding: "20px",
    borderRadius: "12px",
    zIndex: "9999",
    maxWidth: "90%",
    width: "400px",
    fontFamily: "Segoe UI, sans-serif",
    fontSize: "13px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
    boxSizing: "border-box",
  });

  const style = document.createElement("style");
    style.textContent = `
      #${id} .overlay-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 6px;
        font-size: 16px;
      }

      #${id} .overlay-close {
        background: none;
        border: none;
        color: #fff;
        font-size: 20px;
        cursor: pointer;
      }

      #${id} .overlay-subtitle {
        font-size: 13px;
        margin-bottom: 12px;
        opacity: 0.8;
      }

      #${id} .overlay-body {
        max-height: 300px;
        overflow-y: auto;
      }

      #${id} .overlay-body p {
        margin: 0 0 8px;
        line-height: 1.6;
      }

      @media (max-width: 600px) {
        #${id} {
          top: calc(${topOffset} - 40px);
          right: 5%;
          left: 5%;
          width: auto;
          font-size: 13px;
          padding: 16px;
        }

        #${id} .overlay-close {
          font-size: 13px;
        }
      }
    `;

  document.head.appendChild(style);
  document.body.appendChild(overlay);

  //드래그
  const header = overlay.querySelector('.overlay-header');
  let isDragging = false;
  let offsetX = 0;
  let offsetY = 0;

  header.style.cursor = 'move';

  header.addEventListener('mousedown', (e) => {
    isDragging = true;
    offsetX = e.clientX - overlay.getBoundingClientRect().left;
    offsetY = e.clientY - overlay.getBoundingClientRect().top;
    overlay.style.transition = 'none'; 
  });

  document.addEventListener('mousemove', (e) => {
    if (isDragging) {
      overlay.style.left = `${e.clientX - offsetX}px`;
      overlay.style.top = `${e.clientY - offsetY}px`;
      overlay.style.right = 'auto';
    }
  });

  document.addEventListener('mouseup', () => {
    isDragging = false;
  });

  // 닫기 버튼
  overlay.querySelector(".overlay-close").addEventListener("click", () => {
    overlay.remove();
    style.remove();
  });

  return overlay;
}

/*function showOverlay(summaryHTML) {
  const existing = document.getElementById("trust-overlay");
  if (existing) existing.remove();

  const overlay = document.createElement("div");
  overlay.id = "trust-overlay";
  overlay.innerHTML = `
    <div class="overlay-header">
      <span><strong>✨ 요약 정보</strong></span>
      <button class="overlay-close">&times;</button>
    </div>
    <div class="overlay-body">
      ${summaryHTML || "<p>요약 정보 없음</p>"}
    </div>
  `;

  Object.assign(overlay.style, {
    position: "fixed",
    top: "80px",
    right: "5%",
    backgroundColor: "rgba(99, 143, 255, 0.85)",
    color: "#ffffff",
    padding: "20px",
    borderRadius: "12px",
    zIndex: "9999",
    maxWidth: "90%",
    width: "400px",
    fontFamily: "Segoe UI, sans-serif",
    fontSize: "13px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
    boxSizing: "border-box",
  });

  //반응형
  const style = document.createElement("style");
  style.textContent = `
    #trust-overlay .overlay-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
      font-size: 16px;
    }

    #trust-overlay .overlay-close {
      background: none;
      border: none;
      color: #fff;
      font-size: 20px;
      cursor: pointer;
    }

    #trust-overlay .overlay-body p {
      margin: 0 0 8px;
      line-height: 1.6;
    }

    @media (max-width: 600px) {
      #trust-overlay {
        top: 40px;
        right: 5%;
        left: 5%;
        width: auto;
        font-size: 13px;
        padding: 16px;
      }

      #trust-overlay .overlay-close {
        font-size: 13px;
      }
    }
  `;
  document.head.appendChild(style);
  document.body.appendChild(overlay);

  overlay.querySelector(".overlay-close").addEventListener("click", () => {
    overlay.remove();
  });
}*/