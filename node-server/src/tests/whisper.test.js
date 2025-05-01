const fs = require("fs");
const path = require("path");
const { transcribeAudioLocal } = require("../lib/whisperLocal");

describe("Whisper 음성-텍스트 변환 테스트", () => {
  const testAudioPath = path.join(__dirname, "../uploads/test_audio.mp3");
  const outputPath = path.join(__dirname, "../uploads/transcript.txt");

  it("MP3 파일을 텍스트로 변환하고 파일로 저장", async () => {
    try {
      // 음성-텍스트 변환 실행
      const transcript = await transcribeAudioLocal(testAudioPath);

      // 결과를 파일로 저장
      fs.writeFileSync(outputPath, transcript, "utf8");

      // 파일이 생성되었는지 확인
      expect(fs.existsSync(outputPath)).toBe(true);

      // 변환된 텍스트가 비어있지 않은지 확인
      const savedTranscript = fs.readFileSync(outputPath, "utf8");
      expect(savedTranscript).toBeTruthy();

      console.log("변환된 텍스트:", savedTranscript);
    } catch (error) {
      console.error("테스트 실패:", error);
      throw error;
    }
  }, 60000); // 1분 타임아웃
});
