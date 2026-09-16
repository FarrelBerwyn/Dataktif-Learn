import fs from 'fs';
import path from 'path';
import {
  Course,
  Lesson,
  SubCourse,
  LibraryData,
  CourseLibraryConfig,
  CourseLibrarySummary,
  ValidatePathResult,
  LibraryStatus,
} from '../src/types';
import {
  scanCourseDirectory,
  ALLOWED_EXTENSIONS,
  formatBytes,
  formatSeconds,
  formatDurationHuman,
  naturalSort,
  parseCleanTitle,
  slugify,
  linkLessonsSequentially,
  CURATED_COURSES,
} from './courseScanner';
import { getStoredYouTubeCourses } from './youtubeService';

const DATA_DIR = path.join(process.cwd(), '.data');
const LIBRARIES_FILE = path.join(DATA_DIR, 'libraries.json');
const CONFIG_FILE = path.join(process.cwd(), 'config.json');

interface LibraryStore {
  libraries: CourseLibraryConfig[];
  version: number;
}

// Ensure .data folder exists
function ensureDataDir(): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  } catch (err) {
    console.error('Error creating .data directory:', err);
  }
}

/**
 * Resolve absolute path from input (supports Windows drives C:\..., D:\..., UNC \\NAS\..., POSIX, or relative).
 */
export function resolveNormalizedPath(inputPath: string): string {
  if (!inputPath || typeof inputPath !== 'string') return '';
  const trimmed = inputPath.trim();

  // If starts with UNC path on Windows (e.g. \\NAS\Courses or //NAS/Courses)
  if (trimmed.startsWith('\\\\') || trimmed.startsWith('//')) {
    return path.normalize(trimmed);
  }

  // If standard absolute path or Windows drive letter (e.g. D:\Courses)
  if (path.isAbsolute(trimmed) || /^[a-zA-Z]:[\\/]/.test(trimmed)) {
    return path.normalize(trimmed);
  }

  // Relative to process.cwd()
  return path.resolve(process.cwd(), trimmed);
}

/**
 * Scan a single library directory independently.
 * Does NOT recursively scan parent directories or arbitrary locations.
 */
