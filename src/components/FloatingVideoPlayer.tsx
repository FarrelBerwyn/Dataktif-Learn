import React, { useState, useRef, useEffect } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Volume2,
  VolumeX,
  Maximize2,
  X,
  ChevronRight,
  GripHorizontal,
  PictureInPicture,
} from 'lucide-react';
import { Course, Lesson } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { getStoredSeekbarTheme } from '../utils/playerColorThemes';

interface FloatingVideoPlayerProps {
  course: Course;
  currentLesson: Lesson;
  initialTime?: number;
  initialPlaying?: boolean;
  onExpand: (currentTime: number, isPlaying: boolean) => void;
  onClose: () => void;
  onSelectLesson?: (lesson: Lesson) => void;
}

export const FloatingVideoPlayer: React.FC<FloatingVideoPlayerProps> = ({
  course,
  currentLesson,
  initialTime = 0,
  initialPlaying = true,
  onExpand,
  onClose,
  onSelectLesson,
}) => {
  const { t } = useLanguage();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [isPlaying, setIsPlaying] = useState(initialPlaying);
  const [currentTime, setCurrentTime] = useState(initialTime);
  const [duration, setDuration] = useState(currentLesson.duration || 0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);

  const dragRef = useRef<{ startX: number; startY: number; initX: number; initY: number }>({
    startX: 0,
    startY: 0,
    initX: 0,
    initY: 0,
  });

  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [isHoveringSeekbar, setIsHoveringSeekbar] = useState(false);
  const [hoverTime, setHoverTime] = useState(0);
  const [hoverPos, setHoverPos] = useState<{ x: number; width: number } | null>(null);
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

  const isYouTube = Boolean(
    currentLesson.url && (currentLesson.url.includes('youtube.com') || currentLesson.url.includes('youtu.be'))
  );

  const getYouTubeEmbedUrl = (url: string, start?: number, end?: number) => {
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
    if (!id) {
      if (url.includes('/embed/')) {
        return url.includes('?') ? `${url}&autoplay=1&rel=0` : `${url}?autoplay=1&rel=0`;
      }
      return url;
    }

    let embedUrl = `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`;
    if (typeof startTime === 'number' && startTime > 0) {
      embedUrl += `&start=${startTime}`;
    }
    if (typeof endTime === 'number' && endTime > 0) {
      embedUrl += `&end=${endTime}`;
    }
    return embedUrl;
  };

  // Flatten lessons to find next lesson
  const allLessons: Lesson[] = [];
  course.subCourses.forEach((s) => s.lessons.forEach((l) => allLessons.push(l)));
  const currentIndex = allLessons.findIndex((l) => l.id === currentLesson.id);
  const nextLesson = currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null;

  // Restore initial playback time on mount or lesson change
  useEffect(() => {
    if (videoRef.current) {
      if (initialTime > 0) {
        videoRef.current.currentTime = initialTime;
        setCurrentTime(initialTime);
      }
      if (initialPlaying) {
        videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
      }
    }
    setPreviewReady(false);
    isSeekingPreviewRef.current = false;
    queuedPreviewTimeRef.current = null;
    if (previewSeekSafetyTimeoutRef.current) {
      clearTimeout(previewSeekSafetyTimeoutRef.current);
    }
  }, [currentLesson.id]);

  // Format mm:ss or hh:mm:ss
  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return '00:00';
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = Math.floor(secs % 60);
    if (h > 0 || (currentLesson.duration && currentLesson.duration >= 3600)) {
      return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const togglePlay = () => {
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

  const skip = (seconds: number) => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = Math.max(
      0,
      Math.min(videoRef.current.duration, videoRef.current.currentTime + seconds)
    );
  };

  // Trigger Native OS Picture-in-Picture
  const toggleNativePiP = async () => {
    if (!videoRef.current) return;
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else {
        await videoRef.current.requestPictureInPicture();
      }
    } catch (err) {
      console.warn('Native Picture-in-Picture error:', err);
    }
  };

  // Dragging logic for the floating window
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    setIsDragging(true);
    const rect = containerRef.current.getBoundingClientRect();
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initX: rect.left,
      initY: rect.top,
    };
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const deltaX = e.clientX - dragRef.current.startX;
      const deltaY = e.clientY - dragRef.current.startY;
      const newX = Math.max(10, Math.min(window.innerWidth - 380, dragRef.current.initX + deltaX));
      const newY = Math.max(10, Math.min(window.innerHeight - 240, dragRef.current.initY + deltaY));
      setPosition({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
      if (isDragging) setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  const handleMouseEnter = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
  };

  const handleMouseLeave = () => {
    if (isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => setShowControls(false), 2000);
    }
  };

  return (
    <div
      ref={containerRef}
      style={
        position
          ? { left: `${position.x}px`, top: `${position.y}px` }
          : { right: '24px', bottom: '24px' }
      }
      className={`fixed z-[150] w-[340px] sm:w-[380px] bg-[#101E2E]/95 backdrop-blur-xl rounded-2xl shadow-[0_16px_50px_rgba(20,50,90,0.5)] border border-[rgba(91,159,232,0.35)] overflow-hidden flex flex-col transition-shadow duration-300 ${
        isDragging ? 'cursor-grabbing select-none shadow-[0_24px_60px_rgba(20,50,90,0.7)]' : ''
      }`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Floating Header & Drag Handle */}
      <div
        onMouseDown={handleMouseDown}
        className="px-3.5 py-2.5 bg-[#18324A] flex items-center justify-between gap-2 border-b border-white/10 cursor-grab active:cursor-grabbing select-none"
      >
        <div className="flex items-center gap-2 min-w-0">
          <GripHorizontal className="w-4 h-4 text-[#7EAEE0] shrink-0 opacity-80" />
          <div className="min-w-0">
            <p className="text-[11px] font-semibold text-[#BFDFFF] truncate leading-tight">
              {course.title}
            </p>
            <p className="text-[10px] text-white/70 truncate leading-tight mt-0.5">
              {currentLesson.title}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {/* Native PiP button (for HTML5 video) */}
          {!isYouTube && (
            <button
              onClick={toggleNativePiP}
              title={t.classroom.pipNative}
              className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/15 transition-colors cursor-pointer"
            >
              <PictureInPicture className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Expand back to classroom view */}
          <button
            onClick={() => onExpand(currentTime, isPlaying)}
            title={t.classroom.expandPlayer}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/15 transition-colors cursor-pointer"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>

          {/* Close miniplayer */}
          <button
            onClick={onClose}
            title={t.classroom.closePlayer}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-rose-500/80 transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Video Content Screen */}
      <div className="relative aspect-video w-full bg-black flex items-center justify-center overflow-hidden group">
        {isYouTube ? (
          <iframe
            key={currentLesson.id}
            src={getYouTubeEmbedUrl(currentLesson.url, currentLesson.startTime, currentLesson.endTime)}
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
              if (videoRef.current) {
                setCurrentTime(videoRef.current.currentTime);
              }
            }}
            onLoadedMetadata={() => {
              if (videoRef.current) {
                setDuration(videoRef.current.duration);
                if (initialTime > 0) videoRef.current.currentTime = initialTime;
                if (initialPlaying) {
                  videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
                }
              }
            }}
            onEnded={() => {
              setIsPlaying(false);
              if (nextLesson && onSelectLesson) {
                onSelectLesson(nextLesson);
              }
            }}
          />
        )}

        {/* Transparent click surface for video playback toggle */}
        {!isYouTube && (
          <div
            onClick={togglePlay}
            className="absolute inset-0 z-10 cursor-pointer"
          />
        )}

        {/* Pop-up feedback animation on play/pause */}
        {!isYouTube && playFeedback && (
          <div
            key={playFeedback.key}
            className="absolute inset-0 flex items-center justify-center pointer-events-none z-20"
          >
            <div className="absolute inset-0 bg-black/25 animate-blur-flash" />
            <div className="relative animate-play-popup flex items-center justify-center">
              <div className="w-12 h-12 rounded-full bg-black/60 backdrop-blur-md border border-white/25 flex items-center justify-center text-white shadow-xl">
                {playFeedback.type === 'pause' ? (
                  <Pause className="w-5 h-5 fill-current text-white" />
                ) : (
                  <Play className="w-5 h-5 fill-current text-white ml-0.5" />
                )}
              </div>
            </div>
          </div>
        )}

        {/* Floating Controls Overlay (HTML5 only) */}
        {!isYouTube && (
          <div
            className={`absolute inset-x-0 bottom-0 p-2.5 z-20 bg-gradient-to-t from-black/90 via-black/50 to-transparent transition-opacity duration-200 ${
              showControls || !isPlaying ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
          >
            {/* Progress scrubber */}
            {(() => {
              const theme = getStoredSeekbarTheme();
              const progressPercent = duration > 0 ? Math.min(100, Math.max(0, (currentTime / duration) * 100)) : 0;
              return (
                <div className="relative mb-1.5 group/seekbar">
                  {/* Hover Video Preview Thumbnail Tooltip */}
                  {duration > 0 && (
                    <div
                      className={`absolute bottom-full mb-2.5 pointer-events-none z-30 transition-all duration-150 ease-out origin-bottom ${
                        isHoveringSeekbar && hoverPos
                          ? 'opacity-100 scale-100 translate-y-0'
                          : 'opacity-0 scale-95 translate-y-1'
                      }`}
                      style={{
                        left: hoverPos
                          ? `${Math.max(54, Math.min(hoverPos.x, Math.max(54, hoverPos.width - 54)))}px`
                          : '50%',
                        transform: 'translateX(-50%)',
                      }}
                    >
                      {/* Image preview card with small border radius */}
                      <div
                        className="relative w-28 h-[64px] sm:w-32 sm:h-[72px] rounded-lg overflow-hidden bg-[#0c1421] border border-white/25 ring-1 ring-black/60 shadow-[0_8px_24px_rgba(0,0,0,0.85)]"
                        style={{
                          boxShadow: `0 8px 24px rgba(0,0,0,0.85), 0 0 12px ${theme.glow}40`,
                        }}
                      >
                        {currentLesson.thumbnail && (
                          <img
                            src={currentLesson.thumbnail}
                            alt="Preview Thumbnail"
                            className="absolute inset-0 w-full h-full object-cover opacity-75 pointer-events-none"
                          />
                        )}

                        <video
                          ref={previewVideoRef}
                          key={`floating-preview-${currentLesson.id}`}
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

                        <div className="absolute inset-x-0 bottom-0 h-6 bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none" />

                        <div className="absolute bottom-1 left-1/2 -translate-x-1/2 px-1.5 py-0.2 rounded bg-black/80 text-white text-[9px] font-mono font-bold shadow border border-white/15 flex items-center gap-1 pointer-events-none whitespace-nowrap">
                          <span
                            className="w-1 h-1 rounded-full shrink-0"
                            style={{ backgroundColor: theme.hex, boxShadow: `0 0 4px ${theme.hex}` }}
                          />
                          <span>{formatTime(hoverTime)}</span>
                        </div>
                      </div>

                      {/* Caret arrow */}
                      {hoverPos && (
                        <div
                          className="absolute -bottom-[4px] pointer-events-none"
                          style={{
                            left: `calc(50% + ${Math.max(
                              -44,
                              Math.min(
                                44,
                                hoverPos.x - Math.max(54, Math.min(hoverPos.x, Math.max(54, hoverPos.width - 54)))
                              )
                            )}px)`,
                            transform: 'translateX(-50%)',
                          }}
                        >
                          <div className="w-0 h-0 border-x-[4px] border-x-transparent border-t-[4px] border-t-white/35" />
                        </div>
                      )}
                    </div>
                  )}

                  <input
                    type="range"
                    min={0}
                    max={duration || 100}
                    value={currentTime}
                    onMouseMove={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
                      const pct = (x / rect.width) * 100;
                      const time = (pct / 100) * (duration || 0);
                      setHoverTime(time);
                      setHoverPos({ x, width: rect.width });
                      setIsHoveringSeekbar(true);
                      seekPreviewToTime(time);
                    }}
                    onMouseLeave={() => {
                      setIsHoveringSeekbar(false);
                      setHoverPos(null);
                    }}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      setCurrentTime(val);
                      if (videoRef.current) videoRef.current.currentTime = val;
                    }}
                    className="video-seekbar w-full block"
                    style={{
                      height: '4px',
                      background: `linear-gradient(to right, ${theme.hex} 0%, ${theme.hex} ${progressPercent}%, rgba(255,255,255,0.22) ${progressPercent}%, rgba(255,255,255,0.22) 100%)`,
                      ['--seekbar-thumb-color' as any]: theme.hex,
                      ['--seekbar-glow-color' as any]: theme.glow,
                      accentColor: theme.hex,
                    }}
                  />
                </div>
              );
            })()}

            <div className="flex items-center justify-between text-white text-[11px]">
              <div className="flex items-center gap-1.5">
                <button
                  onClick={togglePlay}
                  className="p-1 rounded hover:bg-white/20 transition-colors"
                >
                  {isPlaying ? (
                    <Pause className="w-3.5 h-3.5" />
                  ) : (
                    <Play className="w-3.5 h-3.5 fill-current" />
                  )}
                </button>

                <button
                  onClick={() => skip(-10)}
                  title="Rewind 10s"
                  className="p-1 rounded hover:bg-white/20 transition-colors"
                >
                  <RotateCcw className="w-3 h-3" />
                </button>

                <button
                  onClick={() => skip(10)}
                  title="Forward 10s"
                  className="p-1 rounded hover:bg-white/20 transition-colors"
                >
                  <RotateCw className="w-3 h-3" />
                </button>

                {/* Volume toggle */}
                <button
                  onClick={() => {
                    if (videoRef.current) {
                      videoRef.current.muted = !videoRef.current.muted;
                      setIsMuted(videoRef.current.muted);
                    }
                  }}
                  className="p-1 rounded hover:bg-white/20 transition-colors"
                >
                  {isMuted || volume === 0 ? (
                    <VolumeX className="w-3.5 h-3.5" />
                  ) : (
                    <Volume2 className="w-3.5 h-3.5" />
                  )}
                </button>

                <span className="font-mono text-[10px] text-white/80 ml-1">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>
              </div>

              <div className="flex items-center gap-1">
                {nextLesson && onSelectLesson && (
                  <button
                    onClick={() => onSelectLesson(nextLesson)}
                    title={t.classroom.nextLesson}
                    className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-white/15 hover:bg-white/25 text-[10px] font-medium transition-colors"
                  >
                    <span>Next</span>
                    <ChevronRight className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
