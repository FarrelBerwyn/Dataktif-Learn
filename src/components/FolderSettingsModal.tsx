import React, { useState } from 'react';
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
} from 'lucide-react';

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
  const [folderInput, setFolderInput] = useState(currentFolder);
  const [message, setMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSave = () => {
    if (!folderInput.trim()) return;
    onSaveAndRescan(folderInput.trim());
    setMessage('Updated path and initiated scanner!');
    setTimeout(() => setMessage(null), 3000);
  };

  return (
    <div
      className="fixed inset-0 z-[200] overflow-hidden bg-[#18324A]/40 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl max-h-[calc(100dvh-2rem)] sm:max-h-[88vh] overflow-y-auto bg-white rounded-3xl border border-[rgba(80,140,190,0.2)] shadow-[0_20px_60px_rgba(40,103,168,0.2)] p-6 sm:p-8 animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[rgba(80,140,190,0.15)] mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#DCEEFF] text-[#2867A8] flex items-center justify-center border border-[#BFDFFF]">
              <FolderOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#18324A]">
                Local Course Folder Configuration
              </h2>
              <p className="text-xs text-[#6B8195]">
                Filesystem-driven course hierarchy scanner
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-[#F0F7FF] text-[#6B8195] hover:text-[#18324A] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Status Badge */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
          <div className="p-3.5 rounded-2xl bg-[#F8FBFF] border border-[rgba(80,140,190,0.15)] flex items-center gap-3">
            <div
              className={`w-3 h-3 rounded-full ${
                folderExists ? 'bg-emerald-500 ring-4 ring-emerald-100' : 'bg-amber-500'
              }`}
            />
            <div>
              <p className="text-xs text-[#6B8195]">Folder Status</p>
              <p className="text-xs font-semibold text-[#18324A]">
                {folderExists ? 'Directory Verified & Active' : 'Folder Not Found'}
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#F8FBFF] border border-[rgba(80,140,190,0.15)] flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-[#6B8195]">
              <Layers className="w-4 h-4 text-[#5B9FE8]" />
              <span>Discovered:</span>
            </div>
            <div className="text-xs font-bold text-[#2867A8]">
              {totalCourses} Courses • {totalLessons} Lessons
            </div>
          </div>
        </div>

        {/* Folder Input Field */}
        <div className="mb-6">
          <label className="block text-xs font-bold text-[#18324A] uppercase tracking-wider mb-2">
            Local Video Root Folder Path
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={folderInput}
              onChange={(e) => setFolderInput(e.target.value)}
              placeholder="./videos or /path/to/courses"
              className="flex-1 px-4 py-2.5 bg-[#F0F7FF] border border-[rgba(91,159,232,0.25)] rounded-xl text-sm font-mono text-[#18324A] focus:outline-none focus:ring-2 focus:ring-[#5B9FE8] focus:bg-white"
            />
            <button
              onClick={handleSave}
              disabled={isRescanning}
              className="px-5 py-2.5 rounded-xl bg-[#5B9FE8] hover:bg-[#4A8ED8] text-white font-semibold text-xs shadow-sm transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <FolderSync
                className={`w-4 h-4 ${isRescanning ? 'animate-spin' : ''}`}
              />
              <span>{isRescanning ? 'Scanning...' : 'Save & Rescan'}</span>
            </button>
          </div>
          <p className="text-[11px] text-[#6B8195] mt-1.5 font-mono truncate">
            Resolved system path: {resolvedPath}
          </p>
        </div>

        {message && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{message}</span>
          </div>
        )}

        {/* Multi-Folder Libraries Manager Callout */}
        {onOpenLibrariesManager && (
          <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-[#DCEEFF]/70 to-[#EDF6FF]/70 border border-[#BFDFFF] flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold text-[#18324A]">Multiple Course Folders?</p>
              <p className="text-[11px] text-[#4A6B88] mt-0.5">
                Manage multiple directories, external drives, enable/disable folders in Account Settings.
              </p>
            </div>
            <button
              onClick={() => {
                onClose();
                onOpenLibrariesManager();
              }}
              className="px-3.5 py-2 rounded-xl bg-[#2867A8] hover:bg-[#1f5286] text-white text-xs font-semibold shrink-0 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <span>Manage Libraries</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Structural Explanation */}
        <div className="p-4 rounded-2xl bg-[#F0F7FF] border border-[rgba(91,159,232,0.2)]">
          <h4 className="text-xs font-bold text-[#2867A8] flex items-center gap-1.5 mb-2">
            <HelpCircle className="w-3.5 h-3.5 text-[#5B9FE8]" />
            <span>How the Filesystem Course Scanner Works</span>
          </h4>
          <p className="text-xs text-[#476077] mb-3 leading-relaxed">
            The folder structure itself becomes your course catalog. Simply organize your
            video files into folders:
          </p>

          <pre className="p-3 rounded-xl bg-white border border-[rgba(91,159,232,0.18)] font-mono text-[11px] text-[#18324A] overflow-x-auto leading-relaxed">
{`ROOT FOLDER/
├── Course Name/               (Top-level folder becomes Course)
│   ├── course.json            (Optional: instructor, tags, description)
│   ├── 01 Module Title/       (Subfolder becomes Module)
│   │   ├── 01 Lesson Name.mp4 (Video file becomes Lesson)
│   │   └── 02 Lesson Name.mp4
│   └── 02 Module Title/
│       └── 01 Lesson Name.mp4`}
          </pre>

          <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-[#6B8195]">
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Natural number sorting (1, 2, 10)
            </span>
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Auto-cleans file prefixes
            </span>
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-500" /> HTTP 206 Partial Streaming
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
