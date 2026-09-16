import React, { useState, useEffect, useMemo } from 'react';
import { StickyNote, Clock, Play, ChevronRight, Sparkles } from 'lucide-react';
import { Course, Lesson, Note } from '../types';
import pinBoardImg from '../pin-board.png';
import stickyNotesImg from '../sticky-notes.png';

interface DashboardPinBoardProps {
  courses: Course[];
  onStartLearning: (course: Course, lesson?: Lesson, timestamp?: number) => void;
  onViewAllNotes: () => void;
}

export const DashboardPinBoard: React.FC<DashboardPinBoardProps> = ({
  courses,
  onStartLearning,
  onViewAllNotes,
}) => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [hoveredNoteId, setHoveredNoteId] = useState<string | null>(null);

  // Fetch all user notes
  useEffect(() => {
    fetch('/api/user/notes')
      .then((res) => res.json())
      .then((data) => {
        if (data && Array.isArray(data.notes)) {
          setNotes(data.notes);
        }
      })
      .catch(() => {
        const localNotes: Note[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith('notes_')) {
            try {
              const arr = JSON.parse(localStorage.getItem(key) || '[]');
              if (Array.isArray(arr)) localNotes.push(...arr);
            } catch { }
          }
        }
        setNotes(localNotes);
      });
  }, []);

  const formatTime = (secs: number) => {
    if (isNaN(secs)) return '00:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Find course and lesson for each note
  const resolvedNotes = useMemo(() => {
    return notes.map((note) => {
      let targetCourse = courses.find((c) => c.id === note.courseId);
      if (!targetCourse) {
        targetCourse = courses.find((c) =>
          c.subCourses.some((s) => s.lessons.some((l) => l.id === note.lessonId))
        );
      }

      let targetLesson: Lesson | undefined;
      let videoNumber = 1;

      if (targetCourse) {
        const allLessons: Lesson[] = [];
        targetCourse.subCourses.forEach((s) => s.lessons.forEach((l) => allLessons.push(l)));
        const lIdx = allLessons.findIndex((l) => l.id === note.lessonId);
        if (lIdx >= 0) {
          targetLesson = allLessons[lIdx];
          videoNumber = lIdx + 1;
        }
      }

      return {
        note,
        course: targetCourse,
        lesson: targetLesson,
        videoNumber,
      };
    });
  }, [notes, courses]);

  // Display top 4 recent notes on the board
  const displayNotes = resolvedNotes.slice(0, 4);

  // Pre-configured slight rotations for authentic pinned look
  const rotations = ['rotate-[-3deg]', 'rotate-[2.5deg]', 'rotate-[-1.5deg]', 'rotate-[3deg]'];

  return (
    <div className="relative w-full max-w-[460px] mx-auto select-none">
      {/* Papan Pin Board Image using ONLY src/pin-board.png with shadow */}
      <div className="relative w-full filter drop-shadow-[0_18px_32px_rgba(0,0,0,0.25)]">
        <img
          src={pinBoardImg}
          alt="Cork Pin Board"
          className="w-full h-auto block object-contain pointer-events-none select-none"
          draggable={false}
        />

        {/* Content Container strictly inside the cork area (inside wooden frame) */}
        <div className="absolute inset-x-[11%] top-[8.5%] bottom-[7%] flex flex-col justify-between items-center pointer-events-auto">
          {/* Card Papan: width aligned with sticky notes edges (ujung kiri dan kanan sama), with gap top and sides */}
          <div className="w-full max-w-[310px] sm:max-w-[330px] flex items-center justify-between px-3.5 py-1.5 rounded-xl bg-white/95 backdrop-blur-md border border-[rgba(80,140,190,0.22)] shadow-sm z-30">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-md bg-amber-400 text-amber-950 flex items-center justify-center font-bold shadow-xs">
                <StickyNote className="w-3 h-3 fill-current" />
              </div>
              <h3 className="text-xs sm:text-[13px] font-bold text-[#18324A] leading-tight">
                Papan Catatan Belajar
              </h3>
              <span className="px-1.5 py-0.2 rounded-md bg-amber-100 text-amber-800 text-[10px] font-mono font-bold">
                {notes.length}
              </span>
            </div>

            <button
              onClick={onViewAllNotes}
              className="flex items-center gap-0.5 text-[11px] font-bold text-[#2867A8] hover:text-[#5B9FE8] transition-colors cursor-pointer"
              title="Lihat semua catatan di halaman Pembelajaran"
            >
              <span>Semua</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Cork Area for Sticky Notes with same max-width as Card Papan */}
          <div className="my-auto py-2 w-full max-w-[310px] sm:max-w-[330px] flex items-center justify-center">
            {displayNotes.length === 0 ? (
              /* Empty State: Starter Sticky Note */
              <div className="relative w-40 sm:w-44 aspect-square filter drop-shadow-[0_10px_20px_rgba(0,0,0,0.4)] transform rotate-[-2deg] hover:rotate-0 transition-transform duration-200">
                <img
                  src={stickyNotesImg}
                  alt="Starter Sticky Note"
                  className="absolute inset-0 w-full h-full object-contain pointer-events-none"
                />
                <div className="absolute inset-0 pt-7 px-4 pb-4 flex flex-col justify-between text-center">
                  <div className="flex items-center justify-center gap-1 text-[10px] font-bold text-amber-900">
                    <Sparkles className="w-3 h-3 text-amber-600" />
                    <span>Catatan Anda</span>
                  </div>
                  <p className="text-[10px] font-semibold text-[#2C2400] leading-snug">
                    Catatan penting saat menonton video akan otomatis tertempel di papan ini!
                  </p>
                  <span className="text-[9px] font-mono text-amber-800/80">
                    Klik ikon catatan di player
                  </span>
                </div>
              </div>
            ) : (
              /* Grid of Small Sticky Notes (Up to 4) */
              <div className="grid grid-cols-2 gap-3 sm:gap-4 justify-items-center w-full max-w-[320px] sm:max-w-[340px]">
                {displayNotes.map(({ note, course, lesson, videoNumber }, index) => {
                  const rot = rotations[index % rotations.length];
                  const isHovered = hoveredNoteId === note.id;

                  return (
                    <div
                      key={note.id}
                      onMouseEnter={() => setHoveredNoteId(note.id)}
                      onMouseLeave={() => setHoveredNoteId(null)}
                      onClick={() => {
                        if (course) {
                          onStartLearning(course, lesson, note.timestamp);
                        }
                      }}
                      className={`relative w-28 sm:w-32 md:w-34 aspect-square filter drop-shadow-[0_10px_20px_rgba(0,0,0,0.4)] transition-all duration-250 cursor-pointer ${isHovered
                          ? 'scale-110 z-20 rotate-0 drop-shadow-[0_18px_28px_rgba(0,0,0,0.55)]'
                          : `${rot} z-10`
                        }`}
                      title="Klik untuk membuka video di catatan ini"
                    >
                      {/* Base Sticky Note Asset */}
                      <img
                        src={stickyNotesImg}
                        alt="Sticky Note"
                        className="absolute inset-0 w-full h-full object-contain pointer-events-none select-none"
                        draggable={false}
                      />

                      {/* Note Content Overlay */}
                      <div className="absolute inset-0 pt-6 sm:pt-7 px-3 pb-3 sm:pb-3.5 flex flex-col justify-between">
                        {/* Top Header: Video badge / timestamp */}
                        <div className="flex items-center justify-between gap-1">
                          <span className="px-1 py-0.2 rounded bg-amber-400/80 text-[8px] sm:text-[9px] font-mono font-bold text-[#3B2C00] flex items-center gap-0.5 shadow-2xs">
                            <Clock className="w-2 h-2" />
                            <span>{formatTime(note.timestamp)}</span>
                          </span>

                          <span className="text-[8px] font-mono font-bold text-amber-900/70 truncate max-w-[50px]">
                            V#{videoNumber}
                          </span>
                        </div>

                        {/* Note text: compact */}
                        <div className="my-auto py-0.5">
                          <p className="text-[9px] sm:text-[10px] font-bold text-[#221A00] leading-snug line-clamp-3 break-words font-sans">
                            {note.text}
                          </p>
                        </div>

                        {/* Bottom lesson title */}
                        <div className="pt-0.5 border-t border-amber-300/40 flex items-center justify-between text-[8px] font-semibold text-amber-900/80">
                          <span className="truncate max-w-[70px]">
                            {lesson?.title || course?.title || 'Video'}
                          </span>
                          <Play className="w-2 h-2 fill-current shrink-0 ml-0.5 text-amber-800" />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
