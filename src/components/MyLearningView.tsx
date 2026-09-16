import React, { useState, useEffect, useMemo } from 'react';
import {
  Trophy,
  BookOpen,
  CheckCircle2,
  Clock,
  Play,
  ArrowRight,
  GraduationCap,
  StickyNote,
  Trash2,
  Search,
  Video,
  ChevronRight,
  Layers,
  Calendar,
} from 'lucide-react';
import { Course, Lesson, Note } from '../types';
import { CourseCard } from './CourseCard';
import { useLanguage } from '../context/LanguageContext';

interface MyLearningViewProps {
  courses: Course[];
  completedLessonIds: string[];
  onSelectCourse: (course: Course) => void;
  onStartLearning: (course: Course, lesson?: Lesson, timestamp?: number) => void;
  onExploreCatalog: () => void;
}

interface VideoNotesGroup {
  lesson: Lesson;
  lessonIndex: number; // 0-indexed
  videoNumber: number; // 1-indexed
  notes: Note[];
}

interface CourseNotesGroup {
  course: Course;
  totalNotes: number;
  videoGroups: VideoNotesGroup[];
}

export const MyLearningView: React.FC<MyLearningViewProps> = ({
  courses,
  completedLessonIds,
  onSelectCourse,
  onStartLearning,
  onExploreCatalog,
}) => {
  const { t } = useLanguage();
  const [activeView, setActiveView] = useState<'courses' | 'notes'>('courses');
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoadingNotes, setIsLoadingNotes] = useState(true);
  const [notesSearch, setNotesSearch] = useState('');

  // Fetch all user notes from backend / local storage
  const fetchAllNotes = async () => {
    setIsLoadingNotes(true);
    try {
      const res = await fetch('/api/user/notes');
      const data = await res.json();
      if (data && Array.isArray(data.notes)) {
        setNotes(data.notes);
      }
    } catch (e) {
      console.error('Failed to load notes from API', e);
      // Fallback to localStorage
      const localNotes: Note[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('notes_')) {
          try {
            const arr = JSON.parse(localStorage.getItem(key) || '[]');
            if (Array.isArray(arr)) localNotes.push(...arr);
          } catch {}
        }
      }
      setNotes(localNotes);
    } finally {
      setIsLoadingNotes(false);
    }
  };

  useEffect(() => {
    fetchAllNotes();
  }, []);

  const handleDeleteNote = async (noteId: string) => {
    if (!window.confirm(t.myLearning.deleteConfirm)) return;
    try {
      await fetch(`/api/user/notes/${noteId}`, { method: 'DELETE' });
    } catch (err) {
      console.error('Failed to delete note from server', err);
    }
    setNotes((prev) => prev.filter((n) => n.id !== noteId));
  };

  // Format mm:ss
  const formatTime = (secs: number) => {
    if (isNaN(secs)) return '00:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Format creation date
  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString(undefined, {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '';
    }
  };

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

  // Group notes by Course, then by Video (video ke berapa)
  const groupedCourseNotes = useMemo<CourseNotesGroup[]>(() => {
    const courseMap = new Map<string, { course: Course; notesByLesson: Map<string, Note[]> }>();

    // Prepare matching for every note
    notes.forEach((note) => {
      // Find course
      let targetCourse = courses.find((c) => c.id === note.courseId);
      if (!targetCourse) {
        targetCourse = courses.find((c) =>
          c.subCourses.some((s) => s.lessons.some((l) => l.id === note.lessonId))
        );
      }

      if (!targetCourse) return;

      if (!courseMap.has(targetCourse.id)) {
        courseMap.set(targetCourse.id, {
          course: targetCourse,
          notesByLesson: new Map(),
        });
      }

      const entry = courseMap.get(targetCourse.id)!;
      if (!entry.notesByLesson.has(note.lessonId)) {
        entry.notesByLesson.set(note.lessonId, []);
      }
      entry.notesByLesson.get(note.lessonId)!.push(note);
    });

    const result: CourseNotesGroup[] = [];

    courseMap.forEach(({ course, notesByLesson }) => {
      // Flatten all lessons in sequential curriculum order
      const allLessons: Lesson[] = [];
      course.subCourses.forEach((s) => s.lessons.forEach((l) => allLessons.push(l)));

      const videoGroups: VideoNotesGroup[] = [];
      let totalCourseNotes = 0;

      allLessons.forEach((lesson, index) => {
        const lessonNotes = notesByLesson.get(lesson.id);
        if (lessonNotes && lessonNotes.length > 0) {
          // Filter notes if search query is active
          const filteredNotes = notesSearch.trim()
            ? lessonNotes.filter(
                (n) =>
                  n.text.toLowerCase().includes(notesSearch.toLowerCase()) ||
                  lesson.title.toLowerCase().includes(notesSearch.toLowerCase()) ||
                  course.title.toLowerCase().includes(notesSearch.toLowerCase())
              )
            : lessonNotes;

          if (filteredNotes.length > 0) {
            totalCourseNotes += filteredNotes.length;
            videoGroups.push({
              lesson,
              lessonIndex: index,
              videoNumber: index + 1,
              notes: filteredNotes,
            });
          }
        }
      });

      if (videoGroups.length > 0) {
        result.push({
          course,
          totalNotes: totalCourseNotes,
          videoGroups,
        });
      }
    });

    return result;
  }, [notes, courses, notesSearch]);

  const totalFilteredNotesCount = useMemo(() => {
    return groupedCourseNotes.reduce((acc, curr) => acc + curr.totalNotes, 0);
  }, [groupedCourseNotes]);

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
            <p className="text-sm text-[#6B8195] max-w-xl mb-4">
              {t.myLearning.subtitle}
            </p>

            {/* Quick Action Toggle Button */}
            <button
              onClick={() => setActiveView(activeView === 'courses' ? 'notes' : 'courses')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-[#DCEEFF] hover:border-[#5B9FE8] text-[#18324A] hover:text-[#2867A8] text-xs font-bold shadow-xs transition-all cursor-pointer group"
            >
              <StickyNote className="w-3.5 h-3.5 text-amber-500 group-hover:scale-110 transition-transform" />
              <span>
                {activeView === 'notes'
                  ? t.myLearning.btnBackToCourses
                  : `${t.myLearning.btnViewNotes} (${notes.length})`}
              </span>
              <ArrowRight className="w-3.5 h-3.5 text-[#5B9FE8] group-hover:translate-x-0.5 transition-transform" />
            </button>
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
              <div className="flex items-center gap-2 text-indigo-600 mb-1">
                <Trophy className="w-4 h-4" />
                <span className="text-xs font-semibold">{t.myLearning.activeCourses}</span>
              </div>
              <p className="text-2xl font-bold text-[#18324A]">{userCourses.length}</p>
            </div>

            {/* Notes Metric button */}
            <button
              onClick={() => setActiveView('notes')}
              className={`p-4 rounded-2xl border shadow-sm min-w-[120px] text-left transition-all cursor-pointer group ${
                activeView === 'notes'
                  ? 'bg-[#18324A] border-[#18324A] text-white shadow-md'
                  : 'bg-white border-[rgba(80,140,190,0.16)] hover:border-[#5B9FE8]'
              }`}
            >
              <div className="flex items-center justify-between gap-1 mb-1">
                <div className={`flex items-center gap-1.5 ${activeView === 'notes' ? 'text-amber-300' : 'text-amber-600'}`}>
                  <StickyNote className="w-4 h-4 text-amber-500 fill-amber-500/20" />
                  <span className="text-xs font-semibold">{t.myLearning.allNotesCount}</span>
                </div>
                <ArrowRight className={`w-3.5 h-3.5 transition-transform ${activeView === 'notes' ? 'text-white' : 'text-slate-400 group-hover:translate-x-0.5'}`} />
              </div>
              <p className={`text-2xl font-bold ${activeView === 'notes' ? 'text-white' : 'text-[#18324A]'}`}>
                {notes.length}
              </p>
            </button>
          </div>
        </div>
      </div>

      {/* Segmented View Navigation Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b border-[rgba(80,140,190,0.16)] pb-4">
        <div className="flex items-center gap-2 bg-[#EEF5FC] p-1.5 rounded-2xl w-fit border border-[rgba(80,140,190,0.14)]">
          <button
            onClick={() => setActiveView('courses')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeView === 'courses'
                ? 'bg-white text-[#18324A] shadow-xs'
                : 'text-[#6B8195] hover:text-[#18324A]'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>{t.myLearning.tabCourses}</span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
              activeView === 'courses' ? 'bg-[#DCEEFF] text-[#2867A8]' : 'bg-white/60 text-[#6B8195]'
            }`}>
              {userCourses.length}
            </span>
          </button>

          <button
            onClick={() => setActiveView('notes')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeView === 'notes'
                ? 'bg-white text-[#18324A] shadow-xs'
                : 'text-[#6B8195] hover:text-[#18324A]'
            }`}
          >
            <StickyNote className="w-4 h-4 text-amber-500 fill-amber-500/20" />
            <span>{t.myLearning.tabNotes}</span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
              activeView === 'notes' ? 'bg-amber-100 text-amber-800' : 'bg-white/60 text-[#6B8195]'
            }`}>
              {notes.length}
            </span>
          </button>
        </div>

        {/* Search input for Notes view */}
        {activeView === 'notes' && notes.length > 0 && (
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-[#6B8195] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={notesSearch}
              onChange={(e) => setNotesSearch(e.target.value)}
              placeholder={t.myLearning.searchNotesPlaceholder}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-white border border-[rgba(80,140,190,0.2)] text-xs text-[#18324A] placeholder:text-[#6B8195] focus:outline-none focus:ring-2 focus:ring-[#5B9FE8] shadow-xs"
            />
          </div>
        )}
      </div>

      {/* VIEW 1: ACTIVE COURSES */}
      {activeView === 'courses' && (
        userCourses.length === 0 ? (
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
        )
      )}

      {/* VIEW 2: LEARNING NOTES (Grouped by Course, then by Video ke-berapa) */}
      {activeView === 'notes' && (
        notes.length === 0 ? (
          <div className="text-center py-16 px-4 bg-white rounded-3xl border border-[rgba(80,140,190,0.16)] shadow-sm">
            <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto mb-4 border border-amber-200">
              <StickyNote className="w-8 h-8" />
            </div>
            <h2 className="text-lg font-bold text-[#18324A] mb-2">{t.myLearning.noNotesYet}</h2>
            <p className="text-sm text-[#6B8195] max-w-md mx-auto mb-6">
              {t.myLearning.noNotesYetDesc}
            </p>
            <button
              onClick={() => setActiveView('courses')}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-[#5B9FE8] hover:bg-[#4A8ED8] text-white font-semibold text-sm shadow-[0_4px_16px_rgba(91,159,232,0.4)] transition-all cursor-pointer"
            >
              <span>{t.myLearning.btnBackToCourses}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : groupedCourseNotes.length === 0 ? (
          <div className="text-center py-12 px-4 bg-white rounded-3xl border border-[rgba(80,140,190,0.16)] shadow-sm">
            <Search className="w-8 h-8 text-[#6B8195] mx-auto mb-3" />
            <p className="text-sm font-medium text-[#6B8195]">
              Tidak ada catatan yang cocok dengan "{notesSearch}"
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-[#18324A]">{t.myLearning.notesTitle}</h2>
                <p className="text-xs text-[#6B8195] mt-0.5">{t.myLearning.notesSubtitle}</p>
              </div>
              <span className="text-xs font-bold text-[#2867A8] bg-[#DCEEFF] px-3 py-1.5 rounded-full">
                {totalFilteredNotesCount} Catatan
              </span>
            </div>

            {/* Iterate over each Course */}
            {groupedCourseNotes.map(({ course, totalNotes, videoGroups }) => (
              <div
                key={course.id}
                className="bg-white rounded-3xl border border-[rgba(80,140,190,0.16)] shadow-[0_4px_24px_rgba(220,238,255,0.45)] overflow-hidden transition-all"
              >
                {/* 1. Course Header */}
                <div className="p-5 sm:p-6 bg-gradient-to-r from-[#F8FBFF] to-white border-b border-[rgba(80,140,190,0.12)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    {course.thumbnail ? (
                      <img
                        src={course.thumbnail}
                        alt={course.title}
                        className="w-14 h-14 rounded-2xl object-cover border border-[rgba(80,140,190,0.2)] shadow-xs shrink-0"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-2xl bg-[#5B9FE8] text-white flex items-center justify-center font-bold text-lg shadow-xs shrink-0">
                        {course.title.charAt(0)}
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-[#DCEEFF] text-[#2867A8]">
                          {course.category || 'Kursus'}
                        </span>
                        <span className="text-xs text-[#6B8195] flex items-center gap-1">
                          <StickyNote className="w-3 h-3 text-amber-500" />
                          <strong className="text-[#18324A]">{totalNotes}</strong> catatan
                        </span>
                      </div>
                      <h3 className="text-base sm:text-lg font-bold text-[#18324A]">
                        {course.title}
                      </h3>
                    </div>
                  </div>

                  <button
                    onClick={() => onSelectCourse(course)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white border border-[rgba(80,140,190,0.2)] hover:border-[#5B9FE8] text-xs font-bold text-[#2867A8] hover:bg-[#F0F7FF] transition-all cursor-pointer self-start sm:self-auto shrink-0 shadow-2xs"
                  >
                    <span>Detail Kursus</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* 2. Video Groups inside this Course (video ke berapa) */}
                <div className="p-5 sm:p-6 space-y-6">
                  {videoGroups.map((vg) => (
                    <div
                      key={vg.lesson.id}
                      className="rounded-2xl border border-[rgba(80,140,190,0.12)] bg-[#FCFDFE] p-4 sm:p-5"
                    >
                      {/* Video Header: Video ke berapa & Judul Video */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-[rgba(80,140,190,0.1)] mb-4">
                        <div className="flex items-start sm:items-center gap-2.5">
                          {/* Video Number Badge */}
                          <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#2867A8] text-white font-mono text-xs font-bold shadow-xs shrink-0">
                            <Video className="w-3.5 h-3.5 text-[#BFDFFF]" />
                            <span>{t.myLearning.videoNumber}{vg.videoNumber}</span>
                          </div>

                          <div>
                            <h4 className="text-sm sm:text-base font-bold text-[#18324A]">
                              {vg.lesson.title}
                            </h4>
                            {vg.lesson.subCourseName && (
                              <p className="text-[11px] text-[#6B8195] flex items-center gap-1 mt-0.5">
                                <Layers className="w-3 h-3 text-[#5B9FE8]" />
                                <span>{t.myLearning.module}: {vg.lesson.subCourseName}</span>
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Button: Tonton Video */}
                        <button
                          onClick={() => onStartLearning(course, vg.lesson)}
                          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#5B9FE8] hover:bg-[#4A8ED8] text-white text-xs font-bold transition-all cursor-pointer self-start sm:self-auto shadow-xs"
                        >
                          <Play className="w-3 h-3 fill-current" />
                          <span>Tonton Video</span>
                        </button>
                      </div>

                      {/* Notes list for this video */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                        {vg.notes.map((note) => (
                          <div
                            key={note.id}
                            className="relative group bg-gradient-to-br from-[#FFFDE6] to-[#FFF9B8]/70 border border-amber-300/70 hover:border-amber-400 rounded-2xl p-4 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
                          >
                            {/* Sticky note header: timestamp button & delete */}
                            <div>
                              <div className="flex items-center justify-between gap-2 mb-2">
                                <button
                                  onClick={() => onStartLearning(course, vg.lesson, note.timestamp)}
                                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-400/80 hover:bg-amber-400 text-[#3B2C00] font-mono text-xs font-bold transition-all cursor-pointer shadow-2xs group-hover:scale-105"
                                  title={`Lompat ke video di menit ${formatTime(note.timestamp)}`}
                                >
                                  <Clock className="w-3 h-3" />
                                  <span>{formatTime(note.timestamp)}</span>
                                  <Play className="w-2.5 h-2.5 fill-current ml-0.5 opacity-70" />
                                </button>

                                <button
                                  onClick={() => handleDeleteNote(note.id)}
                                  className="opacity-0 group-hover:opacity-100 text-amber-700 hover:text-red-600 p-1 rounded-lg hover:bg-amber-200/60 transition-all cursor-pointer"
                                  title={t.myLearning.deleteNote}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>

                              {/* Note text */}
                              <p className="text-xs sm:text-sm font-medium text-[#2C2400] leading-relaxed break-words whitespace-pre-wrap">
                                {note.text}
                              </p>
                            </div>

                            {/* Footer: Date created */}
                            {note.createdAt && (
                              <div className="mt-3 pt-2 border-t border-amber-300/40 flex items-center justify-between text-[10px] text-amber-800/70 font-sans">
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  {formatDate(note.createdAt)}
                                </span>
                                <button
                                  onClick={() => onStartLearning(course, vg.lesson, note.timestamp)}
                                  className="text-[10px] font-bold text-amber-900 hover:underline flex items-center gap-0.5 cursor-pointer"
                                >
                                  <span>Putar</span>
                                  <ChevronRight className="w-3 h-3" />
                                </button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
};
