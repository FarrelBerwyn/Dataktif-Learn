import fs from 'fs';
import path from 'path';
import { Course, Lesson, SubCourse, ParsedYouTubeChapter, ParsedYouTubeVideoCourse } from '../src/types';

const DATA_DIR = path.join(process.cwd(), '.data');
const YOUTUBE_COURSES_FILE = path.join(DATA_DIR, 'youtube_courses.json');

function ensureDataDir(): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  } catch (err) {
    console.error('Error creating .data dir:', err);
  }
}

/**
 * Extract YouTube Video ID from a URL or raw ID string.
 */
export function extractVideoId(input: string): string | null {
  if (!input || typeof input !== 'string') return null;
  const trimmed = input.trim();

  // If it's already a raw 11-char video ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  try {
    const url = new URL(trimmed.startsWith('http') ? trimmed : `https://${trimmed}`);
    const vParam = url.searchParams.get('v');
    if (vParam && /^[a-zA-Z0-9_-]{11}$/.test(vParam)) return vParam;

    const pathParts = url.pathname.split('/').filter(Boolean);
    if (url.hostname.includes('youtu.be') && pathParts[0]) {
      const id = pathParts[0].substring(0, 11);
      if (/^[a-zA-Z0-9_-]{11}$/.test(id)) return id;
    }
    const embedIdx = pathParts.findIndex((p) => p === 'embed' || p === 'v' || p === 'shorts');
    if (embedIdx !== -1 && pathParts[embedIdx + 1]) {
      const id = pathParts[embedIdx + 1].substring(0, 11);
      if (/^[a-zA-Z0-9_-]{11}$/.test(id)) return id;
    }
  } catch {}

  const match = trimmed.match(/(?:youtu\.be\/|watch\?v=|\/embed\/|\/v\/|\/shorts\/)([a-zA-Z0-9_-]{11})/);
  if (match) return match[1];

  return null;
}

/**
 * Extract YouTube Playlist ID from a URL or raw ID string.
 */
export function extractPlaylistId(input: string): string | null {
  if (!input || typeof input !== 'string') return null;
  const trimmed = input.trim();

  // If it's already a raw playlist ID (starts with PL, UU, FL, RD, etc.)
  if (/^[a-zA-Z0-9_-]{12,}$/.test(trimmed)) {
    return trimmed;
  }

  try {
    const url = new URL(trimmed.startsWith('http') ? trimmed : `https://${trimmed}`);
    const listParam = url.searchParams.get('list');
    if (listParam) return listParam;

    // e.g. /playlist?list=PLxxx
    const match = trimmed.match(/[?&]list=([a-zA-Z0-9_-]+)/);
    if (match) return match[1];
  } catch {
    const match = trimmed.match(/[?&]list=([a-zA-Z0-9_-]+)/);
    if (match) return match[1];
  }

  return null;
}

/**
 * Parse human duration string into seconds (e.g. "12:34", "1:05:20", or "12 minutes, 30 seconds").
 */
function parseDuration(durationStr?: string): number {
  if (!durationStr) return 600; // default 10m fallback
  const trimmed = durationStr.trim();

  // Format "MM:SS" or "HH:MM:SS"
  if (/^\d+(:\d+)+$/.test(trimmed)) {
    const parts = trimmed.split(':').map((p) => parseInt(p, 10) || 0);
    if (parts.length === 2) {
      return parts[0] * 60 + parts[1];
    } else if (parts.length === 3) {
      return parts[0] * 3600 + parts[1] * 60 + parts[2];
    }
  }

  // Format "X hours, Y minutes, Z seconds"
  let totalSec = 0;
  const h = trimmed.match(/(\d+)\s*(?:hours|hour|jam)/i);
  const m = trimmed.match(/(\d+)\s*(?:minutes|minute|mins|min|menit)/i);
  const s = trimmed.match(/(\d+)\s*(?:seconds|second|secs|sec|detik)/i);

  if (h) totalSec += parseInt(h[1], 10) * 3600;
  if (m) totalSec += parseInt(m[1], 10) * 60;
  if (s) totalSec += parseInt(s[1], 10);

  return totalSec > 0 ? totalSec : 600;
}

