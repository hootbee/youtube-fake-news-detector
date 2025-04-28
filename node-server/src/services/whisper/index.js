// services/whisper/index.js
const { spawn } = require("child_process");
const axios = require("axios");
const fs = require("fs");

class WhisperService {
  async transcribeAudio(audioUrl) {
    const audioPath = await this.downloadAudio(audioUrl);
    return new Promise((resolve, reject) => {
      const pythonProcess = spawn("python", ["whisper_script.py", audioPath]);

      let result = "";
      pythonProcess.stdout.on("data", (data) => {
        result += data.toString();
      });

      pythonProcess.stderr.on("data", (data) => {
        console.error(`Whisper error: ${data}`);
      });

      pythonProcess.on("close", (code) => {
        fs.unlinkSync(audioPath);
        code === 0 ? resolve(result) : reject("Transcription failed");
      });
    });
  }

  async downloadAudio(url) {
    const response = await axios.get(url, { responseType: "arraybuffer" });
    const tempPath = `temp_${Date.now()}.webm`;
    fs.writeFileSync(tempPath, response.data);
    return tempPath;
  }
}

module.exports = WhisperService;
