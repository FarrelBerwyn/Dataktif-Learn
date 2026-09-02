import React from 'react';
import {
  Trophy,
  BookOpen,
  CheckCircle2,
  Clock,
  Play,
  ArrowRight,
  GraduationCap,
} from 'lucide-react';
import { Course, Lesson } from '../types';
import { CourseCard } from './CourseCard';
import { useLanguage } from '../context/LanguageContext';

interface MyLearningViewProps {
  courses: Course[];
  completedLessonIds: string[];
  onSelectCourse: (course: Course) => void;
  onStartLearning: (course: Course) => void;
  onExploreCatalog: () => void;
}

export const MyLearningView: React.FC<MyLearningViewProps> = ({
  courses,
  completedLessonIds,
  onSelectCourse,
  onStartLearning,
  onExploreCatalog,
}) => {
  const { t } = useLanguage();
  // Compute user statistics
  let totalCurriculumLessons = 0;
  let totalStudySeconds = 0;

  courses.forEach((c) => {
    totalCurriculumLessons += c.lessonCount;
    c.subCourses.forEach((s) => {
      s.lessons.forEach((l) => {
        if (completedLessonIds.includes(l.id)) {
          totalStudySeconds += l.duration || 600;
        }
      });
    });
  });

  const totalHours = (totalStudySeconds / 3600).toFixed(1);

  // In-progress or completed courses
  const userCourses = courses.filter((c) => {
    return c.subCourses.some((s) =>
      s.lessons.some((l) => completedLessonIds.includes(l.id))
    );
  });

  return (
    <div className="w-full max-w-[1560px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      {/* Top Hero Stats */}
      <div className="mb-8 p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-white via-[#F8FBFF] to-[#DCEEFF]/40 border border-[rgba(80,140,190,0.16)] shadow-[0_8px_30px_rgba(220,238,255,0.4)]">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-[#2867A8] uppercase tracking-wider mb-2">
              <GraduationCap className="w-4 h-4 text-[#5B9FE8]" />
              <span>{t.myLearning.badge}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#18324A] mb-2">
              {t.myLearning.title}
            </h1>
            <p className="text-sm text-[#6B8195] max-w-xl">
              {t.myLearning.subtitle}
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="flex flex-wrap gap-4">
            <div className="p-4 rounded-2xl bg-white border border-[rgba(80,140,190,0.16)] shadow-sm min-w-[120px]">
              <div className="flex items-center gap-2 text-emerald-600 mb-1">
                <CheckCircle2 className="w-4 h-4" />
                <span className="text-xs font-semibold">{t.myLearning.lessonsDone}</span>
              </div>
              <p className="text-2xl font-bold text-[#18324A]">
                {completedLessonIds.length}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-[rgba(80,140,190,0.16)] shadow-sm min-w-[120px]">
              <div className="flex items-center gap-2 text-[#2867A8] mb-1">
                <Clock className="w-4 h-4 text-[#5B9FE8]" />
                <span className="text-xs font-semibold">{t.myLearning.hoursLearned}</span>
              </div>
              <p className="text-2xl font-bold text-[#18324A]">{totalHours}h</p>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-[rgba(80,140,190,0.16)] shadow-sm min-w-[120px]">
              <div className="flex items-center gap-2 text-amber-600 mb-1">
                <Trophy className="w-4 h-4" />
                <span className="text-xs font-semibold">{t.myLearning.activeCourses}</span>
              </div>
              <p className="text-2xl font-bold text-[#18324A]">{userCourses.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Courses in progress */}
      {userCourses.length === 0 ? (
        <div className="text-center py-16 px-4 bg-white rounded-3xl border border-[rgba(80,140,190,0.16)] shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-[#DCEEFF] text-[#2867A8] flex items-center justify-center mx-auto mb-4 border border-[#BFDFFF]">
            <BookOpen className="w-8 h-8" />
          </div>
          <h2 className="text-lg font-bold text-[#18324A] mb-2">{t.myLearning.noCoursesYet}</h2>
          <p className="text-sm text-[#6B8195] max-w-md mx-auto mb-6">
            {t.myLearning.noCoursesYetDesc}
          </p>
          <button
            onClick={onExploreCatalog}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-[#5B9FE8] hover:bg-[#4A8ED8] text-white font-semibold text-sm shadow-[0_4px_16px_rgba(91,159,232,0.4)] transition-all cursor-pointer"
          >
            <span>{t.myLearning.exploreCatalog}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-[#18324A]">{t.myLearning.inProgressTitle}</h2>
            <span className="text-xs font-semibold text-[#6B8195]">
              {userCourses.length} {t.catalog.of} {courses.length} {t.catalog.coursesCount}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-3.5 sm:gap-x-4 lg:gap-x-5 gap-y-4 sm:gap-y-5 lg:gap-y-6">
            {userCourses.map((course) => {
              const allLessons: Lesson[] = [];
              course.subCourses.forEach((s) => s.lessons.forEach((l) => allLessons.push(l)));
              const doneCount = allLessons.filter((l) => completedLessonIds.includes(l.id)).length;
              const percent = Math.round((doneCount / allLessons.length) * 100);

              return (
                <CourseCard
                  key={course.id}
                  course={course}
                  progressPercent={percent}
                  completedLessonsCount={doneCount}
                  onSelectCourse={onSelectCourse}
                  onStartLearning={onStartLearning}
                />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
