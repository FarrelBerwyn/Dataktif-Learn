import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { execFileSync } from 'child_process';

const THUMBNAILS_DIR = path.join(process.cwd(), '.data', 'thumbnails');

// Ensure thumbnails directory exists
if (!fs.existsSync(THUMBNAILS_DIR)) {
  try {
    fs.mkdirSync(THUMBNAILS_DIR, { recursive: true });
  } catch (err) {
    console.error('Failed to create thumbnails directory:', err);
  }
}

/**
 * Generate a deterministic hash for a video file path
 */
export function getThumbnailHash(videoAbsPath: string): string {
  return crypto.createHash('md5').update(path.normalize(videoAbsPath).toLowerCase()).digest('hex');
}

/**
 * Check if a thumbnail already exists on disk for a given video
 */
export function hasThumbnail(videoAbsPath: string): boolean {
  const hash = getThumbnailHash(videoAbsPath);
  const targetFile = path.join(THUMBNAILS_DIR, `${hash}.jpg`);
  return fs.existsSync(targetFile);
}

/**
 * Extract a high-quality 16:9 thumbnail from a video file using ffmpeg
 */
export function extractVideoThumbnail(videoAbsPath: string): string | null {
  try {
    if (!fs.existsSync(videoAbsPath)) {
      return null;
    }

    const hash = getThumbnailHash(videoAbsPath);
    const targetFile = path.join(THUMBNAILS_DIR, `${hash}.jpg`);

    // Return existing thumbnail if already generated
    if (fs.existsSync(targetFile)) {
      return `/api/thumbnails/generated/${hash}.jpg`;
    }

    // Try extracting frame at 3 seconds, or 1 second if video is short
    const seekTimes = ['00:00:03', '00:00:01', '00:00:00.5'];
    let success = false;

    for (const ss of seekTimes) {
      try {
        execFileSync(
          'ffmpeg',
          [
            '-y',
            '-ss',
            ss,
            '-i',
            videoAbsPath,
            '-vframes',
            '1',
            '-vf',
            'scale=854:480:force_original_aspect_ratio=increase,crop=854:480',
            '-q:v',
            '3',
            targetFile,
          ],
          {
            stdio: 'ignore',
            timeout: 8000,
            windowsHide: true,
          }
        );

        if (fs.existsSync(targetFile) && fs.statSync(targetFile).size > 0) {
          success = true;
          break;
        }
      } catch {
        // Continue to next seek time if this one fails
      }
    }

    if (success) {
      return `/api/thumbnails/generated/${hash}.jpg`;
    }
  } catch (err) {
    console.warn(`[thumbnailGenerator] Error generating thumbnail for ${videoAbsPath}:`, err);
  }

  return null;
}

/**
 * Get the path on disk for a generated thumbnail hash
 */
export function getThumbnailFilePath(hash: string): string | null {
  const safeHash = hash.replace(/[^a-zA-Z0-9_-]/g, '');
  const targetPath = path.join(THUMBNAILS_DIR, `${safeHash}.jpg`);
  if (fs.existsSync(targetPath)) {
    return targetPath;
  }
  return null;
}
