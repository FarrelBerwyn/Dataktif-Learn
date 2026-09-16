import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  Course,
  Lesson,
  LibraryData,
  CourseTab,
} from './types';
import { Navbar } from './components/Navbar';
import { CourseCard } from './components/CourseCard';
import { CourseRow } from './components/CourseRow';
import { CategoryFilterBar } from './components/CategoryFilterBar';
import { CourseCardSkeleton, CourseRowSkeleton } from './components/CourseCardSkeleton';
import { CourseDetailModal } from './components/CourseDetailModal';
import { LessonPlayerView } from './components/LessonPlayerView';
import { FolderSettingsModal } from './components/FolderSettingsModal';
import { MyLearningView } from './components/MyLearningView';
import { SettingsView } from './components/SettingsView';
import { DashboardView } from './components/DashboardView';
import { FloatingVideoPlayer } from './components/FloatingVideoPlayer';
import { useLanguage } from './context/LanguageContext';
import demoLibraryData from './data/demoLibrary.json';
import { generateLessonPath, parseLessonPath, matchCourseAndLesson } from './utils/urlHelper';
import {
  FolderOpen,
  FolderSync,
  Search,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ArrowRight,
  BookOpen,
  ChevronDown,
  Youtube,
  Folder,
  Plus,
} from 'lucide-react';
import { AddYouTubeCourseModal } from './components/AddYouTubeCourseModal';