function formatSecondsToHuman(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);

  if (h > 0) {
    return `${h}h ${m}m`;
  }
  return `${m}m ${s}s`;
}

function formatSecondsToTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) {
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export interface ParsedYouTubeVideo {
  videoId: string;
  title: string;
  duration: number;
  durationFormatted: string;
  thumbnail: string;
}

export interface ParsedYouTubePlaylist {
  playlistId: string;
  title: string;
  description: string;
  instructor: string;
  thumbnail: string;
  videos: ParsedYouTubeVideo[];
  totalDuration: number;
  totalDurationFormatted: string;
}

/**
 * Fetch and extract metadata & videos from a public YouTube playlist.
 */
export async function fetchYouTubePlaylistMetadata(
  playlistUrlOrId: string
): Promise<ParsedYouTubePlaylist> {
  const playlistId = extractPlaylistId(playlistUrlOrId);
  if (!playlistId) {
    throw new Error('Link atau ID playlist YouTube tidak valid.');
  }

  const url = `https://www.youtube.com/playlist?list=${playlistId}`;
  const response = await fetch(url, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      'Accept-Language': 'en-US,en;q=0.9,id;q=0.8',
      Cookie: 'CONSENT=YES+cb; SOCS=CAESEwgDEgk2OTU4NzAwNDQaAmVuIAEaBgiA_LyaBg',
    },
  });

  if (!response.ok) {
    throw new Error(`Gagal memuat halaman YouTube (HTTP ${response.status})`);
  }

  const html = await response.text();

  // Check if YouTube returned playlist not found alert
  if (html.includes('Playlist does not exist') || html.includes('Playlist tidak ada')) {
    throw new Error('Playlist YouTube tidak ditemukan atau bersifat pribadi (Private).');
  }

  let playlistTitle = '';
  let description = '';
  let instructor = 'YouTube Creator';
  let playlistThumbnail = '';
  const parsedVideos: ParsedYouTubeVideo[] = [];

  // 1. Extract ytInitialData
  const idx = html.indexOf('ytInitialData = ');
  if (idx !== -1) {
    try {
      const start = idx + 'ytInitialData = '.length;
      let depth = 0;
      let end = start;
      for (let i = start; i < html.length; i++) {
        if (html[i] === '{') depth++;
        else if (html[i] === '}') {
          depth--;
          if (depth === 0) {
            end = i + 1;
            break;
          }
        }
      }

      const data = JSON.parse(html.slice(start, end));

      // Title & metadata
      const meta = data.metadata?.playlistMetadataRenderer;
      const header = data.header?.playlistHeaderRenderer;
      playlistTitle =
        header?.title?.simpleText ||
        meta?.title ||
        header?.title?.runs?.[0]?.text ||
        '';

      description =
        meta?.description ||
        header?.descriptionText?.simpleText ||
        header?.descriptionText?.runs?.map((r: any) => r.text).join('') ||
        '';

      instructor =
        header?.ownerText?.runs?.[0]?.text ||
        header?.ownerText?.simpleText ||
        'YouTube Creator';

      // Traverse contents for video items (supports both lockupViewModel and playlistVideoRenderer)
      const tabs = data.contents?.twoColumnBrowseResultsRenderer?.tabs;
      const sectionContents =
        tabs?.[0]?.tabRenderer?.content?.sectionListRenderer?.contents?.[0]?.itemSectionRenderer
          ?.contents || [];

      // Look for lockupViewModel
      for (const item of sectionContents) {
        if (item.lockupViewModel) {
          const lvm = item.lockupViewModel;
          const vId = lvm.contentId;
          const vTitle =
            lvm.metadata?.lockupMetadataViewModel?.title?.content ||
            lvm.metadata?.lockupMetadataViewModel?.title?.runs?.[0]?.text ||
            'Materi Video';

          // Extract duration label from overlays
          let durationSec = 600;
          let durText = '10:00';
          const overlays = lvm.contentImage?.thumbnailViewModel?.overlays || [];
          for (const ov of overlays) {
            const timeStatus =
              ov.thumbnailOverlayTimeStatusRenderer?.text?.simpleText ||
              ov.thumbnailOverlayBadgeViewModel?.thumbnailBadges?.[0]?.thumbnailBadgeViewModel
                ?.text;
            const a11y =
              ov.thumbnailOverlayTimeStatusRenderer?.rendererContext?.accessibilityContext
                ?.label;

            if (timeStatus) {
              durText = timeStatus;
              durationSec = parseDuration(timeStatus);
              break;
            } else if (a11y) {
              durationSec = parseDuration(a11y);
              durText = formatSecondsToTime(durationSec);
              break;
            }
          }

          const thumb =
            lvm.contentImage?.thumbnailViewModel?.image?.sources?.slice(-1)?.[0]?.url ||
            `https://i.ytimg.com/vi/${vId}/hqdefault.jpg`;

          if (vId && !parsedVideos.some((pv) => pv.videoId === vId)) {
            parsedVideos.push({
              videoId: vId,
              title: vTitle,
              duration: durationSec,
              durationFormatted: durText,
              thumbnail: thumb,
            });
          }
        } else if (item.playlistVideoRenderer) {
          const pvr = item.playlistVideoRenderer;
          const vId = pvr.videoId;
          const vTitle = pvr.title?.runs?.[0]?.text || pvr.title?.simpleText || 'Materi Video';
          const durationSec = pvr.lengthSeconds ? parseInt(pvr.lengthSeconds, 10) : 600;
          const durText = pvr.lengthText?.simpleText || formatSecondsToTime(durationSec);
          const thumb =
            pvr.thumbnail?.thumbnails?.slice(-1)?.[0]?.url ||
            `https://i.ytimg.com/vi/${vId}/hqdefault.jpg`;

          if (vId && !parsedVideos.some((pv) => pv.videoId === vId)) {
            parsedVideos.push({
              videoId: vId,
              title: vTitle,
              duration: durationSec,
              durationFormatted: durText,
              thumbnail: thumb,
            });
          }
        }
      }

      // Also check if playlistVideoListRenderer exists inside sectionContents
      if (parsedVideos.length === 0) {
        for (const item of sectionContents) {
          const pvl = item.playlistVideoListRenderer?.contents;
          if (Array.isArray(pvl)) {
            for (const v of pvl) {
              const pvr = v.playlistVideoRenderer;
              if (pvr && pvr.videoId) {
                const durationSec = pvr.lengthSeconds ? parseInt(pvr.lengthSeconds, 10) : 600;
                parsedVideos.push({
                  videoId: pvr.videoId,
                  title: pvr.title?.runs?.[0]?.text || 'Materi Video',
                  duration: durationSec,
                  durationFormatted: pvr.lengthText?.simpleText || formatSecondsToTime(durationSec),
                  thumbnail:
                    pvr.thumbnail?.thumbnails?.slice(-1)?.[0]?.url ||
                    `https://i.ytimg.com/vi/${pvr.videoId}/hqdefault.jpg`,
                });
              }
            }
          }
        }
      }
    } catch (e) {
      console.warn('Could not parse ytInitialData JSON:', e);
    }
  }

  // Fallback 1: Extract title from HTML title tag
  if (!playlistTitle) {
    const titleTagMatch = html.match(/<title>(.*?)<\/title>/);
    if (titleTagMatch && titleTagMatch[1]) {
      playlistTitle = titleTagMatch[1].replace(/\s*-\s*YouTube\s*$/, '').trim();
    }
  }

  // Fallback 2: Regex extraction of video IDs if JSON parsing was empty
  if (parsedVideos.length === 0) {
    const videoRegex = /"videoId":"([a-zA-Z0-9_-]{11})"/g;
    const foundIds: string[] = [];
    let match;
    while ((match = videoRegex.exec(html)) !== null) {
      const vId = match[1];
      if (!foundIds.includes(vId) && vId !== playlistId) {
        foundIds.push(vId);
      }
    }

    foundIds.forEach((vId, idx) => {
      parsedVideos.push({
        videoId: vId,
        title: `Materi Pelajaran ${idx + 1}`,
        duration: 600,
        durationFormatted: '10:00',
        thumbnail: `https://i.ytimg.com/vi/${vId}/hqdefault.jpg`,
      });
    });
  }

  if (parsedVideos.length === 0) {
    throw new Error('Tidak ditemukan materi video pada playlist YouTube ini.');
  }

  // Set best thumbnail
  playlistThumbnail =
    parsedVideos[0]?.thumbnail || `https://i.ytimg.com/vi/${parsedVideos[0]?.videoId}/hqdefault.jpg`;

  const totalDuration = parsedVideos.reduce((acc, v) => acc + v.duration, 0);

  return {
    playlistId,
    title: playlistTitle || 'YouTube Course',
    description: description || `Kumpulan ${parsedVideos.length} materi video pembelajaran dari YouTube.`,
    instructor: instructor || 'YouTube Channel',
    thumbnail: playlistThumbnail,
    videos: parsedVideos,
    totalDuration,
    totalDurationFormatted: formatSecondsToHuman(totalDuration),
  };
}

