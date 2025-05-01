const { exec } = require("child_process");
const path = require("path");
require("dotenv").config();

async function transcribeAudioLocal(filePath) {
  const pythonScript = path.join(__dirname, "../python/transcribe.py");
  const pythonPath = process.env.PYTHON_PATH || "python"; // 기본값을 python으로 설정

  console.log("Python 경로:", pythonPath);
  console.log("스크립트 경로:", pythonScript);
  console.log("오디오 파일 경로:", filePath);

  return new Promise((resolve, reject) => {
    exec(
      `${pythonPath} ${pythonScript} "${filePath}"`,
      (error, stdout, stderr) => {
        if (error) {
          console.error("Whisper 실행 오류:", stderr);
          return reject(error);
        }
        resolve(stdout.trim());
      }
    );
  });
}

module.exports = { transcribeAudioLocal };
