import React from 'react';

export const CourseCardSkeleton: React.FC = () => {
  return (
    <div className="relative aspect-video w-full rounded-2xl bg-[#E2EEF8] border border-[rgba(80,140,190,0.18)] shadow-sm overflow-hidden animate-pulse select-none">
      {/* Top subtle badge skeleton */}
      <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between">
        <div className="h-4 bg-[#CFE3F5] rounded-md w-14" />
        <div className="h-4 bg-[#CFE3F5] rounded-md w-8" />
      </div>

      {/* Bottom overlay skeleton inside the 16:9 card */}
      <div className="absolute inset-x-0 bottom-0 p-3 sm:p-3.5 space-y-2 bg-gradient-to-t from-[#B9D9F3]/40 to-transparent">
        <div className="h-3.5 bg-[#CFE3F5] rounded-md w-4/5" />
        <div className="h-2.5 bg-[#CFE3F5] rounded-md w-1/2" />
      </div>
    </div>
  );
};

export const CourseRowSkeleton: React.FC<{ title?: string }> = ({ title = 'Loading Courses' }) => {
  return (
    <div className="mb-6 sm:mb-7">
      <div className="flex items-center justify-between mb-3">
        <div className="h-5 bg-[#E5F1FC] rounded-lg w-40 animate-pulse" />
        <div className="flex gap-1">
          <div className="w-7 h-7 rounded-full bg-[#E5F1FC] animate-pulse" />
          <div className="w-7 h-7 rounded-full bg-[#E5F1FC] animate-pulse" />
        </div>
      </div>

      <div className="flex gap-4 overflow-hidden">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="shrink-0 flex-[0_0_66%] sm:flex-[0_0_45%] md:flex-[0_0_31%] lg:flex-[0_0_calc(20%-13px)] xl:flex-[0_0_calc(16.666%-14px)] min-w-[200px]"
          >
            <CourseCardSkeleton />
          </div>
        ))}
      </div>
    </div>
  );
};