/**
 * Convert parsed YouTube playlist into a Dataktif Learn Course object.
 */
export function convertPlaylistToCourse(
  playlist: ParsedYouTubePlaylist,
  customCategory = 'Technology & Engineering',
  customLevel: 'Beginner' | 'Intermediate' | 'Advanced' | 'All Levels' = 'All Levels'
): Course {
  const courseId = `yt-${playlist.playlistId}`;

  const lessons: Lesson[] = playlist.videos.map((vid, index) => ({
    id: `yt-lesson-${vid.videoId}`,
    order: index + 1,
    globalIndex: index + 1,
    title: vid.title,
    filename: `${vid.videoId}.mp4`,
    path: `https://www.youtube.com/watch?v=${vid.videoId}`,
    relativePath: `youtube/${vid.videoId}`,
    url: `https://www.youtube.com/watch?v=${vid.videoId}`,
    duration: vid.duration,
    durationFormatted: vid.durationFormatted,
    size: 0,
    sizeFormatted: 'Online Stream',
    courseId,
    courseName: playlist.title,
    subCourseId: `${courseId}-mod-1`,
    subCourseName: 'Materi Pembelajaran',
    description: `Materi pembelajaran video ke-${index + 1} dari playlist YouTube ${playlist.title}`,
    thumbnail: vid.thumbnail,
    previousLessonId: index > 0 ? `yt-lesson-${playlist.videos[index - 1].videoId}` : null,
    nextLessonId:
      index < playlist.videos.length - 1
        ? `yt-lesson-${playlist.videos[index + 1].videoId}`
        : null,
    isFirstLesson: index === 0,
    isLastLesson: index === playlist.videos.length - 1,
    source: 'youtube',
    youtubeVideoId: vid.videoId,
    libraryId: 'lib-youtube',
    libraryName: 'YouTube Online Courses',
  }));

  const subCourse: SubCourse = {
    id: `${courseId}-mod-1`,
    name: 'Materi Pembelajaran',
    order: 1,
    path: `youtube/${playlist.playlistId}`,
    courseId,
    lessonCount: lessons.length,
    totalDuration: playlist.totalDuration,
    totalDurationFormatted: playlist.totalDurationFormatted,
    lessons,
  };

  return {
    id: courseId,
    name: playlist.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    title: playlist.title,
    instructor: playlist.instructor,
    category: customCategory,
    level: customLevel,
    description: playlist.description,
    path: `https://www.youtube.com/playlist?list=${playlist.playlistId}`,
    thumbnail: playlist.thumbnail,
    subCourseCount: 1,
    lessonCount: lessons.length,
    totalDuration: playlist.totalDuration,
    totalDurationFormatted: playlist.totalDurationFormatted,
    totalSize: 0,
    totalSizeFormatted: 'Online Stream',
    subCourses: [subCourse],
    tags: ['YouTube', 'Online Course', customCategory],
    featured: true,
    rating: 4.9,
    updatedAt: new Date().toISOString(),
    libraryId: 'lib-youtube',
    libraryName: 'YouTube Online Courses',
    source: 'youtube',
    playlistUrl: `https://www.youtube.com/playlist?list=${playlist.playlistId}`,
    youtubePlaylistId: playlist.playlistId,
  };
}

