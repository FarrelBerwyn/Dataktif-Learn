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
  PictureInPicture,
  PictureInPicture2,
  X,
  Palette,
} from 'lucide-react';
import { Course, Lesson, Note } from '../types';
import { CourseCompletionView } from './CourseCompletionView';
import { VideoStickyNote } from './VideoStickyNote';
import { useLanguage } from '../context/LanguageContext';
import {
  getStoredSeekbarTheme,
  getNextSeekbarTheme,
  SeekbarColorTheme,
} from '../utils/playerColorThemes';

interface LessonPlayerViewProps {
  course: Course;
  currentLesson: Lesson;
  onSelectLesson: (lesson: Lesson) => void;
  onBackToCourse: () => void;
  completedLessonIds: string[];
  onToggleComplete: (lessonId: string) => void;
  onMinimizeToFloating?: (currentTime: number, isPlaying: boolean) => void;
  initialTime?: number;
  initialPlaying?: boolean;
}

export const LessonPlayerView: React.FC<LessonPlayerViewProps> = ({
  course,
  currentLesson,
  onSelectLesson,
  onBackToCourse,
  completedLessonIds,
  onToggleComplete,
  onMinimizeToFloating,
  initialTime = 0,
  initialPlaying = true,
}) => {
  const { t } = useLanguage();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [isPlaying, setIsPlaying] = useState(initialPlaying);
  const [currentTime, setCurrentTime] = useState(initialTime);
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
  const [activeStickyNote, setActiveStickyNote] = useState<Note | null>(null);
  const [showStickyNote, setShowStickyNote] = useState(false);
  const [stickyNotePosition, setStickyNotePosition] = useState<{ x: number; y: number } | null>(null);
  const [isQuickNoteOpen, setIsQuickNoteOpen] = useState(false);
  const quickNoteInputRef = useRef<HTMLInputElement | null>(null);

  const handleToggleQuickNote = () => {
    setIsQuickNoteOpen((prev) => !prev);
    setTimeout(() => {
      quickNoteInputRef.current?.focus();
    }, 50);
  };

  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Seekbar Color Theme state & Hover tooltip
  const [seekbarTheme, setSeekbarTheme] = useState<SeekbarColorTheme>(getStoredSeekbarTheme);
  const [colorToast, setColorToast] = useState<{ name: string; hex: string } | null>(null);
  const colorToastTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isHoveringSeekbar, setIsHoveringSeekbar] = useState(false);
  const [hoverTime, setHoverTime] = useState(0);
  const [hoverPercent, setHoverPercent] = useState(0);
  const [hoverPos, setHoverPos] = useState<{ x: number; width: number } | null>(null);

  // Video hover thumbnail preview state
  const previewVideoRef = useRef<HTMLVideoElement | null>(null);
  const [previewReady, setPreviewReady] = useState(false);
  const isSeekingPreviewRef = useRef(false);
  const queuedPreviewTimeRef = useRef<number | null>(null);
  const previewSeekSafetyTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const seekPreviewToTime = (time: number) => {
    const vid = previewVideoRef.current;
    if (!vid) return;

    if (isSeekingPreviewRef.current) {
      queuedPreviewTimeRef.current = time;
      return;
    }

    isSeekingPreviewRef.current = true;
    if (previewSeekSafetyTimeoutRef.current) clearTimeout(previewSeekSafetyTimeoutRef.current);
    previewSeekSafetyTimeoutRef.current = setTimeout(() => {
      isSeekingPreviewRef.current = false;
    }, 400);

    try {
      if ('fastSeek' in vid && typeof (vid as any).fastSeek === 'function') {
        (vid as any).fastSeek(time);
      } else {
        vid.currentTime = time;
      }
    } catch {
      vid.currentTime = time;
    }
  };

  // Reset preview video state on lesson change
  useEffect(() => {
    setPreviewReady(false);
    isSeekingPreviewRef.current = false;
    queuedPreviewTimeRef.current = null;
    if (previewSeekSafetyTimeoutRef.current) {
      clearTimeout(previewSeekSafetyTimeoutRef.current);
    }
  }, [currentLesson.id]);

  const cycleSeekbarColor = () => {
    setSeekbarTheme((prev) => {
      const next = getNextSeekbarTheme(prev.id);
      setColorToast({ name: next.name, hex: next.hex });
      if (colorToastTimeoutRef.current) clearTimeout(colorToastTimeoutRef.current);
      colorToastTimeoutRef.current = setTimeout(() => {
        setColorToast(null);
      }, 1800);
      return next;
    });
  };

  // Play/Pause popup feedback state
  const [playFeedback, setPlayFeedback] = useState<{
    type: 'play' | 'pause';
    key: number;
  } | null>(null);
  const playFeedbackTimerRef = useRef<NodeJS.Timeout | null>(null);

  const triggerPlayFeedback = (type: 'play' | 'pause') => {
    setPlayFeedback({ type, key: Date.now() });
    if (playFeedbackTimerRef.current) clearTimeout(playFeedbackTimerRef.current);
    playFeedbackTimerRef.current = setTimeout(() => {
      setPlayFeedback(null);
    }, 650);
  };

  // Check if current lesson is a YouTube video URL
  const isYouTube = Boolean(
    currentLesson.url && (currentLesson.url.includes('youtube.com') || currentLesson.url.includes('youtu.be'))
  );

  // Check if current lesson has specific YouTube chapter intervals
  const isYouTubeChapter = Boolean(
    isYouTube &&
    typeof currentLesson.startTime === 'number' &&
    typeof currentLesson.endTime === 'number' &&
    currentLesson.endTime > currentLesson.startTime
  );

  const chapterDuration = isYouTubeChapter
    ? Math.max(0, (currentLesson.endTime || 0) - (currentLesson.startTime || 0))
    : (currentLesson.duration || 0);

  // Custom chapter timeline control state
  const [useCustomChapterControls, setUseCustomChapterControls] = useState<boolean>(true);
  const [ytRelativeTime, setYtRelativeTime] = useState<number>(0);
  const ytPlayerRef = useRef<any>(null);
  const ytIframeRef = useRef<HTMLIFrameElement | null>(null);
  const ytPollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const effectiveCurrentTime = isYouTubeChapter ? ytRelativeTime : currentTime;
  const effectiveDuration = isYouTubeChapter ? chapterDuration : duration;

  const sendYouTubeCommand = (func: string, args: any[] = []) => {
    if (ytPlayerRef.current && typeof ytPlayerRef.current[func] === 'function') {
      try {
        ytPlayerRef.current[func](...args);
        return;
      } catch {}
    }
    if (ytIframeRef.current && ytIframeRef.current.contentWindow) {
      ytIframeRef.current.contentWindow.postMessage(
        JSON.stringify({
          event: 'command',
          func,
          args,
        }),
        '*'
      );
    }
  };

  const getYouTubeEmbedUrl = (
    url: string,
    start?: number,
    end?: number,
    hideControls: boolean = false
  ) => {
    if (!url) return '';
    let startTime = start;
    let endTime = end;
    try {
      const parsed = new URL(url.startsWith('http') ? url : `https://${url}`);
      if (startTime === undefined) {
        const s = parsed.searchParams.get('start') || parsed.searchParams.get('t');
        if (s) startTime = parseInt(s.replace(/\D/g, ''), 10);
      }
      if (endTime === undefined) {
        const e = parsed.searchParams.get('end');
        if (e) endTime = parseInt(e.replace(/\D/g, ''), 10);
      }
    } catch {}

    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    const id = match && match[2].length === 11 ? match[2] : null;
    const originParam = typeof window !== 'undefined' ? `&origin=${encodeURIComponent(window.location.origin)}` : '';

    if (!id) {
      if (url.includes('/embed/')) {
        const sep = url.includes('?') ? '&' : '?';
        return `${url}${sep}autoplay=1&rel=0&enablejsapi=1${originParam}${hideControls ? '&controls=0' : ''}`;
      }
      return url;
    }

    let embedUrl = `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&enablejsapi=1${originParam}`;
    if (hideControls) {
      embedUrl += '&controls=0';
    }
    if (typeof startTime === 'number' && startTime > 0) {
      embedUrl += `&start=${startTime}`;
    }
    if (typeof endTime === 'number' && endTime > 0) {
      embedUrl += `&end=${endTime}`;
    }
    return embedUrl;
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

  // Auto-display matching sticky note when navigating directly to a note's timestamp
  useEffect(() => {
    if (initialTime > 0 && notes.length > 0) {
      const match = notes.find((n) => Math.abs(n.timestamp - initialTime) <= 3);
      if (match) {
        setActiveStickyNote(match);
        setShowStickyNote(true);
      }
    }
  }, [initialTime, notes]);

  // Video time formatting (supports HH:MM:SS for long chapters/courses)
  const formatTime = (secs: number, forceHours: boolean = false) => {
    if (isNaN(secs) || secs < 0) return forceHours ? '00:00:00' : '00:00';
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = Math.floor(secs % 60);
    if (h > 0 || forceHours || effectiveDuration >= 3600) {
      return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Handle Play/Pause
  const togglePlay = () => {
    if (isYouTubeChapter && useCustomChapterControls) {
      if (isPlaying) {
        sendYouTubeCommand('pauseVideo');
        setIsPlaying(false);
        triggerPlayFeedback('pause');
      } else {
        sendYouTubeCommand('playVideo');
        setIsPlaying(true);
        triggerPlayFeedback('play');
      }
      return;
    }
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play().then(() => {
        setIsPlaying(true);
        triggerPlayFeedback('play');
      }).catch(() => {});
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
      triggerPlayFeedback('pause');
    }
  };

  // Skip time
  const skip = (seconds: number) => {
    if (isYouTubeChapter && useCustomChapterControls) {
      const newRel = Math.max(0, Math.min(chapterDuration, ytRelativeTime + seconds));
      const targetAbs = (currentLesson.startTime || 0) + newRel;
      sendYouTubeCommand('seekTo', [targetAbs, true]);
      setYtRelativeTime(newRel);
      setCurrentTime(newRel);
      return;
    }
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
    if (isYouTubeChapter && useCustomChapterControls) {
      sendYouTubeCommand('setPlaybackRate', [newSpeed]);
      return;
    }
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

  // Toggle Native Browser Picture-in-Picture
  const toggleNativePiP = async () => {
    if (!videoRef.current) return;
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else {
        await videoRef.current.requestPictureInPicture();
      }
    } catch (err) {
      console.warn('Native PiP not supported or failed:', err);
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
        if (isYouTubeChapter && useCustomChapterControls) {
          if (isMuted) {
            sendYouTubeCommand('unMute');
            setIsMuted(false);
          } else {
            sendYouTubeCommand('mute');
            setIsMuted(true);
          }
        } else if (videoRef.current) {
          videoRef.current.muted = !videoRef.current.muted;
          setIsMuted(videoRef.current.muted);
        }
      } else if (e.key.toLowerCase() === 'f') {
        e.preventDefault();
        toggleFullscreen();
      } else if (e.key.toLowerCase() === 'p') {
        e.preventDefault();
        if (!isYouTube) toggleNativePiP();
      } else if (e.key.toLowerCase() === 'i') {
        e.preventDefault();
        if (onMinimizeToFloating) {
          onMinimizeToFloating(effectiveCurrentTime, isPlaying);
        }
      } else if (e.key.toLowerCase() === 'n') {
        e.preventDefault();
        handleToggleQuickNote();
      } else if (e.key.toLowerCase() === 'c') {
        e.preventDefault();
        cycleSeekbarColor();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, isYouTubeChapter, useCustomChapterControls, ytRelativeTime, chapterDuration, isMuted, effectiveCurrentTime]);

  // Keep fullscreen state in sync with native browser events (e.g. Escape key)
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

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

  // YouTube Player synchronization effect for Custom Chapter Timeline
  const ytIframeDomId = `yt-iframe-${currentLesson.id}`;
  useEffect(() => {
    if (!isYouTubeChapter) {
      if (ytPollIntervalRef.current) clearInterval(ytPollIntervalRef.current);
      return;
    }

    setYtRelativeTime(0);
    setIsPlaying(true);
    hasEndedRef.current = false;

    let isDestroyed = false;

    const initYT = () => {
      if (isDestroyed) return;
      if (window.YT && window.YT.Player) {
        try {
          if (ytPlayerRef.current) {
            try { ytPlayerRef.current.destroy(); } catch {}
            ytPlayerRef.current = null;
          }
          ytPlayerRef.current = new window.YT.Player(ytIframeDomId, {
            events: {
              onReady: (event: any) => {
                if (isDestroyed) return;
                try {
                  event.target.playVideo();
                } catch {}
              },
              onStateChange: (event: any) => {
                if (isDestroyed) return;
                if (event.data === 1) {
                  setIsPlaying(true);
                } else if (event.data === 2) {
                  setIsPlaying(false);
                } else if (event.data === 0) {
                  handleVideoEnded();
                }
              },
            },
          });
        } catch (err) {
          console.warn('YT.Player init notice:', err);
        }
      }
    };

    const timer = setTimeout(() => {
      if (window.YT && window.YT.Player) {
        initYT();
      } else {
        const prevOnReady = window.onYouTubeIframeAPIReady;
        window.onYouTubeIframeAPIReady = () => {
          if (prevOnReady) prevOnReady();
          initYT();
        };
      }
    }, 150);

    // Continuous interval for checking chapter bounds and updating relative scrubber
    ytPollIntervalRef.current = setInterval(() => {
      if (isDestroyed) return;
      let absTime: number | null = null;
      if (ytPlayerRef.current && typeof ytPlayerRef.current.getCurrentTime === 'function') {
        try {
          absTime = ytPlayerRef.current.getCurrentTime();
        } catch {}
      }

      if (absTime !== null && typeof absTime === 'number') {
        const start = currentLesson.startTime || 0;
        const end = currentLesson.endTime || (start + chapterDuration);
        const rel = Math.max(0, Math.min(chapterDuration, absTime - start));
        setYtRelativeTime(rel);
        setCurrentTime(rel);

        if (absTime >= end - 0.45 && !hasEndedRef.current) {
          handleVideoEnded();
        }
      }
    }, 250);

    const handleMessage = (e: MessageEvent) => {
      try {
        const data = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;
        if (data && data.event === 'infoDelivery' && data.info) {
          if (typeof data.info.currentTime === 'number') {
            const absTime = data.info.currentTime;
            const start = currentLesson.startTime || 0;
            const end = currentLesson.endTime || (start + chapterDuration);
            const rel = Math.max(0, Math.min(chapterDuration, absTime - start));
            setYtRelativeTime(rel);
            setCurrentTime(rel);

            if (absTime >= end - 0.45 && !hasEndedRef.current) {
              handleVideoEnded();
            }
          }
          if (typeof data.info.playerState === 'number') {
            if (data.info.playerState === 1) setIsPlaying(true);
            else if (data.info.playerState === 2) setIsPlaying(false);
            else if (data.info.playerState === 0) handleVideoEnded();
          }
        }
      } catch {}
    };

    window.addEventListener('message', handleMessage);

    return () => {
      isDestroyed = true;
      clearTimeout(timer);
      if (ytPollIntervalRef.current) clearInterval(ytPollIntervalRef.current);
      window.removeEventListener('message', handleMessage);
      if (ytPlayerRef.current) {
        try { ytPlayerRef.current.destroy(); } catch {}
        ytPlayerRef.current = null;
      }
    };
  }, [currentLesson.id, isYouTubeChapter, useCustomChapterControls]);

  // Seek to specific relative time (supporting both local video and YouTube chapter)
  const seekToTime = (time: number) => {
    if (isYouTubeChapter && useCustomChapterControls) {
      const targetAbs = (currentLesson.startTime || 0) + time;
      sendYouTubeCommand('seekTo', [targetAbs, true]);
      setYtRelativeTime(time);
      setCurrentTime(time);
    } else if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  // Add Note
  const handleAddNote = () => {
    if (!newNoteText.trim()) return;
    const note: Note = {
      id: `note-${Date.now()}`,
      lessonId: currentLesson.id,
      courseId: course.id,
      timestamp: Math.floor(effectiveCurrentTime),
      text: newNoteText.trim(),
      createdAt: new Date().toISOString(),
    };

    const updated = [note, ...notes];
    setNotes(updated);
    setNewNoteText('');
    setActiveStickyNote(note);
    setShowStickyNote(true);

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

            {/* Floating Window (PiP) button */}
            {onMinimizeToFloating && (
              <button
                onClick={() => onMinimizeToFloating(currentTime, isPlaying)}
                title={t.classroom.minimizeToFloating}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#F0F7FF] text-[#2867A8] hover:bg-[#DCEEFF] border border-[rgba(91,159,232,0.25)] transition-all cursor-pointer shadow-xs"
              >
                <PictureInPicture2 className="w-3.5 h-3.5 text-[#2867A8]" />
                <span className="hidden sm:inline">{t.classroom.floatingWindow}</span>
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
            className="relative aspect-video w-full rounded-2xl bg-[#0e1726] shadow-[0_12px_36px_rgba(40,103,168,0.25)] border border-[rgba(80,140,190,0.2)] group select-none"
          >
            {/* Inner Video Viewport with overflow-hidden for rounded video corners */}
            <div className="absolute inset-0 rounded-2xl overflow-hidden">
              {isYouTube ? (
                <iframe
                  id={ytIframeDomId}
                  ref={ytIframeRef}
                  key={`${currentLesson.id}-${isYouTubeChapter && useCustomChapterControls ? 'custom' : 'native'}`}
                  src={getYouTubeEmbedUrl(
                    currentLesson.url,
                    currentLesson.startTime,
                    currentLesson.endTime,
                    isYouTubeChapter && useCustomChapterControls
                  )}
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
                    if (initialTime > 0) {
                      videoRef.current.currentTime = initialTime;
                    }
                    if (initialPlaying) {
                      videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
                    }
                  }
                }}
                onEnded={handleVideoEnded}
              />
            )}

            {/* Switcher back to Custom Chapter Timeline if user switched to native YouTube controls */}
            {isYouTubeChapter && !useCustomChapterControls && (
              <div className="absolute top-4 right-4 z-30 animate-in fade-in slide-in-from-top-2">
                <button
                  onClick={() => setUseCustomChapterControls(true)}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#18324A]/95 hover:bg-[#18324A] text-[#BFDFFF] border border-[rgba(91,159,232,0.4)] text-xs font-semibold shadow-[0_8px_24px_rgba(0,0,0,0.5)] backdrop-blur-md transition-all cursor-pointer group"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#5B9FE8] group-hover:rotate-12 transition-transform" />
                  <span>Gunakan Custom Chapter Timeline</span>
                </button>
              </div>
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

            {/* Transparent click surface across video player for instant play/pause toggle */}
            {(!isYouTube || (isYouTubeChapter && useCustomChapterControls)) && (
              <div
                onClick={togglePlay}
                className="absolute inset-0 z-10 cursor-pointer"
                title={isPlaying ? 'Jeda video' : 'Putar video'}
              />
            )}

            {/* Brief Pop-up Feedback Icon & Blur Animation on Play/Pause */}
            {(!isYouTube || (isYouTubeChapter && useCustomChapterControls)) && playFeedback && (
              <div
                key={playFeedback.key}
                className="absolute inset-0 flex items-center justify-center pointer-events-none z-20 overflow-hidden rounded-2xl"
              >
                {/* Subtle backdrop blur that flashes and fades out quickly */}
                <div className="absolute inset-0 bg-black/25 animate-blur-flash" />

                {/* Scaled pop-up icon badge */}
                <div className="relative animate-play-popup flex items-center justify-center">
                  <div
                    className="w-18 h-18 sm:w-20 sm:h-20 rounded-full bg-black/60 backdrop-blur-md border border-white/25 flex items-center justify-center text-white"
                    style={{
                      boxShadow: `0 0 35px ${seekbarTheme.glow}, 0 12px 36px rgba(0,0,0,0.65)`,
                    }}
                  >
                    {playFeedback.type === 'pause' ? (
                      <Pause className="w-8 h-8 sm:w-9 sm:h-9 fill-current text-white" />
                    ) : (
                      <Play className="w-8 h-8 sm:w-9 sm:h-9 fill-current text-white ml-1" />
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Seekbar Color Change Toast Notification */}
            {colorToast && (
              <div className="absolute top-5 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-[#0e1726]/90 backdrop-blur-md border border-white/20 shadow-2xl text-white text-xs font-semibold animate-in fade-in slide-in-from-top-2 pointer-events-none">
                <span
                  className="w-3.5 h-3.5 rounded-full shadow-sm shrink-0 ring-2 ring-white/50"
                  style={{ backgroundColor: colorToast.hex, boxShadow: `0 0 10px ${colorToast.hex}` }}
                />
                <span>Warna Seekbar: <strong style={{ color: colorToast.hex }}>{colorToast.name}</strong></span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-white/15 text-white/80 font-mono font-normal">
                  Tekan C
                </span>
              </div>
            )}

            {/* Milk Blue Video Controls Bar (HTML5 video or YouTube Custom Chapter Timeline) */}
            {(!isYouTube || (isYouTubeChapter && useCustomChapterControls)) && (
              <div
                className={`absolute inset-x-0 bottom-0 p-4 z-20 bg-gradient-to-t from-black/85 via-black/45 to-transparent transition-opacity duration-300 ${
                  showControls || !isPlaying ? 'opacity-100' : 'opacity-0 pointer-events-none'
                }`}
              >
              {(() => {
                const progressPercent = effectiveDuration > 0 ? Math.min(100, Math.max(0, (effectiveCurrentTime / effectiveDuration) * 100)) : 0;
                const volumePercent = (isMuted ? 0 : volume) * 100;

                return (
                  <>
                    {/* YouTube Custom Chapter Timeline Header Badge */}
                    {isYouTubeChapter && (
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2 px-3 py-1 rounded-xl bg-black/60 backdrop-blur-md border border-[rgba(91,159,232,0.3)] shadow-xs">
                          <span className="w-2 h-2 rounded-full bg-[#5B9FE8] animate-pulse" />
                          <span className="text-[11px] font-semibold text-[#BFDFFF] tracking-wide">
                            Custom Chapter Timeline • {formatTime(currentLesson.startTime || 0, true)} – {formatTime(currentLesson.endTime || 0, true)}
                          </span>
                          <span className="text-[10px] text-white/60 font-mono">
                            ({currentLesson.durationFormatted})
                          </span>
                        </div>

                        <button
                          onClick={() => setUseCustomChapterControls(false)}
                          className="text-[10px] font-medium text-white/75 hover:text-white bg-white/10 hover:bg-white/20 px-2.5 py-1 rounded-lg backdrop-blur-xs border border-white/15 transition-all cursor-pointer"
                          title="Beralih ke kontrol bawaan YouTube jika ingin akses CC atau resolusi"
                        >
                          Gunakan Kontrol YouTube
                        </button>
                      </div>
                    )}

                    {/* Progress Scrubber */}
                    <div className="relative mb-3 group/seekbar">
                      {/* Hover Video Preview Thumbnail Tooltip (HTML5 video only) */}
                      {!isYouTube && duration > 0 && (
                        <div
                          className={`absolute bottom-full mb-3.5 pointer-events-none z-30 transition-all duration-150 ease-out origin-bottom ${
                            isHoveringSeekbar && hoverPos
                              ? 'opacity-100 scale-100 translate-y-0'
                              : 'opacity-0 scale-95 translate-y-1'
                          }`}
                          style={{
                            left: hoverPos
                              ? `${Math.max(88, Math.min(hoverPos.x, Math.max(88, hoverPos.width - 88)))}px`
                              : '50%',
                            transform: 'translateX(-50%)',
                          }}
                        >
                          {/* Image preview card with small border radius */}
                          <div
                            className="relative w-40 h-[92px] sm:w-44 sm:h-[101px] rounded-lg overflow-hidden bg-[#0c1421] border border-white/25 ring-1 ring-black/60 shadow-[0_12px_32px_rgba(0,0,0,0.85)]"
                            style={{
                              boxShadow: `0 12px 32px rgba(0,0,0,0.85), 0 0 16px ${seekbarTheme.glow}40`,
                            }}
                          >
                            {/* Fallback thumbnail / poster while video frame decodes */}
                            {currentLesson.thumbnail && (
                              <img
                                src={currentLesson.thumbnail}
                                alt="Preview Thumbnail"
                                className="absolute inset-0 w-full h-full object-cover opacity-75 pointer-events-none"
                              />
                            )}

                            {/* Dedicated preview video element for real-time hovered frame */}
                            <video
                              ref={previewVideoRef}
                              key={`preview-${currentLesson.id}`}
                              src={currentLesson.url}
                              preload="auto"
                              muted
                              playsInline
                              className={`absolute inset-0 w-full h-full object-cover pointer-events-none transition-opacity duration-150 ${
                                previewReady ? 'opacity-100' : 'opacity-0'
                              }`}
                              onLoadedData={() => setPreviewReady(true)}
                              onSeeked={() => {
                                setPreviewReady(true);
                                isSeekingPreviewRef.current = false;
                                if (queuedPreviewTimeRef.current !== null) {
                                  const next = queuedPreviewTimeRef.current;
                                  queuedPreviewTimeRef.current = null;
                                  seekPreviewToTime(next);
                                }
                              }}
                              onError={() => {
                                isSeekingPreviewRef.current = false;
                              }}
                            />

                            {/* Bottom shadow gradient for legible timestamp */}
                            <div className="absolute inset-x-0 bottom-0 h-9 bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none" />

                            {/* Timestamp pill with seekbar theme dot */}
                            <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-md bg-black/80 backdrop-blur-xs text-white text-[11px] font-mono font-bold shadow-md border border-white/15 flex items-center gap-1.5 pointer-events-none whitespace-nowrap">
                              <span
                                className="w-1.5 h-1.5 rounded-full shrink-0"
                                style={{ backgroundColor: seekbarTheme.hex, boxShadow: `0 0 6px ${seekbarTheme.hex}` }}
                              />
                              <span>{formatTime(hoverTime)}</span>
                            </div>
                          </div>

                          {/* Downward triangle caret pointing directly to mouse pointer */}
                          {hoverPos && (
                            <div
                              className="absolute -bottom-[5px] pointer-events-none"
                              style={{
                                left: `calc(50% + ${Math.max(
                                  -72,
                                  Math.min(
                                    72,
                                    hoverPos.x - Math.max(88, Math.min(hoverPos.x, Math.max(88, hoverPos.width - 88)))
                                  )
                                )}px)`,
                                transform: 'translateX(-50%)',
                              }}
                            >
                              <div className="w-0 h-0 border-x-[5px] border-x-transparent border-t-[5px] border-t-white/35" />
                            </div>
                          )}
                        </div>
                      )}

                      <input
                        type="range"
                        min={0}
                        max={effectiveDuration || 100}
                        value={effectiveCurrentTime}
                        onMouseMove={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
                          const pct = (x / rect.width) * 100;
                          const time = (pct / 100) * (effectiveDuration || 0);
                          setHoverPercent(pct);
                          setHoverTime(time);
                          setHoverPos({ x, width: rect.width });
                          setIsHoveringSeekbar(true);
                          if (!isYouTube) {
                            seekPreviewToTime(time);
                          }
                        }}
                        onMouseLeave={() => {
                          setIsHoveringSeekbar(false);
                          setHoverPos(null);
                        }}
                        onChange={(e) => {
                          const t = parseFloat(e.target.value);
                          if (isYouTubeChapter) {
                            const targetAbs = (currentLesson.startTime || 0) + t;
                            sendYouTubeCommand('seekTo', [targetAbs, true]);
                            setYtRelativeTime(t);
                            setCurrentTime(t);
                          } else {
                            setCurrentTime(t);
                            if (videoRef.current) videoRef.current.currentTime = t;
                          }
                        }}
                        className="video-seekbar w-full"
                        style={{
                          background: `linear-gradient(to right, ${seekbarTheme.hex} 0%, ${seekbarTheme.hex} ${progressPercent}%, rgba(255,255,255,0.22) ${progressPercent}%, rgba(255,255,255,0.22) 100%)`,
                          ['--seekbar-thumb-color' as any]: seekbarTheme.hex,
                          ['--seekbar-glow-color' as any]: seekbarTheme.glow,
                          accentColor: seekbarTheme.hex,
                        }}
                      />
                    </div>

                    {/* Bottom Controls Row */}
                    <div className="flex items-center justify-between text-white text-xs">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={togglePlay}
                          className="p-1.5 rounded-lg hover:bg-white/20 transition-colors cursor-pointer"
                        >
                          {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 fill-current" />}
                        </button>

                        <button
                          onClick={() => skip(-10)}
                          title="Rewind 10 seconds (←)"
                          className="p-1.5 rounded-lg hover:bg-white/20 transition-colors cursor-pointer"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => skip(10)}
                          title="Forward 10 seconds (→)"
                          className="p-1.5 rounded-lg hover:bg-white/20 transition-colors cursor-pointer"
                        >
                          <RotateCw className="w-4 h-4" />
                        </button>

                        {/* Volume */}
                        <div className="flex items-center gap-1.5 ml-1">
                          <button
                            onClick={() => {
                              if (isYouTubeChapter && useCustomChapterControls) {
                                if (isMuted) {
                                  sendYouTubeCommand('unMute');
                                  setIsMuted(false);
                                } else {
                                  sendYouTubeCommand('mute');
                                  setIsMuted(true);
                                }
                              } else if (videoRef.current) {
                                videoRef.current.muted = !videoRef.current.muted;
                                setIsMuted(videoRef.current.muted);
                              }
                            }}
                            className="p-1.5 rounded-lg hover:bg-white/20 transition-colors cursor-pointer"
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
                              if (isYouTubeChapter && useCustomChapterControls) {
                                sendYouTubeCommand('setVolume', [val * 100]);
                                sendYouTubeCommand('unMute');
                              } else if (videoRef.current) {
                                videoRef.current.volume = val;
                                videoRef.current.muted = false;
                              }
                            }}
                            className="volume-slider w-16"
                            style={{
                              background: `linear-gradient(to right, ${seekbarTheme.hex} 0%, ${seekbarTheme.hex} ${volumePercent}%, rgba(255,255,255,0.22) ${volumePercent}%, rgba(255,255,255,0.22) 100%)`,
                              ['--seekbar-thumb-color' as any]: seekbarTheme.hex,
                              ['--seekbar-glow-color' as any]: seekbarTheme.glow,
                              accentColor: seekbarTheme.hex,
                            }}
                          />
                        </div>

                        {/* Current / Duration Time */}
                        <div className="font-mono text-[11px] text-white/90 ml-2">
                          {formatTime(effectiveCurrentTime)} / {formatTime(effectiveDuration)}
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5">
                        {/* Speed button */}
                        <button
                          onClick={changeSpeed}
                          className="px-2 py-1 rounded bg-white/20 hover:bg-white/30 text-[11px] font-semibold transition-colors cursor-pointer"
                        >
                          {playbackRate}x
                        </button>

                        {/* Native Picture-in-Picture button (HTML5 video only) */}
                        {!isYouTube && (
                          <button
                            onClick={toggleNativePiP}
                            title={`${t.classroom.pipNative} (P)`}
                            className="p-1.5 rounded-lg hover:bg-white/20 transition-colors cursor-pointer"
                          >
                            <PictureInPicture className="w-4 h-4" />
                          </button>
                        )}

                        {/* In-app Floating Window (miniplayer) button */}
                        {onMinimizeToFloating && (
                          <button
                            onClick={() => onMinimizeToFloating(effectiveCurrentTime, isPlaying)}
                            title={`${t.classroom.minimizeToFloating} (I)`}
                            className="p-1.5 rounded-lg hover:bg-white/20 transition-colors cursor-pointer"
                          >
                            <PictureInPicture2 className="w-4 h-4" />
                          </button>
                        )}

                        {/* Seekbar Color Switcher Shortcut Button */}
                        <button
                          onClick={cycleSeekbarColor}
                          title={`Ganti Warna Seekbar (Tekan C): ${seekbarTheme.name}`}
                          className="p-1.5 rounded-lg hover:bg-white/20 transition-colors cursor-pointer relative group/colorbtn"
                        >
                          <Palette className="w-4 h-4" style={{ color: seekbarTheme.hex }} />
                          <span
                            className="absolute bottom-1 right-1 w-1.5 h-1.5 rounded-full ring-1 ring-black/40"
                            style={{
                              backgroundColor: seekbarTheme.hex,
                              boxShadow: `0 0 6px ${seekbarTheme.hex}`,
                            }}
                          />
                        </button>

                        {/* Quick Add Note shortcut button */}
                        <button
                          onClick={handleToggleQuickNote}
                          title="Tambah Catatan (N)"
                          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                            isQuickNoteOpen ? 'bg-[#5B9FE8] text-white shadow-sm' : 'hover:bg-white/20 text-white'
                          }`}
                        >
                          <StickyNote className="w-4 h-4" />
                        </button>

                        {/* Fullscreen button */}
                        <button
                          onClick={toggleFullscreen}
                          className="p-1.5 rounded-lg hover:bg-white/20 transition-colors cursor-pointer"
                        >
                          {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
            )}

            {/* Quick Note Input Popover (appears when clicking the shortcut button) */}
            {isQuickNoteOpen && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="absolute bottom-16 right-4 sm:right-6 z-40 w-72 sm:w-80 bg-[#18324A]/95 backdrop-blur-md p-3 rounded-2xl shadow-[0_12px_36px_rgba(0,0,0,0.5)] border border-[rgba(91,159,232,0.35)] animate-in fade-in slide-in-from-bottom-2"
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-[#BFDFFF]">
                    <StickyNote className="w-3.5 h-3.5 text-[#5B9FE8]" />
                    <span>Tambah Catatan @ {formatTime(effectiveCurrentTime)}</span>
                  </div>
                  <button
                    onClick={() => setIsQuickNoteOpen(false)}
                    className="p-1 text-white/60 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="flex gap-2">
                  <input
                    ref={quickNoteInputRef}
                    type="text"
                    value={newNoteText}
                    onChange={(e) => setNewNoteText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (newNoteText.trim()) {
                          handleAddNote();
                          setIsQuickNoteOpen(false);
                        }
                      } else if (e.key === 'Escape') {
                        setIsQuickNoteOpen(false);
                      }
                    }}
                    placeholder="Tulis catatan singkat..."
                    className="flex-1 px-3 py-1.5 bg-[#0e1726]/80 border border-white/20 rounded-xl text-xs text-white placeholder:text-white/40 focus:outline-none focus:ring-1 focus:ring-[#5B9FE8]"
                    autoFocus
                  />
                  <button
                    onClick={() => {
                      if (newNoteText.trim()) {
                        handleAddNote();
                        setIsQuickNoteOpen(false);
                      }
                    }}
                    className="px-3 py-1.5 rounded-xl bg-[#5B9FE8] hover:bg-[#4A8ED8] text-white text-xs font-semibold shrink-0 transition-colors cursor-pointer"
                  >
                    Simpan
                  </button>
                </div>
              </div>
            )}
            </div>

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

            {/* Interactive Sticky Note on top of video player (draggable around player perimeter) */}
            {showStickyNote && activeStickyNote && (
              <VideoStickyNote
                key={activeStickyNote.id}
                note={activeStickyNote}
                onClose={() => setShowStickyNote(false)}
                onSeek={(time) => {
                  seekToTime(time);
                }}
                durationSeconds={10}
                isFullscreen={isFullscreen}
                position={stickyNotePosition}
                onPositionChange={setStickyNotePosition}
              />
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
                  placeholder={`Take a note at ${formatTime(effectiveCurrentTime)}...`}
                  className="w-full px-4 py-2.5 bg-[#F0F7FF] border border-[rgba(91,159,232,0.2)] rounded-xl text-sm text-[#18324A] placeholder:text-[#9AAEBD] focus:outline-none focus:ring-2 focus:ring-[#5B9FE8] focus:bg-white"
                />
              </div>
              <button
                onClick={handleAddNote}
                className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#5B9FE8] hover:bg-[#4A8ED8] text-white text-xs font-semibold shadow-sm transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Note ({formatTime(effectiveCurrentTime)})</span>
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
                          seekToTime(note.timestamp);
                          setActiveStickyNote(note);
                          setShowStickyNote(true);
                        }}
                        className="px-2 py-0.5 rounded-md bg-[#DCEEFF] text-[#2867A8] font-mono text-[11px] font-bold hover:bg-[#BFDFFF] transition-colors shrink-0 cursor-pointer"
                        title="Click to seek and display as Sticky Note"
                      >
                        {formatTime(note.timestamp)}
                      </button>
                      <p
                        onClick={() => {
                          seekToTime(note.timestamp);
                          setActiveStickyNote(note);
                          setShowStickyNote(true);
                        }}
                        className="text-xs text-[#18324A] leading-relaxed break-words cursor-pointer hover:text-[#2867A8] transition-colors"
                        title="Click to display on video player"
                      >
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