export default function App() {
  const { t } = useLanguage();
  const [library, setLibrary] = useState<LibraryData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRescanning, setIsRescanning] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Active navigation tab ('home' as default)
  const [activeTab, setActiveTab] = useState<CourseTab>('home');

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);

  // Course Source Tab: All vs Local vs YouTube
  const [selectedSource, setSelectedSource] = useState<'all' | 'local' | 'youtube'>('all');
  const [isAddYouTubeModalOpen, setIsAddYouTubeModalOpen] = useState(false);

  // Modals & Active Learning Player
  const [selectedCourseForDetail, setSelectedCourseForDetail] = useState<Course | null>(null);
  const [activeCourse, setActiveCourse] = useState<Course | null>(null);
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [isFolderSettingsOpen, setIsFolderSettingsOpen] = useState(false);
  const [isFloatingPlayer, setIsFloatingPlayer] = useState(false);
  const [floatingPlayerTime, setFloatingPlayerTime] = useState(0);
  const [floatingPlayerPlaying, setFloatingPlayerPlaying] = useState(true);
  const [initialSeekTime, setInitialSeekTime] = useState(0);

  // Background video fade-out to white & fade-in loop
  const bgVideoRef = useRef<HTMLVideoElement | null>(null);
  const [isBgFading, setIsBgFading] = useState(false);
  const isResettingBgRef = useRef(false);

  const handleBgTimeUpdate = () => {
    const v = bgVideoRef.current;
    if (!v || !v.duration || isResettingBgRef.current) return;
    // Begin smooth fade-out to white 0.85 seconds before video ends
    if (v.currentTime >= v.duration - 0.85) {
      setIsBgFading(true);
    }
  };

  const handleBgEnded = () => {
    const v = bgVideoRef.current;
    if (!v) return;
    isResettingBgRef.current = true;
    setIsBgFading(true);

    // Rewind video to start and restart playback
    v.currentTime = 0;
    v.play().catch(() => {});

    // Fade back in from white once restarted
    setTimeout(() => {
      setIsBgFading(false);
      isResettingBgRef.current = false;
    }, 200);
  };

  // User Progress state
  const [completedLessonIds, setCompletedLessonIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('completed_lessons');
      return saved ? JSON.parse(saved) : ['ai-auto-l1', 'ai-auto-l2'];
    } catch {
      return ['ai-auto-l1', 'ai-auto-l2'];
    }
  });

  // Show temporary toast notification
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Strict environment separation: GitHub Pages uses YouTube dummy data; Localhost uses private data
  const isGitHubPages = Boolean(
    typeof window !== 'undefined' &&
      (window.location.hostname.includes('github.io') ||
        window.location.hostname.includes('github.com'))
  );

  // Fetch library data:
  // - On GitHub Pages: ALWAYS uses educational YouTube dummy data
  // - On Localhost: STRICTLY uses personal private local library from local server
  const fetchLibrary = useCallback(async () => {
    if (isGitHubPages) {
      let customCourses: Course[] = [];
      try {
        const stored = localStorage.getItem('custom_youtube_courses');
        if (stored) customCourses = JSON.parse(stored);
      } catch {}

      const baseCourses = (demoLibraryData.courses || []) as unknown as Course[];
      // Merge custom courses, ensuring no duplicate IDs
      const customIds = new Set(customCourses.map((c) => c.id));
      const filteredBase = baseCourses.filter((c) => !customIds.has(c.id));
      const mergedCourses = [...customCourses, ...filteredBase];

      setLibrary({
        ...demoLibraryData,
        courses: mergedCourses,
        totalCourses: mergedCourses.length,
      } as unknown as LibraryData);
      setIsLoading(false);
      return;
    }

    // Localhost: Private personal courses ONLY
    try {
      setIsLoading(true);
      const res = await fetch('/api/library');
      if (res.ok) {
        const data: LibraryData = await res.json();
        setLibrary(data);
      }
    } catch (err) {
      console.error('Failed to load private library on localhost:', err);
    } finally {
      setIsLoading(false);
    }
  }, [isGitHubPages]);

  // Fetch user progress:
  // - On GitHub Pages: Uses localStorage demo key
  // - On Localhost: Syncs with personal server API
  const fetchProgress = useCallback(async () => {
    if (isGitHubPages) {
      try {
        const saved = localStorage.getItem('completed_lessons_demo');
        if (saved) setCompletedLessonIds(JSON.parse(saved));
      } catch {}
      return;
    }

    try {
      const res = await fetch('/api/user/progress');
      if (res.ok) {
        const data = await res.json();
        if (data.completedLessons && Array.isArray(data.completedLessons)) {
          setCompletedLessonIds(data.completedLessons);
          try {
            localStorage.setItem('completed_lessons', JSON.stringify(data.completedLessons));
          } catch {}
        }
      }
    } catch (err) {
      console.warn('Could not sync personal progress from server:', err);
    }
  }, [isGitHubPages]);

  useEffect(() => {
    fetchLibrary();
    fetchProgress();
  }, [fetchLibrary, fetchProgress]);

  // Sync route on initial load and handle browser Back/Forward (popstate)
  useEffect(() => {
    if (!library || !library.courses || library.courses.length === 0) return;

    // Check if current URL path matches /nama_course/video_course
    const pathInfo = parseLessonPath(window.location.pathname);
    if (pathInfo) {
      const match = matchCourseAndLesson(
        library.courses,
        pathInfo.courseSlug,
        pathInfo.videoSlug
      );
      if (match) {
        setActiveCourse(match.course);
        setActiveLesson(match.lesson);
        setIsFloatingPlayer(false);
      }
    }

    const handlePopState = () => {
      const currentPathInfo = parseLessonPath(window.location.pathname);
      if (currentPathInfo && library?.courses) {
        const match = matchCourseAndLesson(
          library.courses,
          currentPathInfo.courseSlug,
          currentPathInfo.videoSlug
        );
        if (match) {
          setActiveCourse(match.course);
          setActiveLesson(match.lesson);
          setIsFloatingPlayer(false);
          return;
        }
      }
      // If path is root or other, reset active classroom
      setActiveCourse(null);
      setActiveLesson(null);
      setIsFloatingPlayer(false);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [library]);

  // Rescan video directory
  const handleRescan = async () => {
    setIsRescanning(true);
    try {
      const res = await fetch('/api/library/rescan', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setLibrary(data.library);
        showToast(
          `Scanned library! Discovered ${data.library.totalCourses} course(s) and ${data.library.totalLessons} lesson(s).`
        );
      }
    } catch (err) {
      console.error('Error rescanning:', err);
      showToast('Scanner failed. Please check folder path.');
    } finally {
      setIsRescanning(false);
    }
  };

  // Save new directory path and rescan
  const handleSaveAndRescan = async (newPath: string) => {
    setIsRescanning(true);
    try {
      const res = await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoFolder: newPath }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.library) {
          setLibrary(data.library);
        } else {
          fetchLibrary();
        }
        showToast(`Folder updated to "${newPath}". Rescanned courses!`);
      }
    } catch (err) {
      console.error('Error updating folder config:', err);
    } finally {
      setIsRescanning(false);
    }
  };

  // Toggle lesson complete
  const handleToggleComplete = async (lessonId: string) => {
    const isNowDone = !completedLessonIds.includes(lessonId);
    const updated = isNowDone
      ? [...completedLessonIds, lessonId]
      : completedLessonIds.filter((id) => id !== lessonId);

    setCompletedLessonIds(updated);
    try {
      localStorage.setItem(
        isGitHubPages ? 'completed_lessons_demo' : 'completed_lessons',
        JSON.stringify(updated)
      );
    } catch {}

    // Only post to backend server when on localhost
    if (!isGitHubPages) {
      try {
        await fetch('/api/user/progress', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            lessonId,
            completed: isNowDone,
            courseId: activeCourse?.id || '',
          }),
        });
      } catch {}
    }
  };

  // Launch lesson player in classroom mode
  const handleStartLearning = (
    course: Course,
    specificLesson?: Lesson,
    seekTime?: number
  ) => {
    setActiveCourse(course);
    setIsFloatingPlayer(false);
    let chosenLesson: Lesson | null = null;
    if (specificLesson) {
      chosenLesson = specificLesson;
    } else {
      // Find first uncompleted lesson, or default to first lesson
      const allLessons: Lesson[] = [];
      course.subCourses.forEach((s) => s.lessons.forEach((l) => allLessons.push(l)));
      const firstUncompleted =
        allLessons.find((l) => !completedLessonIds.includes(l.id)) || allLessons[0];
      chosenLesson = firstUncompleted || null;
    }
    setActiveLesson(chosenLesson);
    setInitialSeekTime(seekTime || 0);
    if (chosenLesson) {
      const routePath = generateLessonPath(course, chosenLesson);
      window.history.pushState({}, '', routePath);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // All courses loaded from backend
  const allCourses = useMemo(() => {
    return library?.courses || [];
  }, [library]);

  // Categories list (combined from library metadata + course categories)
  const categoriesList = useMemo(() => {
    const defaultList = [
      'AI & Technology',
      'Business',
      'Marketing',
      'Programming',
      'Design',
      'Finance',
      'Entrepreneurship',
    ];
    const set = new Set<string>(defaultList);
    if (library?.categories) {
      library.categories.forEach((c) => set.add(c));
    }
    allCourses.forEach((c) => {
      if (c.category) set.add(c.category);
    });
    return Array.from(set);
  }, [library, allCourses]);

  // Filter courses by source: All | Local | YouTube
  const displayCourses = useMemo(() => {
    if (selectedSource === 'all') return allCourses;
    return allCourses.filter((c) => (c.source || 'local') === selectedSource);
  }, [allCourses, selectedSource]);

  const localCoursesCount = useMemo(() => {
    return allCourses.filter((c) => (c.source || 'local') === 'local').length;
  }, [allCourses]);

  const youtubeCoursesCount = useMemo(() => {
    return allCourses.filter((c) => c.source === 'youtube').length;
  }, [allCourses]);

  // 1. Continue Learning Row courses
  const continueLearningCourses = useMemo(() => {
    if (completedLessonIds.length === 0 || displayCourses.length === 0) return [];

    return displayCourses.filter((course) => {
      const allLessons: Lesson[] = [];
      course.subCourses.forEach((s) => s.lessons.forEach((l) => allLessons.push(l)));
      return allLessons.some((l) => completedLessonIds.includes(l.id));
    });
  }, [displayCourses, completedLessonIds]);

  // 2. Featured Courses row
  const featuredCourses = useMemo(() => {
    if (displayCourses.length === 0) return [];
    const featured = displayCourses.filter((c) => c.featured || (c.rating && c.rating >= 4.8));
    if (featured.length > 0) return featured;
    return displayCourses.slice(0, 5);
  }, [displayCourses]);

  // 3. Popular Courses row
  const popularCourses = useMemo(() => {
    if (displayCourses.length === 0) return [];
    return [...displayCourses].sort(
      (a, b) => (b.rating || 4.7) - (a.rating || 4.7) || b.lessonCount - a.lessonCount
    );
  }, [displayCourses]);

  // 4. New Courses row
  const newCourses = useMemo(() => {
    if (displayCourses.length === 0) return [];
    return [...displayCourses].slice().reverse();
  }, [displayCourses]);

  // 5. Category-based rows in clean prioritized sequence
  const categoryRows = useMemo(() => {
    if (displayCourses.length === 0) return [];
    const map = new Map<string, Course[]>();

    displayCourses.forEach((course) => {
      const cat = course.category || 'General';
      if (!map.has(cat)) {
        map.set(cat, []);
      }
      map.get(cat)!.push(course);
    });

    const preferredOrder = [
      'AI & Technology',
      'Business',
      'Marketing',
      'Programming',
      'Design',
      'Finance',
      'Entrepreneurship',
    ];

    const rows: { category: string; courses: Course[] }[] = [];
    preferredOrder.forEach((category) => {
      if (map.has(category)) {
        rows.push({ category, courses: map.get(category)! });
      }
    });

    map.forEach((courses, category) => {
      if (!preferredOrder.includes(category)) {
        rows.push({ category, courses });
      }
    });

    return rows;
  }, [displayCourses]);

  // Search Results: searches COURSES rather than raw file names
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase().trim();
    return displayCourses.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.name.toLowerCase().includes(q) ||
        c.instructor.toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q) ||
        c.tags.some((t) => t.toLowerCase().includes(q)) ||
        c.subCourses.some((s) => s.name.toLowerCase().includes(q))
    );
  }, [displayCourses, searchQuery]);

  // Filtered courses when a single category is selected in the category filter bar
  const selectedCategoryCourses = useMemo(() => {
    if (selectedCategory === 'All') return [];
    return displayCourses.filter(
      (c) => c.category.toLowerCase() === selectedCategory.toLowerCase()
    );
  }, [displayCourses, selectedCategory]);

  return (
    <div className="min-h-screen flex flex-col font-sans text-[#18324A] relative">
      {/* Full-bleed looping background video with white fade-out & fade-in loop */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <video
          ref={bgVideoRef}
          className="absolute inset-0 w-full h-full object-cover"
          autoPlay
          muted
          playsInline
          onTimeUpdate={handleBgTimeUpdate}
          onEnded={handleBgEnded}
        >
          <source
            src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260808_075824_7c8a2ef3-826c-43ca-81a1-162429faa306.mp4"
            type="video/mp4"
          />
        </video>

        {/* White fade transition overlay (fades to white on end, then fades back in to reveal restarted video) */}
        <div
          className={`absolute inset-0 bg-white transition-opacity duration-700 ease-in-out ${
            isBgFading ? 'opacity-100' : 'opacity-0'
          }`}
        />

        {/* Soft overlay so text/cards remain readable while preserving vivid video mountains */}
        <div
          className={`absolute inset-0 transition-colors duration-500 ${
            activeTab === 'courses' || activeTab === 'catalog'
              ? 'bg-[#F8FBFF]/35 backdrop-blur-[0.5px]'
              : 'bg-[#F8FBFF]/65 backdrop-blur-[1px]'
          }`}
        />
      </div>

      {/* All content above the background */}
      <div className="relative z-[1] min-h-screen flex flex-col">
      {/* Top Navbar - Always visible, including in course progress page */}
      <Navbar
        activeTab={activeCourse && activeLesson && !isFloatingPlayer ? 'courses' : activeTab}
        onTabChange={(tab) => {
          // If user navigates via Navbar tabs while watching, shrink video into floating miniplayer
          if (activeCourse && activeLesson && !isFloatingPlayer) {
            setIsFloatingPlayer(true);
          }
          setActiveTab(tab);
          setSearchQuery('');
          if (!activeCourse || isFloatingPlayer) {
            window.history.pushState({}, '', '/');
          }
        }}
        searchQuery={searchQuery}
        onSearchChange={(q) => setSearchQuery(q)}
        onOpenFolderSettings={() => setIsFolderSettingsOpen(true)}
        onRescan={handleRescan}
        isRescanning={isRescanning}
        totalCourses={library?.totalCourses || 0}
        totalLessons={library?.totalLessons || 0}
        completedLessonsCount={completedLessonIds.length}
        categories={categoriesList}
        selectedCategory={selectedCategory}
        onSelectCategory={(cat) => {
          if (activeCourse && activeLesson && !isFloatingPlayer) {
            setIsFloatingPlayer(true);
          }
          setSelectedCategory(cat);
          setActiveTab('courses');
        }}
        onScrollToCategories={() => {
          if (activeCourse && activeLesson && !isFloatingPlayer) {
            setIsFloatingPlayer(true);
          }
          const el = document.getElementById('category-filter-bar');
          el?.scrollIntoView({ behavior: 'smooth' });
        }}
      />

      {/* Spacer for fixed navbar height */}
      <div className="h-16 sm:h-17 shrink-0" />

      {/* Toast notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-2xl bg-[#18324A] text-white text-xs font-semibold shadow-2xl flex items-center gap-2.5 animate-in slide-in-from-bottom-5">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main App Content Body */}
      <main className="flex-1">
        {/* If actively watching a lesson in classroom mode (not floating), render LessonPlayerView under Navbar */}
        {activeCourse && activeLesson && !isFloatingPlayer ? (
          <LessonPlayerView
            course={activeCourse}
            currentLesson={activeLesson}
            onSelectLesson={(lesson) => {
              setActiveLesson(lesson);
              setFloatingPlayerTime(0);
              window.history.pushState({}, '', generateLessonPath(activeCourse, lesson));
            }}
            onBackToCourse={() => {
              setSelectedCourseForDetail(activeCourse);
              setActiveCourse(null);
              setActiveLesson(null);
              setIsFloatingPlayer(false);
              window.history.pushState({}, '', '/');
            }}
            completedLessonIds={completedLessonIds}
            onToggleComplete={handleToggleComplete}
            onMinimizeToFloating={(time, isPl) => {
              setFloatingPlayerTime(time);
              setFloatingPlayerPlaying(isPl);
              setIsFloatingPlayer(true);
            }}
            initialTime={floatingPlayerTime || initialSeekTime}
            initialPlaying={floatingPlayerPlaying}
          />
        ) : activeTab === 'settings' ? (
          <SettingsView
            initialTab="libraries"
            onBack={() => setActiveTab('home')}
            onCatalogUpdated={() => {
              fetchLibrary();
              fetchProgress();
            }}
          />
        ) : activeTab === 'my-learning' ? (
          <MyLearningView
            courses={allCourses}
            completedLessonIds={completedLessonIds}
            onSelectCourse={(course) => setSelectedCourseForDetail(course)}
            onStartLearning={(course, lesson, timestamp) =>
              handleStartLearning(course, lesson, timestamp)
            }
            onExploreCatalog={() => setActiveTab('courses')}
          />
        ) : activeTab === 'home' && !searchQuery ? (
          <DashboardView
            courses={allCourses}
            completedLessonIds={completedLessonIds}
            onSelectCourse={(course) => setSelectedCourseForDetail(course)}
            onStartLearning={(course, lesson, timestamp) =>
              handleStartLearning(course, lesson, timestamp)
            }
            onNavigateToCourses={(cat) => {
              if (cat) setSelectedCategory(cat);
              setActiveTab('courses');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onOpenFolderSettings={() => setIsFolderSettingsOpen(true)}
            onViewAllNotes={() => {
              setActiveTab('my-learning');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        ) : (
          /* Course Catalog Page (courses / catalog / search) - Padding matches reference image */
          <div className="w-full max-w-[1440px] mx-auto px-6 sm:px-12 md:px-16 lg:px-20 pt-3 pb-10 space-y-6">
            {/* 3. Page Header: Courses + Tab Navigation [ Local | YouTube ] */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 sm:mb-5">
              <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
                <h1 className="text-2xl sm:text-3xl lg:text-[34px] font-extrabold text-[#18324A] tracking-tight">
                  Courses
                </h1>

                {/* Source Tab Navigation: Semua | Local | YouTube */}
                <div className="inline-flex p-1 bg-white/90 backdrop-blur-md rounded-2xl border border-[rgba(80,140,190,0.2)] shadow-2xs">
                  <button
                    onClick={() => setSelectedSource('all')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      selectedSource === 'all'
                        ? 'bg-[#2867A8] text-white shadow-xs'
                        : 'text-[#6B8195] hover:text-[#18324A]'
                    }`}
                  >
                    <span>Semua Course</span>
                    <span
                      className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                        selectedSource === 'all'
                          ? 'bg-white/25 text-white'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {allCourses.length}
                    </span>
                  </button>

                  <button
                    onClick={() => setSelectedSource('local')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      selectedSource === 'local'
                        ? 'bg-[#2867A8] text-white shadow-xs'
                        : 'text-[#6B8195] hover:text-[#18324A]'
                    }`}
                  >
                    <Folder className="w-3.5 h-3.5" />
                    <span>Course Local</span>
                    <span
                      className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                        selectedSource === 'local'
                          ? 'bg-white/25 text-white'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {localCoursesCount}
                    </span>
                  </button>

                  <button
                    onClick={() => setSelectedSource('youtube')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      selectedSource === 'youtube'
                        ? 'bg-red-600 text-white shadow-xs'
                        : 'text-[#6B8195] hover:text-[#18324A]'
                    }`}
                  >
                    <Youtube className="w-3.5 h-3.5 fill-current" />
                    <span>Course YouTube</span>
                    <span
                      className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                        selectedSource === 'youtube'
                          ? 'bg-white/25 text-white'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {youtubeCoursesCount}
                    </span>
                  </button>
                </div>

                {/* Dropdown Beside Title on Desktop: [ All Courses ▼ ] */}
                <div className="relative">
                  <button
                    onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white text-[#2867A8] font-semibold text-xs sm:text-[13px] border border-[rgba(80,140,190,0.22)] shadow-2xs hover:border-[#5B9FE8] hover:bg-[#F4F9FF] transition-all cursor-pointer"
                  >
                    <span>{selectedCategory === 'All' ? 'All Categories' : selectedCategory}</span>
                    <ChevronDown className="w-3.5 h-3.5 text-[#2867A8]" />
                  </button>

                  {isCategoryDropdownOpen && (
                    <div className="absolute left-0 mt-1.5 w-52 rounded-2xl bg-white/95 backdrop-blur-xl border border-[rgba(80,140,190,0.2)] shadow-[0_12px_32px_rgba(24,50,74,0.16)] z-30 py-1.5 max-h-72 overflow-y-auto">
                      {['All', ...categoriesList.filter((c) => c !== 'All')].map((cat) => (
                        <button
                          key={cat}
                          onClick={() => {
                            setSelectedCategory(cat);
                            setIsCategoryDropdownOpen(false);
                          }}
                          className={`w-full text-left px-3.5 py-1.5 text-xs sm:text-[13px] flex items-center justify-between transition-colors ${
                            selectedCategory === cat
                              ? 'bg-[#DCEEFF] text-[#2867A8] font-bold'
                              : 'text-[#3E566E] hover:bg-[#F2F8FF] hover:text-[#18324A]'
                          }`}
                        >
                          <span>{cat === 'All' ? 'All Categories' : cat}</span>
                          {selectedCategory === cat && (
                            <CheckCircle2 className="w-3.5 h-3.5 text-[#2867A8]" />
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons: Add Course from YouTube */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsAddYouTubeModalOpen(true)}
                  className="px-3.5 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <Youtube className="w-3.5 h-3.5 fill-current" />
                  <span>+ Tambah dari YouTube</span>
                </button>
              </div>
            </div>

            {/* 4. Category Filter Bar */}
            <div id="category-filter-bar">
              <CategoryFilterBar
                categories={categoriesList}
                selectedCategory={selectedCategory}
                onSelectCategory={(cat) => setSelectedCategory(cat)}
              />
            </div>

            {/* Loading State: Skeleton Cards preserving 16:9 rows */}
            {isLoading && (
              <div className="space-y-6">
                <CourseRowSkeleton title="Featured Courses" />
                <CourseRowSkeleton title="Popular Courses" />
                <CourseRowSkeleton title="New Courses" />
              </div>
            )}

            {/* Empty State: If no courses available */}
            {!isLoading && allCourses.length === 0 && (
              <div className="text-center py-20 px-6 bg-white rounded-3xl border border-[rgba(80,140,190,0.18)] shadow-sm max-w-xl mx-auto my-8">
                <div className="w-16 h-16 rounded-2xl bg-[#DCEEFF] text-[#2867A8] flex items-center justify-center mx-auto mb-4 border border-[#BFDFFF]">
                  <FolderOpen className="w-8 h-8" />
                </div>
                <h2 className="text-xl font-bold text-[#18324A] mb-2">
                  No courses available yet
                </h2>
                <p className="text-sm text-[#6B8195] mb-6 leading-relaxed">
                  Add a course library to start building your learning library.
                </p>
                <button
                  onClick={() => setIsFolderSettingsOpen(true)}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-[#5B9FE8] hover:bg-[#4A8ED8] text-white font-semibold text-sm shadow-[0_4px_16px_rgba(91,159,232,0.4)] transition-all cursor-pointer"
                >
                  <FolderOpen className="w-4 h-4" />
                  <span>Manage Course Libraries</span>
                </button>
              </div>
            )}

            {/* Search Mode: Display matching courses */}
            {!isLoading && searchQuery.trim() && (
              <div className="mb-12">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-lg sm:text-xl font-bold text-[#18324A] tracking-tight">
                      {t.catalog.searchResultsFor} &ldquo;{searchQuery}&rdquo;
                    </h2>
                    <p className="text-xs text-[#6B8195] mt-0.5">
                      {t.catalog.found} {searchResults.length} {t.catalog.coursesCount}
                    </p>
                  </div>

                  <button
                    onClick={() => setSearchQuery('')}
                    className="text-xs font-semibold text-[#5B9FE8] hover:underline"
                  >
                    {t.catalog.clearSearch}
                  </button>
                </div>

                {searchResults.length === 0 ? (
                  <div className="text-center py-12 px-4 bg-white rounded-2xl border border-[rgba(80,140,190,0.16)]">
                    <Search className="w-10 h-10 text-[#9AAEBD] mx-auto mb-3" />
                    <p className="text-sm font-semibold text-[#18324A]">{t.catalog.noCoursesFound}</p>
                    <p className="text-xs text-[#6B8195] mt-1">
                      {t.catalog.noCoursesMatch} &ldquo;{searchQuery}&rdquo;.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-3.5 sm:gap-x-4 lg:gap-x-5 gap-y-4 sm:gap-y-5 lg:gap-y-6">
                    {searchResults.map((course) => {
                      const allLessons: Lesson[] = [];
                      course.subCourses.forEach((s) => s.lessons.forEach((l) => allLessons.push(l)));
                      const doneCount = allLessons.filter((l) => completedLessonIds.includes(l.id)).length;
                      const percent = allLessons.length > 0 ? Math.round((doneCount / allLessons.length) * 100) : 0;

                      return (
                        <CourseCard
                          key={course.id}
                          course={course}
                          progressPercent={percent}
                          completedLessonsCount={doneCount}
                          onSelectCourse={(c) => setSelectedCourseForDetail(c)}
                          onStartLearning={(c, l) => handleStartLearning(c, l)}
                        />
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Single Selected Category View (when user clicks a specific category filter) */}
            {!isLoading && !searchQuery && selectedCategory !== 'All' && (
              <div className="mb-12">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-lg sm:text-xl font-bold text-[#18324A] tracking-tight">
                      {selectedCategory} Courses
                    </h2>
                    <p className="text-xs text-[#6B8195] mt-0.5">
                      Showing {selectedCategoryCourses.length} {selectedCategoryCourses.length === 1 ? 'course' : 'courses'} in this category
                    </p>
                  </div>

                  <button
                    onClick={() => setSelectedCategory('All')}
                    className="text-xs font-semibold text-[#2867A8] hover:text-[#5B9FE8] px-3 py-1.5 rounded-xl bg-white border border-[rgba(80,140,190,0.2)] shadow-sm"
                  >
                    {t.catalog.viewAllCategories}
                  </button>
                </div>

                {selectedCategoryCourses.length === 0 ? (
                  <div className="text-center py-12 px-4 bg-white rounded-2xl border border-[rgba(80,140,190,0.16)]">
                    <BookOpen className="w-10 h-10 text-[#9AAEBD] mx-auto mb-3" />
                    <p className="text-sm font-semibold text-[#18324A]">No courses in {selectedCategory} yet</p>
                    <p className="text-xs text-[#6B8195] mt-1">
                      Check back soon or organize your folders under this category name.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-3.5 sm:gap-x-4 lg:gap-x-5 gap-y-4 sm:gap-y-5 lg:gap-y-6">
                    {selectedCategoryCourses.map((course) => {
                      const allLessons: Lesson[] = [];
                      course.subCourses.forEach((s) => s.lessons.forEach((l) => allLessons.push(l)));
                      const doneCount = allLessons.filter((l) => completedLessonIds.includes(l.id)).length;
                      const percent = allLessons.length > 0 ? Math.round((doneCount / allLessons.length) * 100) : 0;

                      return (
                        <CourseCard
                          key={course.id}
                          course={course}
                          progressPercent={percent}
                          completedLessonsCount={doneCount}
                          onSelectCourse={(c) => setSelectedCourseForDetail(c)}
                          onStartLearning={(c, l) => handleStartLearning(c, l)}
                        />
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Standard Multi-Row Disney+ Inspired Streaming Experience (when selectedCategory is 'All' and not searching) */}
            {!isLoading && !searchQuery && selectedCategory === 'All' && allCourses.length > 0 && (
              <div>
                {/* 5. CONTINUE LEARNING (first major row, shown if learning history exists) */}
                {continueLearningCourses.length > 0 && (
                  <CourseRow
                    title={t.catalog.continueLearning}
                    subtitle={t.catalog.continueLearningDesc}
                    badge={`${continueLearningCourses.length} In Progress`}
                    courses={continueLearningCourses}
                    completedLessonIds={completedLessonIds}
                    onSelectCourse={(c) => setSelectedCourseForDetail(c)}
                    onStartLearning={(c, l) => handleStartLearning(c, l)}
                    isContinueLearning={true}
                  />
                )}

                {/* 6. FEATURED COURSES */}
                <CourseRow
                  title={t.catalog.featuredCourses}
                  subtitle={t.catalog.featuredCoursesDesc}
                  badge="Featured"
                  courses={featuredCourses}
                  completedLessonIds={completedLessonIds}
                  onSelectCourse={(c) => setSelectedCourseForDetail(c)}
                  onStartLearning={(c, l) => handleStartLearning(c, l)}
                />

                {/* 7. POPULAR COURSES */}
                <CourseRow
                  title={t.catalog.popularCourses}
                  subtitle={t.catalog.popularCoursesDesc}
                  badge="Popular"
                  courses={popularCourses}
                  completedLessonIds={completedLessonIds}
                  onSelectCourse={(c) => setSelectedCourseForDetail(c)}
                  onStartLearning={(c, l) => handleStartLearning(c, l)}
                />

                {/* 8. NEW COURSES */}
                <CourseRow
                  title={t.catalog.newCourses}
                  subtitle={t.catalog.newCoursesDesc}
                  badge="New"
                  courses={newCourses}
                  completedLessonIds={completedLessonIds}
                  onSelectCourse={(c) => setSelectedCourseForDetail(c)}
                  onStartLearning={(c, l) => handleStartLearning(c, l)}
                />

                {/* 9. CATEGORY-BASED ROWS */}
                {categoryRows.map(({ category, courses: catCourses }) => (
                  <CourseRow
                    key={category}
                    id={`row-${category.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}
                    title={category}
                    subtitle={`Explore ${catCourses.length} course${catCourses.length === 1 ? '' : 's'} in ${category}`}
                    badge={`${catCourses.length} ${catCourses.length === 1 ? 'Course' : 'Courses'}`}
                    courses={catCourses}
                    completedLessonIds={completedLessonIds}
                    onSelectCourse={(c) => setSelectedCourseForDetail(c)}
                    onStartLearning={(c, l) => handleStartLearning(c, l)}
                    onViewAll={() => setSelectedCategory(category)}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Picture-in-Picture Floating Window Miniplayer */}
      {isFloatingPlayer && activeCourse && activeLesson && (
        <FloatingVideoPlayer
          course={activeCourse}
          currentLesson={activeLesson}
          initialTime={floatingPlayerTime}
          initialPlaying={floatingPlayerPlaying}
          onExpand={(time, isPl) => {
            setFloatingPlayerTime(time);
            setFloatingPlayerPlaying(isPl);
            setIsFloatingPlayer(false);
            window.history.pushState({}, '', generateLessonPath(activeCourse, activeLesson));
          }}
          onClose={() => {
            setIsFloatingPlayer(false);
            setActiveCourse(null);
            setActiveLesson(null);
            window.history.pushState({}, '', '/');
          }}
          onSelectLesson={(lesson) => {
            setActiveLesson(lesson);
            setFloatingPlayerTime(0);
            window.history.pushState({}, '', generateLessonPath(activeCourse, lesson));
          }}
        />
      )}

      {/* Footer - Displayed when browsing catalog/dashboard/floating player */}
      {(!activeCourse || isFloatingPlayer) && (
        <footer className="mt-auto border-t border-[rgba(80,140,190,0.18)] bg-white/75 backdrop-blur-md py-6 px-4 sm:px-6">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-[#6B8195]">
            <div className="flex items-center gap-2 text-xs">
              <div className="flex items-center gap-1.5 font-bold text-[#18324A]">
                <div className="w-5 h-5 rounded-lg bg-[#5B9FE8] flex items-center justify-center text-white text-[10px] font-black">
                  D
                </div>
                <span>Dataktif</span>
                <span className="text-xs font-bold text-[#2867A8]">Learn</span>
              </div>
              <span>•</span>
              <span>Milk Blue Morphism UI</span>
            </div>
            <div className="flex items-center gap-4 text-[11px]">
              <span>
                Local Folder:{' '}
                <strong className="font-mono text-[#2867A8]">
                  {library?.videoRoot || './videos'}
                </strong>
              </span>
              <span>•</span>
              <button
                onClick={() => setActiveTab('settings')}
                className="text-[#2867A8] hover:text-[#5B9FE8] hover:underline cursor-pointer font-semibold"
              >
                Course Libraries Manager
              </button>
            </div>
          </div>
        </footer>
      )}

      {/* Course Detail / Syllabus Modal */}
      <CourseDetailModal
        course={selectedCourseForDetail}
        isOpen={!!selectedCourseForDetail}
        onClose={() => setSelectedCourseForDetail(null)}
        onSelectLesson={(course, lesson) => handleStartLearning(course, lesson)}
        completedLessonIds={completedLessonIds}
      />

      {/* Folder Settings Modal */}
      <FolderSettingsModal
        isOpen={isFolderSettingsOpen}
        onClose={() => setIsFolderSettingsOpen(false)}
        currentFolder={library?.videoRoot || './videos'}
        resolvedPath={library?.videoRoot || './videos'}
        folderExists={true}
        totalCourses={library?.totalCourses || 0}
        totalLessons={library?.totalLessons || 0}
        isRescanning={isRescanning}
        onSaveAndRescan={handleSaveAndRescan}
        onOpenLibrariesManager={() => setActiveTab('settings')}
      />

      {/* Add YouTube Course Modal */}
      <AddYouTubeCourseModal
        isOpen={isAddYouTubeModalOpen}
        onClose={() => setIsAddYouTubeModalOpen(false)}
        onCourseAdded={fetchLibrary}
      />
      </div>
    </div>
  );
}