/**
 * Parse chapters / sub-courses from YouTube video description or custom text.
 */
export function parseChaptersFromDescription(
  text: string,
  totalDuration: number = 0
): ParsedYouTubeChapter[] {
  if (!text) return [];
  const lines = text.split(/\r?\n/);
  const rawChapters: { time: number; title: string }[] = [];

  // Matches timestamps like 00:00, 0:00, 00:00:00, 01:17:48 at start or in brackets/parentheses
  // Format A: "00:17:48 AI and ML Fundamentals" or "00:00 - Intro" or "[00:15] Tools"
  const pattern1 = /(?:^|\s)(?:\[|\()?(?:(\d{1,2}):)?(\d{1,2}):(\d{2})(?:\]|\))?\s*[-–—:\s]*\s*(.+)$/;
  // Format B: "AI and ML Fundamentals 00:17:48" or "Intro - [00:00]"
  const pattern2 = /^(.+?)\s*[-–—:\s]*\s*(?:\[|\()?(?:(\d{1,2}):)?(\d{1,2}):(\d{2})(?:\]|\))?$/;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    let match = trimmed.match(pattern1);
    if (match) {
      const h = match[1] ? parseInt(match[1], 10) : 0;
      const m = parseInt(match[2], 10);
      const s = parseInt(match[3], 10);
      const title = match[4].replace(/^[-–—:\s]+/, '').trim();
      const timeInSec = h * 3600 + m * 60 + s;
      if (title.length > 0 && !title.toLowerCase().startsWith('http')) {
        rawChapters.push({ time: timeInSec, title });
        continue;
      }
    }

    match = trimmed.match(pattern2);
    if (match) {
      const title = match[1].replace(/[-–—:\s]+$/, '').trim();
      const h = match[2] ? parseInt(match[2], 10) : 0;
      const m = parseInt(match[3], 10);
      const s = parseInt(match[4], 10);
      const timeInSec = h * 3600 + m * 60 + s;
      if (title.length > 0 && !title.toLowerCase().startsWith('http')) {
        rawChapters.push({ time: timeInSec, title });
      }
    }
  }

  // Sort by time
  rawChapters.sort((a, b) => a.time - b.time);

  // Deduplicate identical times (keep first)
  const deduped: { time: number; title: string }[] = [];
  for (const c of rawChapters) {
    if (deduped.length === 0 || deduped[deduped.length - 1].time !== c.time) {
      deduped.push(c);
    }
  }

  if (deduped.length === 0) return [];

  return deduped.map((c, idx) => {
    const next = deduped[idx + 1];
    const endTime = next ? next.time : (totalDuration > c.time ? totalDuration : c.time + 600);
    const duration = Math.max(1, endTime - c.time);
    return {
      title: c.title,
      startTime: c.time,
      endTime,
      startTimeFormatted: formatSecondsToTime(c.time),
      endTimeFormatted: formatSecondsToTime(endTime),
      duration,
      durationFormatted: formatSecondsToTime(duration),
    };
  });
}

