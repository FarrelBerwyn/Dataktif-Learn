import fs from 'fs';
import path from 'path';
import { extractVideoThumbnail } from './thumbnailGenerator';

export interface Lesson {
  id: string;
  order: number;
  globalIndex: number;
  title: string;
  filename: string;
  path: string;
  relativePath: string;
  url: string;
  duration: number; // in seconds
  durationFormatted: string;
  size: number;
  sizeFormatted: string;
  courseId: string;
  courseName: string;
  subCourseId: string;
  subCourseName: string;
  description?: string;
  thumbnail?: string;
  previousLessonId?: string | null;
  nextLessonId?: string | null;
  isFirstLesson?: boolean;
  isLastLesson?: boolean;
  libraryId?: string;
  libraryName?: string;
}

export interface SubCourse {
  id: string;
  name: string;
  order: number;
  path: string;
  courseId: string;
  lessonCount: number;
  totalDuration: number;
  totalDurationFormatted: string;
  lessons: Lesson[];
}

export interface Course {
  id: string;
  name: string;
  title: string;
  instructor: string;
  category: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced' | 'All Levels';
  description: string;
  path: string;
  thumbnail: string;
  subCourseCount: number;
  lessonCount: number;
  totalDuration: number;
  totalDurationFormatted: string;
  totalSize: number;
  totalSizeFormatted: string;
  subCourses: SubCourse[];
  tags: string[];
  featured?: boolean;
  rating?: number;
  updatedAt: string;
  libraryId?: string;
  libraryName?: string;
}

export interface LibraryData {
  courses: Course[];
  totalCourses: number;
  totalSubCourses: number;
  totalLessons: number;
  totalDuration: number;
  totalDurationFormatted: string;
  totalSize: number;
  totalSizeFormatted: string;
  categories: string[];
  scannedAt: string;
  videoRoot: string;
  isDemoFallback?: boolean;
}

export const ALLOWED_EXTENSIONS = ['.mp4', '.webm', '.mov', '.m4v', '.mkv', '.ogg'];
const THUMBNAIL_NAMES = [
  'thumbnail.jpg',
  'thumbnail.jpeg',
  'thumbnail.png',
  'cover.jpg',
  'cover.png',
  'cover.jpeg',
  'poster.jpg',
  'poster.png',
];

// Natural sort collator (1, 2, 10 instead of 1, 10, 2)
const naturalCollator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });

export function naturalSort(a: string, b: string): number {
  return naturalCollator.compare(a, b);
}

// Convert bytes to human readable string
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

