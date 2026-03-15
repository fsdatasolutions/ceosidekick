import { execSync } from "child_process";

/**
 * Run an ffmpeg command. Throws on non-zero exit.
 */
export function ffmpeg(args: string[]): void {
  const cmd = `ffmpeg ${args.join(" ")}`;
  console.log(`    Running: ffmpeg ${args.slice(0, 4).join(" ")}...`);
  execSync(cmd, { encoding: "utf-8", stdio: ["pipe", "pipe", "pipe"] });
}

/**
 * Merge a Playwright WebM recording with an MP3 narration into a LinkedIn-ready MP4.
 */
export function mergeVideoAudio(
  videoPath: string,
  audioPath: string,
  outputPath: string
): void {
  ffmpeg([
    `-i "${videoPath}"`,
    `-i "${audioPath}"`,
    `-c:v libx264 -preset medium -crf 23`,
    `-c:a aac -b:a 192k`,
    `-movflags +faststart`,
    `-shortest`,
    `-y "${outputPath}"`,
  ]);
}
