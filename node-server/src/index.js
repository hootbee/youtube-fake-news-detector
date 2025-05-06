// index.js
const express = require("express");
const { downloadAudio } = require("./lib/downloadAudio");
const { transcribeAudioLocal } = require("./lib/whisperLocal");
const fs = require("fs");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const analysisRouter = require("./api/routes/analysis");
app.use("/api/analysis", analysisRouter);

app.post("/api/stt", async (req, res) => {
  const { videoId } = req.body;
  if (!videoId) return res.status(400).json({ error: "videoId is required" });

  try {
    console.log(`비디오 ID로 오디오 다운로드 시작: ${videoId}`);

    const audioPath = await downloadAudio(videoId);
    console.log(`오디오 다운로드 완료: ${audioPath}`);

    console.log("음성-텍스트 변환 시작");

    const transcript = await transcribeAudioLocal(audioPath);
    console.log("음성-텍스트 변환 완료");

    // mp3 파일 삭제 (선택)
    // fs.unlink(audioPath, (err) => {
    //   if (err) console.error("파일 삭제 실패:", err);
    // });

    res.json({ transcript });
  } catch (error) {
    console.error("처리 오류:", error);
    res.status(500).json({ error: "Failed to process audio" });
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`서버 실행 중: http://localhost:${PORT}`);
});

module.exports = app;