// Convert seconds to mm:ss or hh:mm:ss
export function formatSeconds(secs: number): string {
  if (!secs || isNaN(secs)) return '05:00';
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = Math.floor(secs % 60);
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

// Convert seconds to humanized duration like "4h 20m" or "35m"
export function formatDurationHuman(secs: number): string {
  if (!secs || isNaN(secs)) return '0m';
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  if (h > 0) {
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  }
  return `${Math.max(1, m)}m`;
}

// Intelligent title parser
export function parseCleanTitle(filenameOrFolderName: string): string {
  // Remove extension
  let clean = filenameOrFolderName.replace(/\.[^/.]+$/, '');

  // Remove leading numbers and separators like "01 - ", "1. ", "02_", "Module 01 - "
  clean = clean.replace(/^(module\s*\d+[\s\-_.:]*)/i, '');
  clean = clean.replace(/^(sub\s*course\s*\d+[\s\-_.:]*)/i, '');
  clean = clean.replace(/^(\d+[\s\-_.:]+)/, '');

  // Replace underscores and hyphens with spaces
  clean = clean.replace(/[-_]+/g, ' ').trim();

  // Capitalize words nicely if mostly lower case
  clean = clean
    .split(' ')
    .filter(Boolean)
    .map((word) => {
      if (word.toUpperCase() === word && word.length <= 4) return word; // Keep acronyms like AI, API, UI
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');

  return clean || 'Untitled Lesson';
}

// Generate an ID from a string
export function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Check for course-level or module-level thumbnail
export function findThumbnailInDir(dirPath: string): string | null {
  try {
    if (!fs.existsSync(dirPath)) return null;
    const files = fs.readdirSync(dirPath);
    for (const thumbName of THUMBNAIL_NAMES) {
      if (files.some((f) => f.toLowerCase() === thumbName)) {
        return path.join(dirPath, thumbName);
      }
    }
  } catch {}
  return null;
}

// Check for video-specific thumbnail beside it
export function findThumbnailForVideo(videoPath: string): string | null {
  const dir = path.dirname(videoPath);
  const baseWithoutExt = path.basename(videoPath, path.extname(videoPath));
  const extensions = ['.jpg', '.jpeg', '.png', '.webp'];

  for (const ext of extensions) {
    const candidate = path.join(dir, `${baseWithoutExt}${ext}`);
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }
  return null;
}

// Curated courses list (empty - only real scanned user courses are used)
export const CURATED_COURSES: Course[] = [];


// Re-link previous and next lessons across sub-courses for sequential navigation
export function linkLessonsSequentially(course: Course): void {
  const allLessons: Lesson[] = [];
  course.subCourses.forEach((sub) => {
    sub.lessons.forEach((l) => allLessons.push(l));
  });

  allLessons.forEach((lesson, idx) => {
    lesson.globalIndex = idx;
    lesson.isFirstLesson = idx === 0;
    lesson.isLastLesson = idx === allLessons.length - 1;
    lesson.previousLessonId = idx > 0 ? allLessons[idx - 1].id : null;
    lesson.nextLessonId = idx < allLessons.length - 1 ? allLessons[idx + 1].id : null;
  });
}

// Link all curated courses
CURATED_COURSES.forEach(linkLessonsSequentially);

/**
 * Scan a single Course directory.
 * Hierarchy:
 * CourseDir /
 *   ├── course.json (optional)
 *   ├── thumbnail.jpg (optional)
 *   ├── SubCourse1 /
 *   │   ├── Video 1.mp4
 *   │   └── Video 2.mp4
 *   └── SubCourse2 /
 *       └── Video 3.mp4
 */
export function scanCourseDirectory(
  courseDirAbs: string,
  relativeCoursePath: string
): Course | null {
  try {
    const courseStat = fs.statSync(courseDirAbs);
    if (!courseStat.isDirectory()) return null;

    const folderName = path.basename(courseDirAbs);
    const courseId = slugify(folderName);
    const cleanCourseTitle = parseCleanTitle(folderName);

    // Check for course.json
    let courseJson: any = {};
    const courseJsonPath = path.join(courseDirAbs, 'course.json');
    if (fs.existsSync(courseJsonPath)) {
      try {
        courseJson = JSON.parse(fs.readFileSync(courseJsonPath, 'utf-8'));
      } catch (e) {
        console.warn(`Failed to parse course.json in ${courseDirAbs}:`, e);
      }
    }

    // Thumbnail check
    let courseThumb = '';
    const localThumb = findThumbnailInDir(courseDirAbs);
    if (localThumb) {
      courseThumb = `/api/thumbnails?file=${encodeURIComponent(path.relative(process.cwd(), localThumb))}`;
    } else if (courseJson.thumbnail) {
      courseThumb = courseJson.thumbnail;
    }

    const subCourses: SubCourse[] = [];
    const entries = fs.readdirSync(courseDirAbs);

    // Natural sort directory items
    entries.sort(naturalSort);

    // Look for subfolders (modules) vs video files directly in the course folder
    const subDirs: string[] = [];
    const directVideos: string[] = [];

    for (const entry of entries) {
      if (entry.startsWith('.')) continue;
      const fullPath = path.join(courseDirAbs, entry);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        subDirs.push(entry);
      } else if (ALLOWED_EXTENSIONS.includes(path.extname(entry).toLowerCase())) {
        directVideos.push(entry);
      }
    }

    // Case A: Has subfolders (modules)
    if (subDirs.length > 0) {
      subDirs.forEach((subDirName, subIdx) => {
        const subDirAbs = path.join(courseDirAbs, subDirName);
        const subId = `${courseId}-mod-${slugify(subDirName)}`;
        const cleanSubName = parseCleanTitle(subDirName);

        const subFiles = fs.readdirSync(subDirAbs).filter((f) => !f.startsWith('.'));
        subFiles.sort(naturalSort);

        const lessons: Lesson[] = [];
        let subDuration = 0;

        subFiles.forEach((file) => {
          const ext = path.extname(file).toLowerCase();
          if (!ALLOWED_EXTENSIONS.includes(ext)) return;

          const fileAbs = path.join(subDirAbs, file);
          const stat = fs.statSync(fileAbs);
          const lessonId = `${courseId}-${slugify(path.basename(file, ext))}`;
          const cleanLessonTitle = parseCleanTitle(file);

          // Approximate or estimate duration from file size (average 2.5MB/min for 1080p) or 600s
          const estimatedSecs = Math.max(30, Math.round(stat.size / (1024 * 1024 * 0.4)));

          // First check for dedicated image beside video, else extract frame from video
          const videoLocalThumb = findThumbnailForVideo(fileAbs);
          let lessonThumb = '';
          if (videoLocalThumb) {
            lessonThumb = `/api/thumbnails?file=${encodeURIComponent(path.relative(process.cwd(), videoLocalThumb))}`;
          } else {
            lessonThumb = extractVideoThumbnail(fileAbs) || '';
          }

          lessons.push({
            id: lessonId,
            order: lessons.length + 1,
            globalIndex: 0,
            title: cleanLessonTitle,
            filename: file,
            path: fileAbs,
            relativePath: path.relative(process.cwd(), fileAbs),
            url: `/api/video/${lessonId}`,
            duration: estimatedSecs,
            durationFormatted: formatSeconds(estimatedSecs),
            size: stat.size,
            sizeFormatted: formatBytes(stat.size),
            courseId,
            courseName: cleanCourseTitle,
            subCourseId: subId,
            subCourseName: cleanSubName,
            description: `Lesson ${lessons.length + 1}: In-depth breakdown covering ${cleanLessonTitle}.`,
            thumbnail: lessonThumb || courseThumb,
          });

          subDuration += estimatedSecs;
        });

        if (lessons.length > 0) {
          subCourses.push({
            id: subId,
            name: cleanSubName,
            order: subIdx + 1,
            path: path.relative(process.cwd(), subDirAbs),
            courseId,
            lessonCount: lessons.length,
            totalDuration: subDuration,
            totalDurationFormatted: formatDurationHuman(subDuration),
            lessons,
          });
        }
      });
    }

    // Case B: Direct videos inside course root (no subfolders or mixed)
    if (directVideos.length > 0) {
      const defaultSubId = `${courseId}-general`;
      const defaultSubName = 'Core Curriculum';
      const lessons: Lesson[] = [];
      let subDuration = 0;

      directVideos.forEach((file) => {
        const ext = path.extname(file).toLowerCase();
        const fileAbs = path.join(courseDirAbs, file);
        const stat = fs.statSync(fileAbs);
        const lessonId = `${courseId}-${slugify(path.basename(file, ext))}`;
        const cleanLessonTitle = parseCleanTitle(file);
        const estimatedSecs = Math.max(30, Math.round(stat.size / (1024 * 1024 * 0.4)));

        const videoLocalThumb = findThumbnailForVideo(fileAbs);
        let lessonThumb = '';
        if (videoLocalThumb) {
          lessonThumb = `/api/thumbnails?file=${encodeURIComponent(path.relative(process.cwd(), videoLocalThumb))}`;
        } else {
          lessonThumb = extractVideoThumbnail(fileAbs) || '';
        }

        lessons.push({
          id: lessonId,
          order: lessons.length + 1,
          globalIndex: 0,
          title: cleanLessonTitle,
          filename: file,
          path: fileAbs,
          relativePath: path.relative(process.cwd(), fileAbs),
          url: `/api/video/${lessonId}`,
          duration: estimatedSecs,
          durationFormatted: formatSeconds(estimatedSecs),
          size: stat.size,
          sizeFormatted: formatBytes(stat.size),
          courseId,
          courseName: cleanCourseTitle,
          subCourseId: defaultSubId,
          subCourseName: defaultSubName,
          description: `Lesson ${lessons.length + 1}: ${cleanLessonTitle}`,
          thumbnail: lessonThumb || courseThumb,
        });

        subDuration += estimatedSecs;
      });

      if (lessons.length > 0) {
        subCourses.unshift({
          id: defaultSubId,
          name: defaultSubName,
          order: 1,
          path: relativeCoursePath,
          courseId,
          lessonCount: lessons.length,
          totalDuration: subDuration,
          totalDurationFormatted: formatDurationHuman(subDuration),
          lessons,
        });
      }
    }

    if (subCourses.length === 0) {
      return null;
    }

    // Calculate totals
    let totalLessons = 0;
    let totalDuration = 0;
    let totalSize = 0;

    subCourses.forEach((sub) => {
      totalLessons += sub.lessonCount;
      totalDuration += sub.totalDuration;
      sub.lessons.forEach((l) => (totalSize += l.size));
    });

    // If no explicit course thumbnail was set, adopt the thumbnail of the first video lesson in the course!
    if (!courseThumb) {
      const firstLessonWithThumb = subCourses
        .flatMap((s) => s.lessons)
        .find((l) => l.thumbnail);
      if (firstLessonWithThumb && firstLessonWithThumb.thumbnail) {
        courseThumb = firstLessonWithThumb.thumbnail;
      } else {
        courseThumb =
          'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80';
      }
    }

    const scannedCourse: Course = {
      id: courseId,
      name: cleanCourseTitle,
      title: courseJson.title || cleanCourseTitle,
      instructor: courseJson.instructor || 'Local Academy Faculty',
      category: courseJson.category || 'Technology & Engineering',
      level: courseJson.level || 'Intermediate',
      description:
        courseJson.description ||
        `Comprehensive curriculum on ${cleanCourseTitle} containing ${totalLessons} structured lessons across ${subCourses.length} learning modules.`,
      path: relativeCoursePath,
      thumbnail: courseThumb,
      subCourseCount: subCourses.length,
      lessonCount: totalLessons,
      totalDuration,
      totalDurationFormatted: formatDurationHuman(totalDuration),
      totalSize,
      totalSizeFormatted: formatBytes(totalSize),
      subCourses,
      tags: courseJson.tags || [cleanCourseTitle, 'Hands-on', 'Masterclass'],
      featured: courseJson.featured ?? false,
      rating: courseJson.rating || 4.9,
      updatedAt: new Date().toISOString(),
    };

    linkLessonsSequentially(scannedCourse);
    return scannedCourse;
  } catch (err) {
    console.error(`Error scanning course directory ${courseDirAbs}:`, err);
    return null;
  }
}

/**
 * Scan entire root folder for Courses.
 * Iterates through all top-level directories.
 */
export function scanCourseLibrary(videoRootPath: string): LibraryData {
  const absRoot = path.isAbsolute(videoRootPath)
    ? videoRootPath
    : path.join(process.cwd(), videoRootPath);

  if (!fs.existsSync(absRoot)) {
    try {
      fs.mkdirSync(absRoot, { recursive: true });
    } catch {}
  }

  const localCourses: Course[] = [];
  const categorySet = new Set<string>();

  try {
    const entries = fs.readdirSync(absRoot).filter((e) => !e.startsWith('.'));
    entries.sort(naturalSort);

    const subDirs: string[] = [];
    const rootVideos: string[] = [];

    for (const entry of entries) {
      const fullPath = path.join(absRoot, entry);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        subDirs.push(entry);
      } else if (ALLOWED_EXTENSIONS.includes(path.extname(entry).toLowerCase())) {
        rootVideos.push(entry);
      }
    }

    // If the scanned folder is a dedicated course folder containing sub-folders (modules),
    // treat the entire folder as 1 Main Course containing sub-main-courses (modules).
    const isDedicatedCourseFolder =
      path.basename(absRoot).toLowerCase() !== 'videos' &&
      !absRoot.endsWith(path.sep + 'videos');

    if (isDedicatedCourseFolder) {
      const selfCourse = scanCourseDirectory(absRoot, path.relative(process.cwd(), absRoot));
      if (selfCourse && selfCourse.lessonCount > 0) {
        localCourses.push(selfCourse);
        categorySet.add(selfCourse.category);
        return {
          courses: localCourses,
          totalCourses: 1,
          totalSubCourses: selfCourse.subCourseCount,
          totalLessons: selfCourse.lessonCount,
          totalDuration: selfCourse.totalDuration,
          totalDurationFormatted: selfCourse.totalDurationFormatted,
          totalSize: selfCourse.totalSize,
          totalSizeFormatted: selfCourse.totalSizeFormatted,
          categories: Array.from(categorySet),
          scannedAt: new Date().toISOString(),
          videoRoot: absRoot,
          isDemoFallback: false,
        };
      }
    }

    // 1. Otherwise, scan subdirectories as individual Courses
    for (const subDir of subDirs) {
      const courseAbs = path.join(absRoot, subDir);
      const course = scanCourseDirectory(courseAbs, path.relative(process.cwd(), courseAbs));
      if (course) {
        localCourses.push(course);
        categorySet.add(course.category);
      }
    }

    // 2. If there are loose videos directly in the root folder, group them into a "General Foundations" course
    if (rootVideos.length > 0) {
      const rootCourseId = 'local-foundational-studies';
      const rootCourseTitle = 'Foundational Media Studies';
      const lessons: Lesson[] = [];
      let totalDuration = 0;
      let totalSize = 0;

      rootVideos.forEach((file, idx) => {
        const fileAbs = path.join(absRoot, file);
        const stat = fs.statSync(fileAbs);
        const ext = path.extname(file).toLowerCase();
        const lessonId = `${rootCourseId}-${slugify(path.basename(file, ext))}`;
        const cleanTitle = parseCleanTitle(file);
        const estSec = Math.max(30, Math.round(stat.size / (1024 * 1024 * 0.4)));

        const videoLocalThumb = findThumbnailForVideo(fileAbs);
        let lessonThumb = '';
        if (videoLocalThumb) {
          lessonThumb = `/api/thumbnails?file=${encodeURIComponent(path.relative(process.cwd(), videoLocalThumb))}`;
        } else {
          lessonThumb = extractVideoThumbnail(fileAbs) || '';
        }

        lessons.push({
          id: lessonId,
          order: idx + 1,
          globalIndex: idx,
          title: cleanTitle,
          filename: file,
          path: fileAbs,
          relativePath: path.relative(process.cwd(), fileAbs),
          url: `/api/video/${lessonId}`,
          duration: estSec,
          durationFormatted: formatSeconds(estSec),
          size: stat.size,
          sizeFormatted: formatBytes(stat.size),
          courseId: rootCourseId,
          courseName: rootCourseTitle,
          subCourseId: 'foundations-core',
          subCourseName: 'Module 01 - Core Lessons',
          description: `Direct root lesson: ${cleanTitle}`,
          thumbnail:
            lessonThumb ||
            'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80',
        });
        totalDuration += estSec;
        totalSize += stat.size;
      });

      const rootCourse: Course = {
        id: rootCourseId,
        name: rootCourseTitle,
        title: rootCourseTitle,
        instructor: 'Local Library Faculty',
        category: 'Media & Production',
        level: 'All Levels',
        description: 'Locally discovered instructional video lessons cataloged from your video root directory.',
        path: path.relative(process.cwd(), absRoot),
        thumbnail:
          lessons[0]?.thumbnail ||
          'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80',
        subCourseCount: 1,
        lessonCount: lessons.length,
        totalDuration,
        totalDurationFormatted: formatDurationHuman(totalDuration),
        totalSize,
        totalSizeFormatted: formatBytes(totalSize),
        subCourses: [
          {
            id: 'foundations-core',
            name: 'Module 01 - Core Lessons',
            order: 1,
            path: path.relative(process.cwd(), absRoot),
            courseId: rootCourseId,
            lessonCount: lessons.length,
            totalDuration,
            totalDurationFormatted: formatDurationHuman(totalDuration),
            lessons,
          },
        ],
        tags: ['Local Media', 'Self-Paced'],
        featured: false,
        rating: 4.8,
        updatedAt: new Date().toISOString(),
      };

      linkLessonsSequentially(rootCourse);
      localCourses.push(rootCourse);
      categorySet.add(rootCourse.category);
    }
  } catch (err) {
    console.error(`Error scanning course library at ${absRoot}:`, err);
  }

  // Only real local courses are used (no curated demo injection)
  const combinedCourses = [...localCourses];

  let totalSubCourses = 0;
  let totalLessons = 0;
  let totalDuration = 0;
  let totalSize = 0;

  combinedCourses.forEach((c) => {
    totalSubCourses += c.subCourseCount;
    totalLessons += c.lessonCount;
    totalDuration += c.totalDuration;
    totalSize += c.totalSize;
  });

  return {
    courses: combinedCourses,
    totalCourses: combinedCourses.length,
    totalSubCourses,
    totalLessons,
    totalDuration,
    totalDurationFormatted: formatDurationHuman(totalDuration),
    totalSize,
    totalSizeFormatted: formatBytes(totalSize),
    categories: Array.from(categorySet),
    scannedAt: new Date().toISOString(),
    videoRoot: absRoot,
    isDemoFallback: localCourses.length === 0,
  };
}
