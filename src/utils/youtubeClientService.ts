import {
  Course,
  Lesson,
  SubCourse,
  ParsedYouTubeChapter,
  ParsedYouTubeVideoCourse,
  ParsedYouTubePlaylist,
  ParsedYouTubeVideo,
} from '../types';

/**
 * Extract YouTube Video ID from a URL or raw ID string.
 */
export function extractVideoId(input: string): string | null {
  if (!input || typeof input !== 'string') return null;
  const trimmed = input.trim();

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

  if (/^[a-zA-Z0-9_-]{12,}$/.test(trimmed)) {
    return trimmed;
  }

  try {
    const url = new URL(trimmed.startsWith('http') ? trimmed : `https://${trimmed}`);
    const listParam = url.searchParams.get('list');
    if (listParam) return listParam;

    const match = trimmed.match(/[?&]list=([a-zA-Z0-9_-]+)/);
    if (match) return match[1];
  } catch {
    const match = trimmed.match(/[?&]list=([a-zA-Z0-9_-]+)/);
    if (match) return match[1];
  }

  return null;
}

export function formatSecondsToTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) {
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export function formatSecondsToHuman(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);

  if (h > 0) {
    return `${h}h ${m}m`;
  }
  return `${m}m ${s}s`;
}

/**
 * Parse human timestamp HH:MM:SS or MM:SS to seconds
 */
export function parseTimestampToSeconds(ts: string): number {
  const parts = ts.trim().split(':').map((p) => parseInt(p, 10) || 0);
  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }
  if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  }
  return parts[0] || 0;
}

/**
 * Parse text description with timestamps into ParsedYouTubeChapter[]
 */
export function parseChaptersFromDescription(text: string, totalVideoDuration: number = 0): ParsedYouTubeChapter[] {
  if (!text || typeof text !== 'string') return [];

  const lines = text.split('\n');
  const chaptersRaw: { timeStr: string; seconds: number; title: string }[] = [];

  const regex1 = /(?:^|\s)(\d{1,2}:\d{2}(?::\d{2})?)\s*[-–—:]?\s*(.*)$/;
  const regex2 = /^(.*?)\s*[-–—:]?\s*(\d{1,2}:\d{2}(?::\d{2})?)$/;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const m1 = trimmed.match(regex1);
    if (m1) {
      const timeStr = m1[1];
      const title = m1[2].replace(/^[-–—:]\s*/, '').trim();
      if (title && title.length >= 2) {
        chaptersRaw.push({
          timeStr,
          seconds: parseTimestampToSeconds(timeStr),
          title,
        });
        continue;
      }
    }

    const m2 = trimmed.match(regex2);
    if (m2) {
      const title = m2[1].replace(/[-–—:]\s*$/, '').trim();
      const timeStr = m2[2];
      if (title && title.length >= 2) {
        chaptersRaw.push({
          timeStr,
          seconds: parseTimestampToSeconds(timeStr),
          title,
        });
      }
    }
  }

  if (chaptersRaw.length === 0) return [];

  chaptersRaw.sort((a, b) => a.seconds - b.seconds);

  const chapters: ParsedYouTubeChapter[] = [];
  for (let i = 0; i < chaptersRaw.length; i++) {
    const curr = chaptersRaw[i];
    const next = chaptersRaw[i + 1];
    const startTime = curr.seconds;
    const endTime = next ? next.seconds : (totalVideoDuration > startTime ? totalVideoDuration : startTime + 600);
    const duration = Math.max(0, endTime - startTime);

    chapters.push({
      order: i + 1,
      title: curr.title || `Bab ${i + 1}`,
      startTime,
      startTimeFormatted: formatSecondsToTime(startTime),
      endTime,
      endTimeFormatted: formatSecondsToTime(endTime),
      duration,
      durationFormatted: formatSecondsToTime(duration),
    });
  }

  return chapters;
}

/**
 * Fetch video metadata via public oEmbed
 */
