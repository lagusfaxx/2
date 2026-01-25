import fs from "fs/promises";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
const MAX_VIDEO_SIZE = 100 * 1024 * 1024;

const execFileAsync = promisify(execFile);

export type UploadedKind = "image" | "video" | "image-or-video";

export async function validateUploadedFile(file: Express.Multer.File, kind: UploadedKind) {
  const { fileTypeFromFile } = await import("file-type");
  const detected = await fileTypeFromFile(file.path);
  if (!detected) {
    await cleanupFile(file.path);
    throw new Error("INVALID_FILE_TYPE");
  }

  const isImage = detected.mime.startsWith("image/");
  const isVideo = detected.mime.startsWith("video/");
  if (kind === "image" && !isImage) {
    await cleanupFile(file.path);
    throw new Error("INVALID_FILE_TYPE");
  }
  if (kind === "video" && !isVideo) {
    await cleanupFile(file.path);
    throw new Error("INVALID_FILE_TYPE");
  }
  if (kind === "image-or-video" && !isImage && !isVideo) {
    await cleanupFile(file.path);
    throw new Error("INVALID_FILE_TYPE");
  }

  if (isImage && file.size > MAX_IMAGE_SIZE) {
    await cleanupFile(file.path);
    throw new Error("FILE_TOO_LARGE");
  }
  if (isVideo && file.size > MAX_VIDEO_SIZE) {
    await cleanupFile(file.path);
    throw new Error("FILE_TOO_LARGE");
  }

  return { type: isVideo ? "VIDEO" : "IMAGE" };
}

/**
 * iOS Safari is strict about MP4 codecs. We normalize videos to H.264 (AVC) + AAC and
 * add "faststart" so playback works reliably on mobile.
 *
 * Returns a possibly-new absolute file path (in the same directory) that should be served.
 */
export async function normalizeVideoForIOS(inputPath: string): Promise<{ outputPath: string; changed: boolean }> {
  // ffprobe codecs
  const [vCodec, aCodec] = await Promise.all([probeCodec(inputPath, "v:0"), probeCodec(inputPath, "a:0")]);

  const videoOk = vCodec === "h264";
  const audioOk = !aCodec || aCodec === "aac"; // allow silent videos

  if (videoOk && audioOk) {
    // Still ensure faststart for streaming (movflags). If you want to always faststart,
    // keep changed=false here to avoid extra CPU; most uploads are already fine.
    return { outputPath: inputPath, changed: false };
  }

  const dir = path.dirname(inputPath);
  const base = path.parse(inputPath).name;
  const outputPath = path.join(dir, `${base}-ios.mp4`);

  // Transcode to H.264/AAC with yuv420p (Safari requirement) + faststart.
  // Keep it simple for MVP; later you can add presets/CRF tuning.
  await execFileAsync(
    "ffmpeg",
    [
      "-y",
      "-i",
      inputPath,
      "-c:v",
      "libx264",
      "-profile:v",
      "main",
      "-pix_fmt",
      "yuv420p",
      "-movflags",
      "+faststart",
      "-c:a",
      "aac",
      "-b:a",
      "128k",
      outputPath
    ],
    { maxBuffer: 1024 * 1024 * 10 }
  );

  return { outputPath, changed: true };
}

async function probeCodec(filePath: string, stream: string): Promise<string | null> {
  try {
    const { stdout } = await execFileAsync(
      "ffprobe",
      [
        "-v",
        "error",
        "-select_streams",
        stream,
        "-show_entries",
        "stream=codec_name",
        "-of",
        "default=nw=1:nk=1",
        filePath
      ],
      { maxBuffer: 1024 * 1024 }
    );
    const codec = String(stdout || "").trim();
    return codec ? codec : null;
  } catch {
    return null;
  }
}

async function cleanupFile(pathname: string) {
  try {
    await fs.unlink(pathname);
  } catch {
    // ignore cleanup errors
  }
}
