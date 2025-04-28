const { spawn } = require("child_process");

class WhisperService {
  async transcribeAudio(audioUrl) {
    return new Promise((resolve, reject) => {
      const pythonProcess = spawn("python", ["whisper_handler.py", audioUrl]);

      let result = "";
      pythonProcess.stdout.on("data", (data) => {
        result += data.toString();
      });

      pythonProcess.stderr.on("data", (data) => {
        console.error(`Whisper error: ${data}`);
      });

      pythonProcess.on("close", (code) => {
        code === 0 ? resolve(result) : reject("Transcription failed");
      });
    });
  }
}
