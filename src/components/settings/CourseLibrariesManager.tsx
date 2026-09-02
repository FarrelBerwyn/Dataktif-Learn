import React, { useState, useEffect, useCallback } from 'react';
import {
  Folder,
  FolderPlus,
  FolderSync,
  HardDrive,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Edit3,
  Trash2,
  Star,
  Copy,
  Check,
  ShieldCheck,
  Search,
  RefreshCw,
  Power,
  Layers,
  Film,
  BookOpen,
  Info,
  ExternalLink,
} from 'lucide-react';
import { CourseLibraryConfig, CourseLibrarySummary } from '../../types';
import { AddEditLibraryModal } from './AddEditLibraryModal';
import { DeleteLibraryModal } from './DeleteLibraryModal';

interface CourseLibrariesManagerProps {
  onCatalogUpdated?: () => void;
}

export const CourseLibrariesManager: React.FC<CourseLibrariesManagerProps> = ({
  onCatalogUpdated,
}) => {
  const [libraries, setLibraries] = useState<CourseLibraryConfig[]>([]);
  const [summary, setSummary] = useState<CourseLibrarySummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRescanningAll, setIsRescanningAll] = useState(false);
  const [rescanningId, setRescanningId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedPath, setCopiedPath] = useState<string | null>(null);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [libraryToEdit, setLibraryToEdit] = useState<CourseLibraryConfig | null>(null);
  const [libraryToDelete, setLibraryToDelete] = useState<CourseLibraryConfig | null>(null);

  const fetchLibraries = useCallback(async () => {
    try {
      const res = await fetch('/api/libraries');
      const data = await res.json();
      if (data.libraries) {
        setLibraries(data.libraries);
        setSummary(data.summary);
      }
    } catch (err) {
      console.error('Failed to load course libraries:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLibraries();
  }, [fetchLibraries]);

  const showToast = (msg: string) => {
    setActionSuccessMessage(msg);
    setTimeout(() => {
      setActionSuccessMessage((curr) => (curr === msg ? null : curr));
    }, 4000);
  };

  const handleCopyPath = (pathText: string) => {
    navigator.clipboard.writeText(pathText);
    setCopiedPath(pathText);
    setTimeout(() => setCopiedPath(null), 2000);
  };

  const handleRescanSingle = async (lib: CourseLibraryConfig) => {
    setRescanningId(lib.id);
    try {
      const res = await fetch(`/api/libraries/${encodeURIComponent(lib.id)}/rescan`, {
        method: 'POST',
      });
      const data = await res.json();
      if (res.ok) {
        showToast(`Rescanned "${lib.name}": found ${data.library.courseCount} courses.`);
        await fetchLibraries();
        onCatalogUpdated?.();
      } else {
        alert(data.error || 'Failed to rescan library');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setRescanningId(null);
    }
  };

  const handleRescanAll = async () => {
    setIsRescanningAll(true);
    try {
      const res = await fetch('/api/libraries/rescan-all', {
        method: 'POST',
      });
      const data = await res.json();
      if (res.ok) {
        showToast(`Rescanned all libraries: ${data.summary.totalCourses} courses active.`);
        await fetchLibraries();
        onCatalogUpdated?.();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsRescanningAll(false);
    }
  };

  const handleToggleEnable = async (lib: CourseLibraryConfig) => {
    const endpoint = lib.enabled ? 'disable' : 'enable';
    try {
      const res = await fetch(`/api/libraries/${encodeURIComponent(lib.id)}/${endpoint}`, {
        method: 'POST',
      });
      const data = await res.json();
      if (res.ok) {
        showToast(`Library "${lib.name}" ${lib.enabled ? 'disabled' : 'enabled'}.`);
        await fetchLibraries();
        onCatalogUpdated?.();
      } else {
        alert(data.error || 'Failed to toggle library status');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSetDefault = async (lib: CourseLibraryConfig) => {
    try {
      const res = await fetch(`/api/libraries/${encodeURIComponent(lib.id)}/set-default`, {
        method: 'POST',
      });
      const data = await res.json();
      if (res.ok) {
        showToast(`"${lib.name}" is now the primary default library.`);
        await fetchLibraries();
        onCatalogUpdated?.();
      } else {
        alert(data.error || 'Failed to set default');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Filtered libraries list
  const filteredLibraries = libraries.filter((lib) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return lib.name.toLowerCase().includes(q) || lib.path.toLowerCase().includes(q);
  });

  const formatLastScanned = (isoDate: string | null) => {
    if (!isoDate) return 'Never scanned';
    try {
      const date = new Date(isoDate);
      return date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return 'Recently';
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast alert message */}
      {actionSuccessMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center justify-between animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-2.5 text-xs font-semibold">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{actionSuccessMessage}</span>
          </div>
          <button
            onClick={() => setActionSuccessMessage(null)}
            className="text-xs text-emerald-700 hover:text-emerald-900 cursor-pointer font-medium"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Summary Metrics & Primary Controls Bar */}
      <div className="p-6 rounded-2xl bg-gradient-to-br from-white to-[#F2F8FD] border border-[rgba(80,140,190,0.18)] shadow-[0_8px_30px_rgba(24,50,74,0.06)] backdrop-blur-md">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-5 border-b border-[rgba(80,140,190,0.14)]">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold tracking-wider uppercase text-[#2867A8] bg-[#DCEEFF] px-2.5 py-0.5 rounded-full border border-[#BFDFFF]">
                Multi-Folder Storage
              </span>
              <span className="text-xs text-[#6B8195] font-medium">Local Video Catalog</span>
            </div>
            <h2 className="text-xl font-bold text-[#18324A] mt-1">Course Library Manager</h2>
            <p className="text-xs text-[#6B8195] mt-0.5 max-w-xl">
              Connect external SSDs, network paths, or multiple local project folders. All video
              courses are indexed into your central catalog seamlessly.
            </p>
          </div>

          {/* Quick action buttons */}
          <div className="flex items-center gap-2.5 w-full md:w-auto">
            <button
              onClick={handleRescanAll}
              disabled={isRescanningAll}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-white border border-[rgba(80,140,190,0.25)] text-[#18324A] hover:bg-[#F0F7FF] hover:border-[#5B9FE8] shadow-sm transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 text-[#2867A8] ${isRescanningAll ? 'animate-spin' : ''}`}
              />
              <span>{isRescanningAll ? 'Scanning All...' : 'Rescan All'}</span>
            </button>

            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-[#5B9FE8] to-[#2867A8] text-white shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center gap-2"
            >
              <FolderPlus className="w-4 h-4" />
              <span>Add Course Folder</span>
            </button>
          </div>
        </div>

        {/* 4 Stat Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 mt-5">
          <div className="p-3.5 rounded-xl bg-white/80 border border-[rgba(80,140,190,0.12)] shadow-xs">
            <div className="flex items-center justify-between text-[#6B8195] text-[11px] mb-1">
              <span>Libraries Configured</span>
              <HardDrive className="w-3.5 h-3.5 text-[#2867A8]" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-[#18324A]">
                {summary?.totalLibraries ?? libraries.length}
              </span>
              <span className="text-[11px] text-emerald-600 font-semibold">
                {summary?.activeLibraries ?? 0} active
              </span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-white/80 border border-[rgba(80,140,190,0.12)] shadow-xs">
            <div className="flex items-center justify-between text-[#6B8195] text-[11px] mb-1">
              <span>Total Courses</span>
              <BookOpen className="w-3.5 h-3.5 text-[#5B9FE8]" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-[#18324A]">
                {summary?.totalCourses ?? 0}
              </span>
              <span className="text-[11px] text-[#6B8195]">indexed</span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-white/80 border border-[rgba(80,140,190,0.12)] shadow-xs">
            <div className="flex items-center justify-between text-[#6B8195] text-[11px] mb-1">
              <span>Modules / Sections</span>
              <Layers className="w-3.5 h-3.5 text-[#88B8E8]" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-[#18324A]">
                {summary?.totalModules ?? 0}
              </span>
              <span className="text-[11px] text-[#6B8195]">modules</span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-white/80 border border-[rgba(80,140,190,0.12)] shadow-xs">
            <div className="flex items-center justify-between text-[#6B8195] text-[11px] mb-1">
              <span>Total Video Lessons</span>
              <Film className="w-3.5 h-3.5 text-[#2867A8]" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-[#18324A]">
                {summary?.totalLessons ?? 0}
              </span>
              <span className="text-[11px] text-[#6B8195]">playable</span>
            </div>
          </div>
        </div>
      </div>

      {/* Safety Notice Guarantee Banner */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-50/90 to-teal-50/70 border border-emerald-200/80 text-emerald-950 flex items-start gap-3 shadow-xs">
        <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
        <div className="text-xs space-y-0.5">
          <p className="font-bold text-emerald-900">Non-Destructive Storage Protection</p>
          <p className="text-emerald-800/90 text-[11px] leading-relaxed">
            Removing or disabling a course library in this platform only removes its index entry
            from your application configuration. <strong>Your physical video files will NEVER be deleted or modified.</strong>
          </p>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-[#9AAEBD] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search folders by name or path..."
            className="w-full pl-9 pr-4 py-2 bg-white border border-[rgba(80,140,190,0.22)] rounded-xl text-xs text-[#18324A] placeholder:text-[#9AAEBD] focus:outline-none focus:ring-2 focus:ring-[#5B9FE8] transition-all shadow-xs"
          />
        </div>
        <p className="text-xs text-[#6B8195] font-medium hidden sm:block">
          Showing {filteredLibraries.length} of {libraries.length} libraries
        </p>
      </div>

      {/* Libraries List */}
      <div className="space-y-4">
        {filteredLibraries.map((lib) => {
          const isCurrentRescanning = rescanningId === lib.id;
          const isMissing = lib.status === 'missing';

          return (
            <div
              key={lib.id}
              className={`p-5 rounded-2xl bg-white border transition-all duration-200 shadow-[0_4px_20px_rgba(24,50,74,0.04)] ${
                isMissing
                  ? 'border-amber-300 bg-amber-50/20'
                  : !lib.enabled
                  ? 'border-slate-200 opacity-75 bg-slate-50/30'
                  : 'border-[rgba(80,140,190,0.2)] hover:border-[rgba(80,140,190,0.4)]'
              }`}
            >
              {/* Card Header */}
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 pb-4 border-b border-[rgba(80,140,190,0.1)]">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-xs border ${
                      isMissing
                        ? 'bg-amber-100 text-amber-700 border-amber-300'
                        : !lib.enabled
                        ? 'bg-slate-100 text-slate-500 border-slate-200'
                        : 'bg-[#DCEEFF] text-[#2867A8] border-[#BFDFFF]'
                    }`}
                  >
                    <Folder className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base font-bold text-[#18324A]">{lib.name}</h3>
                      {lib.isDefault && (
                        <span className="inline-flex items-center gap-1 text-[10px] px-2.5 py-0.5 bg-[#DCEEFF] text-[#2867A8] font-bold rounded-full border border-[#BFDFFF]">
                          <Star className="w-3 h-3 fill-current" />
                          Default Library
                        </span>
                      )}
                      {lib.enabled ? (
                        <span className="inline-flex items-center gap-1 text-[10px] px-2.5 py-0.5 bg-emerald-50 text-emerald-700 font-semibold rounded-full border border-emerald-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] px-2.5 py-0.5 bg-slate-100 text-slate-600 font-medium rounded-full border border-slate-200">
                          Disabled
                        </span>
                      )}
                      {isMissing && (
                        <span className="inline-flex items-center gap-1 text-[10px] px-2.5 py-0.5 bg-amber-100 text-amber-800 font-bold rounded-full border border-amber-300">
                          <AlertTriangle className="w-3 h-3" />
                          Path Inaccessible
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex items-center gap-1.5 px-2 py-0.5 bg-[#F8FBFF] border border-[rgba(80,140,190,0.18)] rounded-md font-mono text-[11px] text-[#4A6B88]">
                        <HardDrive className="w-3 h-3 text-[#9AAEBD] shrink-0" />
                        <span className="truncate max-w-xs md:max-w-md">{lib.path}</span>
                      </div>
                      <button
                        onClick={() => handleCopyPath(lib.path)}
                        title="Copy folder path"
                        className="p-1 rounded text-[#6B8195] hover:text-[#18324A] hover:bg-[#DCEEFF]/50 transition-colors cursor-pointer"
                      >
                        {copiedPath === lib.path ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Status indicator button */}
                <div className="flex items-center gap-2 self-end md:self-auto">
                  <button
                    onClick={() => handleToggleEnable(lib)}
                    title={lib.enabled ? 'Disable library' : 'Enable library'}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 border ${
                      lib.enabled
                        ? 'bg-white border-emerald-200 text-emerald-700 hover:bg-emerald-50'
                        : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <Power className="w-3 h-3" />
                    <span>{lib.enabled ? 'Enabled' : 'Disabled'}</span>
                  </button>
                </div>
              </div>

              {/* Missing warning prompt if path not found */}
              {isMissing && (
                <div className="my-3 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold">Folder path not found on disk</p>
                      <p className="text-[11px] text-amber-700 mt-0.5">
                        The directory is missing, or the drive may be disconnected. Reconnect the
                        storage or update the folder path.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setLibraryToEdit(lib)}
                    className="px-3 py-1 bg-amber-600 text-white rounded-lg font-semibold text-[11px] hover:bg-amber-700 transition-colors cursor-pointer shrink-0"
                  >
                    Update Path
                  </button>
                </div>
              )}

              {/* Card Body: Stats & Metadata */}
              <div className="pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                {/* Stats chips */}
                <div className="flex items-center gap-5 text-xs text-[#4A6B88]">
                  <div className="flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4 text-[#2867A8]" />
                    <span className="font-bold text-[#18324A]">{lib.courseCount}</span> Courses
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-[#5B9FE8]" />
                    <span className="font-bold text-[#18324A]">{lib.moduleCount}</span> Modules
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Film className="w-4 h-4 text-[#88B8E8]" />
                    <span className="font-bold text-[#18324A]">{lib.lessonCount}</span> Lessons
                  </div>
                  <div className="hidden lg:flex items-center gap-1.5 text-[11px] text-[#6B8195]">
                    <Clock className="w-3.5 h-3.5 text-[#9AAEBD]" />
                    <span>Scanned: {formatLastScanned(lib.lastScanned)}</span>
                  </div>
                </div>

                {/* Action Buttons Toolbar */}
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Rescan button */}
                  <button
                    onClick={() => handleRescanSingle(lib)}
                    disabled={isCurrentRescanning || !lib.enabled}
                    title="Rescan this library folder for new or deleted video files"
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#F0F7FF] text-[#2867A8] hover:bg-[#DCEEFF] transition-colors cursor-pointer flex items-center gap-1.5 border border-[#BFDFFF] disabled:opacity-50"
                  >
                    <FolderSync
                      className={`w-3.5 h-3.5 ${isCurrentRescanning ? 'animate-spin' : ''}`}
                    />
                    <span>{isCurrentRescanning ? 'Scanning...' : 'Rescan'}</span>
                  </button>

                  {/* Edit button */}
                  <button
                    onClick={() => setLibraryToEdit(lib)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white text-[#18324A] hover:bg-[#F8FBFF] hover:text-[#2867A8] transition-colors cursor-pointer flex items-center gap-1.5 border border-[rgba(80,140,190,0.2)]"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-[#6B8195]" />
                    <span>Edit</span>
                  </button>

                  {/* Set default button */}
                  {!lib.isDefault && (
                    <button
                      onClick={() => handleSetDefault(lib)}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white text-[#6B8195] hover:text-[#2867A8] hover:bg-[#F8FBFF] transition-colors cursor-pointer flex items-center gap-1.5 border border-[rgba(80,140,190,0.2)]"
                    >
                      <Star className="w-3.5 h-3.5" />
                      <span>Set Primary</span>
                    </button>
                  )}

                  {/* Remove button */}
                  <button
                    onClick={() => setLibraryToDelete(lib)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer border border-transparent hover:border-rose-200"
                    title="Remove library configuration"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {/* Empty State */}
        {filteredLibraries.length === 0 && !isLoading && (
          <div className="p-12 text-center rounded-2xl bg-white border border-[rgba(80,140,190,0.18)]">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-[#DCEEFF] text-[#2867A8] flex items-center justify-center mb-3">
              <FolderPlus className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-[#18324A]">No Course Libraries Found</h3>
            <p className="text-xs text-[#6B8195] mt-1 max-w-sm mx-auto">
              {searchQuery
                ? `No library matched "${searchQuery}". Try clearing your search filter.`
                : 'You have not added any course folders yet. Add a local folder to start scanning videos.'}
            </p>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="mt-4 px-5 py-2.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-[#5B9FE8] to-[#2867A8] text-white shadow-md hover:shadow-lg transition-all cursor-pointer inline-flex items-center gap-2"
            >
              <FolderPlus className="w-4 h-4" />
              <span>Add Your First Course Folder</span>
            </button>
          </div>
        )}
      </div>

      {/* Add / Edit Library Modal */}
      <AddEditLibraryModal
        isOpen={isAddModalOpen || Boolean(libraryToEdit)}
        onClose={() => {
          setIsAddModalOpen(false);
          setLibraryToEdit(null);
        }}
        libraryToEdit={libraryToEdit}
        onSaved={() => {
          fetchLibraries();
          onCatalogUpdated?.();
          showToast(
            libraryToEdit
              ? `Library "${libraryToEdit.name}" updated.`
              : 'New course library added and scanned!'
          );
        }}
      />

      {/* Delete Library Modal */}
      <DeleteLibraryModal
        isOpen={Boolean(libraryToDelete)}
        onClose={() => setLibraryToDelete(null)}
        library={libraryToDelete}
        onDeleted={() => {
          fetchLibraries();
          onCatalogUpdated?.();
          showToast('Library configuration removed. Video files remain safe on disk.');
        }}
      />
    </div>
  );
};
