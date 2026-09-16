import React, { useState } from 'react';
import { Clock, Play, CheckCircle2, User, Star, BookOpen, Youtube } from 'lucide-react';
import { Course, Lesson } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface CourseCardProps {
  course: Course;
  progressPercent?: number;
  completedLessonsCount?: number;
  currentLessonInfo?: {
    lessonNumber: number;
    totalLessons: number;
    lessonTitle?: string;
    nextLesson?: Lesson;
  };
  onSelectCourse: (course: Course) => void;
  onStartLearning: (course: Course, lesson?: Lesson) => void;
  compact?: boolean;
}

export const CourseCard: React.FC<CourseCardProps> = ({
  course,
  progressPercent = 0,
  completedLessonsCount = 0,
  currentLessonInfo,
  onSelectCourse,
  onStartLearning,
  compact = false,
}) => {
  const { t } = useLanguage();
  const isCompleted = progressPercent >= 100;
  const isStarted = progressPercent > 0;
  const [imageError, setImageError] = useState(false);

  return (
    <div
      onClick={() => onSelectCourse(course)}
      className="group relative aspect-video w-full rounded-2xl overflow-hidden cursor-pointer select-none bg-[#EBF3FB] border border-[rgba(80,140,190,0.22)] shadow-[0_4px_16px_rgba(24,50,74,0.06)] hover:shadow-[0_16px_34px_rgba(24,50,74,0.22)] hover:border-[#5B9FE8]/60 transition-all duration-300 ease-out hover:scale-[1.03] hover:-translate-y-0.5"
    >
      {/* 1. Large 16:9 Thumbnail Image / Milk Blue Fallback */}
      {!imageError && course.thumbnail ? (
        <img
          src={course.thumbnail}
          alt={course.title}
          loading="lazy"
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
          onError={() => setImageError(true)}
        />
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-[#1B3C61] via-[#2867A8] to-[#4F94E0] flex flex-col items-center justify-center relative overflow-hidden group-hover:scale-105 transition-transform duration-500">
          <div className="absolute -top-10 -right-10 w-36 h-36 rounded-full bg-white/10 blur-xl pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 w-32 h-32 rounded-full bg-[#5B9FE8]/25 blur-lg pointer-events-none" />
          <BookOpen className="w-10 h-10 text-white/30 mb-1" />
          <span className="text-[10px] uppercase font-bold tracking-wider text-white/50">
            {course.category}
          </span>
        </div>
      )}

      {/* 2. Top Vignette Gradient for badge legibility */}
      <div className="absolute inset-x-0 top-0 h-14 bg-gradient-to-b from-black/55 to-transparent pointer-events-none opacity-80" />

      {/* 3. Subtle Bottom Gradient behind Text Area ONLY (Not a heavy solid box) */}
      <div className="absolute inset-x-0 bottom-0 h-3/5 bg-gradient-to-t from-[#0A1A2B]/95 via-[#0A1A2B]/60 via-45% to-transparent pointer-events-none transition-opacity duration-300 group-hover:from-[#06121E]" />

      {/* 4. Top Badges: Category/Level & Rating/Status */}
      <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none z-10">
        <div className="flex items-center gap-1.5">
          {course.source === 'youtube' ? (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-red-600/95 text-white backdrop-blur-md border border-red-400/30 shadow-xs flex items-center gap-1">
              <Youtube className="w-3 h-3 fill-current" />
              <span>YouTube</span>
            </span>
          ) : (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-black/40 backdrop-blur-md text-white/95 border border-white/15 shadow-xs">
              {course.category}
            </span>
          )}
          {course.source === 'youtube' && (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-black/40 backdrop-blur-md text-white/95 border border-white/15 shadow-xs hidden sm:inline-block">
              {course.category}
            </span>
          )}
          {course.featured && (
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-[#2867A8]/90 text-white backdrop-blur-md border border-[#5B9FE8]/30 shadow-xs hidden sm:inline-block">
              Featured
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {isCompleted ? (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-600/90 text-white backdrop-blur-md border border-emerald-400/30 shadow-xs flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              <span>{t.classroom.completed}</span>
            </span>
          ) : course.rating ? (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-black/40 backdrop-blur-md text-white border border-white/15 shadow-xs flex items-center gap-1">
              <Star className="w-2.5 h-2.5 text-amber-400 fill-amber-400" />
              <span>{course.rating.toFixed(1)}</span>
            </span>
          ) : null}
        </div>
      </div>

      {/* 5. Hover Center Quick-Play Action */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-200 z-10">
        <div className="px-3.5 py-1.5 rounded-full bg-white/95 text-[#2867A8] text-xs font-bold shadow-[0_8px_24px_rgba(0,0,0,0.35)] backdrop-blur-md border border-white/60 flex items-center gap-1.5 transform scale-90 group-hover:scale-100 transition-transform duration-200">
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>{isCompleted ? t.completion.reviewCourse : isStarted ? t.catalog.resumeLearning : t.catalog.startLearning}</span>
        </div>
      </div>

      {/* 6. Title and Metadata Overlay inside Thumbnail near bottom */}
      <div className="absolute inset-x-0 bottom-0 p-3 sm:p-3.5 z-10 flex flex-col justify-end pointer-events-none">
        {/* Course Title (Primary - 1 to 2 lines maximum) */}
        <h3 className="font-bold text-xs sm:text-sm text-white leading-snug line-clamp-2 drop-shadow-sm group-hover:text-[#DCEEFF] transition-colors">
          {course.title}
        </h3>

        {/* Secondary Metadata: Instructor or Progress State */}
        {isStarted ? (
          <div className="mt-1 flex items-center justify-between text-[11px] text-[#BFDFFF] font-medium drop-shadow-xs">
            <span className="truncate">
              {currentLessonInfo
                ? `${t.classroom.lessonOf} ${String(currentLessonInfo.lessonNumber).padStart(2, '0')} ${t.classroom.from} ${String(currentLessonInfo.totalLessons).padStart(2, '0')}`
                : `${completedLessonsCount} ${t.catalog.of} ${course.lessonCount} ${t.catalog.lessons}`}
            </span>
            <span className="shrink-0 font-bold ml-1.5 text-white/95">
              {progressPercent}%
            </span>
          </div>
        ) : (
          <div className="mt-1 flex items-center gap-1.5 text-[11px] text-[#CFE4F6] font-medium drop-shadow-xs flex-wrap">
            <span className="truncate max-w-[130px] text-white/90 font-medium">
              {course.instructor}
            </span>
            <span className="text-white/40">•</span>
            <span>{course.lessonCount} {t.catalog.lessons}</span>
            <span className="text-white/40">•</span>
            <span>{course.totalDurationFormatted}</span>
          </div>
        )}
      </div>

      {/* 7. Subtle Progress Bar at very bottom edge (if started) */}
      {isStarted && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/50 overflow-hidden z-20">
          <div
            className={`h-full transition-all duration-500 ${
              isCompleted ? 'bg-emerald-400' : 'bg-[#5B9FE8]'
            }`}
            style={{ width: `${Math.min(100, Math.max(3, progressPercent))}%` }}
          />
        </div>
      )}
    </div>
  );
};
