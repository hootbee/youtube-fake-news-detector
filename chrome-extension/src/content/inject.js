function injectScript(file, tag) {
  // 1. HTML 문서에서 지정된 태그(예: 'body')의 첫 번째 요소를 찾음
  const node = document.getElementsByTagName(tag)[0];

  // 2. 새로운 script 요소 생성
  const script = document.createElement("script");

  // 3. Chrome 확장 프로그램 내의 파일 URL을 가져와서 script의 src 속성에 설정
  script.src = chrome.runtime.getURL(file);

  // 4. 찾은 태그에 새로 생성한 script 요소를 추가
  node.appendChild(script);
}
