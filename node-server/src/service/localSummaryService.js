const { exec } = require("child_process");
const path = require("path");
const fs = require("fs");
require("dotenv").config();

class LocalSummaryService {
  constructor() {
    this.pythonPath = process.env.PYTHON_PATH || "/opt/homebrew/bin/python3";
    this.scriptPath = path.join(__dirname, "../python/summarize_service.py");

    if (!fs.existsSync(this.scriptPath)) {
      throw new Error(`Python 스크립트를 찾을 수 없습니다: ${this.scriptPath}`);
    }
  }

  async summarizeText(text) {
    return new Promise((resolve, reject) => {
      const command = `${this.pythonPath} "${this.scriptPath}" "${text.replace(
        /"/g,
        '\\"'
      )}"`;
      console.log("실행할 명령어:", command);

      exec(command, { encoding: "utf8" }, (err, stdout, stderr) => {
        if (err) {
          console.error("Python 실행 오류:", stderr);
          reject(err);
        } else {
          try {
            const result = JSON.parse(stdout);
            resolve(result.summary);
          } catch (parseError) {
            reject(new Error("JSON 파싱 오류: " + stdout));
          }
        }
      });
    });
  }
}

module.exports = LocalSummaryService;
