import React, { useState, useRef, useEffect } from 'react';
import {
  ArrowLeft,
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  CheckCircle2,
  Circle,
  ChevronRight,
  ChevronLeft,
  BookOpen,
  StickyNote,
  Plus,
  Trash2,
  Clock,
  Layers,
  Sparkles,
  Folder,
  Trophy,
} from 'lucide-react';
import { Course, Lesson, Note } from '../types';
import { CourseCompletionView } from './CourseCompletionView';
import { useLanguage } from '../context/LanguageContext';

interface LessonPlayerViewProps {
  course: Course;
  currentLesson: Lesson;
  onSelectLesson: (lesson: Lesson) => void;
  onBackToCourse: () => void;
  completedLessonIds: string[];
  onToggleComplete: (lessonId: string) => void;
}

export const LessonPlayerView: React.FC<LessonPlayerViewProps> = ({
  course,
  currentLesson,
  onSelectLesson,
  onBackToCourse,
  completedLessonIds,
  onToggleComplete,
}) => {
  const { t } = useLanguage();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(currentLesson.duration || 0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [autoPlayNext, setAutoPlayNext] = useState(true);
  const [showCompletionView, setShowCompletionView] = useState(false);
  const [nextLessonNotification, setNextLessonNotification] = useState<string | null>(null);

  // Notes state
  const [activeTab, setActiveTab] = useState<'notes' | 'curriculum'>('curriculum');
  const [notes, setNotes] = useState<Note[]>([]);
  const [newNoteText, setNewNoteText] = useState('');

  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Check if current lesson is a YouTube video URL
  const isYouTube = Boolean(
    currentLesson.url && (currentLesson.url.includes('youtube.com') || currentLesson.url.includes('youtu.be'))
  );

  const getYouTubeEmbedUrl = (url: string) => {
    if (!url) return '';
    if (url.includes('/embed/')) {
      return url.includes('?') ? `${url}&autoplay=1&rel=0` : `${url}?autoplay=1&rel=0`;
    }
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    const id = match && match[2].length === 11 ? match[2] : null;
    return id ? `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0` : url;
  };

  // Flatten course lessons to find previous & next lessons
  const allLessons: Lesson[] = [];
  course.subCourses.forEach((s) => s.lessons.forEach((l) => allLessons.push(l)));

  const currentIndex = allLessons.findIndex((l) => l.id === currentLesson.id);
  const previousLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : null;
  const nextLesson = currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null;

  const isCompleted = completedLessonIds.includes(currentLesson.id);
  const completedCount = allLessons.filter((l) => completedLessonIds.includes(l.id)).length;
  const progressPercent = Math.round((completedCount / allLessons.length) * 100);

  // Load notes for current lesson
  useEffect(() => {
    fetch(`/api/user/notes?lessonId=${encodeURIComponent(currentLesson.id)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.notes) setNotes(data.notes);
      })
      .catch(() => {
        // Fallback to localStorage
        try {
          const stored = localStorage.getItem(`notes_${currentLesson.id}`);
          if (stored) setNotes(JSON.parse(stored));
        } catch {}
      });
  }, [currentLesson.id]);

  // Video time formatting
  const formatTime = (secs: number) => {
    if (isNaN(secs)) return '00:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Handle Play/Pause
  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  // Skip time
  const skip = (seconds: number) => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = Math.max(
      0,
      Math.min(videoRef.current.duration, videoRef.current.currentTime + seconds)
    );
  };

  // Change speed
  const changeSpeed = () => {
    const speeds = [0.75, 1, 1.25, 1.5, 2];
    const nextIdx = (speeds.indexOf(playbackRate) + 1) % speeds.length;
    const newSpeed = speeds[nextIdx];
    setPlaybackRate(newSpeed);
    if (videoRef.current) {
      videoRef.current.playbackRate = newSpeed;
    }
  };

  // Toggle Fullscreen
  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // Auto-hide controls
  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) setShowControls(false);
    }, 2800);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts if user is typing in textarea/input
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;

      if (e.code === 'Space') {
        e.preventDefault();
        togglePlay();
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        skip(-10);
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        skip(10);
      } else if (e.key.toLowerCase() === 'm') {
        e.preventDefault();
        if (videoRef.current) {
          videoRef.current.muted = !videoRef.current.muted;
          setIsMuted(videoRef.current.muted);
        }
      } else if (e.key.toLowerCase() === 'f') {
        e.preventDefault();
        toggleFullscreen();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying]);

  const hasEndedRef = useRef(false);

  useEffect(() => {
    hasEndedRef.current = false;
    setCurrentTime(0);
  }, [currentLesson.id]);

  // Video ended handler: auto-advance to next video or show completion view
  const handleVideoEnded = () => {
    if (hasEndedRef.current) return;
    hasEndedRef.current = true;
    setIsPlaying(false);

    // 1. Mark current lesson as complete automatically
    if (!completedLessonIds.includes(currentLesson.id)) {
      onToggleComplete(currentLesson.id);
    }

    // 2. Auto-advance to next lesson if available
    if (nextLesson) {
      setNextLessonNotification(nextLesson.title);
      setTimeout(() => setNextLessonNotification(null), 3200);
      onSelectLesson(nextLesson);
    } else {
      // 3. Last lesson of the course reached! Show Appreciation & Summary View
      setShowCompletionView(true);
    }
  };

  // Add Note
  const handleAddNote = () => {
    if (!newNoteText.trim()) return;
    const note: Note = {
      id: `note-${Date.now()}`,
      lessonId: currentLesson.id,
      courseId: course.id,
      timestamp: Math.floor(currentTime),
      text: newNoteText.trim(),
      createdAt: new Date().toISOString(),
    };

    const updated = [note, ...notes];
    setNotes(updated);
    setNewNoteText('');

    // Save to server
    fetch('/api/user/notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(note),
    }).catch(() => {});

    try {
      localStorage.setItem(`notes_${currentLesson.id}`, JSON.stringify(updated));
    } catch {}
  };

  // Delete note
  const handleDeleteNote = (noteId: string) => {
    const updated = notes.filter((n) => n.id !== noteId);
    setNotes(updated);
    try {
      localStorage.setItem(`notes_${currentLesson.id}`, JSON.stringify(updated));
    } catch {}
  };

  // If user has completed the entire course or clicked to view completion summary
  if (showCompletionView) {
    return (
      <CourseCompletionView
        course={course}
        completedLessonIds={completedLessonIds}
        onBackToCatalog={onBackToCourse}
        onReviewCourse={(lesson) => {
          setShowCompletionView(false);
          if (lesson) onSelectLesson(lesson);
        }}
        onRestartCourse={() => {
          setShowCompletionView(false);
          if (allLessons.length > 0) onSelectLesson(allLessons[0]);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FBFF] flex flex-col">
      {/* Top Classroom Bar */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-[rgba(80,140,190,0.16)] px-4 sm:px-6 py-3 shadow-[0_2px_10px_rgba(220,238,255,0.3)]">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={onBackToCourse}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#F0F7FF] text-[#2867A8] hover:bg-[#DCEEFF] text-xs font-semibold border border-[rgba(91,159,232,0.25)] transition-all cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>{t.classroom.backToCourse}</span>
            </button>

            <div className="h-4 w-px bg-[rgba(80,140,190,0.2)] hidden sm:block" />

            <div className="min-w-0">
              <div className="flex items-center gap-1.5 text-xs text-[#6B8195]">
                <span className="font-semibold text-[#18324A] truncate max-w-[180px] sm:max-w-[260px]">
                  {course.title}
                </span>
                <span>•</span>
                <span className="text-[#2867A8] font-medium truncate hidden md:inline">
                  {currentLesson.subCourseName}
                </span>
              </div>
              <h1 className="text-sm sm:text-base font-bold text-[#18324A] truncate">
                {currentLesson.title}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* If entire course is completed, provide button to view appreciation & summary anytime */}
            {completedCount === allLessons.length && (
              <button
                onClick={() => setShowCompletionView(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#DCEEFF] text-[#2867A8] hover:bg-[#C8E4FF] border border-[#BFDFFF] transition-all cursor-pointer shadow-xs"
              >
                <Trophy className="w-3.5 h-3.5 text-[#2867A8]" />
                <span className="hidden sm:inline">{t.classroom.courseSummaryBtn}</span>
              </button>
            )}

            {/* Mark as Complete Toggle */}
            <button
              onClick={() => onToggleComplete(currentLesson.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border cursor-pointer ${
                isCompleted
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-white text-[#6B8195] hover:text-[#18324A] border-[rgba(80,140,190,0.2)] hover:border-[#5B9FE8]'
              }`}
            >
              {isCompleted ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>{t.classroom.completed}</span>
                </>
              ) : (
                <>
                  <Circle className="w-4 h-4 text-[#9AAEBD]" />
                  <span>{t.classroom.markComplete}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Classroom Workspace: Main Video + Sidebar */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Video Player & Meta Details */}
        <div className="lg:col-span-8 flex flex-col gap-5">
          {/* Video Player Container */}
          <div
            ref={containerRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={() => isPlaying && setShowControls(false)}
            className="relative aspect-video w-full rounded-2xl bg-[#0e1726] overflow-hidden shadow-[0_12px_36px_rgba(40,103,168,0.25)] border border-[rgba(80,140,190,0.2)] group select-none"
          >
            {isYouTube ? (
              <iframe
                key={currentLesson.id}
                src={getYouTubeEmbedUrl(currentLesson.url)}
                title={currentLesson.title}
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            ) : (
              <video
                ref={videoRef}
                key={currentLesson.id}
                src={currentLesson.url}
                className="w-full h-full object-contain cursor-pointer"
                onClick={togglePlay}
                onTimeUpdate={() => {
                  if (!videoRef.current) return;
                  const curr = videoRef.current.currentTime;
                  const dur = videoRef.current.duration;
                  setCurrentTime(curr);

                  // Reliable auto-advance trigger when video reaches the end
                  if (dur > 0 && curr >= dur - 0.35 && !hasEndedRef.current) {
                    handleVideoEnded();
                  }
                }}
                onLoadedMetadata={() => {
                  if (videoRef.current) {
                    setDuration(videoRef.current.duration);
                    videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
                  }
                }}
                onEnded={handleVideoEnded}
              />
            )}

            {/* Auto-advance notification banner */}
            {nextLessonNotification && (
              <div className="absolute top-4 left-4 right-4 z-30 flex items-center justify-center pointer-events-none animate-in fade-in slide-in-from-top-3">
                <div className="bg-[#18324A]/90 text-white px-4 py-2 rounded-2xl shadow-xl backdrop-blur-md border border-white/20 flex items-center gap-2 text-xs sm:text-sm font-semibold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{t.classroom.playingNextNotification}</span>
                  <span className="text-[#BFDFFF] truncate max-w-[260px]">{nextLessonNotification}</span>
                </div>
              </div>
            )}

            {/* Click to play overlay when paused (HTML5 only) */}
            {!isYouTube && !isPlaying && (
              <div
                onClick={togglePlay}
                className="absolute inset-0 flex items-center justify-center bg-black/25 backdrop-blur-[2px] cursor-pointer"
              >
                <div className="w-16 h-16 rounded-full bg-[#5B9FE8] text-white flex items-center justify-center shadow-[0_6px_24px_rgba(91,159,232,0.6)] transform hover:scale-110 transition-transform">
                  <Play className="w-7 h-7 fill-current ml-1" />
                </div>
              </div>
            )}

            {/* Milk Blue Video Controls Bar (HTML5 only) */}
            {!isYouTube && (
              <div
                className={`absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/80 via-black/40 to-transparent transition-opacity duration-300 ${
                  showControls || !isPlaying ? 'opacity-100' : 'opacity-0 pointer-events-none'
                }`}
              >
              {/* Progress Scrubber */}
              <div className="mb-3">
                <input
                  type="range"
                  min={0}
                  max={duration || 100}
                  value={currentTime}
                  onChange={(e) => {
                    const t = parseFloat(e.target.value);
                    setCurrentTime(t);
                    if (videoRef.current) videoRef.current.currentTime = t;
                  }}
                  className="w-full h-1.5 bg-white/30 rounded-lg appearance-none cursor-pointer accent-[#5B9FE8]"
                />
              </div>

              {/* Bottom Controls Row */}
              <div className="flex items-center justify-between text-white text-xs">
                <div className="flex items-center gap-3">
                  <button
                    onClick={togglePlay}
                    className="p-1.5 rounded-lg hover:bg-white/20 transition-colors"
                  >
                    {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 fill-current" />}
                  </button>

                  <button
                    onClick={() => skip(-10)}
                    title="Rewind 10 seconds (←)"
                    className="p-1.5 rounded-lg hover:bg-white/20 transition-colors"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => skip(10)}
                    title="Forward 10 seconds (→)"
                    className="p-1.5 rounded-lg hover:bg-white/20 transition-colors"
                  >
                    <RotateCw className="w-4 h-4" />
                  </button>

                  {/* Volume */}
                  <div className="flex items-center gap-1.5 ml-1">
                    <button
                      onClick={() => {
                        if (videoRef.current) {
                          videoRef.current.muted = !videoRef.current.muted;
                          setIsMuted(videoRef.current.muted);
                        }
                      }}
                      className="p-1.5 rounded-lg hover:bg-white/20 transition-colors"
                    >
                      {isMuted || volume === 0 ? (
                        <VolumeX className="w-4 h-4" />
                      ) : (
                        <Volume2 className="w-4 h-4" />
                      )}
                    </button>
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.05}
                      value={isMuted ? 0 : volume}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        setVolume(val);
                        setIsMuted(false);
                        if (videoRef.current) {
                          videoRef.current.volume = val;
                          videoRef.current.muted = false;
                        }
                      }}
                      className="w-16 h-1 bg-white/30 rounded appearance-none cursor-pointer accent-[#5B9FE8]"
                    />
                  </div>

                  {/* Current / Duration Time */}
                  <div className="font-mono text-[11px] text-white/90 ml-2">
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  {/* Speed button */}
                  <button
                    onClick={changeSpeed}
                    className="px-2 py-1 rounded bg-white/20 hover:bg-white/30 text-[11px] font-semibold transition-colors"
                  >
                    {playbackRate}x
                  </button>

                  {/* Fullscreen button */}
                  <button
                    onClick={toggleFullscreen}
                    className="p-1.5 rounded-lg hover:bg-white/20 transition-colors"
                  >
                    {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
            )}
          </div>

          {/* Sequential Navigation & Lesson Title Bar */}
          <div className="bg-white rounded-2xl p-5 border border-[rgba(80,140,190,0.16)] shadow-[0_4px_20px_rgba(220,238,255,0.4)]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[rgba(80,140,190,0.12)]">
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold text-[#2867A8] mb-1">
                  <span>{t.classroom.lessonOf} {currentIndex + 1} {t.classroom.from} {allLessons.length}</span>
                  <span>•</span>
                  <span>{currentLesson.subCourseName}</span>
                </div>
                <h2 className="text-xl font-bold text-[#18324A]">{currentLesson.title}</h2>
              </div>

              {/* Linear Previous / Next Lesson controls */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => previousLesson && onSelectLesson(previousLesson)}
                  disabled={!previousLesson}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#F0F7FF] text-[#2867A8] border border-[rgba(91,159,232,0.25)] hover:bg-[#DCEEFF] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  title={previousLesson ? `Previous: ${previousLesson.title}` : 'First lesson in course'}
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span className="hidden sm:inline">{t.classroom.previous}</span>
                </button>

                {nextLesson ? (
                  <button
                    onClick={() => onSelectLesson(nextLesson)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-[#5B9FE8] text-white hover:bg-[#4A8ED8] shadow-sm transition-all cursor-pointer"
                    title={`Next: ${nextLesson.title}`}
                  >
                    <span>{t.classroom.nextLesson}</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={() => setShowCompletionView(true)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm transition-all cursor-pointer"
                    title="Course Selesai! Lihat Halaman Ringkasan & Apresiasi"
                  >
                    <Trophy className="w-4 h-4" />
                    <span>{t.classroom.courseFinished}</span>
                  </button>
                )}
              </div>
            </div>

            {/* Lesson description & details */}
            <div className="pt-4 text-sm text-[#476077]">
              <p className="leading-relaxed mb-3">
                {currentLesson.description ||
                  `In this session, you will explore core principles of ${currentLesson.title}. Review practical scenarios and follow along with local source materials.`}
              </p>

              <div className="flex flex-wrap items-center gap-3 text-xs text-[#6B8195]">
                <div className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-[#5B9FE8]" />
                  <span>Duration: {currentLesson.durationFormatted}</span>
                </div>
                {currentLesson.sizeFormatted && (
                  <div className="flex items-center gap-1">
                    <Layers className="w-3.5 h-3.5 text-[#5B9FE8]" />
                    <span>File size: {currentLesson.sizeFormatted}</span>
                  </div>
                )}
                <div className="flex items-center gap-1 font-mono text-[11px] bg-[#F0F7FF] px-2.5 py-1 rounded-md text-[#2867A8]">
                  <Folder className="w-3 h-3 text-[#5B9FE8]" />
                  <span>{currentLesson.filename}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Lesson Notes Section */}
          <div className="bg-white rounded-2xl p-5 border border-[rgba(80,140,190,0.16)] shadow-[0_4px_20px_rgba(220,238,255,0.4)]">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 font-bold text-sm text-[#18324A]">
                <StickyNote className="w-4 h-4 text-[#5B9FE8]" />
                <span>Timestamped Learning Notes</span>
              </div>
              <span className="text-xs text-[#6B8195] font-medium">
                {notes.length} saved note{notes.length === 1 ? '' : 's'}
              </span>
            </div>

            {/* Add note field */}
            <div className="flex flex-col sm:flex-row gap-2 mb-4">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={newNoteText}
                  onChange={(e) => setNewNoteText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddNote()}
                  placeholder={`Take a note at ${formatTime(currentTime)}...`}
                  className="w-full px-4 py-2.5 bg-[#F0F7FF] border border-[rgba(91,159,232,0.2)] rounded-xl text-sm text-[#18324A] placeholder:text-[#9AAEBD] focus:outline-none focus:ring-2 focus:ring-[#5B9FE8] focus:bg-white"
                />
              </div>
              <button
                onClick={handleAddNote}
                className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#5B9FE8] hover:bg-[#4A8ED8] text-white text-xs font-semibold shadow-sm transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Add Note ({formatTime(currentTime)})</span>
              </button>
            </div>

            {/* List of notes */}
            {notes.length === 0 ? (
              <p className="text-xs text-[#9AAEBD] py-2">
                No notes for this lesson yet. Type key takeaways above to bookmark insights at specific timestamps!
              </p>
            ) : (
              <div className="space-y-2">
                {notes.map((note) => (
                  <div
                    key={note.id}
                    className="flex items-start justify-between gap-3 p-3 rounded-xl bg-[#F8FBFF] border border-[rgba(80,140,190,0.12)] hover:border-[rgba(91,159,232,0.3)] transition-colors"
                  >
                    <div className="flex items-start gap-2.5 min-w-0">
                      <button
                        onClick={() => {
                          if (videoRef.current) videoRef.current.currentTime = note.timestamp;
                        }}
                        className="px-2 py-0.5 rounded-md bg-[#DCEEFF] text-[#2867A8] font-mono text-[11px] font-bold hover:bg-[#BFDFFF] transition-colors shrink-0"
                        title="Click to seek to this timestamp"
                      >
                        {formatTime(note.timestamp)}
                      </button>
                      <p className="text-xs text-[#18324A] leading-relaxed break-words">
                        {note.text}
                      </p>
                    </div>

                    <button
                      onClick={() => handleDeleteNote(note.id)}
                      className="text-[#9AAEBD] hover:text-rose-500 p-1 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Curriculum Syllabus Sidebar */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          {/* Course Progress Card */}
          <div className="bg-white rounded-2xl p-5 border border-[rgba(80,140,190,0.16)] shadow-[0_4px_20px_rgba(220,238,255,0.4)]">
            <h3 className="font-bold text-sm text-[#18324A] mb-1">{course.title}</h3>
            <p className="text-xs text-[#6B8195] mb-3">Instructor: {course.instructor}</p>

            <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
              <span className="text-[#2867A8]">Course Progress</span>
              <span className="text-[#18324A]">{progressPercent}%</span>
            </div>

            <div className="w-full h-2 bg-[#F0F7FF] rounded-full overflow-hidden border border-[rgba(91,159,232,0.15)] mb-3">
              <div
                className="h-full bg-gradient-to-r from-[#5B9FE8] to-[#2867A8] rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(4, progressPercent))}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-xs text-[#6B8195]">
              <span>
                {completedCount} of {allLessons.length} lessons finished
              </span>
              <label className="flex items-center gap-1.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={autoPlayNext}
                  onChange={(e) => setAutoPlayNext(e.target.checked)}
                  className="rounded text-[#5B9FE8] focus:ring-[#5B9FE8]"
                />
                <span className="text-[11px]">Autoplay next</span>
              </label>
            </div>
          </div>

          {/* Structured Modules & Lessons Accordion */}
          <div className="bg-white rounded-2xl border border-[rgba(80,140,190,0.16)] shadow-[0_4px_20px_rgba(220,238,255,0.4)] overflow-hidden flex-1 flex flex-col">
            <div className="p-4 bg-[#F8FBFF] border-b border-[rgba(80,140,190,0.14)] flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-sm text-[#18324A]">
                <Layers className="w-4 h-4 text-[#5B9FE8]" />
                <span>{t.classroom.curriculumTab}</span>
              </div>
              <span className="text-xs text-[#6B8195] font-medium">
                {course.subCourseCount} modules
              </span>
            </div>

            <div className="divide-y divide-[rgba(80,140,190,0.1)] overflow-y-auto max-h-[600px] custom-scrollbar">
              {course.subCourses.map((sub, sIdx) => {
                const isCurrentModule = sub.lessons.some((l) => l.id === currentLesson.id);

                return (
                  <div key={sub.id} className="p-3">
                    {/* Module Title */}
                    <div className="px-2 py-1.5 mb-1.5">
                      <h4 className="text-xs font-bold text-[#18324A] uppercase tracking-wide">
                        {sIdx + 1}. {sub.name}
                      </h4>
                      <p className="text-[11px] text-[#6B8195]">
                        {sub.lessonCount} lessons • {sub.totalDurationFormatted}
                      </p>
                    </div>

                    {/* Lessons list */}
                    <div className="space-y-1">
                      {sub.lessons.map((lesson, lIdx) => {
                        const isCurrent = lesson.id === currentLesson.id;
                        const isDone = completedLessonIds.includes(lesson.id);

                        return (
                          <div
                            key={lesson.id}
                            onClick={() => onSelectLesson(lesson)}
                            className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer text-xs transition-all ${
                              isCurrent
                                ? 'bg-[#DCEEFF] text-[#2867A8] font-semibold shadow-sm border border-[#BFDFFF]'
                                : 'hover:bg-[#F0F7FF] text-[#18324A]'
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0 pr-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onToggleComplete(lesson.id);
                                }}
                                className="shrink-0"
                              >
                                {isDone ? (
                                  <CheckCircle2 className="w-4 h-4 text-emerald-500 fill-emerald-100" />
                                ) : isCurrent ? (
                                  <Play className="w-3.5 h-3.5 text-[#5B9FE8] fill-current" />
                                ) : (
                                  <Circle className="w-3.5 h-3.5 text-[#9AAEBD]" />
                                )}
                              </button>
                              <span className="truncate">
                                {lIdx + 1}. {lesson.title}
                              </span>
                            </div>

                            <span className="text-[11px] font-mono text-[#6B8195] shrink-0">
                              {lesson.durationFormatted}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
