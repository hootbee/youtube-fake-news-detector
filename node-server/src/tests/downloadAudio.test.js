const fs = require("fs");
const { downloadAudio } = require("../services/youtube/downloadMp3");

describe("유튜브 오디오 다운로드", () => {
  let audioPath;

  // 각 테스트 후 임시 파일 정리
  afterEach(() => {
    if (audioPath && fs.existsSync(audioPath)) {
      fs.unlinkSync(audioPath);
    }
  });

  it("MP3 파일이 정상적으로 다운로드되어야 함", async () => {
    const videoId = "dQw4w9WgXcQ"; // 테스트용 비디오 ID

    audioPath = await downloadAudio(videoId);

    // 파일 존재 여부 확인
    expect(fs.existsSync(audioPath)).toBe(true);

    // 파일 크기 확인 (빈 파일이 아닌지)
    const stats = fs.statSync(audioPath);
    expect(stats.size).toBeGreaterThan(0);
  }, 30000); // 30초 타임아웃
});

module.exports = {
  testEnvironment: "node",
  testTimeout: 60000,
  moduleDirectories: ["node_modules", "src"],
  roots: ["<rootDir>/srctests", "<rootDir>/src"],
  verbose: true,
  setupFiles: ["<rootDir>/.env"],
};
