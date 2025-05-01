const ytdl = require("ytdl-core");
const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");

class WhisperService {
  constructor() {
    this.audioDir = path.join(__dirname, "../audios");
    if (!fs.existsSync(this.audioDir)) {
      fs.mkdirSync(this.audioDir);
    }
  }

  // 유튜브 오디오 다운로드
  async downloadAudio(videoUrl, fileName) {
    return new Promise((resolve, reject) => {
      const audioPath = path.join(this.audioDir, `${fileName}.mp3`);
      const audioStream = ytdl(videoUrl, { filter: "audioonly" });

      audioStream.pipe(fs.createWriteStream(audioPath));

      audioStream.on("end", () => {
        resolve(audioPath);
      });

      audioStream.on("error", (err) => {
        reject(err);
      });
    });
  }

  // 오디오를 텍스트로 변환
  async transcribeAudio(audioPath) {
    return new Promise((resolve, reject) => {
      const scriptPath = path.join(__dirname, "transcribe.py");
      const command = `python "${scriptPath}" "${audioPath}"`;

      exec(command, (err, stdout, stderr) => {
        if (err) {
          console.error(stderr);
          reject(err);
        } else {
          resolve(stdout.trim());
        }
      });
    });
  }
}

module.exports = WhisperService;
