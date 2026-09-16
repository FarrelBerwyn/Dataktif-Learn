import express, { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import {
  scanCourseLibrary,
  LibraryData,
  Course,
  Lesson,
} from './server/courseScanner';
import { libraryManager } from './server/libraryManager';
import { getThumbnailFilePath } from './server/thumbnailGenerator';
import {
  extractPlaylistId,
  extractVideoId,
  fetchYouTubePlaylistMetadata,
  fetchYouTubeVideoWithChapters,
  convertPlaylistToCourse,
  convertVideoChaptersToCourse,
  getStoredYouTubeCourses,
  saveYouTubeCourse,
  deleteStoredYouTubeCourse,
} from './server/youtubeService';

const CONFIG_FILE = path.join(process.cwd(), 'config.json');

interface AppConfig {
  videoFolder: string;
  autoRescanIntervalSeconds: number;
}

const DEFAULT_CONFIG: AppConfig = {
  videoFolder: './videos',
  autoRescanIntervalSeconds: 60,
};

function loadConfig(): AppConfig {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const data = fs.readFileSync(CONFIG_FILE, 'utf-8');
      return { ...DEFAULT_CONFIG, ...JSON.parse(data) };
    }
  } catch (err) {
    console.error('Error reading config file, using defaults:', err);
  }
  return { ...DEFAULT_CONFIG };
}

function saveConfig(cfg: AppConfig): void {
  try {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(cfg, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving config file:', err);
  }
}

let activeConfig = loadConfig();

// In-memory cached library state
let cachedLibrary: LibraryData = scanCourseLibrary(activeConfig.videoFolder);

function refreshLibrary(): LibraryData {
  cachedLibrary = scanCourseLibrary(activeConfig.videoFolder);
  return cachedLibrary;
}

// User lesson progress storage in JSON
const DATA_DIR = path.join(process.cwd(), '.data');
if (!fs.existsSync(DATA_DIR)) {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  } catch {}
}
const PROGRESS_FILE = path.join(DATA_DIR, 'progress.json');
const LEGACY_PROGRESS_FILE = path.join(process.cwd(), 'progress.json');

interface ProgressData {
  completedLessons: string[]; // lesson ids
  progressPercentByCourse: Record<string, number>;
  playbackTimes: Record<string, number>; // lessonId -> currentTime in seconds
  lastWatchedLessonId?: string;
  notes: Array<{
    id: string;
    lessonId: string;
    courseId: string;
    timestamp: number;
    text: string;
    createdAt: string;
  }>;
}

function loadProgress(): ProgressData {
  try {
    if (fs.existsSync(PROGRESS_FILE)) {
      return JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf-8'));
    }
    // Migration fallback from root progress.json
    if (fs.existsSync(LEGACY_PROGRESS_FILE)) {
      const data = JSON.parse(fs.readFileSync(LEGACY_PROGRESS_FILE, 'utf-8'));
      saveProgress(data);
      try {
        fs.unlinkSync(LEGACY_PROGRESS_FILE);
      } catch {}
      return data;
    }
  } catch {}
  return {
    completedLessons: [],
    progressPercentByCourse: {},
    playbackTimes: {},
    notes: [],
  };
}

