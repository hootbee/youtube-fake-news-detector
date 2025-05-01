// lib/downloadAudio.js
const YTDlpWrap = require("yt-dlp-wrap").default;
const path = require("path");
const os = require("os");
const fs = require("fs");
require("dotenv").config();

const ytdlp = new YTDlpWrap(process.env.YTDLP_PATH);

async function downloadAudio(videoId) {
  const tmpPath = path.join(
    os.tmpdir(),
    `yt-audio-${videoId}-${Date.now()}.mp3`
  );
  const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;

  return new Promise((resolve, reject) => {
    const process = ytdlp.exec([
      videoUrl,
      "-f",
      "bestaudio[ext=m4a]/bestaudio",
      "-x",
      "--audio-format",
      "mp3",
      "-o",
      tmpPath,
      "--no-playlist",
      "--quiet",
    ]);

    process.on("close", (code) => {
      if (code === 0 && fs.existsSync(tmpPath)) {
        resolve(tmpPath);
      } else {
        reject(new Error("오디오 다운로드 실패"));
      }
    });

    process.on("error", (err) => reject(err));
  });
}

module.exports = { downloadAudio };
