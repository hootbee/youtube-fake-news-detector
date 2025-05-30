function showOverlay(id, mainTitle, subTitle, content) {
  // 🔹 1. 오버레이 컨테이너가 없으면 생성
  let container = document.getElementById("overlay-container");
  if (!container) {
    container = document.createElement("div");
    container.id = "overlay-container";
    Object.assign(container.style, {
      position: "fixed",
      top: "20px",
      right: "5%",
      display: "flex",
      flexDirection: "column",
      gap: "20px",
      zIndex: 9999,
      maxWidth: "90%",
      alignItems: "flex-end",
    });
    document.body.appendChild(container);
  }

  // 🔹 2. 기존 오버레이 제거
  const existing = document.getElementById(id);
  if (existing) existing.remove();

  // 🔹 3. 오버레이 생성
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

  // 🔹 4. 스타일 적용
  Object.assign(overlay.style, {
    position: "relative", // 컨테이너 안에 위치
    backgroundColor: "rgba(99, 143, 255, 0.85)",
    color: "#ffffff",
    padding: "20px",
    borderRadius: "12px",
    zIndex: "1",
    maxWidth: "100%",
    width: "450px",
    fontFamily: "Segoe UI, sans-serif",
    fontSize: "13px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
    boxSizing: "border-box",
    ...(id === "trust-overlay"  ? { marginTop: "50px"} : {}),
  });

  // 🔹 5. 스타일 시트 생성
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
      #overlay-container {
        right: 2%;
        left: 2%;
        align-items: center;
      }

      #${id} {
        width: 100%;
        padding: 16px;
        font-size: 12px;
      }

      #${id} .overlay-close {
        font-size: 16px;
      }
    }
  `;

  document.head.appendChild(style);

  // 🔹 6. 오버레이 삽입
  container.appendChild(overlay);

  // 🔹 7. 드래그 기능 추가
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
    overlay.style.position = 'fixed'; // 드래그 중에는 고정 위치로 변경
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

  // 🔹 8. 닫기 버튼 동작
  overlay.querySelector(".overlay-close").addEventListener("click", () => {
    overlay.remove();
    style.remove();
  });

  return overlay;
}
