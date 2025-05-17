const path = require("path");
const fs = require("fs");
const { exec } = require("child_process");
const YTDlpWrap = require("yt-dlp-wrap").default;
require("dotenv").config();

class WhisperService {
  constructor() {
    this.ytdlp = new YTDlpWrap(process.env.YTDLP_PATH);
  }

  // YouTube 오디오 다운로드 → storage/audio 폴더로 저장
  async downloadAudio(videoId) {
    const storageDir = path.join(__dirname, "../storage/audio");

    // storage/audio 디렉터리 없으면 생성
    if (!fs.existsSync(storageDir)) {
      fs.mkdirSync(storageDir, { recursive: true });
    }

    const fileName = `audio-${videoId}-${Date.now()}.mp3`;
    const outputPath = path.join(storageDir, fileName);
    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;

    return new Promise((resolve, reject) => {
      const process = this.ytdlp.exec([
        videoUrl,
        "-f",
        "bestaudio[ext=m4a]/bestaudio",
        "-x",
        "--audio-format",
        "mp3",
        "-o",
        outputPath,
        "--no-playlist",
        "--quiet",
      ]);

      process.on("close", (code) => {
        if (code === 0 && fs.existsSync(outputPath)) {
          resolve(outputPath);
        } else {
          reject(new Error("\n🔇 오디오 다운로드 실패"));
        }
      });

      process.on("error", (err) => reject(err));
    });
  }

  // 오디오 → 텍스트 변환 (Whisper)
  async transcribeAudio(audioPath) {
    return new Promise((resolve, reject) => {
      const scriptPath = path.join(__dirname, "../python/transcribe.py");
      const pythonPath = process.env.PYTHON_PATH;
      const command = `${pythonPath} "${scriptPath}" "${audioPath}"`;

      exec(command, (err, stdout, stderr) => {
        if (err) {
          console.error(stderr);
          reject(err);
        } else {
          console.log("\n📄 텍스트 변환 완료:\n", stdout.trim());

          // 오디오 파일 삭제
          fs.unlink(audioPath, (unlinkErr) => {
            if (unlinkErr) {
              console.error("\n❌ 오디오 파일 삭제 실패:", unlinkErr);
            } else {
              console.log("\n⭕ 오디오 파일 삭제 완료:", audioPath);
            }
          });

          resolve(stdout.trim());
        }
      });
    });
  }
}

module.exports = WhisperService;