/**
 * Fetch and extract metadata & chapters from a single YouTube video.
 */
export async function fetchYouTubeVideoWithChapters(
  videoUrlOrId: string,
  customChaptersText?: string
): Promise<ParsedYouTubeVideoCourse> {
  const videoId = extractVideoId(videoUrlOrId);
  if (!videoId) {
    throw new Error('Link atau ID video YouTube tidak valid.');
  }

  const url = `https://www.youtube.com/watch?v=${videoId}`;
  const response = await fetch(url, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
    },
  });

  if (!response.ok) {
    throw new Error(`Gagal memuat halaman YouTube (HTTP ${response.status})`);
  }

  const html = await response.text();

  let title = '';
  let author = 'YouTube Creator';
  let description = '';
  let totalDuration = 600;
  let thumbnail = `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`;
  const markersList: { time: number; title: string; thumbnail?: string }[] = [];

  // 1. Extract ytInitialPlayerResponse
  const pIdx = html.indexOf('ytInitialPlayerResponse = ');
  if (pIdx !== -1) {
    try {
      const start = pIdx + 'ytInitialPlayerResponse = '.length;
      let depth = 0;
      let end = start;
      for (let i = start; i < html.length; i++) {
        if (html[i] === '{') depth++;
        else if (html[i] === '}') {
          depth--;
          if (depth === 0) {
            end = i + 1;
            break;
          }
        }
      }
      const playerResponse = JSON.parse(html.slice(start, end));

      // Check playability
      const playStatus = playerResponse.playabilityStatus?.status;
      if (playStatus && (playStatus === 'ERROR' || playStatus === 'UNPLAYABLE')) {
        const reason = playerResponse.playabilityStatus?.reason || 'Video YouTube tidak dapat diputar atau bersifat pribadi.';
        throw new Error(reason);
      }

      const vd = playerResponse.videoDetails;
      if (vd) {
        title = vd.title || title;
        author = vd.author || author;
        description = vd.shortDescription || description;
        if (vd.lengthSeconds) {
          totalDuration = parseInt(vd.lengthSeconds, 10) || totalDuration;
        }
        if (vd.thumbnail?.thumbnails?.length) {
          thumbnail = vd.thumbnail.thumbnails.slice(-1)[0].url;
        }
      }
    } catch (e: any) {
      if (e.message?.includes('Video YouTube tidak dapat diputar')) throw e;
      console.warn('Could not parse ytInitialPlayerResponse JSON:', e);
    }
  }

  // 2. Extract ytInitialData for macroMarkersListItemRenderer (YouTube native chapters)
  const idx = html.indexOf('ytInitialData = ');
  if (idx !== -1) {
    try {
      const start = idx + 'ytInitialData = '.length;
      let depth = 0;
      let end = start;
      for (let i = start; i < html.length; i++) {
        if (html[i] === '{') depth++;
        else if (html[i] === '}') {
          depth--;
          if (depth === 0) {
            end = i + 1;
            break;
          }
        }
      }
      const data = JSON.parse(html.slice(start, end));

      function findMarkers(obj: any): any[] {
        if (!obj || typeof obj !== 'object') return [];
        if (obj.macroMarkersListItemRenderer) return [obj.macroMarkersListItemRenderer];
        let res: any[] = [];
        for (const k of Object.keys(obj)) {
          res = res.concat(findMarkers(obj[k]));
        }
        return res;
      }

      const markers = findMarkers(data);
      for (const m of markers) {
        const markerTitle = m.title?.simpleText || m.title?.runs?.[0]?.text;
        const startTimeSec =
          typeof m.startTimeSeconds === 'number'
            ? m.startTimeSeconds
            : typeof m.onTap?.watchEndpoint?.startTimeSeconds === 'number'
            ? m.onTap.watchEndpoint.startTimeSeconds
            : parseDuration(m.timeDescription?.simpleText);

        const markerThumb = m.thumbnail?.thumbnails?.slice(-1)?.[0]?.url;

        if (markerTitle && typeof startTimeSec === 'number') {
          markersList.push({
            time: Math.floor(startTimeSec),
            title: markerTitle.trim(),
            thumbnail: markerThumb,
          });
        }
      }
    } catch (e) {
      console.warn('Could not parse ytInitialData JSON for chapters:', e);
    }
  }

  // Fallback title from <title> tag if not found
  if (!title) {
    const titleTagMatch = html.match(/<title>(.*?)<\/title>/);
    if (titleTagMatch && titleTagMatch[1]) {
      title = titleTagMatch[1].replace(/\s*-\s*YouTube\s*$/, '').trim();
    }
  }

  // Determine chapters:
  let parsedChapters: ParsedYouTubeChapter[] = [];

  // Priority A: Custom chapters text provided by user
  if (customChaptersText && customChaptersText.trim()) {
    parsedChapters = parseChaptersFromDescription(customChaptersText, totalDuration);
  }

  // Priority B: Description text parse (matches timestamps explicitly written in description)
  if (parsedChapters.length === 0 && description) {
    parsedChapters = parseChaptersFromDescription(description, totalDuration);
  }

  // Priority C: Native YouTube markers
  if (parsedChapters.length === 0 && markersList.length >= 2) {
    markersList.sort((a, b) => a.time - b.time);
    const deduped: { time: number; title: string; thumbnail?: string }[] = [];
    for (const m of markersList) {
      if (deduped.length === 0 || deduped[deduped.length - 1].time !== m.time) {
        deduped.push(m);
      }
    }
    parsedChapters = deduped.map((m, i) => {
      const next = deduped[i + 1];
      const endTime = next ? next.time : (totalDuration > m.time ? totalDuration : m.time + 600);
      const duration = Math.max(1, endTime - m.time);
      return {
        title: m.title,
        startTime: m.time,
        endTime,
        startTimeFormatted: formatSecondsToTime(m.time),
        endTimeFormatted: formatSecondsToTime(endTime),
        duration,
        durationFormatted: formatSecondsToTime(duration),
        thumbnail: m.thumbnail,
      };
    });
  }

  // Priority D: Fallback regex on raw HTML in case description was truncated
  if (parsedChapters.length === 0) {
    parsedChapters = parseChaptersFromDescription(html, totalDuration);
  }

  // Fallback if no chapters at all: 1 single chapter of the whole video
  if (parsedChapters.length === 0) {
    parsedChapters = [
      {
        title: title || 'Full Video Lecture',
        startTime: 0,
        endTime: totalDuration,
        startTimeFormatted: formatSecondsToTime(0),
        endTimeFormatted: formatSecondsToTime(totalDuration),
        duration: totalDuration,
        durationFormatted: formatSecondsToTime(totalDuration),
      },
    ];
  }

  return {
    videoId,
    title: title || 'YouTube Video Course',
    description: description || `Materi pembelajaran video dari YouTube: ${title}`,
    instructor: author || 'YouTube Creator',
    thumbnail,
    totalDuration,
    totalDurationFormatted: formatSecondsToHuman(totalDuration),
    chapters: parsedChapters,
  };
}

