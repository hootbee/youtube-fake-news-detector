// 수정된 스크립트 주입 방식
function injectScriptV3(file, tag) {
  // 1. 중복 주입 방지 체크
  if (window.trustCheckerInjected) return;
  window.trustCheckerInjected = true;

  // 2. Manifest V3 호환 방식
  chrome.scripting
    .executeScript({
      target: { tabId: chrome.devtools.inspectedWindow.tabId },
      files: [file],
    })
    .catch((error) => {
      console.error("Script injection failed:", error);
    });
}
