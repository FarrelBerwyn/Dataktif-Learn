import React from 'react';
import { Play, Sparkles, Clock, Layers, User, Star, ArrowRight } from 'lucide-react';
import { Course } from '../types';

interface FeaturedCourseHeroProps {
  course: Course;
  onSelectCourse: (course: Course) => void;
  onStartCourse: (course: Course) => void;
}

export const FeaturedCourseHero: React.FC<FeaturedCourseHeroProps> = ({
  course,
  onSelectCourse,
  onStartCourse,
}) => {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-white via-[#F8FBFF] to-[#DCEEFF]/50 border border-[rgba(80,140,190,0.18)] shadow-[0_12px_36px_rgba(220,238,255,0.6)] p-6 sm:p-8 lg:p-10 mb-10">
      {/* Background soft ambient circles */}
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-[#BFDFFF]/30 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/3 -mb-20 w-60 h-60 rounded-full bg-[#DCEEFF]/40 blur-2xl pointer-events-none" />

      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left Column: Course Info */}
        <div className="lg:col-span-7 flex flex-col items-start">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white text-[#2867A8] text-xs font-bold border border-[rgba(91,159,232,0.25)] shadow-sm mb-4">
            <Sparkles className="w-3.5 h-3.5 text-[#5B9FE8]" />
            <span>Featured Masterclass</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#DCEEFF] text-[#2867A8] ml-1 font-semibold">
              {course.category}
            </span>
          </div>

          {/* Title */}
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#18324A] tracking-tight leading-tight mb-3">
            {course.title}
          </h1>

          {/* Description */}
          <p className="text-sm sm:text-base text-[#476077] leading-relaxed mb-6 max-w-2xl">
            {course.description}
          </p>

          {/* Meta specs */}
          <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-xs text-[#6B8195] font-medium mb-6">
            <div className="flex items-center gap-1.5 text-[#18324A]">
              <User className="w-4 h-4 text-[#5B9FE8]" />
              <span className="font-semibold">{course.instructor}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-[#5B9FE8]" />
              <span>{course.subCourseCount} Modules ({course.lessonCount} Lessons)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-[#5B9FE8]" />
              <span>{course.totalDurationFormatted}</span>
            </div>
            {course.rating && (
              <div className="flex items-center gap-1 bg-white px-2 py-0.5 rounded-md border border-[rgba(80,140,190,0.15)] text-[#18324A] font-bold">
                <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                <span>{course.rating}</span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => onStartCourse(course)}
              className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-[#5B9FE8] hover:bg-[#4A8ED8] text-white font-semibold text-sm shadow-[0_4px_16px_rgba(91,159,232,0.4)] hover:shadow-[0_6px_22px_rgba(91,159,232,0.55)] transition-all cursor-pointer transform hover:-translate-y-0.5"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Start Course</span>
            </button>

            <button
              onClick={() => onSelectCourse(course)}
              className="flex items-center gap-1.5 px-5 py-3 rounded-2xl bg-white hover:bg-[#F0F7FF] text-[#2867A8] font-semibold text-sm border border-[rgba(91,159,232,0.25)] shadow-sm transition-all cursor-pointer"
            >
              <span>View Syllabus</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Right Column: Visual Card */}
        <div
          onClick={() => onSelectCourse(course)}
          className="lg:col-span-5 relative group cursor-pointer"
        >
          <div className="relative aspect-video w-full rounded-2xl overflow-hidden border border-[rgba(80,140,190,0.2)] shadow-[0_10px_30px_rgba(40,103,168,0.15)] bg-white group-hover:shadow-[0_16px_40px_rgba(40,103,168,0.25)] transition-all duration-300">
            <img
              src={course.thumbnail}
              alt={course.title}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-black/15 group-hover:bg-black/5 transition-colors flex items-center justify-center">
              <div className="w-14 h-14 rounded-full bg-white/95 text-[#5B9FE8] flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform">
                <Play className="w-6 h-6 fill-current ml-0.5" />
              </div>
            </div>

            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
              <span className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-white/90 backdrop-blur-md text-[#2867A8] shadow-sm">
                Full Curriculum Preview
              </span>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-black/70 text-white">
                {course.totalDurationFormatted}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