export async function fetchClientYouTubeVideoMetadata(videoId: string): Promise<{
  title: string;
  author: string;
  thumbnail: string;
}> {
  try {
    const oembedUrl = `https://noembed.com/embed?url=${encodeURIComponent(`https://www.youtube.com/watch?v=${videoId}`)}`;
    const res = await fetch(oembedUrl);
    if (res.ok) {
      const data = await res.json();
      if (data && data.title) {
        return {
          title: data.title,
          author: data.author_name || 'YouTube Creator',
          thumbnail: `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`,
        };
      }
    }
  } catch {}

  try {
    const directUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(`https://www.youtube.com/watch?v=${videoId}`)}&format=json`;
    const res = await fetch(directUrl);
    if (res.ok) {
      const data = await res.json();
      if (data && data.title) {
        return {
          title: data.title,
          author: data.author_name || 'YouTube Creator',
          thumbnail: `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`,
        };
      }
    }
  } catch {}

  return {
    title: `YouTube Video (${videoId})`,
    author: 'YouTube Creator',
    thumbnail: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
  };
}

/**
 * Client-side YouTube preview
 */
export async function fetchClientYouTubePreview(
  url: string,
  mode: 'chapters' | 'playlist',
  customChaptersText?: string
): Promise<{
  mode: 'chapters' | 'playlist';
  videoCourse?: ParsedYouTubeVideoCourse;
  playlist?: ParsedYouTubePlaylist;
}> {
  if (mode === 'chapters') {
    const videoId = extractVideoId(url);
    if (!videoId) {
      throw new Error('Link video YouTube tidak valid. Mohon masukkan link video seperti https://www.youtube.com/watch?v=...');
    }

    const meta = await fetchClientYouTubeVideoMetadata(videoId);
    let chapters: ParsedYouTubeChapter[] = [];

    if (customChaptersText?.trim()) {
      chapters = parseChaptersFromDescription(customChaptersText);
    }

    if (chapters.length === 0) {
      // Default initial chapter
      chapters = [
        {
          order: 1,
          title: meta.title,
          startTime: 0,
          startTimeFormatted: '00:00',
          endTime: 600,
          endTimeFormatted: '10:00',
          duration: 600,
          durationFormatted: '10:00',
        },
      ];
    }

    const totalDuration = chapters.reduce((acc, c) => acc + c.duration, 0);

    return {
      mode: 'chapters',
      videoCourse: {
        videoId,
        title: meta.title,
        description: `Video pembelajaran dari YouTube: ${meta.title}`,
        instructor: meta.author,
        thumbnail: meta.thumbnail,
        chapters,
        totalDuration,
        totalDurationFormatted: formatSecondsToHuman(totalDuration),
      },
    };
  }

  // mode === 'playlist'
  const playlistId = extractPlaylistId(url);
  if (!playlistId) {
    throw new Error('Link playlist YouTube tidak valid. Mohon masukkan link seperti https://www.youtube.com/playlist?list=PL...');
  }

  // Try fetching playlist HTML via CORS proxy
  try {
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(`https://www.youtube.com/playlist?list=${playlistId}`)}`;
    const res = await fetch(proxyUrl);
    if (res.ok) {
      const html = await res.text();
      const titleMatch = html.match(/<meta\s+name="title"\s+content="([^"]+)"/i) || html.match(/<title>([^<]+)<\/title>/i);
      const playlistTitle = titleMatch ? titleMatch[1].replace(/ - YouTube$/, '').trim() : `YouTube Playlist (${playlistId})`;

      // Extract video entries from ytInitialData
      const ytDataMatch = html.match(/var\s+ytInitialData\s*=\s*({.+?});\s*<\/script>/s);
      const videos: ParsedYouTubeVideo[] = [];

      if (ytDataMatch) {
        try {
          const ytData = JSON.parse(ytDataMatch[1]);
          const tabs = ytData?.contents?.twoColumnBrowseResultsRenderer?.tabs || [];
          const tabRenderer = tabs[0]?.tabRenderer;
          const sectionList = tabRenderer?.content?.sectionListRenderer?.contents || [];
          const itemSection = sectionList[0]?.itemSectionRenderer?.contents || [];
          const playlistRenderer = itemSection[0]?.playlistVideoListRenderer;
          const rawContents = playlistRenderer?.contents || [];

          for (let i = 0; i < rawContents.length; i++) {
            const item = rawContents[i]?.playlistVideoRenderer;
            if (!item || !item.videoId) continue;
            const title = item.title?.runs?.[0]?.text || item.title?.simpleText || `Video ${i + 1}`;
            const durationSec = parseInt(item.lengthSeconds, 10) || 600;
            const thumb = item.thumbnail?.thumbnails?.pop()?.url || `https://i.ytimg.com/vi/${item.videoId}/hqdefault.jpg`;

            videos.push({
              videoId: item.videoId,
              title,
              duration: durationSec,
              durationFormatted: formatSecondsToTime(durationSec),
              thumbnail: thumb,
            });
          }
        } catch {}
      }

      if (videos.length > 0) {
        const totalDuration = videos.reduce((sum, v) => sum + v.duration, 0);
        return {
          mode: 'playlist',
          playlist: {
            playlistId,
            title: playlistTitle,
            description: `Kumpulan video materi dari playlist YouTube ${playlistTitle}`,
            instructor: 'YouTube Creator',
            thumbnail: videos[0]?.thumbnail || `https://i.ytimg.com/vi/${videos[0]?.videoId}/maxresdefault.jpg`,
            videos,
            totalDuration,
            totalDurationFormatted: formatSecondsToHuman(totalDuration),
          },
        };
      }
    }
  } catch {}

  // Fallback if CORS proxy was unreachable
  return {
    mode: 'playlist',
    playlist: {
      playlistId,
      title: `YouTube Playlist (${playlistId})`,
      description: `Playlist YouTube: https://www.youtube.com/playlist?list=${playlistId}`,
      instructor: 'YouTube Creator',
      thumbnail: 'https://img.youtube.com/vi/default.jpg',
      videos: [
        {
          videoId: playlistId,
          title: `Playlist Materi (${playlistId})`,
          duration: 1200,
          durationFormatted: '20:00',
          thumbnail: 'https://img.youtube.com/vi/default.jpg',
        },
      ],
      totalDuration: 1200,
      totalDurationFormatted: '20m',
    },
  };
}