export function scanSingleLibrary(lib: CourseLibraryConfig): {
  courses: Course[];
  courseCount: number;
  moduleCount: number;
  lessonCount: number;
  status: LibraryStatus;
  error?: string;
} {
  const absPath = resolveNormalizedPath(lib.path);

  // 1. Check folder existence
  if (!fs.existsSync(absPath)) {
    return {
      courses: [],
      courseCount: 0,
      moduleCount: 0,
      lessonCount: 0,
      status: 'missing',
      error: 'Folder does not exist or drive is disconnected.',
    };
  }

  // 2. Check if it is a directory
  try {
    const stat = fs.statSync(absPath);
    if (!stat.isDirectory()) {
      return {
        courses: [],
        courseCount: 0,
        moduleCount: 0,
        lessonCount: 0,
        status: 'error',
        error: 'Specified path is not a directory.',
      };
    }
  } catch (err: any) {
    return {
      courses: [],
      courseCount: 0,
      moduleCount: 0,
      lessonCount: 0,
      status: 'error',
      error: err.message || 'Cannot access folder.',
    };
  }

  // 3. Check read permissions
  try {
    fs.accessSync(absPath, fs.constants.R_OK);
  } catch {
    return {
      courses: [],
      courseCount: 0,
      moduleCount: 0,
      lessonCount: 0,
      status: 'error',
      error: 'Access denied: Folder is not readable.',
    };
  }

  const courses: Course[] = [];
  let totalModules = 0;
  let totalLessons = 0;

  try {
    const entries = fs.readdirSync(absPath).filter((e) => !e.startsWith('.'));
    entries.sort(naturalSort);

    const subDirs: string[] = [];
    const directVideos: string[] = [];

    for (const entry of entries) {
      const fullPath = path.join(absPath, entry);
      try {
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
          subDirs.push(entry);
        } else if (ALLOWED_EXTENSIONS.includes(path.extname(entry).toLowerCase())) {
          directVideos.push(entry);
        }
      } catch {}
    }

    // If the added folder is a dedicated course folder that contains sub-folders (modules),
    // treat the entire folder as 1 Main Course containing sub-main-courses (modules),
    // so all content stays unified under the primary course topic.
    const isDedicatedCourseFolder =
      path.basename(absPath).toLowerCase() !== 'videos' &&
      !absPath.endsWith(path.sep + 'videos');

    if (isDedicatedCourseFolder) {
      const singleMainCourse = scanCourseDirectory(absPath, path.relative(process.cwd(), absPath));
      if (singleMainCourse && singleMainCourse.lessonCount > 0) {
        const scopedCourseId = `${lib.id}/${singleMainCourse.id}`;
        singleMainCourse.id = scopedCourseId;
        singleMainCourse.libraryId = lib.id;
        singleMainCourse.libraryName = lib.name;

        // If user gave a specific customized name for the library, use it
        if (lib.name && lib.name.trim() && lib.name !== 'Claude' && lib.name !== 'Main Course Library') {
          singleMainCourse.title = lib.name.trim();
        }

        singleMainCourse.subCourses.forEach((sub) => {
          sub.courseId = scopedCourseId;
          sub.lessons.forEach((l) => {
            l.courseId = scopedCourseId;
            l.courseName = singleMainCourse.title;
            l.libraryId = lib.id;
            l.libraryName = lib.name;
            l.url = `/api/video/${encodeURIComponent(l.id)}`;
          });
        });

        linkLessonsSequentially(singleMainCourse);
        courses.push(singleMainCourse);
        totalModules = singleMainCourse.subCourseCount;
        totalLessons = singleMainCourse.lessonCount;

        return {
          courses,
          courseCount: 1,
          moduleCount: totalModules,
          lessonCount: totalLessons,
          status: 'active',
        };
      }
    }

    // A. Otherwise, scan subdirectories as individual courses
    for (const subDir of subDirs) {
      const courseAbs = path.join(absPath, subDir);
      const relativeCoursePath = path.relative(process.cwd(), courseAbs);
      const scanned = scanCourseDirectory(courseAbs, relativeCoursePath);
      if (scanned) {
        // Tag with library context to avoid conflict across multiple libraries
        const scopedCourseId = `${lib.id}/${scanned.id}`;
        scanned.id = scopedCourseId;
        scanned.libraryId = lib.id;
        scanned.libraryName = lib.name;

        // Also update subcourse and lesson references
        scanned.subCourses.forEach((sub) => {
          sub.courseId = scopedCourseId;
          sub.lessons.forEach((l) => {
            l.courseId = scopedCourseId;
            l.courseName = scanned.title;
            l.libraryId = lib.id;
            l.libraryName = lib.name;
            l.url = `/api/video/${encodeURIComponent(l.id)}`;
          });
        });

        linkLessonsSequentially(scanned);
        courses.push(scanned);
        totalModules += scanned.subCourseCount;
        totalLessons += scanned.lessonCount;
      }
    }

    // B. Direct loose videos in library root
    if (directVideos.length > 0) {
      const rootCourseId = `${lib.id}/general-studies`;
      const rootCourseTitle = `${lib.name} - Direct Media`;
      const lessons: Lesson[] = [];
      let totalDuration = 0;
      let totalSize = 0;

      directVideos.forEach((file, idx) => {
        const fileAbs = path.join(absPath, file);
        try {
          const stat = fs.statSync(fileAbs);
          const ext = path.extname(file).toLowerCase();
          const lessonId = `${rootCourseId}-${slugify(path.basename(file, ext))}`;
          const cleanTitle = parseCleanTitle(file);
          const estSec = Math.max(30, Math.round(stat.size / (1024 * 1024 * 0.4)));

          lessons.push({
            id: lessonId,
            order: idx + 1,
            globalIndex: idx,
            title: cleanTitle,
            filename: file,
            path: fileAbs,
            relativePath: path.relative(process.cwd(), fileAbs),
            url: `/api/video/${encodeURIComponent(lessonId)}`,
            duration: estSec,
            durationFormatted: formatSeconds(estSec),
            size: stat.size,
            sizeFormatted: formatBytes(stat.size),
            courseId: rootCourseId,
            courseName: rootCourseTitle,
            subCourseId: `${lib.id}-core-media`,
            subCourseName: 'Module 01 - Media Lessons',
            libraryId: lib.id,
            libraryName: lib.name,
            description: `Media lesson from ${lib.name}: ${cleanTitle}`,
            thumbnail:
              'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80',
          });
          totalDuration += estSec;
          totalSize += stat.size;
        } catch {}
      });

      if (lessons.length > 0) {
        const rootCourse: Course = {
          id: rootCourseId,
          name: rootCourseTitle,
          title: rootCourseTitle,
          instructor: `${lib.name} Faculty`,
          category: 'Media & Production',
          level: 'All Levels',
          description: `Direct lessons cataloged from library root "${lib.name}".`,
          path: path.relative(process.cwd(), absPath),
          thumbnail:
            'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80',
          subCourseCount: 1,
          lessonCount: lessons.length,
          totalDuration,
          totalDurationFormatted: formatDurationHuman(totalDuration),
          totalSize,
          totalSizeFormatted: formatBytes(totalSize),
          libraryId: lib.id,
          libraryName: lib.name,
          subCourses: [
            {
              id: `${lib.id}-core-media`,
              name: 'Module 01 - Media Lessons',
              order: 1,
              path: path.relative(process.cwd(), absPath),
              courseId: rootCourseId,
              lessonCount: lessons.length,
              totalDuration,
              totalDurationFormatted: formatDurationHuman(totalDuration),
              lessons,
            },
          ],
          tags: ['Local Library', lib.name],
          featured: false,
          rating: 4.8,
          updatedAt: new Date().toISOString(),
        };

        linkLessonsSequentially(rootCourse);
        courses.push(rootCourse);
        totalModules += 1;
        totalLessons += lessons.length;
      }
    }
  } catch (err: any) {
    console.error(`Error scanning library ${lib.name} (${absPath}):`, err);
    return {
      courses: [],
      courseCount: 0,
      moduleCount: 0,
      lessonCount: 0,
      status: 'error',
      error: err.message || 'Scanning encountered an error.',
    };
  }

  const finalStatus: LibraryStatus = lib.enabled ? 'active' : 'disabled';

  return {
    courses,
    courseCount: courses.length,
    moduleCount: totalModules,
    lessonCount: totalLessons,
    status: finalStatus,
  };
}

