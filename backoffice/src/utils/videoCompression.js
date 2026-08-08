/**
 * Compress a video in the browser by re-encoding through a scaled canvas
 * + MediaRecorder. Falls back to the original file if compression isn't
 * supported or doesn't shrink the result.
 */
export function compressVideoToBlob(
  file,
  {
    maxWidth = 1280,
    maxHeight = 720,
    videoBitsPerSecond = 1_800_000,
    maxSizeMB = 25,
    frameRate = 30,
    onProgress,
  } = {},
) {
  return new Promise((resolve, reject) => {
    if (typeof MediaRecorder === "undefined") {
      reject(new Error("Video compression is not supported in this browser"));
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.muted = true;
    video.playsInline = true;
    video.preload = "auto";
    video.src = objectUrl;

    let settled = false;
    const cleanup = () => {
      URL.revokeObjectURL(objectUrl);
      video.removeAttribute("src");
      video.load();
    };

    const fail = (err) => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(err instanceof Error ? err : new Error(String(err)));
    };

    const succeed = (blob) => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve(blob);
    };

    video.onerror = () => fail(new Error("Failed to load video"));

    video.onloadedmetadata = async () => {
      try {
        const srcW = video.videoWidth || maxWidth;
        const srcH = video.videoHeight || maxHeight;
        const scale = Math.min(1, maxWidth / srcW, maxHeight / srcH);
        const width = Math.max(2, Math.round((srcW * scale) / 2) * 2);
        const height = Math.max(2, Math.round((srcH * scale) / 2) * 2);

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          fail(new Error("Canvas is not available"));
          return;
        }

        const canvasStream = canvas.captureStream(frameRate);
        let audioTracks = [];
        try {
          const mediaStream =
            typeof video.captureStream === "function"
              ? video.captureStream()
              : typeof video.mozCaptureStream === "function"
                ? video.mozCaptureStream()
                : null;
          if (mediaStream) {
            audioTracks = mediaStream.getAudioTracks();
          }
        } catch {
          /* audio optional */
        }

        const tracks = [
          ...canvasStream.getVideoTracks(),
          ...audioTracks.map((t) => t.clone()),
        ];
        const combined = new MediaStream(tracks);

        const mimeType = pickMimeType();
        const recorder = new MediaRecorder(combined, {
          mimeType,
          videoBitsPerSecond,
        });

        const chunks = [];
        recorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) chunks.push(e.data);
        };

        recorder.onerror = () => fail(new Error("Video recording failed"));

        recorder.onstop = () => {
          tracks.forEach((t) => t.stop());
          const blob = new Blob(chunks, { type: mimeType });
          const maxBytes = maxSizeMB * 1024 * 1024;

          // Prefer compressed result only when it actually helps (or fits budget).
          if (blob.size > 0 && (blob.size < file.size || blob.size <= maxBytes)) {
            succeed(blob);
          } else if (file.size <= maxBytes) {
            succeed(file);
          } else if (blob.size > 0 && blob.size < file.size) {
            succeed(blob);
          } else {
            fail(new Error("Compressed video is still too large"));
          }
        };

        const duration = Number.isFinite(video.duration) ? video.duration : 0;
        const draw = () => {
          if (settled) return;
          ctx.drawImage(video, 0, 0, width, height);
          if (onProgress && duration > 0) {
            onProgress(Math.min(0.99, video.currentTime / duration));
          }
          if (!video.paused && !video.ended) {
            requestAnimationFrame(draw);
          }
        };

        video.onplay = () => {
          if (recorder.state === "inactive") recorder.start(200);
          requestAnimationFrame(draw);
        };

        video.onended = () => {
          if (onProgress) onProgress(1);
          if (recorder.state !== "inactive") recorder.stop();
          else fail(new Error("Recorder never started"));
        };

        try {
          await video.play();
        } catch (err) {
          fail(err);
        }
      } catch (err) {
        fail(err);
      }
    };
  });
}

function pickMimeType() {
  const candidates = [
    "video/webm;codecs=vp9,opus",
    "video/webm;codecs=vp8,opus",
    "video/webm",
    "video/mp4",
  ];
  for (const type of candidates) {
    if (MediaRecorder.isTypeSupported?.(type)) return type;
  }
  return "video/webm";
}

export function videoExtensionForMime(mime = "") {
  if (mime.includes("mp4")) return ".mp4";
  return ".webm";
}