/**
 * Convert ParsedYouTubeVideoCourse to a standard Course object
 */
export function convertClientVideoChaptersToCourse(
  videoCourse: ParsedYouTubeVideoCourse,
  category: string = 'Technology & Engineering',
  level: 'All Levels' | 'Beginner' | 'Intermediate' | 'Advanced' = 'All Levels',
  customTitle?: string
): Course {
  const courseTitle = customTitle?.trim() || videoCourse.title;
  const courseId = `yt-vid-${videoCourse.videoId}`;

  const subCourses: SubCourse[] = videoCourse.chapters.map((ch, idx) => {
    const subCourseId = `${courseId}-sub-${ch.order}`;
    const lessonId = `yt-lesson-${videoCourse.videoId}-${ch.order}`;
    const lessonUrl = `https://www.youtube.com/watch?v=${videoCourse.videoId}&start=${ch.startTime}&end=${ch.endTime}`;

    const lesson: Lesson = {
      id: lessonId,
      order: 1,
      globalIndex: idx + 1,
      title: ch.title,
      filename: `${videoCourse.videoId}-part-${ch.order}.mp4`,
      path: lessonUrl,
      relativePath: `youtube/${videoCourse.videoId}/${ch.order}`,
      url: lessonUrl,
      duration: ch.duration,
      durationFormatted: ch.durationFormatted,
      size: 0,
      sizeFormatted: 'Online Stream',
      courseId,
      courseName: courseTitle,
      subCourseId,
      subCourseName: ch.title,
      description: `Bab ${ch.order} (${ch.startTimeFormatted} - ${ch.endTimeFormatted}) dari video pembelajaran YouTube: ${courseTitle}`,
      thumbnail: videoCourse.thumbnail,
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

    return {
      id: subCourseId,
      name: ch.title,
      order: ch.order,
      path: `youtube/${videoCourse.videoId}/${ch.order}`,
      courseId,
      lessonCount: 1,
      totalDuration: ch.duration,
      totalDurationFormatted: ch.durationFormatted,
      lessons: [lesson],
    };
  });

  return {
    id: courseId,
    name: courseTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    title: courseTitle,
    instructor: videoCourse.instructor || 'YouTube Creator',
    category,
    level,
    description: videoCourse.description,
    path: `https://www.youtube.com/watch?v=${videoCourse.videoId}`,
    thumbnail: videoCourse.thumbnail,
    subCourseCount: subCourses.length,
    lessonCount: subCourses.length,
    totalDuration: videoCourse.totalDuration,
    totalDurationFormatted: videoCourse.totalDurationFormatted,
    totalSize: 0,
    totalSizeFormatted: 'Online Stream',
    subCourses,
    tags: ['YouTube', 'Video Course', category],
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
 * Convert ParsedYouTubePlaylist to a standard Course object
 */
export function convertClientPlaylistToCourse(
  playlist: ParsedYouTubePlaylist,
  category: string = 'Technology & Engineering',
  level: 'All Levels' | 'Beginner' | 'Intermediate' | 'Advanced' = 'All Levels',
  customTitle?: string
): Course {
  const courseTitle = customTitle?.trim() || playlist.title;
  const courseId = `yt-${playlist.playlistId}`;
  const subCourseId = `${courseId}-mod-1`;

  const lessons: Lesson[] = playlist.videos.map((vid, idx) => {
    const lessonId = `yt-lesson-${vid.videoId}`;
    const lessonUrl = `https://www.youtube.com/watch?v=${vid.videoId}`;

    return {
      id: lessonId,
      order: idx + 1,
      globalIndex: idx + 1,
      title: vid.title,
      filename: `${vid.videoId}.mp4`,
      path: lessonUrl,
      relativePath: `youtube/${vid.videoId}`,
      url: lessonUrl,
      duration: vid.duration,
      durationFormatted: vid.durationFormatted,
      size: 0,
      sizeFormatted: 'Online Stream',
      courseId,
      courseName: courseTitle,
      subCourseId,
      subCourseName: 'Materi Pembelajaran',
      description: `Materi video pembelajaran ke-${idx + 1} dari playlist YouTube ${courseTitle}`,
      thumbnail: vid.thumbnail,
      previousLessonId: idx > 0 ? `yt-lesson-${playlist.videos[idx - 1].videoId}` : null,
      nextLessonId: idx < playlist.videos.length - 1 ? `yt-lesson-${playlist.videos[idx + 1].videoId}` : null,
      isFirstLesson: idx === 0,
      isLastLesson: idx === playlist.videos.length - 1,
      source: 'youtube',
      youtubeVideoId: vid.videoId,
      libraryId: 'lib-youtube',
      libraryName: 'YouTube Online Courses',
    };
  });

  const subCourse: SubCourse = {
    id: subCourseId,
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
    name: courseTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    title: courseTitle,
    instructor: playlist.instructor || 'YouTube Creator',
    category,
    level,
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
    tags: ['YouTube', 'Online Course', category],
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
 * Save custom course to localStorage
 */
export function saveClientCustomCourse(course: Course): void {
  try {
    const raw = localStorage.getItem('custom_youtube_courses');
    let courses: Course[] = raw ? JSON.parse(raw) : [];
    // Remove if duplicate id exists
    courses = courses.filter((c) => c.id !== course.id);
    courses.unshift(course);
    localStorage.setItem('custom_youtube_courses', JSON.stringify(courses));
  } catch (err) {
    console.warn('Failed to save course to localStorage:', err);
  }
}

/**
 * Get custom courses from localStorage
 */
export function getClientCustomCourses(): Course[] {
  try {
    const raw = localStorage.getItem('custom_youtube_courses');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Delete custom course from localStorage
 */
export function deleteClientCustomCourse(courseId: string): void {
  try {
    const raw = localStorage.getItem('custom_youtube_courses');
    if (!raw) return;
    const courses: Course[] = JSON.parse(raw);
    const filtered = courses.filter((c) => c.id !== courseId);
    localStorage.setItem('custom_youtube_courses', JSON.stringify(filtered));
  } catch (err) {
    console.warn('Failed to delete course from localStorage:', err);
  }
}
