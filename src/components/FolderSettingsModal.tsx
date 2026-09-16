import React, { useState, useEffect } from 'react';
import {
  X,
  FolderOpen,
  FolderSync,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Layers,
  FileVideo,
  Database,
  ArrowRight,
  Youtube,
  Search,
  Sparkles,
  Loader2,
  Trash2,
  ExternalLink,
  Clock,
  User,
  Plus,
} from 'lucide-react';
import { Course, ParsedYouTubePlaylist, ParsedYouTubeVideoCourse, YouTubeImportMode } from '../types';
import {
  fetchClientYouTubePreview,
  convertClientVideoChaptersToCourse,
  convertClientPlaylistToCourse,
  saveClientCustomCourse,
  getClientCustomCourses,
  deleteClientCustomCourse,
} from '../utils/youtubeClientService';

interface FolderSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentFolder: string;
  resolvedPath: string;
  folderExists: boolean;
  totalCourses: number;
  totalLessons: number;
  isRescanning: boolean;
  onSaveAndRescan: (newPath: string) => void;
  onOpenLibrariesManager?: () => void;
}

const CATEGORIES = [
  'Technology & Engineering',
  'Programming',
  'Design & Creative',
  'Business & Management',
  'Finance & Accounting',
  'Data Science & AI',
  'General',
];