/**
 * Convert parsed YouTube video with chapters into a Course divided into sub-courses.
 */
export function convertVideoChaptersToCourse(
  videoCourse: ParsedYouTubeVideoCourse,
  customCategory = 'Technology & Engineering',
  customLevel: 'Beginner' | 'Intermediate' | 'Advanced' | 'All Levels' = 'All Levels'
): Course {
  const courseId = `yt-vid-${videoCourse.videoId}`;

  const allLessons: Lesson[] = [];
  const subCourses: SubCourse[] = videoCourse.chapters.map((ch, idx) => {
    const subCourseId = `${courseId}-sub-${idx + 1}`;
    const lessonId = `yt-lesson-${videoCourse.videoId}-${idx + 1}`;

    const lesson: Lesson = {
      id: lessonId,
      order: 1,
      globalIndex: idx + 1,
      title: ch.title,
      filename: `${videoCourse.videoId}-part-${idx + 1}.mp4`,
      path: `https://www.youtube.com/watch?v=${videoCourse.videoId}&start=${ch.startTime}&end=${ch.endTime}`,
      relativePath: `youtube/${videoCourse.videoId}/${idx + 1}`,
      url: `https://www.youtube.com/watch?v=${videoCourse.videoId}&start=${ch.startTime}&end=${ch.endTime}`,
      duration: ch.duration,
      durationFormatted: ch.durationFormatted,
      size: 0,
      sizeFormatted: 'Online Stream',
      courseId,
      courseName: videoCourse.title,
      subCourseId,
      subCourseName: ch.title,
      description: `Bab ${idx + 1} (${ch.startTimeFormatted} - ${ch.endTimeFormatted}) dari video pembelajaran YouTube: ${videoCourse.title}`,
      thumbnail: ch.thumbnail || videoCourse.thumbnail,
      previousLessonId: idx > 0 ? `yt-lesson-${videoCourse.videoId}-${idx}` : null,
      nextLessonId: idx < videoCourse.chapters.length - 1 ? `yt-lesson-${videoCourse.videoId}-${idx + 2}` : null,
      isFirstLesson: idx === 0,
      isLastLesson: idx === videoCourse.chapters.length - 1,
      source: 'youtube',
      youtubeVideoId: videoCourse.videoId,
      startTime: ch.startTime,
      endTime: ch.endTime,
      libraryId: 'lib-youtube',
      libraryName: 'YouTube Online Courses',
    };

    allLessons.push(lesson);

    return {
      id: subCourseId,
      name: ch.title,
      order: idx + 1,
      path: `youtube/${videoCourse.videoId}/${idx + 1}`,
      courseId,
      lessonCount: 1,
      totalDuration: ch.duration,
      totalDurationFormatted: formatSecondsToHuman(ch.duration),
      lessons: [lesson],
    };
  });

  return {
    id: courseId,
    name: videoCourse.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    title: videoCourse.title,
    instructor: videoCourse.instructor,
    category: customCategory,
    level: customLevel,
    description: videoCourse.description,
    path: `https://www.youtube.com/watch?v=${videoCourse.videoId}`,
    thumbnail: videoCourse.thumbnail,
    subCourseCount: subCourses.length,
    lessonCount: allLessons.length,
    totalDuration: videoCourse.totalDuration,
    totalDurationFormatted: videoCourse.totalDurationFormatted,
    totalSize: 0,
    totalSizeFormatted: 'Online Stream',
    subCourses,
    tags: ['YouTube', 'Video Course', customCategory],
    featured: true,
    rating: 4.9,
    updatedAt: new Date().toISOString(),
    libraryId: 'lib-youtube',
    libraryName: 'YouTube Online Courses',
    source: 'youtube',
    playlistUrl: `https://www.youtube.com/watch?v=${videoCourse.videoId}`,
    youtubePlaylistId: videoCourse.videoId,
  };
}

