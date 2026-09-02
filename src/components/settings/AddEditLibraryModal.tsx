import React, { useState, useEffect } from 'react';
import {
  Folder,
  FolderPlus,
  Edit3,
  X,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Loader2,
  Sparkles,
  HardDrive,
  Info,
} from 'lucide-react';
import { CourseLibraryConfig, ValidatePathResult } from '../../types';

interface AddEditLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  libraryToEdit?: CourseLibraryConfig | null;
  onSaved: () => void;
}

export const AddEditLibraryModal: React.FC<AddEditLibraryModalProps> = ({
  isOpen,
  onClose,
  libraryToEdit,
  onSaved,
}) => {
  const isEditing = Boolean(libraryToEdit);

  const [name, setName] = useState('');
  const [folderPath, setFolderPath] = useState('');
  const [enabled, setEnabled] = useState(true);
  const [isDefault, setIsDefault] = useState(false);

  // Validation state
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<ValidatePathResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (libraryToEdit) {
        setName(libraryToEdit.name);
        setFolderPath(libraryToEdit.path);
        setEnabled(libraryToEdit.enabled);
        setIsDefault(libraryToEdit.isDefault);
        setValidationResult({
          valid: true,
          courseCount: libraryToEdit.courseCount,
          moduleCount: libraryToEdit.moduleCount,
          lessonCount: libraryToEdit.lessonCount,
        });
      } else {
        setName('');
        setFolderPath('');
        setEnabled(true);
        setIsDefault(false);
        setValidationResult(null);
      }
      setErrorMessage(null);
    }
  }, [isOpen, libraryToEdit]);

  if (!isOpen) return null;

  const handleValidatePath = async (pathToTest: string) => {
    const trimmed = pathToTest.trim();
    if (!trimmed) {
      setValidationResult(null);
      return;
    }

    setIsValidating(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/libraries/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path: trimmed,
          currentId: libraryToEdit?.id,
        }),
      });

      const data: ValidatePathResult = await res.json();
      setValidationResult(data);
    } catch (err: any) {
      setValidationResult({
        valid: false,
        error: 'Failed to connect to validation service.',
      });
    } finally {
      setIsValidating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMessage('Please enter a library name.');
      return;
    }
    if (!folderPath.trim()) {
      setErrorMessage('Please specify a folder path.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      if (isEditing && libraryToEdit) {
        const res = await fetch(`/api/libraries/${encodeURIComponent(libraryToEdit.id)}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: name.trim(),
            path: folderPath.trim(),
            enabled,
            isDefault,
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Failed to update library.');
        }
      } else {
        const res = await fetch('/api/libraries', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: name.trim(),
            path: folderPath.trim(),
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Failed to add library.');
        }
      }

      onSaved();
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'An error occurred while saving.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-[#0F2236]/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="bg-white w-full max-w-lg rounded-2xl shadow-[0_20px_50px_rgba(24,50,74,0.25)] border border-[rgba(80,140,190,0.2)] overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-[rgba(80,140,190,0.14)] bg-gradient-to-r from-[#F8FBFF] to-[#EDF6FF] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#DCEEFF] text-[#2867A8] flex items-center justify-center shadow-sm border border-[#BFDFFF]">
              {isEditing ? <Edit3 className="w-5 h-5" /> : <FolderPlus className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-base font-bold text-[#18324A]">
                {isEditing ? 'Edit Course Library' : 'Add New Course Folder'}
              </h3>
              <p className="text-xs text-[#6B8195]">
                {isEditing
                  ? 'Update configuration or change folder path'
                  : 'Register a local directory containing video courses'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-[#6B8195] hover:text-[#18324A] hover:bg-[#DCEEFF]/50 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Unable to save</p>
                <p className="mt-0.5">{errorMessage}</p>
              </div>
            </div>
          )}

          {/* Library Name */}
          <div>
            <label className="block font-semibold text-[#18324A] mb-1.5 text-xs">
              Library Display Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Masterclass Archive, SSD Courses, Creative Suite"
              required
              className="w-full px-3.5 py-2.5 bg-[#F8FBFF] border border-[rgba(80,140,190,0.25)] rounded-xl text-xs text-[#18324A] placeholder:text-[#9AAEBD] focus:outline-none focus:ring-2 focus:ring-[#5B9FE8] focus:bg-white transition-all font-medium"
            />
          </div>

          {/* Folder Path */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block font-semibold text-[#18324A] text-xs">
                Local Folder Path <span className="text-rose-500">*</span>
              </label>
              <button
                type="button"
                onClick={() => handleValidatePath(folderPath)}
                disabled={isValidating || !folderPath.trim()}
                className="text-[11px] font-semibold text-[#2867A8] hover:text-[#5B9FE8] flex items-center gap-1 cursor-pointer disabled:opacity-40"
              >
                {isValidating ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span>Validating...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3 h-3 text-[#5B9FE8]" />
                    <span>Test Path</span>
                  </>
                )}
              </button>
            </div>

            <div className="relative">
              <HardDrive className="w-4 h-4 text-[#9AAEBD] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={folderPath}
                onChange={(e) => {
                  setFolderPath(e.target.value);
                  setValidationResult(null);
                }}
                onBlur={() => {
                  if (folderPath.trim() && !validationResult) {
                    handleValidatePath(folderPath);
                  }
                }}
                placeholder="e.g. D:\Video Courses or C:\Users\Media\Courses or ./videos"
                required
                className="w-full pl-9 pr-3.5 py-2.5 bg-[#F8FBFF] border border-[rgba(80,140,190,0.25)] rounded-xl text-xs font-mono text-[#18324A] placeholder:text-[#9AAEBD] focus:outline-none focus:ring-2 focus:ring-[#5B9FE8] focus:bg-white transition-all"
              />
            </div>
            <p className="text-[11px] text-[#6B8195] mt-1.5 flex items-center gap-1">
              <span>Supports Windows drive letters (D:\...), Unix paths (/...), and relative paths (./videos)</span>
            </p>
          </div>

          {/* Live Path Validation Status Box */}
          {isValidating && (
            <div className="p-3 rounded-xl bg-[#F0F7FF] border border-[rgba(80,140,190,0.2)] flex items-center gap-2.5 text-[#2867A8]">
              <Loader2 className="w-4 h-4 animate-spin text-[#5B9FE8]" />
              <span>Scanning path and testing read permissions...</span>
            </div>
          )}

          {!isValidating && validationResult && (
            <div>
              {validationResult.valid ? (
                <div className="p-3 rounded-xl bg-emerald-50/80 border border-emerald-200 text-emerald-900">
                  <div className="flex items-center gap-2 font-semibold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Valid Course Library Directory</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mt-2 pt-2 border-t border-emerald-200/60 text-center">
                    <div className="bg-white/80 rounded-lg p-1.5 border border-emerald-200/40">
                      <p className="text-xs font-bold text-emerald-800">
                        {validationResult.courseCount ?? 0}
                      </p>
                      <p className="text-[10px] text-emerald-700">Courses</p>
                    </div>
                    <div className="bg-white/80 rounded-lg p-1.5 border border-emerald-200/40">
                      <p className="text-xs font-bold text-emerald-800">
                        {validationResult.moduleCount ?? 0}
                      </p>
                      <p className="text-[10px] text-emerald-700">Modules</p>
                    </div>
                    <div className="bg-white/80 rounded-lg p-1.5 border border-emerald-200/40">
                      <p className="text-xs font-bold text-emerald-800">
                        {validationResult.lessonCount ?? 0}
                      </p>
                      <p className="text-[10px] text-emerald-700">Lessons</p>
                    </div>
                  </div>
                  {validationResult.warning && (
                    <p className="text-[11px] text-amber-700 mt-2 flex items-start gap-1">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                      <span>{validationResult.warning}</span>
                    </p>
                  )}
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800">
                  <div className="flex items-center gap-2 font-semibold">
                    <AlertCircle className="w-4 h-4 text-rose-600" />
                    <span>Invalid Folder Path</span>
                  </div>
                  <p className="text-[11px] text-rose-700 mt-1">
                    {validationResult.error || 'The specified folder could not be found or read.'}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Edit-only settings */}
          {isEditing && (
            <div className="pt-2 border-t border-[rgba(80,140,190,0.14)] space-y-3">
              {/* Enabled toggle */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-[#F8FBFF] border border-[rgba(80,140,190,0.12)]">
                <div>
                  <span className="font-semibold text-[#18324A]">Enable this Library</span>
                  <p className="text-[11px] text-[#6B8195]">
                    Courses appear in the catalog, search, and continue learning
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enabled}
                    onChange={(e) => setEnabled(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#2867A8]"></div>
                </label>
              </div>

              {/* Set as Default */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-[#F8FBFF] border border-[rgba(80,140,190,0.12)]">
                <div>
                  <span className="font-semibold text-[#18324A]">Primary / Default Library</span>
                  <p className="text-[11px] text-[#6B8195]">
                    Designate this folder as your primary storage location
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isDefault}
                    onChange={(e) => setIsDefault(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#2867A8]"></div>
                </label>
              </div>
            </div>
          )}

          {/* Non-destructive guarantee notice */}
          <div className="p-3 rounded-xl bg-[#F0F7FF] border border-[rgba(91,159,232,0.2)] flex items-start gap-2.5 text-[#2867A8]">
            <Info className="w-4 h-4 text-[#5B9FE8] shrink-0 mt-0.5" />
            <p className="text-[11px] leading-relaxed">
              <strong>Safe Read-Only Indexing:</strong> The platform only indexes video files and
              course metadata. It will never move, alter, or delete any physical files from your
              system.
            </p>
          </div>

          {/* Footer action buttons */}
          <div className="pt-3 border-t border-[rgba(80,140,190,0.14)] flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-[#6B8195] hover:text-[#18324A] hover:bg-[#F0F7FF] transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isValidating}
              className="px-5 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-[#5B9FE8] to-[#2867A8] text-white shadow-md hover:shadow-lg transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving & Scanning...</span>
                </>
              ) : (
                <span>{isEditing ? 'Save Changes' : 'Add & Scan Folder'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