function saveProgress(data: ProgressData): void {
  try {
    fs.writeFileSync(PROGRESS_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.warn('Could not save progress.json:', err);
  }
}

let userProgress = loadProgress();

// Helper to locate a lesson by ID
function findLessonById(lessonId: string): {
  lesson: Lesson;
  course: Course;
} | null {
  for (const course of cachedLibrary.courses) {
    for (const sub of course.subCourses) {
      for (const l of sub.lessons) {
        if (l.id === lessonId) {
          return { lesson: l, course };
        }
      }
    }
  }
  return null;
}

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  app.use(express.json());

  // ==========================================
  // COURSE LIBRARIES MANAGER API ROUTES
  // ==========================================

  // GET /api/libraries - list all libraries & summary
  app.get('/api/libraries', (req: Request, res: Response) => {
    const libraries = libraryManager.getLibraries();
    const summary = libraryManager.getSummary();
    res.json({ libraries, summary });
  });

  // POST /api/libraries/validate - test if path exists, readable, count courses
  app.post('/api/libraries/validate', (req: Request, res: Response) => {
    const { path: folderPath, currentId } = req.body;
    const result = libraryManager.validatePath(folderPath, currentId);
    res.json(result);
  });

  // POST /api/libraries - add a new library folder
  app.post('/api/libraries', (req: Request, res: Response) => {
    const { name, path: folderPath } = req.body;
    try {
      const lib = libraryManager.addLibrary(name, folderPath);
      res.status(201).json({
        success: true,
        message: `Library "${lib.name}" added and indexed successfully.`,
        library: lib,
        summary: libraryManager.getSummary(),
      });
    } catch (err: any) {
      res.status(400).json({ valid: false, error: err.message || 'Failed to add library' });
    }
  });

  // PUT /api/libraries/:id - edit library name, path, enabled, or default status
  app.put('/api/libraries/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const { name, path: folderPath, enabled, isDefault } = req.body;
    try {
      const updated = libraryManager.updateLibrary(id, {
        name,
        path: folderPath,
        enabled,
        isDefault,
      });
      res.json({
        success: true,
        message: `Library "${updated.name}" updated successfully.`,
        library: updated,
        summary: libraryManager.getSummary(),
      });
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Failed to update library' });
    }
  });

  // DELETE /api/libraries/:id - ONLY removes configuration; NEVER deletes physical files!
  app.delete('/api/libraries/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const success = libraryManager.deleteLibrary(id);
    if (!success) {
      res.status(404).json({ error: `Library with ID "${id}" not found.` });
      return;
    }
    res.json({
      success: true,
      message: 'Library removed from configuration. Physical video files were NOT deleted.',
      summary: libraryManager.getSummary(),
    });
  });

  // POST /api/libraries/:id/rescan - independently rescan one library
  app.post('/api/libraries/:id/rescan', (req: Request, res: Response) => {
    const { id } = req.params;
    try {
      const lib = libraryManager.rescanLibrary(id);
      res.json({
        success: true,
        message: `Library "${lib.name}" rescanned: ${lib.courseCount} courses, ${lib.lessonCount} lessons.`,
        library: lib,
        summary: libraryManager.getSummary(),
      });
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Failed to rescan library' });
    }
  });

  // POST /api/libraries/rescan-all - rescan all enabled libraries
  app.post('/api/libraries/rescan-all', (req: Request, res: Response) => {
    const summary = libraryManager.rescanAllLibraries();
    res.json({
      success: true,
      message: `Rescanned all libraries. Total active: ${summary.totalCourses} courses, ${summary.totalLessons} lessons.`,
      libraries: libraryManager.getLibraries(),
      summary,
    });
  });

  // POST /api/libraries/:id/enable - enable a library
  app.post('/api/libraries/:id/enable', (req: Request, res: Response) => {
    const { id } = req.params;
    try {
      const lib = libraryManager.enableLibrary(id);
      res.json({
        success: true,
        message: `Library "${lib.name}" enabled. Courses restored to catalog.`,
        library: lib,
        summary: libraryManager.getSummary(),
      });
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Failed to enable library' });
    }
  });

  // POST /api/libraries/:id/disable - disable a library
  app.post('/api/libraries/:id/disable', (req: Request, res: Response) => {
    const { id } = req.params;
    try {
      const lib = libraryManager.disableLibrary(id);
      res.json({
        success: true,
        message: `Library "${lib.name}" disabled. Courses hidden from catalog.`,
        library: lib,
        summary: libraryManager.getSummary(),
      });
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Failed to disable library' });
    }
  });

  // POST /api/libraries/:id/set-default - designate library as primary/default
  app.post('/api/libraries/:id/set-default', (req: Request, res: Response) => {
    const { id } = req.params;
    try {
      const lib = libraryManager.setDefaultLibrary(id);
      res.json({
        success: true,
        message: `Library "${lib.name}" is now the primary default library.`,
        library: lib,
        summary: libraryManager.getSummary(),
      });
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Failed to set default library' });
    }
  });

  // ==========================================
  // YOUTUBE VIDEO & PLAYLIST COURSE API ROUTES
  // ==========================================

  // POST /api/youtube/preview - Preview a YouTube video (with chapters) or playlist before adding
  app.post('/api/youtube/preview', async (req: Request, res: Response) => {
    const { url, mode, customChaptersText } = req.body;
    if (!url || typeof url !== 'string') {
      res.status(400).json({ error: 'URL atau ID YouTube diperlukan.' });
      return;
    }

    try {
      const isPlaylistMode = mode === 'playlist';
      const isChaptersMode = mode === 'chapters';

      // Auto-detect if mode is not strictly specified
      const hasPlaylistId = Boolean(extractPlaylistId(url));
      const hasVideoId = Boolean(extractVideoId(url));

      let targetMode: 'chapters' | 'playlist' = 'chapters';
      if (isPlaylistMode) {
        targetMode = 'playlist';
      } else if (isChaptersMode) {
        targetMode = 'chapters';
      } else if (hasPlaylistId && !hasVideoId) {
        targetMode = 'playlist';
      } else {
        targetMode = 'chapters';
      }

      if (targetMode === 'chapters') {
        const videoCourse = await fetchYouTubeVideoWithChapters(url, customChaptersText);
        res.json({ success: true, mode: 'chapters', videoCourse });
      } else {
        const playlist = await fetchYouTubePlaylistMetadata(url);
        res.json({ success: true, mode: 'playlist', playlist });
      }
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Gagal memuat data YouTube.' });
    }
  });

  // GET /api/youtube/courses - Get list of added YouTube courses
  app.get('/api/youtube/courses', (req: Request, res: Response) => {
    const courses = getStoredYouTubeCourses();
    res.json({ success: true, courses });
  });

  // POST /api/youtube/courses - Add a YouTube video (with chapters) or playlist as course
  app.post('/api/youtube/courses', async (req: Request, res: Response) => {
    const { url, mode, category, level, customTitle, customChaptersText } = req.body;
    if (!url || typeof url !== 'string') {
      res.status(400).json({ error: 'URL atau ID YouTube diperlukan.' });
      return;
    }

    try {
      let course: Course;
      const targetMode: 'chapters' | 'playlist' = mode === 'playlist' ? 'playlist' : 'chapters';

      if (targetMode === 'chapters') {
        const videoCourse = await fetchYouTubeVideoWithChapters(url, customChaptersText);
        if (customTitle && customTitle.trim()) {
          videoCourse.title = customTitle.trim();
        }
        course = convertVideoChaptersToCourse(videoCourse, category, level);
      } else {
        const playlist = await fetchYouTubePlaylistMetadata(url);
        if (customTitle && customTitle.trim()) {
          playlist.title = customTitle.trim();
        }
        course = convertPlaylistToCourse(playlist, category, level);
      }

      saveYouTubeCourse(course);
      libraryManager.rebuildMergedIndex();

      res.status(201).json({
        success: true,
        message: `Kursus YouTube "${course.title}" berhasil ditambahkan ke Library!`,
        course,
        library: libraryManager.getMergedLibrary(),
      });
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Gagal menambahkan kursus YouTube.' });
    }
  });

  // DELETE /api/youtube/courses/:id - Delete a YouTube course
  app.delete('/api/youtube/courses/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    try {
      const updated = deleteStoredYouTubeCourse(id);
      libraryManager.rebuildMergedIndex();
      res.json({
        success: true,
        message: 'Kursus YouTube berhasil dihapus dari Library.',
        courses: updated,
        library: libraryManager.getMergedLibrary(),
      });
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Gagal menghapus kursus YouTube.' });
    }
  });

  // ==========================================
  // CORE PLATFORM API ROUTES
  // ==========================================

  // Health check
  app.get('/api/health', (req: Request, res: Response) => {
    const libData = libraryManager.getMergedLibrary();
    res.json({
      status: 'ok',
      service: 'Milk Blue Video Course Platform Server',
      timestamp: new Date().toISOString(),
      librariesSummary: libraryManager.getSummary(),
      stats: {
        totalCourses: libData.totalCourses,
        totalLessons: libData.totalLessons,
        categories: libData.categories,
      },
    });
  });

  // Library configuration
  app.get('/api/config', (req: Request, res: Response) => {
    const libData = libraryManager.getMergedLibrary();
    const libs = libraryManager.getLibraries();
    const primary = libs.find((l) => l.isDefault) || libs[0];
    const absPath = primary ? path.resolve(primary.path) : path.join(process.cwd(), activeConfig.videoFolder);

    res.json({
      config: activeConfig,
      resolvedPath: absPath,
      exists: fs.existsSync(absPath),
      totalCourses: libData.totalCourses,
      totalLessons: libData.totalLessons,
      isDemoFallback: libData.isDemoFallback,
    });
  });

  app.post('/api/config', (req: Request, res: Response) => {
    const { videoFolder } = req.body;
    if (videoFolder && typeof videoFolder === 'string') {
      activeConfig.videoFolder = videoFolder.trim();
      saveConfig(activeConfig);
      const libs = libraryManager.getLibraries();
      if (libs.length > 0) {
        try {
          const primary = libs.find((l) => l.isDefault) || libs[0];
          libraryManager.updateLibrary(primary.id, { path: activeConfig.videoFolder });
        } catch {}
      }
    }
    const libData = libraryManager.getMergedLibrary();
    res.json({
      success: true,
      message: `Library path updated to ${activeConfig.videoFolder}`,
      config: activeConfig,
      library: libData,
    });
  });

  // Full Library Hierarchy
  app.get('/api/library', (req: Request, res: Response) => {
    res.json(libraryManager.getMergedLibrary());
  });

  // Force Rescan of directory
  app.post(['/api/library/rescan', '/api/videos/rescan'], (req: Request, res: Response) => {
    const summary = libraryManager.rescanAllLibraries();
    const fresh = libraryManager.getMergedLibrary();
    res.json({
      success: true,
      message: `Scanned ${fresh.totalCourses} course(s) across ${summary.activeLibraries} active library/libraries.`,
      library: fresh,
      summary,
    });
  });

  // Courses list with filtering, searching, sorting, and libraryId filter
  app.get('/api/courses', (req: Request, res: Response) => {
    const { category, search, level, sort, libraryId } = req.query;
    const merged = libraryManager.getMergedLibrary();
    let list = [...merged.courses];

    if (libraryId && typeof libraryId === 'string' && libraryId !== 'all') {
      list = list.filter((c) => c.libraryId === libraryId);
    }

    if (category && typeof category === 'string' && category.toLowerCase() !== 'all') {
      const catLower = category.toLowerCase();
      list = list.filter((c) => c.category.toLowerCase() === catLower);
    }

    if (level && typeof level === 'string' && level.toLowerCase() !== 'all') {
      const lvlLower = level.toLowerCase();
      list = list.filter((c) => c.level.toLowerCase() === lvlLower);
    }

    if (search && typeof search === 'string' && search.trim()) {
      const q = search.toLowerCase().trim();
      list = list.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          c.name.toLowerCase().includes(q) ||
          c.description.toLowerCase().includes(q) ||
          c.instructor.toLowerCase().includes(q) ||
          c.tags.some((t) => t.toLowerCase().includes(q)) ||
          c.subCourses.some((s) =>
            s.lessons.some((l) => l.title.toLowerCase().includes(q))
          )
      );
    }

    if (sort === 'duration-asc') {
      list.sort((a, b) => a.totalDuration - b.totalDuration);
    } else if (sort === 'duration-desc') {
      list.sort((a, b) => b.totalDuration - a.totalDuration);
    } else if (sort === 'lessons') {
      list.sort((a, b) => b.lessonCount - a.lessonCount);
    } else if (sort === 'title') {
      list.sort((a, b) => a.title.localeCompare(b.title));
    }

    res.json({
      courses: list,
      total: list.length,
      categories: merged.categories,
    });
  });

  // Single Course by ID (supports scoped IDs like library-001/ai-automation)
  app.get('/api/courses/:courseId(*)', (req: Request, res: Response) => {
    const courseId = req.params.courseId;
    const course = libraryManager.findCourseById(courseId);

    if (!course) {
      res.status(404).json({ error: 'Course not found' });
      return;
    }

    const merged = libraryManager.getMergedLibrary();
    // Related courses in same category
    const related = merged.courses
      .filter((c) => c.id !== courseId && (c.category === course.category || c.level === course.level))
      .slice(0, 3);

    res.json({
      course,
      related,
    });
  });

  // Single SubCourse (Module) by ID
  app.get('/api/courses/:courseId/subcourses/:subCourseId', (req: Request, res: Response) => {
    const { courseId, subCourseId } = req.params;
    const course = libraryManager.findCourseById(courseId);
    if (!course) {
      res.status(404).json({ error: 'Course not found' });
      return;
    }
    const subCourse = course.subCourses.find((s) => s.id === subCourseId);
    if (!subCourse) {
      res.status(404).json({ error: 'SubCourse module not found' });
      return;
    }
    res.json({
      courseId: course.id,
      courseTitle: course.title,
      subCourse,
    });
  });

  // Single Lesson with adjacent navigation links
  app.get('/api/lessons/:lessonId(*)', (req: Request, res: Response) => {
    const lessonId = req.params.lessonId;
    const found = libraryManager.findLessonById(lessonId);

    if (!found) {
      res.status(404).json({ error: 'Lesson not found' });
      return;
    }

    const { lesson, course } = found;

    // Find previous and next lesson objects
    const allCourseLessons: Lesson[] = [];
    course.subCourses.forEach((s) => s.lessons.forEach((l) => allCourseLessons.push(l)));

    const currentIndex = allCourseLessons.findIndex((l) => l.id === lessonId);
    const prev = currentIndex > 0 ? allCourseLessons[currentIndex - 1] : null;
    const next = currentIndex < allCourseLessons.length - 1 ? allCourseLessons[currentIndex + 1] : null;

    res.json({
      lesson,
      course: {
        id: course.id,
        title: course.title,
        instructor: course.instructor,
        category: course.category,
        subCourses: course.subCourses,
      },
      previousLesson: prev
        ? { id: prev.id, title: prev.title, subCourseName: prev.subCourseName }
        : null,
      nextLesson: next
        ? { id: next.id, title: next.title, subCourseName: next.subCourseName }
        : null,
      isFirstLesson: currentIndex === 0,
      isLastLesson: currentIndex === allCourseLessons.length - 1,
      totalLessonsInCourse: allCourseLessons.length,
      currentLessonIndex: currentIndex + 1,
    });
  });

  // User progress and notes
  app.get('/api/user/progress', (req: Request, res: Response) => {
    res.json(userProgress);
  });

  app.post('/api/user/progress', (req: Request, res: Response) => {
    const { lessonId, completed, currentTime, courseId, progressPercent } = req.body;

    if (lessonId && completed !== undefined) {
      if (completed) {
        if (!userProgress.completedLessons.includes(lessonId)) {
          userProgress.completedLessons.push(lessonId);
        }
      } else {
        userProgress.completedLessons = userProgress.completedLessons.filter((id) => id !== lessonId);
      }
    }

    if (lessonId && typeof currentTime === 'number') {
      userProgress.playbackTimes[lessonId] = currentTime;
      userProgress.lastWatchedLessonId = lessonId;
    }

    if (courseId && typeof progressPercent === 'number') {
      userProgress.progressPercentByCourse[courseId] = progressPercent;
    }

    saveProgress(userProgress);
    res.json({ success: true, progress: userProgress });
  });

  // Notes API
  app.get('/api/user/notes', (req: Request, res: Response) => {
    const { lessonId } = req.query;
    let notes = userProgress.notes || [];
    if (lessonId && typeof lessonId === 'string') {
      notes = notes.filter((n) => n.lessonId === lessonId);
    }
    res.json({ notes });
  });

  app.post('/api/user/notes', (req: Request, res: Response) => {
    const { lessonId, courseId, timestamp, text } = req.body;
    if (!lessonId || !text) {
      res.status(400).json({ error: 'lessonId and text are required' });
      return;
    }

    const note = {
      id: `note-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      lessonId,
      courseId: courseId || '',
      timestamp: typeof timestamp === 'number' ? timestamp : 0,
      text: text.trim(),
      createdAt: new Date().toISOString(),
    };

    userProgress.notes = userProgress.notes || [];
    userProgress.notes.unshift(note);
    saveProgress(userProgress);

    res.json({ success: true, note });
  });

  app.delete('/api/user/notes/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    userProgress.notes = (userProgress.notes || []).filter((n) => n.id !== id);
    saveProgress(userProgress);
    res.json({ success: true });
  });

  // Stream video with full HTTP 206 Range requests and strict library access security
  const handleStreamRequest = (req: Request, res: Response, targetPathOrId: string) => {
    const resolution = libraryManager.resolveVideoPath(targetPathOrId);

    if (resolution.forbidden) {
      res.status(403).send('Forbidden: Access to video files outside registered and enabled course libraries is prohibited.');
      return;
    }

    if (resolution.remoteUrl) {
      res.redirect(resolution.remoteUrl);
      return;
    }

    if (!resolution.resolvedPath || !fs.existsSync(resolution.resolvedPath)) {
      res.status(404).send('Video file or stream target not found.');
      return;
    }

    const resolvedFilePath = resolution.resolvedPath;

    // Read file stat
    let stat: fs.Stats;
    try {
      stat = fs.statSync(resolvedFilePath);
    } catch {
      res.status(500).send('Unable to read video file stats');
      return;
    }

    const fileSize = stat.size;
    const range = req.headers.range;

    const ext = path.extname(resolvedFilePath).toLowerCase();
    let contentType = 'video/mp4';
    if (ext === '.webm') contentType = 'video/webm';
    else if (ext === '.mov') contentType = 'video/quicktime';
    else if (ext === '.mkv') contentType = 'video/x-matroska';
    else if (ext === '.ogg') contentType = 'video/ogg';

    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

      if (start >= fileSize || end >= fileSize) {
        res
          .status(416)
          .set({
            'Content-Range': `bytes */${fileSize}`,
          })
          .send('Requested range not satisfiable');
        return;
      }

      const chunksize = end - start + 1;
      const file = fs.createReadStream(resolvedFilePath, { start, end });

      const head = {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': contentType,
      };

      res.writeHead(206, head);
      file.pipe(res);
    } else {
      const head = {
        'Content-Length': fileSize,
        'Content-Type': contentType,
        'Accept-Ranges': 'bytes',
      };
      res.writeHead(200, head);
      fs.createReadStream(resolvedFilePath).pipe(res);
    }
  };

  // Primary video streaming endpoint (supports slashes in lesson ID)
  app.get('/api/video/:id(*)', (req: Request, res: Response) => {
    handleStreamRequest(req, res, req.params.id);
  });

  // Legacy streaming endpoint by filename
  app.get('/api/stream/:filename(*)', (req: Request, res: Response) => {
    handleStreamRequest(req, res, req.params.filename);
  });

  // Serve static thumbnails
  app.get('/api/thumbnails', (req: Request, res: Response) => {
    const fileParam = req.query.file;
    if (typeof fileParam !== 'string') {
      res.status(400).send('Missing file param');
      return;
    }
    const absPath = path.isAbsolute(fileParam)
      ? fileParam
      : path.join(process.cwd(), fileParam);

    if (fs.existsSync(absPath)) {
      res.sendFile(absPath);
    } else {
      res.status(404).send('Thumbnail not found');
    }
  });

  // Serve dynamically extracted video thumbnail frames
  app.get('/api/thumbnails/generated/:hash', (req: Request, res: Response) => {
    const rawHash = req.params.hash.replace(/\.jpg$/i, '');
    const targetPath = getThumbnailFilePath(rawHash);
    if (targetPath && fs.existsSync(targetPath)) {
      res.setHeader('Cache-Control', 'public, max-age=86400');
      res.setHeader('Content-Type', 'image/jpeg');
      res.sendFile(targetPath);
    } else {
      res.status(404).send('Thumbnail not found');
    }
  });

  // Vite development middleware or production static handling
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const tryListen = (port: number) => {
    const server = app.listen(port, '0.0.0.0', () => {
      console.log(`Milk Blue Course Platform Server running on http://localhost:${port}`);
    });

    server.on('error', (err: any) => {
      if (err.code === 'EADDRINUSE') {
        console.warn(`Port ${port} is in use, attempting port ${port + 1}...`);
        tryListen(port + 1);
      } else {
        console.error('Server error:', err);
      }
    });
  };

  tryListen(PORT);
}

startServer();