/**
 * Storage management for YouTube courses.
 */
export function getStoredYouTubeCourses(): Course[] {
  ensureDataDir();
  try {
    if (fs.existsSync(YOUTUBE_COURSES_FILE)) {
      const content = fs.readFileSync(YOUTUBE_COURSES_FILE, 'utf-8');
      const data = JSON.parse(content);
      if (Array.isArray(data)) return data;
      if (data && Array.isArray(data.courses)) return data.courses;
    }
  } catch (err) {
    console.error('Failed to read youtube_courses.json:', err);
  }
  return [];
}

export function saveYouTubeCourse(course: Course): Course[] {
  ensureDataDir();
  const existing = getStoredYouTubeCourses();
  const index = existing.findIndex((c) => c.id === course.id);

  if (index >= 0) {
    existing[index] = course;
  } else {
    existing.unshift(course);
  }

  try {
    fs.writeFileSync(YOUTUBE_COURSES_FILE, JSON.stringify({ courses: existing }, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving youtube_courses.json:', err);
  }

  return existing;
}

export function deleteStoredYouTubeCourse(courseId: string): Course[] {
  ensureDataDir();
  const existing = getStoredYouTubeCourses();
  const filtered = existing.filter((c) => c.id !== courseId);

  try {
    fs.writeFileSync(YOUTUBE_COURSES_FILE, JSON.stringify({ courses: filtered }, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error deleting course from youtube_courses.json:', err);
  }

  return filtered;
}