export const FolderSettingsModal: React.FC<FolderSettingsModalProps> = ({
  isOpen,
  onClose,
  currentFolder,
  resolvedPath,
  folderExists,
  totalCourses,
  totalLessons,
  isRescanning,
  onSaveAndRescan,
  onOpenLibrariesManager,
}) => {
  // Main Tab Navigation: Local vs YouTube
  const [activeTab, setActiveTab] = useState<'local' | 'youtube'>('local');

  // Local state
  const [folderInput, setFolderInput] = useState(currentFolder);
  const [localMessage, setLocalMessage] = useState<string | null>(null);

  // YouTube state
  const [ytMode, setYtMode] = useState<YouTubeImportMode>('chapters');
  const [playlistUrl, setPlaylistUrl] = useState('');
  const [isLoadingYtPreview, setIsLoadingYtPreview] = useState(false);
  const [ytPreview, setYtPreview] = useState<ParsedYouTubePlaylist | null>(null);
  const [videoPreview, setVideoPreview] = useState<ParsedYouTubeVideoCourse | null>(null);
  const [customTitle, setCustomTitle] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [isSavingYt, setIsSavingYt] = useState(false);
  const [ytMessage, setYtMessage] = useState<string | null>(null);
  const [ytError, setYtError] = useState<string | null>(null);
  const [existingYtCourses, setExistingYtCourses] = useState<Course[]>([]);
  const [isLoadingYtList, setIsLoadingYtList] = useState(false);

  // Load existing YouTube courses when switching to YouTube tab
  const fetchYouTubeCourses = async () => {
    setIsLoadingYtList(true);
    try {
      const res = await fetch('/api/youtube/courses');
      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        const data = await res.json();
        if (data.courses) {
          setExistingYtCourses(data.courses);
          return;
        }
      }
    } catch {
      // Backend not reachable, will fallback
    }

    // Static fallback (GitHub Pages)
    const localCourses = getClientCustomCourses();
    setExistingYtCourses(localCourses);
    setIsLoadingYtList(false);
  };

  useEffect(() => {
    if (isOpen && activeTab === 'youtube') {
      fetchYouTubeCourses();
    }
  }, [isOpen, activeTab]);

  if (!isOpen) return null;

  const handleSaveLocal = () => {
    if (!folderInput.trim()) return;
    onSaveAndRescan(folderInput.trim());
    setLocalMessage('Path berhasil diperbarui dan pemindaian folder dimulai!');
    setTimeout(() => setLocalMessage(null), 3500);
  };

  const handleFetchYtPreview = async () => {
    const trimmed = playlistUrl.trim();
    if (!trimmed) {
      setYtError(
        ytMode === 'chapters'
          ? 'Masukkan link video YouTube terlebih dahulu.'
          : 'Masukkan link playlist YouTube terlebih dahulu.'
      );
      return;
    }

    setIsLoadingYtPreview(true);
    setYtError(null);
    setYtMessage(null);
    setYtPreview(null);
    setVideoPreview(null);

    try {
      let data: any = null;
      try {
        const res = await fetch('/api/youtube/preview', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: trimmed, mode: ytMode }),
        });
        const contentType = res.headers.get('content-type') || '';
        if (res.ok && contentType.includes('application/json')) {
          data = await res.json();
        }
      } catch {
        // Backend not reachable
      }

      if (!data) {
        data = await fetchClientYouTubePreview(trimmed, ytMode);
      }

      if (!data) {
        throw new Error('Gagal memuat materi YouTube.');
      }

      if (data.mode === 'chapters' && data.videoCourse) {
        setVideoPreview(data.videoCourse);
        setCustomTitle(data.videoCourse.title);
      } else if (data.playlist) {
        setYtPreview(data.playlist);
        setCustomTitle(data.playlist.title);
      }
    } catch (err: any) {
      setYtError(err.message || 'Terjadi kesalahan saat memuat materi YouTube.');
    } finally {
      setIsLoadingYtPreview(false);
    }
  };

  const handleSaveYtCourse = async () => {
    const activeData = ytMode === 'chapters' ? videoPreview : ytPreview;
    if (!activeData) return;

    setIsSavingYt(true);
    setYtError(null);

    try {
      let saved = false;
      try {
        const res = await fetch('/api/youtube/courses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            url: playlistUrl.trim(),
            mode: ytMode,
            category,
            customTitle: customTitle.trim() || activeData.title,
          }),
        });
        const contentType = res.headers.get('content-type') || '';
        if (res.ok && contentType.includes('application/json')) {
          const data = await res.json();
          setYtMessage(data.message || 'Kursus YouTube berhasil ditambahkan ke Library!');
          saved = true;
        }
      } catch {
        // Backend not reachable
      }

      if (!saved) {
        let newCourse: Course;
        if (ytMode === 'chapters' && videoPreview) {
          newCourse = convertClientVideoChaptersToCourse(
            videoPreview,
            category,
            'All Levels',
            customTitle.trim() || undefined
          );
        } else if (ytPreview) {
          newCourse = convertClientPlaylistToCourse(
            ytPreview,
            category,
            'All Levels',
            customTitle.trim() || undefined
          );
        } else {
          throw new Error('Data kursus tidak valid.');
        }

        saveClientCustomCourse(newCourse);
        setYtMessage('Kursus YouTube berhasil ditambahkan ke Library!');
      }

      setYtPreview(null);
      setVideoPreview(null);
      setPlaylistUrl('');
      await fetchYouTubeCourses();
      onSaveAndRescan(currentFolder); // trigger platform library refresh

      setTimeout(() => setYtMessage(null), 4000);
    } catch (err: any) {
      setYtError(err.message || 'Gagal menyimpan kursus.');
    } finally {
      setIsSavingYt(false);
    }
  };

  const handleDeleteYtCourse = async (courseId: string) => {
    if (!confirm('Hapus kursus YouTube ini dari Library Anda?')) return;

    try {
      let deleted = false;
      try {
        const res = await fetch(`/api/youtube/courses/${encodeURIComponent(courseId)}`, {
          method: 'DELETE',
        });
        if (res.ok) {
          deleted = true;
        }
      } catch {}

      if (!deleted) {
        deleteClientCustomCourse(courseId);
      }

      await fetchYouTubeCourses();
      onSaveAndRescan(currentFolder);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[200] overflow-hidden bg-[#18324A]/45 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl max-h-[calc(100dvh-2rem)] sm:max-h-[88vh] overflow-y-auto bg-white rounded-3xl border border-[rgba(80,140,190,0.22)] shadow-[0_24px_70px_rgba(40,103,168,0.25)] p-6 sm:p-8 animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[rgba(80,140,190,0.15)] mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#DCEEFF] text-[#2867A8] flex items-center justify-center border border-[#BFDFFF] shadow-xs">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#18324A]">
                Course Library Manager
              </h2>
              <p className="text-xs text-[#6B8195]">
                Tambahkan dan kelola sumber materi kursus Anda
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-[#F0F7FF] text-[#6B8195] hover:text-[#18324A] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation: Course Local vs Course YouTube */}
        <div className="flex p-1.5 bg-[#F0F5FA] rounded-2xl mb-6 border border-[rgba(80,140,190,0.15)]">
          <button
            onClick={() => setActiveTab('local')}
            className={`flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'local'
                ? 'bg-white text-[#2867A8] shadow-sm'
                : 'text-[#6B8195] hover:text-[#18324A]'
            }`}
          >
            <FolderOpen className="w-4 h-4" />
            <span>Course dari Local</span>
          </button>

          <button
            onClick={() => setActiveTab('youtube')}
            className={`flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'youtube'
                ? 'bg-white text-red-600 shadow-sm'
                : 'text-[#6B8195] hover:text-[#18324A]'
            }`}
          >
            <Youtube className="w-4 h-4 fill-current" />
            <span>Course dari YouTube</span>
            {existingYtCourses.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-red-100 text-red-700 font-bold">
                {existingYtCourses.length}
              </span>
            )}
          </button>
        </div>

        {/* ========================================================= */}
        {/* TAB 1: COURSE LOCAL (FOLDER) */}
        {/* ========================================================= */}
        {activeTab === 'local' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Current Status Badge */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3.5 rounded-2xl bg-[#F8FBFF] border border-[rgba(80,140,190,0.15)] flex items-center gap-3">
                <div
                  className={`w-3 h-3 rounded-full ${
                    folderExists ? 'bg-emerald-500 ring-4 ring-emerald-100' : 'bg-amber-500'
                  }`}
                />
                <div>
                  <p className="text-xs text-[#6B8195]">Status Folder Lokal</p>
                  <p className="text-xs font-semibold text-[#18324A]">
                    {folderExists ? 'Direktori Terverifikasi & Aktif' : 'Folder Tidak Ditemukan'}
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#F8FBFF] border border-[rgba(80,140,190,0.15)] flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-[#6B8195]">
                  <Layers className="w-4 h-4 text-[#5B9FE8]" />
                  <span>Ditemukan:</span>
                </div>
                <div className="text-xs font-bold text-[#2867A8]">
                  {totalCourses} Courses • {totalLessons} Lessons
                </div>
              </div>
            </div>

            {/* Folder Input Field */}
            <div>
              <label className="block text-xs font-bold text-[#18324A] uppercase tracking-wider mb-2">
                Path Direktori Root Video Course
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={folderInput}
                  onChange={(e) => setFolderInput(e.target.value)}
                  placeholder="./videos atau D:\Courses"
                  className="flex-1 px-4 py-2.5 bg-[#F0F7FF] border border-[rgba(91,159,232,0.25)] rounded-xl text-sm font-mono text-[#18324A] focus:outline-none focus:ring-2 focus:ring-[#5B9FE8] focus:bg-white"
                />
                <button
                  onClick={handleSaveLocal}
                  disabled={isRescanning}
                  className="px-5 py-2.5 rounded-xl bg-[#2867A8] hover:bg-[#1E5288] text-white font-semibold text-xs shadow-sm transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <FolderSync className={`w-4 h-4 ${isRescanning ? 'animate-spin' : ''}`} />
                  <span>{isRescanning ? 'Memindai...' : 'Simpan & Scan'}</span>
                </button>
              </div>
              <p className="text-[11px] text-[#6B8195] mt-1.5 font-mono truncate">
                Resolved system path: {resolvedPath}
              </p>
            </div>

            {localMessage && (
              <div className="p-3.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{localMessage}</span>
              </div>
            )}

            {/* Multi-Folder Libraries Manager Callout */}
            {onOpenLibrariesManager && (
              <div className="p-4 rounded-2xl bg-gradient-to-r from-[#DCEEFF]/70 to-[#EDF6FF]/70 border border-[#BFDFFF] flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-bold text-[#18324A]">Punya Banyak Folder Kursus?</p>
                  <p className="text-[11px] text-[#4A6B88] mt-0.5">
                    Kelola multi direktori, external drive, dan aktifkan/nonaktifkan folder library.
                  </p>
                </div>
                <button
                  onClick={() => {
                    onClose();
                    onOpenLibrariesManager();
                  }}
                  className="px-3.5 py-2 rounded-xl bg-[#2867A8] hover:bg-[#1f5286] text-white text-xs font-semibold shrink-0 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <span>Buka Libraries</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Structural Explanation */}
            <div className="p-4 rounded-2xl bg-[#F0F7FF] border border-[rgba(91,159,232,0.2)]">
              <h4 className="text-xs font-bold text-[#2867A8] flex items-center gap-1.5 mb-2">
                <HelpCircle className="w-3.5 h-3.5 text-[#5B9FE8]" />
                <span>Format Struktur Folder Course Lokal</span>
              </h4>
              <pre className="p-3 rounded-xl bg-white border border-[rgba(91,159,232,0.18)] font-mono text-[11px] text-[#18324A] overflow-x-auto leading-relaxed">
{`ROOT FOLDER/
├── Judul Course/              (Folder Utama menjadi Course)
│   ├── course.json            (Opsional: info kategori, deskripsi)
│   ├── 01 Module Title/       (Subfolder menjadi Modul)
│   │   ├── 01 Lesson.mp4      (File Video menjadi Lesson)
│   │   └── 02 Lesson.mp4
│   └── 02 Module Title/
│       └── 01 Lesson.mp4`}
              </pre>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: COURSE YOUTUBE (CHAPTERS & PLAYLIST) */}
        {/* ========================================================= */}
        {activeTab === 'youtube' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Mode Toggle & Importer Form */}
            <div className="p-5 rounded-2xl bg-[#FFF9F9] border border-red-200 space-y-4">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-[#18324A] uppercase tracking-wider">
                  Metode Import YouTube
                </label>
              </div>

              {/* Mode Toggle Button */}
              <div className="grid grid-cols-2 p-1 bg-white rounded-xl border border-red-200 shadow-xs">
                <button
                  type="button"
                  onClick={() => {
                    setYtMode('chapters');
                    setYtPreview(null);
                    setVideoPreview(null);
                    setYtError(null);
                  }}
                  className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                    ytMode === 'chapters'
                      ? 'bg-red-50 text-red-700 border border-red-200 shadow-xs'
                      : 'text-[#6B8195] hover:text-[#18324A]'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5 text-red-600" />
                  <span>Bagi per Sub-Course (Bab Video)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setYtMode('playlist');
                    setYtPreview(null);
                    setVideoPreview(null);
                    setYtError(null);
                  }}
                  className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                    ytMode === 'playlist'
                      ? 'bg-red-50 text-red-700 border border-red-200 shadow-xs'
                      : 'text-[#6B8195] hover:text-[#18324A]'
                  }`}
                >
                  <Youtube className="w-3.5 h-3.5 text-red-600" />
                  <span>Full Playlist YouTube</span>
                </button>
              </div>

              <div className="space-y-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={playlistUrl}
                    onChange={(e) => setPlaylistUrl(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleFetchYtPreview()}
                    placeholder={
                      ytMode === 'chapters'
                        ? 'https://www.youtube.com/watch?v=... atau https://youtu.be/...'
                        : 'https://www.youtube.com/playlist?list=PL...'
                    }
                    className="flex-1 px-4 py-2.5 bg-white border border-red-200 rounded-xl text-xs sm:text-sm text-[#18324A] focus:outline-none focus:ring-2 focus:ring-red-400 font-mono"
                  />

                  <button
                    onClick={handleFetchYtPreview}
                    disabled={isLoadingYtPreview || !playlistUrl.trim()}
                    className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-xs transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isLoadingYtPreview ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Memuat...</span>
                      </>
                    ) : (
                      <>
                        <Search className="w-4 h-4" />
                        <span>{ytMode === 'chapters' ? 'Cek Video & Bab' : 'Cek Playlist'}</span>
                      </>
                    )}
                  </button>
                </div>
                <p className="text-[11px] text-[#6B8195]">
                  {ytMode === 'chapters'
                    ? 'Masukkan link video YouTube dengan timestamp bab (misal: 00:00:00, 00:17:48) di deskripsinya.'
                    : 'Masukkan link playlist YouTube publik (misal: tutorial, kuliah, atau workshop).'}
                </p>
              </div>
            </div>

            {/* Error & Success Messages */}
            {ytError && (
              <div className="p-3.5 rounded-xl bg-red-50 text-red-700 border border-red-200 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                <span>{ytError}</span>
              </div>
            )}

            {ytMessage && (
              <div className="p-3.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{ytMessage}</span>
              </div>
            )}

            {/* Preview Card */}
            {(ytPreview || videoPreview) && (
              <div className="p-5 rounded-2xl bg-white border border-[rgba(80,140,190,0.22)] shadow-sm space-y-4 animate-in fade-in duration-200">
                <div className="flex items-center justify-between pb-2 border-b border-[rgba(80,140,190,0.15)]">
                  <span className="text-xs font-bold text-red-600 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4" />
                    <span>
                      {ytMode === 'chapters'
                        ? 'Preview Video & Sub-Course Ditemukan'
                        : 'Preview Playlist Ditemukan'}
                    </span>
                  </span>
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-red-50 text-red-700">
                    {ytMode === 'chapters' && videoPreview
                      ? `${videoPreview.chapters.length} Sub-Course Terdeteksi`
                      : `${ytPreview?.videos.length} Video Materi`}
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 items-start">
                  <div className="w-full sm:w-40 aspect-video rounded-xl overflow-hidden bg-slate-900 shrink-0 relative shadow-inner">
                    <img
                      src={(videoPreview || ytPreview)?.thumbnail}
                      alt={(videoPreview || ytPreview)?.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-1.5 right-1.5 px-1 py-0.5 rounded bg-black/80 text-white text-[9px] font-mono">
                      {(videoPreview || ytPreview)?.totalDurationFormatted}
                    </div>
                  </div>

                  <div className="flex-1 min-w-0 space-y-2 w-full">
                    <div>
                      <label className="block text-[11px] font-bold text-[#6B8195] mb-1">
                        Judul Kursus
                      </label>
                      <input
                        type="text"
                        value={customTitle}
                        onChange={(e) => setCustomTitle(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg border border-[rgba(80,140,190,0.25)] text-xs sm:text-sm font-bold text-[#18324A] bg-white outline-none focus:border-[#2867A8]"
                      />
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-xs text-[#6B8195]">
                      <span className="font-semibold text-[#18324A]">
                        {(videoPreview || ytPreview)?.instructor}
                      </span>
                      <span>•</span>
                      <span>{(videoPreview || ytPreview)?.totalDurationFormatted}</span>
                      <span>•</span>
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="px-2 py-1 rounded-lg border border-slate-200 text-xs font-semibold bg-white"
                      >
                        {CATEGORIES.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Sub-Courses preview if chapters mode */}
                {ytMode === 'chapters' && videoPreview && (
                  <div className="pt-2">
                    <label className="block text-[11px] font-bold text-[#6B8195] uppercase tracking-wider mb-2">
                      Daftar Sub-Course / Bab ({videoPreview.chapters.length})
                    </label>
                    <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1 no-scrollbar">
                      {videoPreview.chapters.map((ch, i) => (
                        <div
                          key={`${ch.startTime}-${i}`}
                          className="p-2 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-2 text-xs"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="w-5 h-5 rounded-md bg-red-100 text-red-700 font-mono font-bold text-[10px] flex items-center justify-center shrink-0">
                              {i + 1}
                            </span>
                            <span className="font-semibold text-[#18324A] truncate">
                              {ch.title}
                            </span>
                          </div>
                          <span className="text-[10px] font-mono text-[#6B8195] shrink-0">
                            {ch.startTimeFormatted} ({ch.durationFormatted})
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    onClick={() => {
                      setYtPreview(null);
                      setVideoPreview(null);
                    }}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-[#6B8195] hover:text-[#18324A]"
                  >
                    Batal
                  </button>
                  <button
                    onClick={handleSaveYtCourse}
                    disabled={isSavingYt}
                    className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-sm transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {isSavingYt ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Menyimpan...</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-3.5 h-3.5" />
                        <span>Simpan ke Course Library</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* List of Already Added YouTube Courses */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold text-[#18324A] uppercase tracking-wider">
                  Daftar Course YouTube Tersimpan ({existingYtCourses.length})
                </h3>
              </div>

              {isLoadingYtList ? (
                <div className="py-8 text-center text-xs text-[#6B8195] flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Memuat daftar kursus YouTube...</span>
                </div>
              ) : existingYtCourses.length === 0 ? (
                <div className="py-8 text-center text-xs text-[#6B8195] bg-[#F8FBFF] rounded-2xl border border-[rgba(80,140,190,0.15)]">
                  Belum ada kursus YouTube yang ditambahkan. Gunakan kolom di atas untuk menambahkan playlist pertama Anda!
                </div>
              ) : (
                <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                  {existingYtCourses.map((c) => (
                    <div
                      key={c.id}
                      className="p-3 rounded-2xl bg-white border border-[rgba(80,140,190,0.15)] shadow-2xs hover:shadow-sm flex items-center justify-between gap-3 transition-all"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-16 h-10 rounded-lg overflow-hidden bg-slate-900 shrink-0 relative">
                          <img
                            src={c.thumbnail}
                            alt={c.title}
                            className="w-full h-full object-cover"
                          />
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-red-100 text-red-700">
                              YouTube
                            </span>
                            <h4 className="text-xs font-bold text-[#18324A] truncate">
                              {c.title}
                            </h4>
                          </div>
                          <p className="text-[10px] text-[#6B8195] mt-0.5">
                            {c.instructor} • {c.lessonCount} video • {c.totalDurationFormatted}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {c.playlistUrl && (
                          <a
                            href={c.playlistUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                            title="Buka di YouTube"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}

                        <button
                          onClick={() => handleDeleteYtCourse(c.id)}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
                          title="Hapus kursus ini"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer Close Button */}
        <div className="mt-6 pt-4 border-t border-[rgba(80,140,190,0.15)] flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#18324A] text-xs sm:text-sm font-bold transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
