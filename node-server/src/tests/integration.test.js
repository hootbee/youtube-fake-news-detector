const fs = require("fs");
const path = require("path");
const { downloadAudio } = require("../lib/downloadAudio");
const { transcribeAudioLocal } = require("../lib/whisperLocal");

describe("유튜브 동영상 다운로드 및 음성-텍스트 변환 통합 테스트", () => {
  let audioPath;
  let transcriptPath;

  // 각 테스트 후 임시 파일 정리
  afterEach(() => {
    // 오디오 파일 정리
    if (audioPath && fs.existsSync(audioPath)) {
      fs.unlinkSync(audioPath);
      console.log("오디오 파일 삭제 완료:", audioPath);
    }

    // 텍스트 파일 정리
    if (transcriptPath && fs.existsSync(transcriptPath)) {
      fs.unlinkSync(transcriptPath);
      console.log("텍스트 파일 삭제 완료:", transcriptPath);
    }
  });

  it("동영상 다운로드부터 텍스트 변환까지 전체 과정이 정상 동작해야 함", async () => {
    try {
      // 1. 유튜브 동영상 다운로드
      console.log("1. 유튜브 동영상 다운로드 시작");
      const videoId = "dQw4w9WgXcQ"; // 테스트용 짧은 동영상 ID 사용
      audioPath = await downloadAudio(videoId);

      // 다운로드 결과 확인
      expect(fs.existsSync(audioPath)).toBe(true);
      const audioStats = fs.statSync(audioPath);
      expect(audioStats.size).toBeGreaterThan(0);
      console.log("다운로드 완료. 파일 크기:", audioStats.size, "bytes");

      // 2. Whisper로 음성-텍스트 변환
      console.log("2. 음성-텍스트 변환 시작");
      const transcript = await transcribeAudioLocal(audioPath);
      expect(transcript).toBeTruthy();

      // 3. 변환 결과 저장
      transcriptPath = path.join(__dirname, "../uploads/transcript.txt");
      fs.writeFileSync(transcriptPath, transcript, "utf8");

      // 저장된 텍스트 확인
      const savedTranscript = fs.readFileSync(transcriptPath, "utf8");
      expect(savedTranscript).toBeTruthy();
      console.log("변환된 텍스트:", savedTranscript);
    } catch (error) {
      console.error("통합 테스트 실패:", error);
      throw error;
    }
  }, 120000); // 2분 타임아웃 설정
});
