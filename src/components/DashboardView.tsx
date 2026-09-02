import React from 'react';
import {
  Play,
  BookOpen,
  ArrowRight,
  CheckCircle2,
  Clock,
  Layers,
  Trophy,
  GraduationCap,
  ChevronRight,
  Compass,
  Star,
} from 'lucide-react';
import { Course, Lesson } from '../types';
import { CourseRow } from './CourseRow';
import { useLanguage } from '../context/LanguageContext';

interface DashboardViewProps {
  courses: Course[];
  completedLessonIds: string[];
  onSelectCourse: (course: Course) => void;
  onStartLearning: (course: Course, lesson?: Lesson) => void;
  onNavigateToCourses: (category?: string) => void;
  onOpenFolderSettings: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  courses,
  completedLessonIds,
  onSelectCourse,
  onStartLearning,
  onNavigateToCourses,
}) => {
  const { t, profile } = useLanguage();

  // Compute user statistics
  let totalStudySeconds = 0;
  courses.forEach((c) => {
    c.subCourses.forEach((s) => {
      s.lessons.forEach((l) => {
        if (completedLessonIds.includes(l.id)) {
          totalStudySeconds += l.duration || 600;
        }
      });
    });
  });
  const totalHours = (totalStudySeconds / 3600).toFixed(1);

  // In-progress courses
  const continueLearningCourses = courses.filter((c) => {
    const allLessons: Lesson[] = [];
    c.subCourses.forEach((s) => s.lessons.forEach((l) => allLessons.push(l)));
    const doneCount = allLessons.filter((l) => completedLessonIds.includes(l.id)).length;
    return doneCount > 0 && doneCount < allLessons.length;
  });

  // Most relevant active course to resume and second course for the 2 overlaid cards
  const card1Course = continueLearningCourses[0] || courses[0] || null;
  const card2Course = courses.length > 1 ? courses[1] : courses[0] || null;
  const activeCourseToResume = card1Course;

  // Featured and new courses
  const featuredCourses = courses.filter((c) => c.featured).slice(0, 10);
  const displayFeatured = featuredCourses.length > 0 ? featuredCourses : courses.slice(0, 10);
  const newCourses = [...courses]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 10);

  // Compute total lessons
  const totalAllLessons = courses.reduce((acc, c) => acc + c.lessonCount, 0);
  const completionPercentage =
    totalAllLessons > 0 ? Math.round((completedLessonIds.length / totalAllLessons) * 100) : 0;

  // Categories list with count
  const categoryCounts = courses.reduce((acc, c) => {
    if (c.category) {
      acc[c.category] = (acc[c.category] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  const categoryList: [string, number][] = (Object.entries(categoryCounts) as [string, number][]).sort(
    (a, b) => b[1] - a[1]
  );

  return (
    <div className="w-full max-w-[1440px] mx-auto px-6 sm:px-12 md:px-16 lg:px-20 pt-3 pb-10 space-y-6">
      {/* 1. HERO BANNER WITH ANIMATED VIDEO BACKGROUND & 2 FLOATING ROTATED CARDS */}
      <div className="relative overflow-visible my-2">
        {/* Rounded Banner Container */}
        <section className="relative overflow-hidden rounded-3xl sm:rounded-[36px] bg-black p-6 sm:p-8 md:p-12 text-white shadow-[0_25px_60px_rgba(0,0,0,0.45)] border border-white/20 min-h-[300px] sm:min-h-[340px] lg:min-h-[360px] flex items-center">
          {/* Full-screen looping video background using CloudFront URL */}
          <video
            className="absolute inset-0 w-full h-full object-cover pointer-events-none"
            autoPlay
            loop
            muted
            playsInline
          >
            <source
              src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260328_105406_16f4600d-7a92-4292-b96e-b19156c7830a.mp4"
              type="video/mp4"
            />
          </video>

          {/* Ambient translucent gradient overlay for optimal legibility */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/65 to-black/30 pointer-events-none" />
          <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-[#5B9FE8]/20 blur-3xl pointer-events-none" />

          {/* Left Column: Greeting & Primary Actions */}
          <div className="relative z-10 max-w-lg lg:max-w-xl space-y-3.5 sm:space-y-4 text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/15 text-[#BFDFFF] text-xs font-semibold backdrop-blur-md border border-white/20">
              <GraduationCap className="w-4 h-4 text-[#BFDFFF]" />
              <span>{t.dashboard.welcomeBadge}</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-white font-bold">{profile.role}</span>
            </div>

            <div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-white leading-tight">
                {t.dashboard.welcomeTitle},{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#BFDFFF] via-white to-[#9BC9FF]">
                  {profile.name}
                </span>
              </h1>
              <p className="text-xs sm:text-sm text-[#DCEEFF] leading-relaxed mt-1.5 max-w-md line-clamp-2 font-normal">
                {t.dashboard.welcomeSubtitle}
              </p>
            </div>

            {/* Quick Action CTA Buttons */}
            <div className="flex flex-wrap items-center gap-2.5 pt-1">
              {activeCourseToResume && (
                <button
                  onClick={() => onStartLearning(activeCourseToResume)}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#5B9FE8] hover:bg-[#4A8ED8] text-white font-bold text-xs sm:text-sm shadow-[0_4px_14px_rgba(91,159,232,0.4)] hover:shadow-[0_6px_20px_rgba(91,159,232,0.55)] transition-all cursor-pointer"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>{t.dashboard.resumeLearning}</span>
                </button>
              )}

              <button
                onClick={() => onNavigateToCourses()}
                className="flex items-center gap-1.5 px-4.5 py-2.5 rounded-xl bg-white/12 hover:bg-white/20 text-white font-semibold text-xs sm:text-sm border border-white/25 backdrop-blur-md transition-all cursor-pointer"
              >
                <Compass className="w-4 h-4 text-[#BFDFFF]" />
                <span>{t.dashboard.exploreCourses}</span>
                <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
              </button>
            </div>
          </div>

          {/* Carousel dots indicator in bottom-right matching reference image */}
          <div className="absolute bottom-5 right-8 z-10 hidden sm:flex items-center gap-1.5 opacity-80 pointer-events-none">
            <div className="w-6 h-1 rounded-full bg-white" />
            <div className="w-1.5 h-1.5 rounded-full bg-white/50" />
            <div className="w-1.5 h-1.5 rounded-full bg-white/50" />
            <div className="w-1.5 h-1.5 rounded-full bg-white/50" />
            <div className="w-1.5 h-1.5 rounded-full bg-white/50" />
          </div>
        </section>

        {/* 2 FLOATING ROTATED CARDS (On top of banner layer) */}
        {/* CARD 1: Positioned in center of banner, shifted slightly right and upwards, rotated left */}
        {card1Course && (
          <div
            onClick={() => onSelectCourse(card1Course)}
            className="absolute top-4 sm:top-6 md:top-8 left-auto right-[180px] sm:right-[210px] md:right-[230px] lg:right-[260px] z-20 hidden md:block w-44 sm:w-48 lg:w-52 bg-white text-[#18324A] rounded-2xl sm:rounded-[26px] p-2.5 sm:p-3 shadow-[0_20px_45px_rgba(0,0,0,0.45)] border border-white/90 transform -rotate-7 hover:-rotate-2 hover:scale-105 transition-all duration-300 cursor-pointer group pointer-events-auto"
          >
            {/* Image with button overlaid on top */}
            <div className="aspect-[4/3] rounded-xl sm:rounded-2xl overflow-hidden mb-2 bg-slate-900 relative shadow-inner">
              {card1Course.thumbnail ? (
                <img
                  src={card1Course.thumbnail}
                  alt={card1Course.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-full bg-[#DCEEFF] flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-[#2867A8]" />
                </div>
              )}

              {/* Subtle dark gradient overlay at bottom of image */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent pointer-events-none" />

              {/* Blue Action Button placed on top of the image */}
              <div className="absolute bottom-2 inset-x-2 z-10">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onStartLearning(card1Course);
                  }}
                  className="w-full py-1.5 px-3 rounded-full bg-[#2867A8] hover:bg-[#1E5288] text-white text-xs font-bold shadow-[0_4px_12px_rgba(40,103,168,0.45)] transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95 border border-white/25"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Mulai Belajar</span>
                </button>
              </div>
            </div>

            {/* Title only (stars removed) */}
            <h4 className="font-bold text-xs sm:text-[13px] text-[#18324A] truncate group-hover:text-[#2867A8] transition-colors leading-tight px-1 pb-1">
              {card1Course.title}
            </h4>
          </div>
        )}

        {/* CARD 2: Position remains on the right, extending OUTSIDE the banner, rotated right */}
        {card2Course && (
          <div
            onClick={() => onSelectCourse(card2Course)}
            className="absolute top-1/2 -translate-y-1/2 right-[-8px] sm:right-[-16px] md:right-[-22px] lg:right-[-28px] z-20 hidden md:block w-40 sm:w-44 lg:w-48 bg-white text-[#18324A] rounded-2xl sm:rounded-[24px] p-2.5 sm:p-3 shadow-[0_25px_50px_rgba(0,0,0,0.5)] border border-white/90 transform rotate-7 hover:rotate-2 hover:scale-105 transition-all duration-300 cursor-pointer group pointer-events-auto"
          >
            {/* Image with button overlaid on top */}
            <div className="aspect-[4/3] rounded-xl sm:rounded-2xl overflow-hidden mb-2 bg-slate-900 relative shadow-inner">
              {card2Course.thumbnail ? (
                <img
                  src={card2Course.thumbnail}
                  alt={card2Course.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-full bg-[#DCEEFF] flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-[#2867A8]" />
                </div>
              )}

              {/* Subtle dark gradient overlay at bottom of image */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent pointer-events-none" />

              {/* Blue Action Button placed on top of the image */}
              <div className="absolute bottom-2 inset-x-2 z-10">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onStartLearning(card2Course);
                  }}
                  className="w-full py-1.5 px-3 rounded-full bg-[#2867A8] hover:bg-[#1E5288] text-white text-xs font-bold shadow-[0_4px_12px_rgba(40,103,168,0.45)] transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95 border border-white/25"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Mulai Belajar</span>
                </button>
              </div>
            </div>

            {/* Title only (stars removed) */}
            <h4 className="font-bold text-xs sm:text-[13px] text-[#18324A] truncate group-hover:text-[#2867A8] transition-colors leading-tight px-1 pb-1">
              {card2Course.title}
            </h4>
          </div>
        )}
      </div>

      {/* 2. STREAMLINED METRICS (Slim height to preserve vertical space) */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-3">
        {/* Active Enrolled Courses */}
        <div className="p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-white/85 backdrop-blur-md border border-[rgba(80,140,190,0.18)] shadow-2xs flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#DCEEFF] text-[#2867A8] flex items-center justify-center shrink-0 border border-[#BFDFFF]">
            <BookOpen className="w-4 h-4" />
          </div>
          <div>
            <div className="text-base sm:text-lg font-extrabold text-[#18324A] leading-tight">{courses.length}</div>
            <div className="text-[10px] sm:text-[11px] text-[#6B8195] font-medium">{t.dashboard.activeCourses}</div>
          </div>
        </div>

        {/* Completed Lessons */}
        <div className="p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-white/85 backdrop-blur-md border border-[rgba(80,140,190,0.18)] shadow-2xs flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-200">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div>
            <div className="text-base sm:text-lg font-extrabold text-[#18324A] leading-tight">{completedLessonIds.length}</div>
            <div className="text-[10px] sm:text-[11px] text-[#6B8195] font-medium">{t.dashboard.completedLessons}</div>
          </div>
        </div>

        {/* Total Study Hours */}
        <div className="p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-white/85 backdrop-blur-md border border-[rgba(80,140,190,0.18)] shadow-2xs flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#F0F7FF] text-[#5B9FE8] flex items-center justify-center shrink-0 border border-[rgba(91,159,232,0.3)]">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <div className="text-base sm:text-lg font-extrabold text-[#18324A] leading-tight">{totalHours}h</div>
            <div className="text-[10px] sm:text-[11px] text-[#6B8195] font-medium">{t.dashboard.totalStudyHours}</div>
          </div>
        </div>

        {/* Completion Rate */}
        <div className="p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-white/85 backdrop-blur-md border border-[rgba(80,140,190,0.18)] shadow-2xs flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-200">
            <Trophy className="w-4 h-4" />
          </div>
          <div>
            <div className="text-base sm:text-lg font-extrabold text-[#18324A] leading-tight">{completionPercentage}%</div>
            <div className="text-[10px] sm:text-[11px] text-[#6B8195] font-medium">{t.dashboard.completionRate}</div>
          </div>
        </div>
      </section>

      {/* 3. CONTINUE LEARNING SECTION (Directly visible in first viewport without scrolling) */}
      {continueLearningCourses.length > 0 && (
        <section className="space-y-2.5 sm:space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm sm:text-base font-bold text-[#18324A] tracking-tight flex items-center gap-2">
                <Play className="w-3.5 h-3.5 text-[#5B9FE8] fill-current" />
                <span>{t.dashboard.continueLearningSection}</span>
              </h2>
              <p className="text-[11px] text-[#6B8195]">
                {t.dashboard.continueLearningSubtitle}
              </p>
            </div>
            <button
              onClick={() => onNavigateToCourses()}
              className="text-xs font-semibold text-[#2867A8] hover:text-[#5B9FE8] flex items-center gap-1 cursor-pointer"
            >
              <span>{t.dashboard.allCoursesButton}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {continueLearningCourses.slice(0, 3).map((course) => {
              const allLessons: Lesson[] = [];
              course.subCourses.forEach((s) => s.lessons.forEach((l) => allLessons.push(l)));
              const doneCount = allLessons.filter((l) => completedLessonIds.includes(l.id)).length;
              const percent = Math.round((doneCount / allLessons.length) * 100);
              const firstUncompleted =
                allLessons.find((l) => !completedLessonIds.includes(l.id)) || allLessons[0];

              return (
                <div
                  key={course.id}
                  onClick={() => onSelectCourse(course)}
                  className="p-3 sm:p-3.5 rounded-xl sm:rounded-2xl bg-white/90 backdrop-blur-md border border-[rgba(80,140,190,0.18)] shadow-2xs hover:shadow-md hover:border-[#5B9FE8] transition-all flex flex-col justify-between cursor-pointer group"
                >
                  <div className="flex items-center gap-3 mb-2.5">
                    <div className="w-18 h-12 rounded-lg overflow-hidden bg-slate-100 shrink-0 relative border border-[rgba(80,140,190,0.15)]">
                      {course.thumbnail ? (
                        <img
                          src={course.thumbnail}
                          alt={course.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      ) : (
                        <div className="w-full h-full bg-[#DCEEFF] flex items-center justify-center">
                          <BookOpen className="w-4 h-4 text-[#2867A8]" />
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-[#DCEEFF] text-[#2867A8]">
                        {course.category}
                      </span>
                      <h3 className="font-bold text-xs text-[#18324A] truncate mt-0.5 group-hover:text-[#2867A8] transition-colors">
                        {course.title}
                      </h3>
                      <p className="text-[10px] text-[#6B8195] truncate">
                        Next: {firstUncompleted?.title}
                      </p>
                    </div>
                  </div>

                  {/* Compact Progress bar */}
                  <div>
                    <div className="flex items-center justify-between text-[10px] text-[#6B8195] mb-1 font-medium">
                      <span>
                        {doneCount} {t.catalog.of} {course.lessonCount} {t.catalog.lessons}
                      </span>
                      <span className="font-bold text-[#2867A8]">{percent}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-[#F0F5FA] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[#5B9FE8] to-[#2867A8] rounded-full"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* 4. EXPLORE BY CATEGORY QUICK SHELF */}
      {categoryList.length > 0 && (
        <section className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-[#18324A] tracking-tight">
                {t.dashboard.categoriesSection}
              </h2>
              <p className="text-[11px] text-[#6B8195]">
                {t.dashboard.categoriesSubtitle}
              </p>
            </div>
            <button
              onClick={() => onNavigateToCourses()}
              className="text-xs font-semibold text-[#2867A8] hover:text-[#5B9FE8] flex items-center gap-1 cursor-pointer"
            >
              <span>{t.dashboard.viewAllCategories}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
            {categoryList.slice(0, 6).map(([category, count]) => (
              <button
                key={category}
                onClick={() => onNavigateToCourses(category)}
                className="p-3 rounded-xl bg-white/80 backdrop-blur-md hover:bg-[#F0F7FF] border border-[rgba(80,140,190,0.18)] hover:border-[#5B9FE8] shadow-2xs hover:shadow-xs transition-all text-left group cursor-pointer"
              >
                <div className="w-7 h-7 rounded-lg bg-[#DCEEFF] text-[#2867A8] group-hover:bg-[#2867A8] group-hover:text-white flex items-center justify-center mb-1.5 transition-colors">
                  <Layers className="w-3.5 h-3.5" />
                </div>
                <h4 className="font-bold text-xs text-[#18324A] group-hover:text-[#2867A8] truncate">
                  {category}
                </h4>
                <p className="text-[10px] text-[#6B8195] mt-0.5">
                  {count} {count === 1 ? 'Course' : 'Courses'}
                </p>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* 5. FEATURED MASTERCLASSES ROW */}
      <section className="pt-2">
        <CourseRow
          title={t.dashboard.featuredSection}
          subtitle={t.dashboard.featuredSubtitle}
          badge="Featured"
          courses={displayFeatured}
          completedLessonIds={completedLessonIds}
          onSelectCourse={onSelectCourse}
          onStartLearning={onStartLearning}
          onViewAll={() => onNavigateToCourses()}
        />
      </section>

      {/* 6. RECENT COURSES ROW */}
      <section className="pt-2">
        <CourseRow
          title={t.dashboard.recentCoursesSection}
          subtitle={t.dashboard.recentCoursesSubtitle}
          badge="New"
          courses={newCourses}
          completedLessonIds={completedLessonIds}
          onSelectCourse={onSelectCourse}
          onStartLearning={onStartLearning}
          onViewAll={() => onNavigateToCourses()}
        />
      </section>
    </div>
  );
};
