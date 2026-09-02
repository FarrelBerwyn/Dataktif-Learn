import React, { useState } from 'react';
import {
  Trophy,
  Award,
  Sparkles,
  CheckCircle2,
  Clock,
  Layers,
  BookOpen,
  ArrowLeft,
  RotateCcw,
  Eye,
  ChevronDown,
  ChevronUp,
  Share2,
  Check,
  GraduationCap,
} from 'lucide-react';
import { Course, Lesson } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface CourseCompletionViewProps {
  course: Course;
  completedLessonIds: string[];
  onBackToCatalog: () => void;
  onReviewCourse: (lesson?: Lesson) => void;
  onRestartCourse: () => void;
}

export const CourseCompletionView: React.FC<CourseCompletionViewProps> = ({
  course,
  completedLessonIds,
  onBackToCatalog,
  onReviewCourse,
  onRestartCourse,
}) => {
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({
    [course.subCourses[0]?.id || '']: true,
  });

  const toggleModule = (id: string) => {
    setExpandedModules((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCopySummary = () => {
    const text = `🎉 Saya telah menyelesaikan seluruh materi course "${course.title}" (${course.subCourseCount} Modul, ${course.lessonCount} Pelajaran) di Dataktif Learn!`;
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // Compute total lessons
  const allLessons: Lesson[] = [];
  course.subCourses.forEach((s) => s.lessons.forEach((l) => allLessons.push(l)));

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#EEF6FF] via-[#F8FBFF] to-white flex flex-col font-sans text-[#18324A]">
      {/* Top Header Bar */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-[rgba(80,140,190,0.16)] px-4 sm:px-6 py-3 shadow-[0_2px_10px_rgba(220,238,255,0.3)]">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
          <button
            onClick={onBackToCatalog}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#F0F7FF] text-[#2867A8] hover:bg-[#DCEEFF] text-xs font-semibold border border-[rgba(91,159,232,0.25)] transition-all cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{t.completion.backToCatalog}</span>
          </button>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>{t.completion.curriculumDone} • 100%</span>
            </span>
          </div>
        </div>
      </header>

      {/* Main Completion Container */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12 flex flex-col gap-8">
        {/* Hero Celebration Banner */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#18324A] via-[#1F466E] to-[#2867A8] p-6 sm:p-10 md:p-12 text-white shadow-[0_20px_60px_rgba(24,50,74,0.3)] border border-[rgba(91,159,232,0.3)] text-center">
          {/* Decorative glowing background elements */}
          <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-[#5B9FE8]/25 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-[#BFDFFF]/20 blur-3xl pointer-events-none" />

          {/* Trophy Badge Icon */}
          <div className="relative inline-flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-tr from-[#5B9FE8] to-[#9BC9FF] shadow-[0_8px_32px_rgba(91,159,232,0.6)] mb-6 border-2 border-white/40 transform hover:scale-105 transition-transform">
            <Trophy className="w-10 h-10 sm:w-12 sm:h-12 text-white drop-shadow-md" />
            <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center border-2 border-white shadow-md">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>

          <div className="relative z-10 max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-[#BFDFFF] text-xs font-semibold uppercase tracking-wider mb-3 backdrop-blur-sm">
              <GraduationCap className="w-3.5 h-3.5" />
              <span>{t.completion.appreciationBadge}</span>
            </div>

            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight mb-3 text-white">
              {t.completion.congratsTitle}
            </h1>

            <p className="text-sm sm:text-base text-[#DCEEFF] leading-relaxed mb-2 font-medium">
              &ldquo;{course.title}&rdquo;
            </p>

            <p className="text-xs sm:text-sm text-[#9BC9FF]">
              {t.completion.instructor}: <span className="font-semibold text-white">{course.instructor}</span> •{' '}
              {t.completion.category}: <span className="font-semibold text-white">{course.category}</span>
            </p>
          </div>

          {/* Quick Hero Actions */}
          <div className="relative z-10 flex flex-wrap items-center justify-center gap-3 mt-8 pt-6 border-t border-white/15">
            <button
              onClick={() => onReviewCourse(allLessons[0])}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#5B9FE8] hover:bg-[#4A8ED8] text-white font-semibold text-xs sm:text-sm shadow-[0_4px_16px_rgba(91,159,232,0.4)] transition-all cursor-pointer"
            >
              <Eye className="w-4 h-4" />
              <span>{t.completion.reviewCourse}</span>
            </button>

            <button
              onClick={onRestartCourse}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs sm:text-sm border border-white/25 transition-all cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>{t.completion.restartCourse}</span>
            </button>

            <button
              onClick={handleCopySummary}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs sm:text-sm border border-white/25 transition-all cursor-pointer"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
              <span>{copied ? t.completion.copiedClipboard : t.completion.shareAchievement}</span>
            </button>
          </div>
        </section>

        {/* 4-Stat Metric Cards */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-white border border-[rgba(80,140,190,0.18)] shadow-sm flex flex-col items-center text-center">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2.5 border border-emerald-100">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div className="text-2xl font-extrabold text-[#18324A]">100%</div>
            <div className="text-xs text-[#6B8195] font-medium mt-0.5">{t.completion.curriculumDone}</div>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-[rgba(80,140,190,0.18)] shadow-sm flex flex-col items-center text-center">
            <div className="w-10 h-10 rounded-xl bg-[#DCEEFF] text-[#2867A8] flex items-center justify-center mb-2.5 border border-[#BFDFFF]">
              <BookOpen className="w-5 h-5" />
            </div>
            <div className="text-2xl font-extrabold text-[#18324A]">{course.lessonCount}</div>
            <div className="text-xs text-[#6B8195] font-medium mt-0.5">{t.completion.lessonsDone}</div>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-[rgba(80,140,190,0.18)] shadow-sm flex flex-col items-center text-center">
            <div className="w-10 h-10 rounded-xl bg-[#F0F7FF] text-[#5B9FE8] flex items-center justify-center mb-2.5 border border-[rgba(91,159,232,0.3)]">
              <Layers className="w-5 h-5" />
            </div>
            <div className="text-2xl font-extrabold text-[#18324A]">{course.subCourseCount}</div>
            <div className="text-xs text-[#6B8195] font-medium mt-0.5">{t.completion.modulesDone}</div>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-[rgba(80,140,190,0.18)] shadow-sm flex flex-col items-center text-center">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-2.5 border border-amber-100">
              <Clock className="w-5 h-5" />
            </div>
            <div className="text-2xl font-extrabold text-[#18324A]">{course.totalDurationFormatted}</div>
            <div className="text-xs text-[#6B8195] font-medium mt-0.5">{t.completion.totalStudyTime}</div>
          </div>
        </section>

        {/* Detailed Curriculum Recap / Summary of Covered Modules */}
        <section className="bg-white rounded-3xl border border-[rgba(80,140,190,0.2)] p-6 sm:p-8 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-[rgba(80,140,190,0.15)]">
            <div>
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-[#5B9FE8]" />
                <h2 className="text-lg sm:text-xl font-bold text-[#18324A] tracking-tight">
                  {t.completion.summaryTitle}
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-[#6B8195] mt-0.5">
                {t.completion.summarySubtitle}
              </p>
            </div>

            <div className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-[#F0F7FF] text-[#2867A8] border border-[rgba(91,159,232,0.25)] self-start sm:self-auto">
              {course.level} Level Curriculum
            </div>
          </div>

          {/* Module List Accordions */}
          <div className="space-y-3.5">
            {course.subCourses.map((sub, idx) => {
              const isExpanded = !!expandedModules[sub.id];
              return (
                <div
                  key={sub.id}
                  className="rounded-2xl border border-[rgba(80,140,190,0.18)] bg-[#F8FBFF] overflow-hidden transition-all"
                >
                  <button
                    onClick={() => toggleModule(sub.id)}
                    className="w-full flex items-center justify-between p-4 text-left hover:bg-[#F0F7FF] transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs shrink-0 border border-emerald-200">
                        <Check className="w-4 h-4 text-emerald-600 stroke-[3]" />
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-bold text-[#5B9FE8] uppercase tracking-wider">
                            Modul {idx + 1}
                          </span>
                          <span className="text-[11px] text-[#6B8195]">• {sub.totalDurationFormatted}</span>
                        </div>
                        <h3 className="text-sm sm:text-base font-bold text-[#18324A] truncate">
                          {sub.name}
                        </h3>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 ml-3">
                      <span className="text-xs text-emerald-700 font-semibold bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                        {sub.lessons.length} Selesai
                      </span>
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-[#6B8195]" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-[#6B8195]" />
                      )}
                    </div>
                  </button>

                  {/* Lessons list inside module */}
                  {isExpanded && (
                    <div className="p-3 pt-0 space-y-1.5 border-t border-[rgba(80,140,190,0.12)]">
                      {sub.lessons.map((lesson, lIdx) => (
                        <div
                          key={lesson.id}
                          className="flex items-center justify-between p-2.5 rounded-xl bg-white hover:bg-[#F0F7FF] transition-colors border border-[rgba(80,140,190,0.1)] group"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <span className="text-xs font-semibold text-[#6B8195] w-5 text-center shrink-0">
                              {lIdx + 1}
                            </span>
                            <div className="w-12 h-7 rounded-md overflow-hidden bg-[#18324A]/10 shrink-0 relative border border-[rgba(80,140,190,0.15)]">
                              {lesson.thumbnail ? (
                                <img
                                  src={lesson.thumbnail}
                                  alt={lesson.title}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-[#DCEEFF]">
                                  <BookOpen className="w-3.5 h-3.5 text-[#2867A8]" />
                                </div>
                              )}
                            </div>
                            <span className="text-xs sm:text-sm font-medium text-[#18324A] truncate">
                              {lesson.title}
                            </span>
                          </div>

                          <div className="flex items-center gap-3 shrink-0 ml-2">
                            <span className="text-xs text-[#6B8195]">{lesson.durationFormatted}</span>
                            <button
                              onClick={() => onReviewCourse(lesson)}
                              className="text-xs font-semibold text-[#5B9FE8] hover:text-[#2867A8] flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Lihat</span>
                            </button>
                            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Bottom Navigation Actions */}
        <section className="flex flex-col sm:flex-row items-center justify-between gap-4 p-6 rounded-3xl bg-[#F0F7FF] border border-[rgba(91,159,232,0.25)]">
          <div>
            <h3 className="text-base font-bold text-[#18324A]">{t.completion.exploreMore}</h3>
            <p className="text-xs sm:text-sm text-[#6B8195]">
              {t.completion.exploreMoreDesc}
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={onRestartCourse}
              className="px-4 py-2 rounded-xl bg-white hover:bg-[#DCEEFF] text-[#2867A8] text-xs sm:text-sm font-semibold border border-[rgba(91,159,232,0.3)] transition-all cursor-pointer flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{t.completion.restartCourse}</span>
            </button>

            <button
              onClick={onBackToCatalog}
              className="px-6 py-2.5 rounded-xl bg-[#5B9FE8] hover:bg-[#4A8ED8] text-white text-xs sm:text-sm font-semibold shadow-[0_4px_16px_rgba(91,159,232,0.4)] transition-all cursor-pointer flex items-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{t.completion.backToHome}</span>
            </button>
          </div>
        </section>
      </main>
    </div>
  );
};
