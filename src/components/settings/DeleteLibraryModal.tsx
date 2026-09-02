import React, { useState } from 'react';
import {
  AlertTriangle,
  X,
  Trash2,
  ShieldCheck,
  Folder,
  Loader2,
} from 'lucide-react';
import { CourseLibraryConfig } from '../../types';

interface DeleteLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  library: CourseLibraryConfig | null;
  onDeleted: () => void;
}

export const DeleteLibraryModal: React.FC<DeleteLibraryModalProps> = ({
  isOpen,
  onClose,
  library,
  onDeleted,
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen || !library) return null;

  const handleDelete = async () => {
    setIsDeleting(true);
    setErrorMessage(null);

    try {
      const res = await fetch(`/api/libraries/${encodeURIComponent(library.id)}`, {
        method: 'DELETE',
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to remove library.');
      }

      onDeleted();
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'An error occurred while removing the library.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-[#0F2236]/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="bg-white w-full max-w-md rounded-2xl shadow-[0_20px_50px_rgba(24,50,74,0.25)] border border-[rgba(80,140,190,0.2)] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-[rgba(80,140,190,0.14)] bg-gradient-to-r from-rose-50/60 to-orange-50/40 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shadow-sm border border-rose-200">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#18324A]">Remove Course Library</h3>
              <p className="text-xs text-[#6B8195]">Remove folder configuration from application</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-[#6B8195] hover:text-[#18324A] hover:bg-slate-100 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 space-y-4 text-xs">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <p className="text-[#18324A] text-sm font-medium">
            Are you sure you want to remove <strong>"{library.name}"</strong> from your course libraries?
          </p>

          {/* Library details card */}
          <div className="p-3.5 rounded-xl bg-[#F8FBFF] border border-[rgba(80,140,190,0.18)] space-y-1.5">
            <div className="flex items-center gap-2 text-[#18324A] font-semibold text-xs">
              <Folder className="w-4 h-4 text-[#2867A8]" />
              <span>{library.name}</span>
              {library.isDefault && (
                <span className="text-[10px] px-2 py-0.5 bg-[#DCEEFF] text-[#2867A8] rounded-full font-medium">
                  Default Library
                </span>
              )}
            </div>
            <p className="font-mono text-[11px] text-[#6B8195] truncate">{library.path}</p>
            <div className="flex items-center gap-4 text-[11px] text-[#6B8195] pt-1">
              <span>{library.courseCount} Courses</span>
              <span>•</span>
              <span>{library.moduleCount} Modules</span>
              <span>•</span>
              <span>{library.lessonCount} Lessons</span>
            </div>
          </div>

          {/* Safety Notice Guarantee */}
          <div className="p-3.5 rounded-xl bg-emerald-50/90 border border-emerald-200 text-emerald-900 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold text-xs text-emerald-950">Non-Destructive Guarantee</p>
              <p className="text-[11px] leading-relaxed text-emerald-800">
                Removing this library only removes its entry from your library configuration.
                <strong> None of your physical video files or folders will ever be deleted from your storage drive.</strong>
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="pt-3 border-t border-[rgba(80,140,190,0.14)] flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-[#6B8195] hover:text-[#18324A] hover:bg-[#F0F7FF] transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting}
              className="px-5 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white shadow-md hover:shadow-lg transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Removing...</span>
                </>
              ) : (
                <span>Remove from Libraries</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
