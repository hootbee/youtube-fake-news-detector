// overlayButton.js

function insertOverlayTriggerButton(onClickCallback) {
  const existingBtn = document.getElementById("trust-checker-btn");
  if (existingBtn) return;

  const btn = document.createElement("button");
  btn.id = "trust-checker-btn";
  btn.innerText = "신뢰도 확인 🔎";
  Object.assign(btn.style, {
    position: "fixed",
    top: "20px",
    right: "20px",
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
}