class LibraryManager {
  private store: LibraryStore = { libraries: [], version: 1 };
  private cachedCourses: Course[] = [];
  private cachedLibraryData: LibraryData | null = null;
  private isScanningGlobal = false;

  constructor() {
    this.initStore();
  }

  private initStore(): void {
    ensureDataDir();

    let loaded = false;
    if (fs.existsSync(LIBRARIES_FILE)) {
      try {
        const raw = fs.readFileSync(LIBRARIES_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.libraries)) {
          this.store = {
            libraries: parsed.libraries,
            version: parsed.version || 1,
          };
          loaded = true;
        }
      } catch (err) {
        console.error('Failed to parse existing libraries.json, recreating:', err);
      }
    }

    // Section 33 & 34: Migration from existing videoFolder or default fallback
    if (!loaded || this.store.libraries.length === 0) {
      let initialPath = './videos';
      if (fs.existsSync(CONFIG_FILE)) {
        try {
          const cfg = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'));
          if (cfg.videoFolder) {
            initialPath = cfg.videoFolder;
          }
        } catch {}
      }

      const defaultLib: CourseLibraryConfig = {
        id: 'library-001',
        name: 'Main Course Library',
        path: initialPath,
        enabled: true,
        isDefault: true,
        lastScanned: new Date().toISOString(),
        courseCount: 0,
        moduleCount: 0,
        lessonCount: 0,
        status: 'active',
      };

      this.store = {
        libraries: [defaultLib],
        version: 1,
      };

      this.saveStore();
    }

