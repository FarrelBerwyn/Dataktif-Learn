import React, { useState, useRef, useEffect } from 'react';
import {
  GraduationCap,
  FolderSync,
  Search,
  BookOpen,
  BookmarkCheck,
  FolderOpen,
  Home,
  Grid,
  User,
  CheckCircle2,
  Clock,
  Layers,
  Sparkles,
  Settings,
  Menu,
  X,
  Globe,
  ChevronDown,
} from 'lucide-react';
import { CourseTab } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface NavbarProps {
  activeTab: CourseTab;
  onTabChange: (tab: CourseTab) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onOpenFolderSettings: () => void;
  onRescan: () => void;
  isRescanning: boolean;
  totalCourses: number;
  totalLessons: number;
  completedLessonsCount?: number;
  onScrollToCategories?: () => void;
  categories?: string[];
  selectedCategory?: string;
  onSelectCategory?: (category: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onTabChange,
  searchQuery,
  onSearchChange,
  onOpenFolderSettings,
  onRescan,
  isRescanning,
  totalCourses,
  totalLessons,
  completedLessonsCount = 0,
  onScrollToCategories,
  categories = [],
  selectedCategory,
  onSelectCategory,
}) => {
  const { t, language, setLanguage, profile } = useLanguage();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(false);
  const [isMobileCategoriesOpen, setIsMobileCategoriesOpen] = useState(false);
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const categoriesMenuRef = useRef<HTMLDivElement>(null);

  // Detect scroll to toggle frosted glass navbar
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    handleScroll(); // check on mount
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close dropdowns on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) {
        setIsProfileOpen(false);
      }
      if (categoriesMenuRef.current && !categoriesMenuRef.current.contains(e.target as Node)) {
        setIsCategoriesOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleFocusSearch = () => {
    setIsSearchActive(true);
    if (activeTab !== 'courses' && activeTab !== 'catalog') {
      onTabChange('courses');
    }
    setTimeout(() => {
      searchInputRef.current?.focus();
    }, 50);
  };

  return (
    <header
      className={`fixed left-0 right-0 z-30 transition-all duration-300 ease-in-out ${
        isScrolled
          ? 'top-2 sm:top-4 px-3 sm:px-6'
          : 'top-0 px-0'
      }`}
    >
      <div
        className={`max-w-7xl mx-auto transition-all duration-300 ease-in-out ${
          isScrolled
            ? 'active bg-[rgba(255,255,255,0.82)] backdrop-blur-[16px] backdrop-saturate-[180%] border border-[rgba(226,232,240,0.8)] shadow-[0_4px_20px_-2px_rgba(0,0,0,0.05),0_12px_28px_-6px_rgba(40,103,168,0.08)] rounded-full px-4 sm:px-6 py-2 sm:py-2.5'
            : 'bg-transparent border-transparent shadow-none rounded-none px-4 sm:px-6 lg:px-8 py-3.5'
        }`}
      >
        <div className="flex items-center justify-between h-12 sm:h-13 gap-3">
          {/* Brand Logo & Name */}
          <div
            className="flex items-center gap-2.5 cursor-pointer group shrink-0"
            onClick={() => {
              onTabChange('home');
              onSearchChange('');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#5B9FE8] to-[#2867A8] flex items-center justify-center text-white shadow-[0_4px_12px_rgba(91,159,232,0.35)] group-hover:shadow-[0_6px_18px_rgba(91,159,232,0.5)] transition-all">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-baseline gap-1">
                <span className="font-bold text-lg sm:text-xl tracking-tight text-black">
                  Dataktif
                </span>
                <span className="text-xs sm:text-sm font-bold text-[#2867A8]">
                  Learn
                </span>
              </div>
            </div>
          </div>

          {/* Navigation Links: Home, Courses, Categories Dropdown, My Learning, Libraries */}
          <nav className="hidden md:flex items-center gap-1 sm:gap-1.5">
            {/* Home (Dashboard) */}
            <button
              onClick={() => {
                onTabChange('home');
                onSearchChange('');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                activeTab === 'home' && !searchQuery
                  ? 'bg-[#DCEEFF] text-[#2867A8] shadow-sm'
                  : 'text-[#6B8195] hover:text-[#18324A] hover:bg-[#F0F7FF]'
              }`}
            >
              <Home className="w-4 h-4" />
              <span>{t.nav.home}</span>
            </button>

            {/* Courses Page */}
            <button
              onClick={() => {
                onTabChange('courses');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                (activeTab === 'courses' || activeTab === 'catalog') && !searchQuery
                  ? 'bg-[#DCEEFF] text-[#2867A8] shadow-sm'
                  : 'text-[#6B8195] hover:text-[#18324A] hover:bg-[#F0F7FF]'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>{t.nav.courses}</span>
            </button>

            {/* Categories Dropdown Button */}
            <div className="relative" ref={categoriesMenuRef}>
              <button
                onClick={() => setIsCategoriesOpen((prev) => !prev)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                  isCategoriesOpen
                    ? 'bg-[#DCEEFF] text-[#2867A8] shadow-sm'
                    : 'text-[#6B8195] hover:text-[#18324A] hover:bg-[#F0F7FF]'
                }`}
              >
                <Grid className="w-4 h-4" />
                <span>{t.nav.categories}</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${
                    isCategoriesOpen ? 'rotate-180 text-[#2867A8]' : 'text-[#9AAEBD]'
                  }`}
                />
              </button>

              {/* Dropdown Menu */}
              {isCategoriesOpen && (
                <div className="absolute top-full mt-2 left-0 w-64 rounded-2xl bg-white/95 backdrop-blur-xl border border-[rgba(80,140,190,0.2)] shadow-[0_12px_32px_rgba(24,50,74,0.14)] py-2 z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="px-3.5 py-1.5 mb-1 text-[11px] font-bold uppercase tracking-wider text-[#6B8195] border-b border-[rgba(80,140,190,0.12)] flex items-center justify-between">
                    <span>{t.nav.categories}</span>
                    <span className="text-[10px] bg-[#F0F7FF] text-[#2867A8] px-1.5 py-0.2 rounded-md font-mono">
                      {categories.length}
                    </span>
                  </div>

                  <div className="max-h-64 overflow-y-auto custom-scrollbar px-1.5 space-y-0.5">
                    {/* All option */}
                    <button
                      onClick={() => {
                        if (onSelectCategory) onSelectCategory('All');
                        onTabChange('courses');
                        setIsCategoriesOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-left transition-colors cursor-pointer ${
                        selectedCategory === 'All' || !selectedCategory
                          ? 'bg-[#DCEEFF] text-[#2867A8]'
                          : 'text-[#18324A] hover:bg-[#F0F7FF]'
                      }`}
                    >
                      <span>{t.catalog.allCategories}</span>
                      {(!selectedCategory || selectedCategory === 'All') && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#2867A8]" />
                      )}
                    </button>

                    {/* Individual categories */}
                    {categories
                      .filter((c) => c !== 'All')
                      .map((cat) => {
                        const isCurrent = selectedCategory === cat;
                        return (
                          <button
                            key={cat}
                            onClick={() => {
                              if (onSelectCategory) onSelectCategory(cat);
                              onTabChange('courses');
                              setIsCategoriesOpen(false);
                            }}
                            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-left transition-colors cursor-pointer ${
                              isCurrent
                                ? 'bg-[#DCEEFF] text-[#2867A8] font-bold'
                                : 'text-[#4A647A] hover:bg-[#F0F7FF] hover:text-[#18324A]'
                            }`}
                          >
                            <span className="truncate">{cat}</span>
                            {isCurrent && (
                              <CheckCircle2 className="w-3.5 h-3.5 text-[#2867A8] shrink-0" />
                            )}
                          </button>
                        );
                      })}
                  </div>
                </div>
              )}
            </div>

            {/* My Learning */}
            <button
              onClick={() => onTabChange('my-learning')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                activeTab === 'my-learning'
                  ? 'bg-[#DCEEFF] text-[#2867A8] shadow-sm'
                  : 'text-[#6B8195] hover:text-[#18324A] hover:bg-[#F0F7FF]'
              }`}
            >
              <BookmarkCheck className="w-4 h-4" />
              <span>{t.nav.myLearning}</span>
            </button>

            {/* Course Libraries / Settings */}
            <button
              onClick={() => onTabChange('settings')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                activeTab === 'settings'
                  ? 'bg-[#DCEEFF] text-[#2867A8] shadow-sm'
                  : 'text-[#6B8195] hover:text-[#18324A] hover:bg-[#F0F7FF]'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span className="hidden md:inline">{t.nav.libraries}</span>
              <span className="text-[9px] px-1.5 py-0.2 bg-[#BFDFFF] text-[#18324A] rounded-full font-bold hidden sm:inline">
                {t.nav.newBadge}
              </span>
            </button>

            {/* Smooth Expandable Search Pill Card */}
            <div
              className={`relative flex items-center transition-all duration-300 ease-out overflow-hidden ${
                isSearchExpanded || searchQuery
                  ? 'w-48 sm:w-60 md:w-72 bg-[#EAF3FD] hover:bg-[#E2EEFC] border border-[#BFDFFF] rounded-full shadow-2xs py-1 px-3'
                  : 'w-20 sm:w-22 bg-transparent hover:bg-[#F0F7FF] border border-transparent rounded-xl py-1 px-2.5 cursor-pointer'
              }`}
              onClick={() => {
                if (!isSearchExpanded && !searchQuery) {
                  setIsSearchExpanded(true);
                  if (activeTab !== 'courses' && activeTab !== 'catalog') {
                    onTabChange('courses');
                  }
                  setTimeout(() => searchInputRef.current?.focus(), 120);
                }
              }}
            >
              <Search
                className={`w-4 h-4 shrink-0 transition-colors duration-200 ${
                  isSearchExpanded || searchQuery ? 'text-[#2867A8]' : 'text-[#6B8195]'
                }`}
              />

              {/* Collapsed State: Simple 'Cari' text */}
              {!isSearchExpanded && !searchQuery ? (
                <span className="ml-1.5 text-xs sm:text-sm font-semibold text-[#6B8195] select-none whitespace-nowrap">
                  {t.nav.search}
                </span>
              ) : (
                /* Expanded State: Clean input inside smooth card */
                <div className="flex-1 flex items-center ml-2 min-w-0 animate-in fade-in duration-200">
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                    onBlur={() => {
                      if (!searchQuery) {
                        setIsSearchExpanded(false);
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Escape') {
                        onSearchChange('');
                        setIsSearchExpanded(false);
                      }
                    }}
                    placeholder={t.nav.searchPlaceholder}
                    className="w-full bg-transparent text-xs sm:text-[13px] text-[#18324A] placeholder:text-[#8AA4BD] focus:outline-none"
                    autoFocus
                  />
                  {searchQuery ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSearchChange('');
                        setIsSearchExpanded(false);
                      }}
                      className="p-1 rounded-full hover:bg-black/10 text-[#6B8195] hover:text-[#18324A] transition-colors cursor-pointer shrink-0 ml-1"
                      title={t.nav.clear}
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsSearchExpanded(false);
                      }}
                      className="p-1 rounded-full hover:bg-black/10 text-[#7B95AC] hover:text-[#18324A] transition-colors cursor-pointer shrink-0 ml-1"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              )}
            </div>
          </nav>

          {/* Right Side: Profile / Account & Quick Settings */}
          <div className="flex items-center gap-2 relative" ref={profileMenuRef}>
            {/* Quick Rescan button */}
            <button
              onClick={onRescan}
              disabled={isRescanning}
              title={t.nav.rescanTitle}
              className="p-2 rounded-xl text-[#2867A8] bg-[#F0F7FF] hover:bg-[#DCEEFF] border border-[rgba(91,159,232,0.2)] transition-all cursor-pointer disabled:opacity-50"
            >
              <FolderSync
                className={`w-4 h-4 ${isRescanning ? 'animate-spin text-[#5B9FE8]' : ''}`}
              />
            </button>

            {/* Profile / Account Trigger */}
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center gap-2 p-1 sm:pl-2 sm:pr-2.5 rounded-xl hover:bg-[#F0F7FF] border border-transparent hover:border-[rgba(80,140,190,0.18)] transition-all cursor-pointer"
            >
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#5B9FE8] to-[#BFDFFF] text-[#18324A] font-bold text-xs flex items-center justify-center shadow-sm border border-white">
                {profile.initials}
              </div>
              <span className="text-xs font-semibold text-[#18324A] hidden sm:block">
                {profile.name}
              </span>
            </button>

            {/* Mobile Menu Trigger */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-xl text-[#18324A] hover:bg-[#F0F7FF] transition-colors cursor-pointer"
              aria-label="Toggle mobile menu"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            {/* Profile / Account Dropdown */}
            {isProfileOpen && (
              <div className="absolute right-0 top-12 w-72 bg-white rounded-2xl border border-[rgba(80,140,190,0.2)] shadow-[0_16px_40px_rgba(40,103,168,0.2)] p-4 z-50 animate-in fade-in zoom-in-95 duration-150">
                {/* User Header */}
                <div className="flex items-center gap-3 pb-3 border-b border-[rgba(80,140,190,0.14)]">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#5B9FE8] to-[#2867A8] text-white font-bold text-sm flex items-center justify-center shadow-sm">
                    {profile.initials}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[#18324A]">{profile.name}</h4>
                    <p className="text-[11px] text-[#2867A8] font-semibold flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-[#5B9FE8]" />
                      <span>{profile.role}</span>
                    </p>
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 gap-2 my-3">
                  <div className="p-2.5 rounded-xl bg-[#F8FBFF] border border-[rgba(80,140,190,0.12)] text-center">
                    <p className="text-sm font-bold text-[#18324A]">{completedLessonsCount}</p>
                    <p className="text-[10px] text-[#6B8195]">{t.nav.lessonsDone}</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#F8FBFF] border border-[rgba(80,140,190,0.12)] text-center">
                    <p className="text-sm font-bold text-[#18324A]">{totalCourses}</p>
                    <p className="text-[10px] text-[#6B8195]">{t.nav.coursesInLibrary}</p>
                  </div>
                </div>

                {/* Menu items */}
                <div className="space-y-1">
                  <button
                    onClick={() => {
                      setIsProfileOpen(false);
                      onTabChange('settings');
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-[#18324A] hover:bg-[#F0F7FF] hover:text-[#2867A8] transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <Settings className="w-4 h-4 text-[#2867A8]" />
                      <span>{t.nav.accountSettings}</span>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      setIsProfileOpen(false);
                      onTabChange('settings');
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-[#18324A] hover:bg-[#F0F7FF] hover:text-[#2867A8] transition-colors cursor-pointer"
                  >
                    <FolderOpen className="w-4 h-4 text-[#5B9FE8]" />
                    <span>{t.nav.courseLibraries}</span>
                  </button>

                  <button
                    onClick={() => {
                      setIsProfileOpen(false);
                      onTabChange('my-learning');
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-[#18324A] hover:bg-[#F0F7FF] hover:text-[#2867A8] transition-colors cursor-pointer"
                  >
                    <BookmarkCheck className="w-4 h-4 text-[#5B9FE8]" />
                    <span>{t.nav.learningDashboard}</span>
                  </button>

                  <button
                    onClick={() => {
                      setIsProfileOpen(false);
                      onRescan();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-[#18324A] hover:bg-[#F0F7FF] hover:text-[#2867A8] transition-colors cursor-pointer"
                  >
                    <FolderSync className="w-4 h-4 text-[#5B9FE8]" />
                    <span>{t.nav.rescanCourses}</span>
                  </button>
                </div>

                {/* Quick Language Switcher inside dropdown */}
                <div className="pt-2 mt-2 border-t border-[rgba(80,140,190,0.14)]">
                  <div className="flex items-center justify-between px-2 py-1 text-xs">
                    <span className="flex items-center gap-1.5 text-[11px] font-semibold text-[#4A6B88]">
                      <Globe className="w-3.5 h-3.5 text-[#5B9FE8]" />
                      <span>Language</span>
                    </span>
                    <div className="flex items-center gap-1 bg-[#F0F7FF] p-0.5 rounded-lg border border-[rgba(91,159,232,0.2)]">
                      <button
                        onClick={() => setLanguage('id')}
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                          language === 'id'
                            ? 'bg-[#2867A8] text-white shadow-xs'
                            : 'text-[#6B8195] hover:text-[#18324A]'
                        }`}
                      >
                        ID
                      </button>
                      <button
                        onClick={() => setLanguage('en')}
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                          language === 'en'
                            ? 'bg-[#2867A8] text-white shadow-xs'
                            : 'text-[#6B8195] hover:text-[#18324A]'
                        }`}
                      >
                        EN
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Mobile / Tablet Quick Search Field when activated */}
        {(isSearchActive || searchQuery) && (
          <div className="py-2.5 xl:hidden border-t border-[rgba(80,140,190,0.1)]">
            <div className="relative">
              <Search className="w-4 h-4 text-[#9AAEBD] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search courses..."
                className="w-full pl-9 pr-14 py-2 bg-[#F0F7FF] border border-[rgba(91,159,232,0.25)] rounded-xl text-sm text-[#18324A] placeholder:text-[#9AAEBD] focus:outline-none focus:ring-2 focus:ring-[#5B9FE8] focus:bg-white"
              />
              <button
                onClick={() => {
                  onSearchChange('');
                  setIsSearchActive(false);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-[#6B8195] hover:text-[#18324A]"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Mobile Menu Drawer */}
      {isMobileMenuOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/35 backdrop-blur-sm z-[110]"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div className="fixed top-4 left-4 right-4 max-w-sm ml-auto bg-white/95 backdrop-blur-xl rounded-3xl p-5 shadow-2xl z-[120] border border-[rgba(80,140,190,0.2)] animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-[rgba(80,140,190,0.14)] mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#5B9FE8] to-[#2867A8] flex items-center justify-center text-white">
                  <GraduationCap className="w-4 h-4" />
                </div>
                <span className="font-bold text-base text-[#18324A]">Menu</span>
              </div>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-1.5 rounded-xl hover:bg-[#F0F7FF] text-[#6B8195] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="flex flex-col gap-1.5">
              {/* Home */}
              <button
                onClick={() => {
                  onTabChange('home');
                  onSearchChange('');
                  setIsMobileMenuOpen(false);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-sm font-semibold text-[#18324A] hover:bg-[#F0F7FF] hover:text-[#2867A8] transition-colors text-left cursor-pointer"
              >
                <Home className="w-4 h-4 text-[#2867A8]" />
                <span>{t.nav.home}</span>
              </button>

              {/* Courses */}
              <button
                onClick={() => {
                  onTabChange('courses');
                  setIsMobileMenuOpen(false);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-sm font-semibold text-[#18324A] hover:bg-[#F0F7FF] hover:text-[#2867A8] transition-colors text-left cursor-pointer"
              >
                <BookOpen className="w-4 h-4 text-[#2867A8]" />
                <span>{t.nav.courses}</span>
              </button>

              {/* Categories Accordion in Mobile */}
              <div>
                <button
                  onClick={() => setIsMobileCategoriesOpen((prev) => !prev)}
                  className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-sm font-semibold text-[#18324A] hover:bg-[#F0F7FF] hover:text-[#2867A8] transition-colors text-left cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <Grid className="w-4 h-4 text-[#2867A8]" />
                    <span>{t.nav.categories}</span>
                  </div>
                  <ChevronDown
                    className={`w-4 h-4 transition-transform text-[#6B8195] ${
                      isMobileCategoriesOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {isMobileCategoriesOpen && (
                  <div className="pl-10 pr-3 py-1 space-y-1">
                    <button
                      onClick={() => {
                        if (onSelectCategory) onSelectCategory('All');
                        onTabChange('courses');
                        setIsMobileMenuOpen(false);
                      }}
                      className={`w-full text-left py-1.5 text-xs font-semibold ${
                        !selectedCategory || selectedCategory === 'All'
                          ? 'text-[#2867A8]'
                          : 'text-[#6B8195]'
                      }`}
                    >
                      • {t.catalog.allCategories}
                    </button>
                    {categories
                      .filter((c) => c !== 'All')
                      .map((cat) => (
                        <button
                          key={cat}
                          onClick={() => {
                            if (onSelectCategory) onSelectCategory(cat);
                            onTabChange('courses');
                            setIsMobileMenuOpen(false);
                          }}
                          className={`w-full text-left py-1.5 text-xs ${
                            selectedCategory === cat
                              ? 'text-[#2867A8] font-bold'
                              : 'text-[#6B8195] hover:text-[#18324A]'
                          }`}
                        >
                          • {cat}
                        </button>
                      ))}
                  </div>
                )}
              </div>

              <button
                onClick={() => {
                  onTabChange('my-learning');
                  setIsMobileMenuOpen(false);
                }}
                className="flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-sm font-semibold text-[#18324A] hover:bg-[#F0F7FF] hover:text-[#2867A8] transition-colors text-left cursor-pointer"
              >
                <BookmarkCheck className="w-4 h-4 text-[#2867A8]" />
                <span>{t.nav.myLearning}</span>
              </button>

              <button
                onClick={() => {
                  onTabChange('settings');
                  setIsMobileMenuOpen(false);
                }}
                className="flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-sm font-semibold text-[#18324A] hover:bg-[#F0F7FF] hover:text-[#2867A8] transition-colors text-left cursor-pointer"
              >
                <Settings className="w-4 h-4 text-[#2867A8]" />
                <span>{t.nav.courseLibraries}</span>
              </button>

              {/* Mobile Language Switcher */}
              <div className="pt-2 mt-2 border-t border-[rgba(80,140,190,0.14)] flex items-center justify-between px-3">
                <span className="text-xs font-semibold text-[#6B8195] flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-[#5B9FE8]" />
                  <span>Language</span>
                </span>
                <div className="flex items-center gap-1 bg-[#F0F7FF] p-0.5 rounded-lg border border-[rgba(91,159,232,0.2)]">
                  <button
                    onClick={() => setLanguage('id')}
                    className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                      language === 'id'
                        ? 'bg-[#2867A8] text-white shadow-xs'
                        : 'text-[#6B8195] hover:text-[#18324A]'
                    }`}
                  >
                    ID
                  </button>
                  <button
                    onClick={() => setLanguage('en')}
                    className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                      language === 'en'
                        ? 'bg-[#2867A8] text-white shadow-xs'
                        : 'text-[#6B8195] hover:text-[#18324A]'
                    }`}
                  >
                    EN
                  </button>
                </div>
              </div>
            </nav>
          </div>
        </>
      )}
    </header>
  );
};
