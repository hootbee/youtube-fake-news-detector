const { exec } = require("child_process");
const path = require("path");

class localSummaryService {
  constructor() {}

  async summarizeText(text) {
    return new Promise((resolve, reject) => {
      const scriptPath = path.join(__dirname, "summarize_service.py");
      const command = `python "${scriptPath}" "${text.replace(/"/g, '\\"')}"`;

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

module.exports = localSummaryService;