    // Perform initial scan
    this.rescanAllLibraries();
  }

  private saveStore(): void {
    ensureDataDir();
    try {
      fs.writeFileSync(LIBRARIES_FILE, JSON.stringify(this.store, null, 2), 'utf-8');
    } catch (err) {
      console.error('Error saving libraries.json:', err);
    }
  }

  public getLibraries(): CourseLibraryConfig[] {
    // Sort: default first, then enabled, then by name
    return [...this.store.libraries].sort((a, b) => {
      if (a.isDefault && !b.isDefault) return -1;
      if (!a.isDefault && b.isDefault) return 1;
      if (a.enabled && !b.enabled) return -1;
      if (!a.enabled && b.enabled) return 1;
      return a.name.localeCompare(b.name);
    });
  }

  public getLibraryById(id: string): CourseLibraryConfig | null {
    return this.store.libraries.find((l) => l.id === id) || null;
  }

  public getSummary(): CourseLibrarySummary {
    const libs = this.store.libraries;
    const active = libs.filter((l) => l.enabled && l.status === 'active').length;
    const disabled = libs.filter((l) => !l.enabled).length;

    let totalCourses = 0;
    let totalModules = 0;
    let totalLessons = 0;
    let mostRecentScan: string | undefined;

    libs.forEach((l) => {
      if (l.enabled) {
        totalCourses += l.courseCount || 0;
        totalModules += l.moduleCount || 0;
        totalLessons += l.lessonCount || 0;
      }
      if (l.lastScanned) {
        if (!mostRecentScan || new Date(l.lastScanned) > new Date(mostRecentScan)) {
          mostRecentScan = l.lastScanned;
        }
      }
    });

    return {
      totalLibraries: libs.length,
      activeLibraries: active,
      disabledLibraries: disabled,
      totalCourses,
      totalModules,
      totalLessons,
      lastUpdated: mostRecentScan || new Date().toISOString(),
    };
  }

  /**
   * Section 5: Validate a path before saving.
   */
  public validatePath(folderPath: string, currentLibId?: string): ValidatePathResult {
    if (!folderPath || typeof folderPath !== 'string' || !folderPath.trim()) {
      return { valid: false, error: 'Path is required.' };
    }

    const absPath = resolveNormalizedPath(folderPath);

    // 1. Check existence
    if (!fs.existsSync(absPath)) {
      return {
        valid: false,
        exists: false,
        error: `Folder does not exist: "${folderPath}". Please verify the drive or directory.`,
      };
    }

    // 2. Check if directory
    try {
      const stat = fs.statSync(absPath);
      if (!stat.isDirectory()) {
        return {
          valid: false,
          exists: true,
          isDir: false,
          error: `Target path is a file, not a directory: "${folderPath}".`,
        };
      }
    } catch (err: any) {
      return {
        valid: false,
        exists: false,
        error: `Cannot read target path: ${err.message}`,
      };
    }

    // 3. Check readability
    try {
      fs.accessSync(absPath, fs.constants.R_OK);
    } catch {
      return {
        valid: false,
        exists: true,
        readable: false,
        error: 'Access denied: Application does not have read permissions for this folder.',
      };
    }

    // 4. Check if already registered
    const duplicate = this.store.libraries.find((l) => {
      if (currentLibId && l.id === currentLibId) return false;
      const otherAbs = resolveNormalizedPath(l.path);
      return otherAbs.toLowerCase() === absPath.toLowerCase();
    });

    if (duplicate) {
      return {
        valid: false,
        exists: true,
        readable: true,
        error: `Path is already registered under library "${duplicate.name}".`,
      };
    }

    // 5. Inspect contents for courses and video lessons
    try {
      const tempLib: CourseLibraryConfig = {
        id: 'temp-validate',
        name: 'Validate Temp',
        path: folderPath,
        enabled: true,
        isDefault: false,
        courseCount: 0,
        moduleCount: 0,
        lessonCount: 0,
        status: 'active',
      };

      const result = scanSingleLibrary(tempLib);

      if (result.courseCount === 0 && result.lessonCount === 0) {
        return {
          valid: true,
          exists: true,
          readable: true,
          isDir: true,
          courseCount: 0,
          moduleCount: 0,
          lessonCount: 0,
          warning:
            'Folder exists and is readable, but no video files (.mp4, .webm, etc.) or course subfolders were detected yet.',
        };
      }

      return {
        valid: true,
        exists: true,
        readable: true,
        isDir: true,
        courseCount: result.courseCount,
        moduleCount: result.moduleCount,
        lessonCount: result.lessonCount,
      };
    } catch (err: any) {
      return {
        valid: false,
        exists: true,
        readable: true,
        error: `Failed to inspect folder contents: ${err.message}`,
      };
    }
  }

  /**
   * Section 18: Add a new library.
   */
  public addLibrary(name: string, folderPath: string): CourseLibraryConfig {
    const cleanName = (name || '').trim();
    const cleanPath = (folderPath || '').trim();

    if (!cleanName) throw new Error('Library name is required.');
    if (!cleanPath) throw new Error('Folder path is required.');

    const validation = this.validatePath(cleanPath);
    if (!validation.valid) {
      throw new Error(validation.error || 'Invalid folder path.');
    }

    // Generate library ID (e.g. library-002, library-003...)
    const existingIds = new Set(this.store.libraries.map((l) => l.id));
    let nextNum = this.store.libraries.length + 1;
    let id = `library-${nextNum.toString().padStart(3, '0')}`;
    while (existingIds.has(id)) {
      nextNum++;
      id = `library-${nextNum.toString().padStart(3, '0')}`;
    }

    // If this is the first library ever, make it default
    const isDefault = this.store.libraries.length === 0;

    const newLib: CourseLibraryConfig = {
      id,
      name: cleanName,
      path: cleanPath,
      enabled: true,
      isDefault,
      lastScanned: new Date().toISOString(),
      courseCount: validation.courseCount || 0,
      moduleCount: validation.moduleCount || 0,
      lessonCount: validation.lessonCount || 0,
      status: 'active',
    };

    this.store.libraries.push(newLib);
    this.saveStore();

    // Rescan library to build exact index and merge into global catalog
    this.rescanLibrary(id);
    return newLib;
  }

  /**
   * Section 11: Edit an existing library.
   */
  public updateLibrary(
    id: string,
    updates: {
      name?: string;
      path?: string;
      enabled?: boolean;
      isDefault?: boolean;
    }
  ): CourseLibraryConfig {
    const lib = this.store.libraries.find((l) => l.id === id);
    if (!lib) throw new Error(`Library with ID "${id}" not found.`);

    let pathChanged = false;
    if (updates.name !== undefined && updates.name.trim()) {
      lib.name = updates.name.trim();
    }

    if (updates.path !== undefined && updates.path.trim() && updates.path.trim() !== lib.path) {
      const newPath = updates.path.trim();
      const validation = this.validatePath(newPath, id);
      if (!validation.valid) {
        throw new Error(validation.error || 'Invalid folder path.');
      }
      lib.path = newPath;
      pathChanged = true;
    }

    if (updates.enabled !== undefined) {
      lib.enabled = Boolean(updates.enabled);
      lib.status = lib.enabled ? 'active' : 'disabled';
    }

    if (updates.isDefault !== undefined && updates.isDefault) {
      this.store.libraries.forEach((l) => {
        l.isDefault = l.id === id;
      });
      lib.enabled = true; // Default must be enabled
      lib.status = 'active';
    }

    this.saveStore();

    if (pathChanged || updates.enabled !== undefined) {
      this.rescanLibrary(id);
    } else {
      this.rebuildMergedIndex();
    }

    return lib;
  }

  /**
   * Section 12 & 21: Delete library.
   * CRITICAL: ONLY removes the library configuration from store.
   * NEVER executes fs.rm(), fs.unlink(), or deletes physical course files.
   */
  public deleteLibrary(id: string): boolean {
    const idx = this.store.libraries.findIndex((l) => l.id === id);
    if (idx === -1) return false;

    const removed = this.store.libraries[idx];
    this.store.libraries.splice(idx, 1);

    // Section 13: If removed library was default, pick another enabled library as default
    if (removed.isDefault && this.store.libraries.length > 0) {
      const nextEnabled = this.store.libraries.find((l) => l.enabled) || this.store.libraries[0];
      if (nextEnabled) {
        nextEnabled.isDefault = true;
        nextEnabled.enabled = true;
        nextEnabled.status = 'active';
      }
    }

    this.saveStore();
    this.rebuildMergedIndex();
    return true;
  }

  /**
   * Section 19: Enable library.
   */
  public enableLibrary(id: string): CourseLibraryConfig {
    const lib = this.store.libraries.find((l) => l.id === id);
    if (!lib) throw new Error(`Library "${id}" not found.`);

    lib.enabled = true;
    lib.status = 'active';
    this.saveStore();
    this.rescanLibrary(id);
    return lib;
  }

  /**
   * Section 20: Disable library.
   * Preserves configuration, removes courses from active catalog.
   */
  public disableLibrary(id: string): CourseLibraryConfig {
    const lib = this.store.libraries.find((l) => l.id === id);
    if (!lib) throw new Error(`Library "${id}" not found.`);

    lib.enabled = false;
    lib.status = 'disabled';

    // If this was default, reassign default to another enabled library
    if (lib.isDefault) {
      lib.isDefault = false;
      const nextEnabled = this.store.libraries.find((l) => l.id !== id && l.enabled);
      if (nextEnabled) {
        nextEnabled.isDefault = true;
      }
    }

    this.saveStore();
    this.rebuildMergedIndex();
    return lib;
  }

  /**
   * Section 13: Set default library.
   */
  public setDefaultLibrary(id: string): CourseLibraryConfig {
    const lib = this.store.libraries.find((l) => l.id === id);
    if (!lib) throw new Error(`Library "${id}" not found.`);

    this.store.libraries.forEach((l) => {
      l.isDefault = l.id === id;
    });

    lib.enabled = true;
    lib.status = 'active';
    this.saveStore();
    this.rebuildMergedIndex();
    return lib;
  }

  /**
   * Section 14: Rescan a single library independently.
   */
  public rescanLibrary(id: string): CourseLibraryConfig {
    const lib = this.store.libraries.find((l) => l.id === id);
    if (!lib) throw new Error(`Library "${id}" not found.`);

    lib.status = 'scanning';
    const scanResult = scanSingleLibrary(lib);

    lib.courseCount = scanResult.courseCount;
    lib.moduleCount = scanResult.moduleCount;
    lib.lessonCount = scanResult.lessonCount;
    lib.status = scanResult.status;
    lib.error = scanResult.error;
    lib.lastScanned = new Date().toISOString();

    this.saveStore();
    this.rebuildMergedIndex();
    return lib;
  }

  /**
   * Section 15: Global rescan of all enabled libraries.
   */
  public rescanAllLibraries(): CourseLibrarySummary {
    if (this.isScanningGlobal) return this.getSummary();
    this.isScanningGlobal = true;

    try {
      for (const lib of this.store.libraries) {
        if (lib.enabled) {
          lib.status = 'scanning';
          const res = scanSingleLibrary(lib);
          lib.courseCount = res.courseCount;
          lib.moduleCount = res.moduleCount;
          lib.lessonCount = res.lessonCount;
          lib.status = res.status;
          lib.error = res.error;
          lib.lastScanned = new Date().toISOString();
        } else {
          lib.status = 'disabled';
        }
      }
      this.saveStore();
      this.rebuildMergedIndex();
    } finally {
      this.isScanningGlobal = false;
    }

    return this.getSummary();
  }

  /**
   * Section 22: Merged course index from all enabled libraries.
   */
  public rebuildMergedIndex(): LibraryData {
    const allCourses: Course[] = [];
    const categorySet = new Set<string>();

    const enabledLibs = this.store.libraries.filter((l) => l.enabled);

    for (const lib of enabledLibs) {
      const scanResult = scanSingleLibrary(lib);
      for (const course of scanResult.courses) {
        course.source = 'local';
        course.subCourses.forEach((s) => s.lessons.forEach((l) => (l.source = 'local')));
        allCourses.push(course);
        if (course.category) categorySet.add(course.category);
      }
    }

    // Merge YouTube courses
    const ytCourses = getStoredYouTubeCourses();
    for (const ytCourse of ytCourses) {
      ytCourse.source = 'youtube';
      ytCourse.subCourses.forEach((s) => s.lessons.forEach((l) => (l.source = 'youtube')));
      allCourses.push(ytCourse);
      if (ytCourse.category) categorySet.add(ytCourse.category);
    }

    const hasLocalCourses = allCourses.length > 0;

    // Only real courses from enabled libraries are indexed (no curated demo injection)

    let totalSubCourses = 0;
    let totalLessons = 0;
    let totalDuration = 0;
    let totalSize = 0;

    allCourses.forEach((c) => {
      totalSubCourses += c.subCourseCount;
      totalLessons += c.lessonCount;
      totalDuration += c.totalDuration;
      totalSize += c.totalSize;
    });

    // Primary library path or fallback
    const defaultLib =
      enabledLibs.find((l) => l.isDefault) || enabledLibs[0] || this.store.libraries[0];

    const data: LibraryData = {
      courses: allCourses,
      totalCourses: allCourses.length,
      totalSubCourses,
      totalLessons,
      totalDuration,
      totalDurationFormatted: formatDurationHuman(totalDuration),
      totalSize,
      totalSizeFormatted: formatBytes(totalSize),
      categories: Array.from(categorySet),
      scannedAt: new Date().toISOString(),
      videoRoot: defaultLib ? defaultLib.path : './videos',
      isDemoFallback: false,
    };

    this.cachedCourses = allCourses;
    this.cachedLibraryData = data;
    return data;
  }

  public getMergedLibrary(): LibraryData {
    if (!this.cachedLibraryData) {
      return this.rebuildMergedIndex();
    }
    return this.cachedLibraryData;
  }

  public findCourseById(courseId: string): Course | null {
    const libData = this.getMergedLibrary();
    // Allow matching exact courseId or decoded
    const decoded = decodeURIComponent(courseId);
    return libData.courses.find((c) => c.id === courseId || c.id === decoded) || null;
  }

  public findLessonById(lessonId: string): { lesson: Lesson; course: Course } | null {
    const libData = this.getMergedLibrary();
    const decoded = decodeURIComponent(lessonId);

    for (const course of libData.courses) {
      for (const sub of course.subCourses) {
        for (const l of sub.lessons) {
          if (l.id === lessonId || l.id === decoded || l.filename === lessonId) {
            return { lesson: l, course };
          }
        }
      }
    }
    return null;
  }

  /**
   * Section 24: Security verification for video serving.
   * Ensures the target path is inside a registered, ENABLED library.
   */
  public resolveVideoPath(targetPathOrId: string): {
    resolvedPath?: string;
    remoteUrl?: string;
    forbidden?: boolean;
    notFound?: boolean;
  } {
    const decoded = decodeURIComponent(targetPathOrId);

    // 1. Check if it matches a lesson ID
    const found = this.findLessonById(targetPathOrId) || this.findLessonById(decoded);
    if (found) {
      if (found.lesson.url && found.lesson.url.startsWith('http')) {
        return { remoteUrl: found.lesson.url };
      }

      const filePath = found.lesson.path;
      if (fs.existsSync(filePath)) {
        // Validate that this file is within one of our ENABLED library roots
        const absFilePath = path.resolve(filePath);
        const isSafe = this.store.libraries.some((lib) => {
          if (!lib.enabled) return false;
          const libAbs = resolveNormalizedPath(lib.path);
          const relative = path.relative(libAbs, absFilePath);
          return !relative.startsWith('..') && !path.isAbsolute(relative);
        });

        if (isSafe) {
          return { resolvedPath: absFilePath };
        } else {
          return { forbidden: true };
        }
      }
    }

    // 2. Check if it's a relative path inside one of the enabled libraries
    for (const lib of this.store.libraries) {
      if (!lib.enabled) continue;
      const libAbs = resolveNormalizedPath(lib.path);
      const candidate = path.resolve(libAbs, decoded);

      const relative = path.relative(libAbs, candidate);
      if (relative.startsWith('..') || path.isAbsolute(relative)) {
        continue; // traversal attempt
      }

      if (fs.existsSync(candidate) && !fs.statSync(candidate).isDirectory()) {
        return { resolvedPath: candidate };
      }
    }

    return { notFound: true };
  }
}

export const libraryManager = new LibraryManager();
