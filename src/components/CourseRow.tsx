import React, { useRef, useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, ArrowRight, Grid, ChevronDown, ChevronUp } from 'lucide-react';
import { Course, Lesson } from '../types';
import { CourseCard } from './CourseCard';

interface CourseRowProps {
  id?: string;
  title: string;
  subtitle?: string;
  badge?: string;
  courses: Course[];
  completedLessonIds: string[];
  onSelectCourse: (course: Course) => void;
  onStartLearning: (course: Course, lesson?: Lesson) => void;
  onViewAll?: () => void;
  isContinueLearning?: boolean;
}

export const CourseRow: React.FC<CourseRowProps> = ({
  id,
  title,
  subtitle,
  badge,
  courses,
  completedLessonIds,
  onSelectCourse,
  onStartLearning,
  onViewAll,
  isContinueLearning = false,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const checkScroll = useCallback(() => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
  }, []);

  useEffect(() => {
    if (isExpanded) return;
    checkScroll();
    const el = scrollRef.current;
    if (!el) return;

    el.addEventListener('scroll', checkScroll, { passive: true });
    window.addEventListener('resize', checkScroll);
    return () => {
      el.removeEventListener('scroll', checkScroll);
      window.removeEventListener('resize', checkScroll);
    };
  }, [courses, checkScroll, isExpanded]);

  const handleScroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const clientWidth = scrollRef.current.clientWidth;
    // Scroll by roughly one full batch of visible cards
    const scrollAmount = direction === 'left' ? -clientWidth : clientWidth;
    scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
  };

  const handleToggleExpand = () => {
    if (onViewAll && courses.length > 5) {
      // If parent has dedicated view all, trigger it or toggle in-place expand
      setIsExpanded((prev) => !prev);
    } else {
      setIsExpanded((prev) => !prev);
    }
  };

  if (courses.length === 0) return null;

  return (
    <section id={id} className="mb-7 sm:mb-9 group/row">
      {/* Row Header - Section Title and See All action */}
      <div className="flex items-center justify-between mb-3 sm:mb-3.5">
        <div className="flex items-center gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg lg:text-[20px] font-bold text-[#18324A] tracking-tight">
                {title}
              </h2>
              {badge && (
                <span className="text-[10px] sm:text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#DCEEFF] text-[#2867A8] border border-[#BFDFFF]">
                  {badge}
                </span>
              )}
            </div>
            {subtitle && (
              <p className="text-[11px] sm:text-xs text-[#6B8195] mt-0.5 hidden sm:block">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {/* Action buttons & carousel navigation arrows */}
        <div className="flex items-center gap-2">
          {courses.length > 5 && (
            <button
              onClick={handleToggleExpand}
              className="text-xs sm:text-[13px] font-semibold text-[#2867A8] hover:text-[#18324A] transition-colors flex items-center gap-1 px-2.5 py-1 rounded-lg hover:bg-white/80 border border-transparent hover:border-[rgba(80,140,190,0.2)]"
            >
              <span>{isExpanded ? 'Show Less' : `See All (${courses.length})`}</span>
              {isExpanded ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ArrowRight className="w-3.5 h-3.5" />
              )}
            </button>
          )}

          {/* Carousel Left / Right Buttons (visible when not expanded & has >5 courses) */}
          {!isExpanded && courses.length > 5 && (
            <div className="flex items-center gap-1 ml-1">
              <button
                onClick={() => handleScroll('left')}
                disabled={!canScrollLeft}
                aria-label="Scroll left"
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white text-[#2867A8] border border-[rgba(80,140,190,0.2)] shadow-xs hover:bg-[#5B9FE8] hover:text-white hover:border-[#5B9FE8] transition-all flex items-center justify-center disabled:opacity-25 disabled:pointer-events-none cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <button
                onClick={() => handleScroll('right')}
                disabled={!canScrollRight}
                aria-label="Scroll right"
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white text-[#2867A8] border border-[rgba(80,140,190,0.2)] shadow-xs hover:bg-[#5B9FE8] hover:text-white hover:border-[#5B9FE8] transition-all flex items-center justify-center disabled:opacity-25 disabled:pointer-events-none cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Grid or Horizontal Row Rendering */}
      {isExpanded ? (
        /* Expanded Multi-Row 5-Card Grid */
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-3.5 sm:gap-x-4 lg:gap-x-5 gap-y-4 sm:gap-y-5 lg:gap-y-6">
          {courses.map((course) => {
            const allLessons: Lesson[] = [];
            course.subCourses.forEach((s) => s.lessons.forEach((l) => allLessons.push(l)));
            const doneCount = allLessons.filter((l) => completedLessonIds.includes(l.id)).length;
            const percent = allLessons.length > 0 ? Math.round((doneCount / allLessons.length) * 100) : 0;
            const nextLesson = allLessons.find((l) => !completedLessonIds.includes(l.id)) || allLessons[0];
            const nextLessonIndex = nextLesson ? allLessons.findIndex((l) => l.id === nextLesson.id) + 1 : doneCount;

            const currentLessonInfo =
              percent > 0
                ? {
                    lessonNumber: nextLessonIndex > 0 ? nextLessonIndex : 1,
                    totalLessons: allLessons.length,
                    lessonTitle: nextLesson?.title,
                    nextLesson,
                  }
                : undefined;

            return (
              <div key={course.id} className="w-full">
                <CourseCard
                  course={course}
                  progressPercent={percent}
                  completedLessonsCount={doneCount}
                  currentLessonInfo={currentLessonInfo}
                  onSelectCourse={onSelectCourse}
                  onStartLearning={onStartLearning}
                />
              </div>
            );
          })}
        </div>
      ) : (
        /* Dense 5-Card Content Row (5 on desktop, 3-4 on tablet, 2 on mobile) */
        <div
          ref={scrollRef}
          className="flex gap-3 sm:gap-4 lg:gap-5 overflow-x-auto pb-2.5 pt-0.5 px-0.5 no-scrollbar scroll-smooth snap-x snap-mandatory"
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          }}
        >
          {courses.map((course) => {
            // Compute lesson stats & next lesson for progress
            const allLessons: Lesson[] = [];
            course.subCourses.forEach((s) => s.lessons.forEach((l) => allLessons.push(l)));

            const doneCount = allLessons.filter((l) => completedLessonIds.includes(l.id)).length;
            const percent = allLessons.length > 0 ? Math.round((doneCount / allLessons.length) * 100) : 0;

            // Next uncompleted lesson
            const nextLesson = allLessons.find((l) => !completedLessonIds.includes(l.id)) || allLessons[0];
            const nextLessonIndex = nextLesson
              ? allLessons.findIndex((l) => l.id === nextLesson.id) + 1
              : doneCount;

            const currentLessonInfo =
              percent > 0
                ? {
                    lessonNumber: nextLessonIndex > 0 ? nextLessonIndex : 1,
                    totalLessons: allLessons.length,
                    lessonTitle: nextLesson?.title,
                    nextLesson,
                  }
                : undefined;

            return (
              <div
                key={course.id}
                className="shrink-0 snap-start flex-[0_0_calc(50%-6px)] sm:flex-[0_0_calc(33.333%-11px)] md:flex-[0_0_calc(25%-12px)] lg:flex-[0_0_calc(20%-16px)] min-w-[150px]"
              >
                <CourseCard
                  course={course}
                  progressPercent={percent}
                  completedLessonsCount={doneCount}
                  currentLessonInfo={currentLessonInfo}
                  onSelectCourse={onSelectCourse}
                  onStartLearning={onStartLearning}
                />
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};
