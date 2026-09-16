export interface Lesson {
  id: string;
  order: number;
  globalIndex: number;
  title: string;
  filename: string;
  path: string;
  relativePath: string;
  url: string;
  duration: number; // seconds
  durationFormatted: string;
  size: number;
  sizeFormatted: string;
  courseId: string;
  courseName: string;
  subCourseId: string;
  subCourseName: string;
  libraryId?: string;
  libraryName?: string;
  description?: string;
  thumbnail?: string;
  previousLessonId?: string | null;
  nextLessonId?: string | null;
  isFirstLesson?: boolean;
  isLastLesson?: boolean;
  source?: 'local' | 'youtube';
  youtubeVideoId?: string;
  startTime?: number;
  endTime?: number;
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
  source?: 'local' | 'youtube';
  playlistUrl?: string;
  youtubePlaylistId?: string;
}

export type LibraryStatus = 'active' | 'disabled' | 'missing' | 'error' | 'scanning';

export interface CourseLibraryConfig {
  id: string;
  name: string;
  path: string;
  enabled: boolean;
  isDefault: boolean;
  lastScanned?: string;
  courseCount: number;
  moduleCount: number;
  type?: 'local' | 'youtube';
  playlistUrl?: string;
  lessonCount: number;
  status: LibraryStatus;
  error?: string;
}

export interface CourseLibrarySummary {
  totalLibraries: number;
  activeLibraries: number;
  disabledLibraries: number;
  totalCourses: number;
  totalModules: number;
  totalLessons: number;
  lastUpdated?: string;
}

export interface ValidatePathResult {
  valid: boolean;
  exists?: boolean;
  readable?: boolean;
  isDir?: boolean;
  courseCount?: number;
  moduleCount?: number;
  lessonCount?: number;
  error?: string;
  warning?: string;
}

export type CourseTab = 'home' | 'courses' | 'catalog' | 'my-learning' | 'search' | 'folder-settings' | 'settings';
export type SettingsSubTab = 'account' | 'appearance' | 'playback' | 'notifications' | 'libraries';

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

export interface LessonDetailResponse {
  lesson: Lesson;
  course: {
    id: string;
    title: string;
    instructor: string;
    category: string;
    subCourses: SubCourse[];
  };
  previousLesson: { id: string; title: string; subCourseName: string } | null;
  nextLesson: { id: string; title: string; subCourseName: string } | null;
  isFirstLesson: boolean;
  isLastLesson: boolean;
  totalLessonsInCourse: number;
  currentLessonIndex: number;
}

export interface Note {
  id: string;
  lessonId: string;
  courseId: string;
  timestamp: number;
  text: string;
  createdAt: string;
}

export interface UserProgress {
  completedLessons: string[];
  progressPercentByCourse: Record<string, number>;
  playbackTimes: Record<string, number>; // lessonId -> seconds
  lastWatchedLessonId?: string;
  notes?: Note[];
}

export type YouTubeImportMode = 'chapters' | 'playlist';

export interface ParsedYouTubeChapter {
  title: string;
  startTime: number;
  endTime: number;
  startTimeFormatted: string;
  endTimeFormatted: string;
  duration: number;
  durationFormatted: string;
  thumbnail?: string;
}

export interface ParsedYouTubeVideoCourse {
  videoId: string;
  title: string;
  description: string;
  instructor: string;
  thumbnail: string;
  totalDuration: number;
  totalDurationFormatted: string;
  chapters: ParsedYouTubeChapter[];
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
