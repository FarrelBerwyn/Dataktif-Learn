import React, { useState, useEffect } from 'react';
import {
  X,
  Play,
  CheckCircle2,
  Clock,
  Layers,
  User,
  Folder,
  ChevronDown,
  ChevronUp,
  Tag,
  BookOpen,
  Sparkles,
} from 'lucide-react';
import { Course, Lesson } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface CourseDetailModalProps {
  course: Course | null;
  isOpen: boolean;
  onClose: () => void;
  onSelectLesson: (course: Course, lesson: Lesson) => void;
  completedLessonIds: string[];
}

export const CourseDetailModal: React.FC<CourseDetailModalProps> = ({
  course,
  isOpen,
  onClose,
  onSelectLesson,
  completedLessonIds,
}) => {
  const { t } = useLanguage();
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({});

  // Close modal when pressing Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !course) return null;

  const toggleModule = (modId: string) => {
    setExpandedModules((prev) => ({
      ...prev,
      [modId]: prev[modId] === undefined ? false : !prev[modId],
    }));
  };

  // Find first uncompleted lesson or default to first lesson
  const allLessons: Lesson[] = [];
  course.subCourses.forEach((s) => s.lessons.forEach((l) => allLessons.push(l)));

  const firstUncompleted =
    allLessons.find((l) => !completedLessonIds.includes(l.id)) || allLessons[0];
  const completedCount = allLessons.filter((l) => completedLessonIds.includes(l.id)).length;
  const progressPercent =
    allLessons.length > 0 ? Math.round((completedCount / allLessons.length) * 100) : 0;

  return (
    <div
      className="fixed inset-0 z-[200] bg-[#18324A]/40 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 md:p-6 overflow-hidden"
      onClick={onClose}
    >
      {/* Modal Card - Constrained so height never exceeds the screen */}
      <div
        className="relative w-full max-w-4xl max-h-[min(90vh,calc(100dvh-1.5rem))] sm:max-h-[min(88vh,calc(100dvh-3rem))] bg-white rounded-3xl border border-[rgba(80,140,190,0.2)] shadow-[0_20px_60px_rgba(40,103,168,0.25)] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Banner - compact & proportional */}
        <div className="relative h-32 sm:h-40 md:h-44 w-full shrink-0 overflow-hidden bg-[#F0F7FF]">
          <img
            src={course.thumbnail}
            alt={course.title}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-white via-white/40 to-transparent" />

          {/* Close button */}
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="absolute top-3 right-3 sm:top-4 sm:right-4 z-20 p-2 rounded-full bg-white/90 hover:bg-white text-[#18324A] shadow-md transition-all border border-[rgba(80,140,190,0.2)] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Category & Level pills */}
          <div className="absolute top-3 left-3 sm:top-4 sm:left-4 z-10 flex gap-2">
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-white/95 text-[#2867A8] shadow-sm border border-[rgba(91,159,232,0.2)]">
              {course.category}
            </span>
            <span className="text-xs font-medium px-3 py-1 rounded-full bg-[#18324A]/90 text-white shadow-sm">
              {course.level}
            </span>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto min-h-0 p-5 sm:p-7 sm:pt-4">
          {/* Main Course Info */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6 pb-6 border-b border-[rgba(80,140,190,0.15)]">
            <div className="flex-1 min-w-0">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-[#18324A] tracking-tight mb-2">
                {course.title}
              </h1>

              <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs sm:text-sm text-[#6B8195]">
                <div className="flex items-center gap-1.5 font-medium text-[#18324A]">
                  <User className="w-4 h-4 text-[#5B9FE8]" />
                  <span>{course.instructor}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-[#5B9FE8]" />
                  <span>{course.subCourseCount} Modules</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-[#5B9FE8]" />
                  <span>{course.lessonCount} Lessons</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-[#5B9FE8]" />
                  <span>{course.totalDurationFormatted}</span>
                </div>
              </div>
            </div>

            {/* Quick Action Button in Top Info */}
            <div className="flex flex-col sm:items-end gap-1.5 shrink-0">
              <button
                onClick={() => {
                  if (firstUncompleted) {
                    onSelectLesson(course, firstUncompleted);
                    onClose();
                  }
                }}
                className="flex items-center justify-center gap-2 px-5 py-2.5 sm:px-6 sm:py-3 rounded-2xl bg-[#5B9FE8] hover:bg-[#4A8ED8] text-white font-semibold text-sm shadow-[0_4px_16px_rgba(91,159,232,0.4)] transition-all cursor-pointer"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>
                  {completedCount > 0
                    ? `${t.courseDetail.resumeLesson} (${completedCount}/${allLessons.length})`
                    : t.courseDetail.startLearning}
                </span>
              </button>

              {completedCount > 0 && (
                <div className="text-xs font-medium text-[#2867A8] flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  <span>{progressPercent}% curriculum completed</span>
                </div>
              )}
            </div>
          </div>

          {/* Description & Filesystem Path info */}
          <div className="mb-6 sm:mb-8">
            <p className="text-sm text-[#476077] leading-relaxed mb-4">
              {course.description}
            </p>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5 text-xs text-[#6B8195] bg-[#F0F7FF] px-3 py-1.5 rounded-xl border border-[rgba(91,159,232,0.18)]">
                <Folder className="w-3.5 h-3.5 text-[#5B9FE8]" />
                <span className="font-mono text-[11px] text-[#2867A8] truncate max-w-[280px] sm:max-w-md">
                  {course.path}
                </span>
              </div>

              {course.tags.map((tag) => (
                <span
                  key={tag}
                  className="flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-lg bg-[#F8FBFF] text-[#6B8195] border border-[rgba(80,140,190,0.14)]"
                >
                  <Tag className="w-3 h-3 text-[#9AAEBD]" />
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Structured Curriculum Syllabus */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base sm:text-lg font-bold text-[#18324A] flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#5B9FE8]" />
                <span>{t.courseDetail.curriculum}</span>
              </h2>
              <span className="text-xs font-medium text-[#6B8195]">
                {course.lessonCount} sequential lessons
              </span>
            </div>

            <div className="space-y-3">
              {course.subCourses.map((sub, sIdx) => {
                const isExpanded = expandedModules[sub.id] !== false; // expanded by default
                const subCompletedCount = sub.lessons.filter((l) =>
                  completedLessonIds.includes(l.id)
                ).length;
                const isSubCompleted =
                  sub.lessons.length > 0 && subCompletedCount === sub.lessons.length;

                return (
                  <div
                    key={sub.id}
                    className="border border-[rgba(80,140,190,0.16)] rounded-2xl overflow-hidden bg-white shadow-sm"
                  >
                    {/* Module Header */}
                    <div
                      onClick={() => toggleModule(sub.id)}
                      className="flex items-center justify-between p-3.5 sm:p-4 bg-[#F8FBFF] hover:bg-[#F0F7FF] cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
                            isSubCompleted
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-[#DCEEFF] text-[#2867A8]'
                          }`}
                        >
                          {isSubCompleted ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          ) : (
                            sIdx + 1
                          )}
                        </div>
                        <div>
                          <h3 className="font-semibold text-xs sm:text-sm text-[#18324A]">
                            {sub.name}
                          </h3>
                          <div className="flex items-center gap-2.5 text-[11px] sm:text-xs text-[#6B8195] mt-0.5">
                            <span>{sub.lessonCount} lessons</span>
                            <span>•</span>
                            <span>{sub.totalDurationFormatted}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-[#6B8195]">
                        <span className="text-xs font-medium hidden sm:inline">
                          {subCompletedCount}/{sub.lessonCount} done
                        </span>
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-[#9AAEBD]" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-[#9AAEBD]" />
                        )}
                      </div>
                    </div>

                    {/* Lessons list inside Module */}
                    {isExpanded && (
                      <div className="divide-y divide-[rgba(80,140,190,0.1)]">
                        {sub.lessons.map((lesson, lIdx) => {
                          const isDone = completedLessonIds.includes(lesson.id);

                          return (
                            <div
                              key={lesson.id}
                              onClick={() => {
                                onSelectLesson(course, lesson);
                                onClose();
                              }}
                              className="group flex items-center justify-between p-3 sm:px-5 hover:bg-[#F0F7FF]/70 cursor-pointer transition-colors"
                            >
                              <div className="flex items-center gap-3 min-w-0 pr-4">
                                <div
                                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                                    isDone
                                      ? 'text-emerald-600'
                                      : 'text-[#9AAEBD] group-hover:text-[#5B9FE8]'
                                  }`}
                                >
                                  {isDone ? (
                                    <CheckCircle2 className="w-4 h-4 fill-emerald-100" />
                                  ) : (
                                    <Play className="w-3.5 h-3.5 fill-current opacity-70 group-hover:opacity-100" />
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <p className="text-xs sm:text-sm font-medium text-[#18324A] group-hover:text-[#2867A8] truncate">
                                    {lIdx + 1}. {lesson.title}
                                  </p>
                                  {lesson.description && (
                                    <p className="text-[11px] sm:text-xs text-[#6B8195] truncate">
                                      {lesson.description}
                                    </p>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                <span className="text-[11px] sm:text-xs font-mono text-[#6B8195]">
                                  {lesson.durationFormatted}
                                </span>
                                <span className="opacity-0 group-hover:opacity-100 transition-opacity text-xs font-semibold px-2.5 py-1 rounded-lg bg-[#5B9FE8] text-white">
                                  Play
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Anchored Bottom Action Bar */}
        <div className="shrink-0 px-5 py-3 sm:px-7 sm:py-3.5 bg-[#F8FBFF] border-t border-[rgba(80,140,190,0.16)] flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[11px] sm:text-xs text-[#6B8195] truncate">
              {completedCount > 0
                ? `Next: ${firstUncompleted?.title || 'Lesson 1'}`
                : `${course.lessonCount} Lessons • ${course.totalDurationFormatted}`}
            </p>
            <p className="text-xs sm:text-sm font-semibold text-[#18324A] truncate">
              {course.title}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold text-[#6B8195] hover:text-[#18324A] hover:bg-white transition-colors cursor-pointer border border-transparent hover:border-[rgba(80,140,190,0.16)]"
            >
              {t.courseDetail.close}
            </button>
            <button
              onClick={() => {
                if (firstUncompleted) {
                  onSelectLesson(course, firstUncompleted);
                  onClose();
                }
              }}
              className="flex items-center gap-2 px-5 py-2 sm:px-6 sm:py-2.5 rounded-xl bg-[#5B9FE8] hover:bg-[#4A8ED8] text-white text-xs sm:text-sm font-bold shadow-[0_4px_14px_rgba(91,159,232,0.35)] transition-all cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{completedCount > 0 ? t.courseDetail.resumeLesson : t.courseDetail.startLearning}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
