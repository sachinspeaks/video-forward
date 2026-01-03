const express = require("express");
const { spawn } = require("child_process");

const app = express();

app.get("/video", (req, res) => {
  // 1. Set the correct headers for MJPEG
  res.writeHead(200, {
    "Content-Type": "multipart/x-mixed-replace; boundary=ffserver",
    "Cache-Control": "no-cache",
    Connection: "close",
    Pragma: "no-cache",
  });

  // 2. Spawn FFmpeg
  const ffmpeg = spawn("ffmpeg", [
    "-rtsp_transport",
    "tcp",
    "-flags",
    "low_delay", // Reduce internal buffering
    "-fflags",
    "nobuffer", // Drop buffering for the input
    "-probesize",
    "32", // Analyze less data before starting
    "-analyzeduration",
    "0", // Start streaming immediately
    "-i",
    "rtsp://0.0.0.0:8554/sachin",
    "-vf",
    "fps=20", // Limit FPS to reduce processing load
    "-q:v",
    "8", // Slightly lower quality (8 instead of 5) saves CPU
    "-f",
    "mpjpeg",
    "-boundary_tag",
    "ffserver",
    "-",
  ]);

  // 3. Pipe stdout directly to the response
  // This handles the chunking and boundaries automatically
  ffmpeg.stdout.pipe(res);

  // 4. Error handling
  ffmpeg.stderr.on("data", (data) => {
    // Uncomment for debugging:
    // console.log(`FFmpeg log: ${data}`);
  });

  // 5. Cleanup on user disconnect
  req.on("close", () => {
    console.log("Client disconnected, killing FFmpeg process.");
    ffmpeg.kill("SIGKILL");
  });
});

app.listen(3000, () => {
  console.log("Stream running at http://localhost:3000/video");
});
