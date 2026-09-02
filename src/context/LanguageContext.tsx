import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'id' | 'en';

export interface UserProfile {
  name: string;
  role: string;
  email: string;
  initials: string;
}

const DEFAULT_PROFILE: UserProfile = {
  name: 'Farrel Berwyn',
  role: 'Student',
  email: 'farrel.berwyn@learning.local',
  initials: 'FB',
};

export const translations = {
  id: {
    // Navigation
    nav: {
      home: 'Beranda',
      courses: 'Course',
      categories: 'Kategori',
      myLearning: 'Pembelajaran Saya',
      libraries: 'Pustaka Course',
      search: 'Cari',
      searchPlaceholder: 'Cari materi course...',
      account: 'Akun',
      rescanTitle: 'Pindai Ulang Course',
      lessonsDone: 'Pelajaran Selesai',
      coursesInLibrary: 'Course di Library',
      accountSettings: 'Pengaturan Akun',
      courseLibraries: 'Manajer Library Course',
      learningDashboard: 'Dashboard Pembelajaran',
      rescanCourses: 'Pindai Ulang Course',
      close: 'Tutup',
      clear: 'Hapus',
      newBadge: 'Baru',
      proMember: 'Student Pro',
    },
    // Dashboard (Home)
    dashboard: {
      welcomeBadge: 'Student Learning Hub',
      welcomeTitle: 'Selamat Datang Kembali',
      welcomeSubtitle: 'Lanjutkan petualangan belajarmu hari ini. Jelajahi kurikulum berjenjang, pelajari materi baru, dan pantau progres belajarmu secara realtime.',
      resumeLearning: 'Lanjutkan Belajar',
      exploreCourses: 'Jelajahi Katalog Course',
      activeCourses: 'Kursus Aktif',
      completedLessons: 'Pelajaran Selesai',
      totalStudyHours: 'Total Jam Belajar',
      completionRate: 'Tingkat Kelulusan',
      continueLearningSection: 'Lanjutkan Pembelajaran',
      continueLearningSubtitle: 'Materi video terakhir yang sedang Anda tonton',
      featuredSection: 'Rekomendasi Course Terpilih',
      featuredSubtitle: 'Kurikulum masterclass teratas yang siap meningkatkan keahlian Anda',
      categoriesSection: 'Jelajahi Berdasarkan Kategori',
      categoriesSubtitle: 'Pilih bidang keahlian yang ingin Anda pelajari lebih dalam',
      viewAllCategories: 'Lihat Semua Kategori',
      recentCoursesSection: 'Course Terbaru di Library',
      recentCoursesSubtitle: 'Pembaruan materi dan kurikulum yang baru ditambahkan',
      allCoursesButton: 'Buka Halaman Course',
      noActiveCourse: 'Belum ada course yang sedang berjalan. Mulai belajar sekarang!',
    },
    // Catalog & Home
    catalog: {
      heroBadge: 'Rekomendasi Course Unggulan',
      modules: 'Modul',
      lessons: 'Pelajaran',
      hours: 'Jam',
      startLearning: 'Mulai Belajar',
      resumeLearning: 'Lanjutkan Belajar',
      continueLearning: 'Lanjutkan Pembelajaran',
      continueLearningDesc: 'Lanjutkan materi video terakhir yang sedang Anda pelajari.',
      allCourses: 'Jelajahi Semua Course',
      allCoursesDesc: 'Koleksi kurikulum lengkap dari pustaka course lokal Anda.',
      allCategories: 'Semua Kategori',
      filterAll: 'Semua',
      showing: 'Menampilkan',
      of: 'dari',
      coursesCount: 'course',
      noCoursesFound: 'Tidak ada materi course yang ditemukan',
      noCoursesDesc: 'Coba sesuaikan kata kunci pencarian atau pilih kategori lain.',
      resetFilters: 'Reset Filter',
      loadingTitle: 'Memuat Pustaka Course...',
      loadingDesc: 'Menganalisis direktori video dan metadata kurikulum lokal.',
      rating: 'Rating',
      instructor: 'Instruktur',
      level: 'Tingkat',
      duration: 'Durasi',
      searchResultsFor: 'Hasil Pencarian untuk',
      found: 'Ditemukan',
      clearSearch: 'Bersihkan Pencarian',
      noCoursesMatch: 'Tidak ada course yang sesuai dengan kata kunci',
      viewAllCategories: 'Lihat Semua Kategori',
      featuredCourses: 'Featured Courses',
      featuredCoursesDesc: 'Pilihan course dengan rating dan evaluasi tertinggi dari pustaka Anda',
      popularCourses: 'Popular Courses',
      popularCoursesDesc: 'Course terpopuler dan materi rekomendasi teratas untuk Anda',
      newCourses: 'New Courses',
      newCoursesDesc: 'Penambahan course dan materi terbaru ke dalam library',
    },
    // Course Detail Modal
    courseDetail: {
      instructor: 'Instruktur',
      modules: 'Modul',
      lessons: 'Pelajaran',
      duration: 'Total Durasi',
      curriculum: 'Kurikulum & Daftar Modul',
      completed: 'Selesai',
      startLearning: 'Mulai Belajar',
      resumeLesson: 'Lanjutkan Belajar',
      close: 'Tutup',
      playLesson: 'Putar Pelajaran',
    },
    // Classroom / Lesson Player
    classroom: {
      backToCourse: 'Kembali ke Course',
      markComplete: 'Tandai Selesai',
      completed: 'Selesai',
      previous: 'Sebelumnya',
      nextLesson: 'Pelajaran Selanjutnya',
      courseFinished: 'Selesai & Ringkasan',
      curriculumTab: 'Kurikulum Modul',
      notesTab: 'Catatan Pribadi',
      addNotePlaceholder: 'Tulis catatan materi pada durasi ini...',
      saveNote: 'Simpan Catatan',
      noNotes: 'Belum ada catatan untuk pelajaran ini. Tulis catatan untuk mempermudah ulasan belajar.',
      deleteNote: 'Hapus',
      playingNextNotification: 'Memutar Pelajaran Selanjutnya:',
      courseSummaryBtn: 'Ringkasan Course',
      speed: 'Kecepatan',
      notesCount: 'Catatan',
      lessonOf: 'Pelajaran',
      from: 'dari',
    },
    // Course Completion View
    completion: {
      backToCatalog: 'Kembali ke Katalog',
      appreciationBadge: 'Apresiasi Kelulusan Pembelajaran',
      congratsTitle: 'Selamat! Anda Telah Menyelesaikan Seluruh Materi Course',
      instructor: 'Instruktur',
      category: 'Kategori',
      reviewCourse: 'Tinjau Ulang Materi',
      restartCourse: 'Putar Ulang dari Awal',
      shareAchievement: 'Bagikan Pencapaian',
      copiedClipboard: 'Tersalin ke Clipboard!',
      curriculumDone: 'Kelulusan Materi',
      lessonsDone: 'Pelajaran Selesai',
      modulesDone: 'Modul Dituntaskan',
      totalStudyTime: 'Total Waktu Belajar',
      summaryTitle: 'Ringkasan Modul yang Telah Diselesaikan',
      summarySubtitle: 'Seluruh modul dan video telah terverifikasi selesai secara lengkap',
      completedBadge: 'Selesai',
      exploreMore: 'Ingin menjelajahi materi lainnya?',
      exploreMoreDesc: 'Kembali ke beranda untuk memilih topik baru atau ulangi materi yang ingin diperdalam.',
      backToHome: 'Kembali ke Beranda',
      viewLesson: 'Lihat',
    },
    // My Learning View
    myLearning: {
      badge: 'Dashboard Siswa',
      title: 'Dashboard Pembelajaran Saya',
      subtitle: 'Pantau progres belajar, statistik durasi, dan lanjutkan materi terakhir Anda.',
      lessonsDone: 'Pelajaran Dituntaskan',
      hoursLearned: 'Jam Waktu Belajar',
      activeCourses: 'Course Sedang Dipelajari',
      completionRate: 'Rata-rata Kelulusan',
      inProgressTitle: 'Lanjutkan Pelajaran Anda',
      noCoursesYet: 'Belum Ada Riwayat Pembelajaran Aktif',
      noCoursesYetDesc: 'Pilih dan mulai tonton materi course dari katalog untuk memantau progres belajar Anda di sini.',
      exploreCatalog: 'Jelajahi Katalog Course',
    },
    // Settings View & Tabs
    settings: {
      title: 'Pengaturan',
      backToCourses: 'Kembali ke Course',
      sandboxNotice: 'Pustaka Lokal Sandboxed & Aman',
      tabs: {
        libraries: 'Pustaka Course',
        librariesDesc: 'Kelola folder dan direktori penyimpanan video lokal',
        account: 'Akun Siswa',
        accountDesc: 'Informasi profil dan identitas akun siswa',
        appearance: 'Tampilan & Bahasa',
        appearanceDesc: 'Tema visual dan pilihan bahasa platform pembelajaran',
        playback: 'Pemutar Video',
        playbackDesc: 'Pengaturan pemutaran otomatis dan rasio video',
        notifications: 'Notifikasi',
        notificationsDesc: 'Pengingat belajar dan ringkasan progres mingguan',
      },
      // Language Section
      languageTitle: 'Pilihan Bahasa (Language)',
      languageSubtitle: 'Pilih bahasa tampilan untuk seluruh antarmuka platform pembelajaran.',
      langId: 'Bahasa Indonesia',
      langIdDesc: 'Bahasa Indonesia baku dengan peristilahan teknis dan serapan alami.',
      langEn: 'English (US)',
      langEnDesc: 'Standard international English terminology across all platform views.',
      activeBadge: 'Aktif',
      // Appearance Theme
      themeTitle: 'Tema & Visual Tampilan',
      themeSubtitle: 'Pilihan estetika warna, kontras, dan kenyamanan visual layar.',
      themeMilkBlue: 'Milk Blue Morphism',
      themeMilkBlueDesc: 'Nuansa biru langit lembut dengan kartu frosted glass untuk belajar siang hari.',
      themeDark: 'Midnight Slate',
      themeDarkDesc: 'Palet gelap sapphire-slate yang nyaman untuk ruangan redup dan malam hari.',
      themeSystem: 'Default Sistem',
      themeSystemDesc: 'Menyesuaikan mode gelap atau terang sistem operasi Anda secara otomatis.',
      comingSoon: 'Segera Hadir',
      compactGrid: 'Tampilan Grid Kompak',
      compactGridDesc: 'Mengoptimalkan ruang layar agar memuat lebih banyak kartu course.',
      // Account Settings
      accountInfoTitle: 'Informasi Siswa',
      fullName: 'Nama Lengkap',
      emailAddress: 'Alamat Email',
      headlineBio: 'Peran / Deskripsi Siswa',
      updateProfile: 'Simpan Perubahan Profil',
      profileUpdatedToast: 'Profil siswa berhasil diperbarui!',
      studentRole: 'Student',
      // Libraries Manager
      librariesTitle: 'Manajer Pustaka Course',
      librariesSubtitle: 'Hubungkan folder video lokal di komputer Anda sebagai sumber course.',
      addNewLibrary: 'Tambah Folder Course',
      statusActive: 'Aktif',
      statusMissing: 'Folder Tidak Ditemukan',
      edit: 'Ubah',
      delete: 'Hapus',
      rescanNow: 'Pindai Sekarang',
    },
    // Modals
    modals: {
      folderSettingsTitle: 'Pengaturan Folder Course',
      folderSettingsDesc: 'Tentukan lokasi direktori di mana materi video course Anda disimpan.',
      folderPathLabel: 'Path Folder Video',
      saveAndRescan: 'Simpan & Pindai Ulang',
      cancel: 'Batal',
    },
  },

  en: {
    // Navigation
    nav: {
      home: 'Home',
      courses: 'Courses',
      categories: 'Categories',
      myLearning: 'My Learning',
      libraries: 'Libraries',
      search: 'Search',
      searchPlaceholder: 'Search courses...',
      account: 'Account',
      rescanTitle: 'Rescan Courses',
      lessonsDone: 'Lessons Done',
      coursesInLibrary: 'Courses in Library',
      accountSettings: 'Account Settings',
      courseLibraries: 'Course Libraries',
      learningDashboard: 'My Learning Dashboard',
      rescanCourses: 'Rescan Video Courses',
      close: 'Close',
      clear: 'Clear',
      newBadge: 'New',
      proMember: 'Student Member',
    },
    // Dashboard (Home)
    dashboard: {
      welcomeBadge: 'Student Learning Hub',
      welcomeTitle: 'Welcome Back',
      welcomeSubtitle: 'Continue your learning journey today. Explore structured curriculums, master new skills, and track your study milestones in realtime.',
      resumeLearning: 'Resume Learning',
      exploreCourses: 'Explore Course Catalog',
      activeCourses: 'Active Courses',
      completedLessons: 'Lessons Completed',
      totalStudyHours: 'Total Study Hours',
      completionRate: 'Completion Rate',
      continueLearningSection: 'Continue Learning',
      continueLearningSubtitle: 'Recent video lessons you are currently watching',
      featuredSection: 'Featured Course Highlights',
      featuredSubtitle: 'Top tier masterclasses curated to accelerate your technical skills',
      categoriesSection: 'Explore by Category',
      categoriesSubtitle: 'Select a subject to dive deeper into practical curriculums',
      viewAllCategories: 'View All Categories',
      recentCoursesSection: 'Recently Added to Library',
      recentCoursesSubtitle: 'Latest curriculum folders scanned and synchronized',
      allCoursesButton: 'Open Course Catalog',
      noActiveCourse: 'No active courses in progress yet. Start learning today!',
    },
    // Catalog & Home
    catalog: {
      heroBadge: 'Featured Course Recommendation',
      modules: 'Modules',
      lessons: 'Lessons',
      hours: 'Hours',
      startLearning: 'Start Learning',
      resumeLearning: 'Resume Lesson',
      continueLearning: 'Continue Learning',
      continueLearningDesc: 'Pick up right where you left off in your active courses.',
      allCourses: 'Explore All Courses',
      allCoursesDesc: 'Comprehensive video curriculum scanned from your local libraries.',
      allCategories: 'All Categories',
      filterAll: 'All',
      showing: 'Showing',
      of: 'of',
      coursesCount: 'courses',
      noCoursesFound: 'No courses found',
      noCoursesDesc: 'Try adjusting your search query or selecting a different category.',
      resetFilters: 'Reset Filters',
      loadingTitle: 'Loading Course Catalog...',
      loadingDesc: 'Scanning local directories and parsing video curriculum metadata.',
      rating: 'Rating',
      instructor: 'Instructor',
      level: 'Level',
      duration: 'Duration',
      searchResultsFor: 'Search Results for',
      found: 'Found',
      clearSearch: 'Clear Search',
      noCoursesMatch: 'No courses matched',
      viewAllCategories: 'View All Categories',
      featuredCourses: 'Featured Courses',
      featuredCoursesDesc: 'Top rated courses from your library',
      popularCourses: 'Popular Courses',
      popularCoursesDesc: 'Highly enrolled courses and top student recommendations',
      newCourses: 'New Courses',
      newCoursesDesc: 'Latest additions to the video library catalog',
    },
    // Course Detail Modal
    courseDetail: {
      instructor: 'Instructor',
      modules: 'Modules',
      lessons: 'Lessons',
      duration: 'Total Duration',
      curriculum: 'Curriculum & Learning Modules',
      completed: 'Completed',
      startLearning: 'Start Learning',
      resumeLesson: 'Resume Lesson',
      close: 'Close',
      playLesson: 'Play Lesson',
    },
    // Classroom / Lesson Player
    classroom: {
      backToCourse: 'Back to Course',
      markComplete: 'Mark Complete',
      completed: 'Completed',
      previous: 'Previous',
      nextLesson: 'Next Lesson',
      courseFinished: 'Finish & Summary',
      curriculumTab: 'Course Curriculum',
      notesTab: 'Personal Notes',
      addNotePlaceholder: 'Write a study note at this timestamp...',
      saveNote: 'Save Note',
      noNotes: 'No notes yet for this lesson. Add notes to reinforce your retention.',
      deleteNote: 'Delete',
      playingNextNotification: 'Playing Next Lesson:',
      courseSummaryBtn: 'Course Summary',
      speed: 'Speed',
      notesCount: 'Notes',
      lessonOf: 'Lesson',
      from: 'of',
    },
    // Course Completion View
    completion: {
      backToCatalog: 'Back to Catalog',
      appreciationBadge: 'Learning Completion Appreciation',
      congratsTitle: 'Congratulations! You Have Completed the Entire Course',
      instructor: 'Instructor',
      category: 'Category',
      reviewCourse: 'Review Course',
      restartCourse: 'Restart from Beginning',
      shareAchievement: 'Share Achievement',
      copiedClipboard: 'Copied to Clipboard!',
      curriculumDone: 'Curriculum Completed',
      lessonsDone: 'Lessons Completed',
      modulesDone: 'Modules Completed',
      totalStudyTime: 'Total Study Time',
      summaryTitle: 'Summary of Completed Learning Modules',
      summarySubtitle: 'All modules and video lessons are verified completed',
      completedBadge: 'Completed',
      exploreMore: 'Want to explore more topics?',
      exploreMoreDesc: 'Return to catalog to choose another course or revisit key modules.',
      backToHome: 'Back to Catalog',
      viewLesson: 'View',
    },
    // My Learning View
    myLearning: {
      badge: 'Student Dashboard',
      title: 'My Learning Dashboard',
      subtitle: 'Monitor your study progress, learning time, and resume active lessons.',
      lessonsDone: 'Lessons Completed',
      hoursLearned: 'Hours Learned',
      activeCourses: 'Active Courses',
      completionRate: 'Completion Rate',
      inProgressTitle: 'Resume Your Learning',
      noCoursesYet: 'No active learning history yet',
      noCoursesYetDesc: 'Start watching courses from your catalog to track your progress here.',
      exploreCatalog: 'Explore Course Catalog',
    },
    // Settings View & Tabs
    settings: {
      title: 'Settings',
      backToCourses: 'Back to Courses',
      sandboxNotice: 'Local Filesystem Sandboxed & Safe',
      tabs: {
        libraries: 'Course Libraries',
        librariesDesc: 'Manage local folder paths & storage directories',
        account: 'Student Account',
        accountDesc: 'Profile information and student identity',
        appearance: 'Appearance & Language',
        appearanceDesc: 'Theme aesthetics and application language',
        playback: 'Video Playback',
        playbackDesc: 'Player autoplay settings and playback rules',
        notifications: 'Notifications',
        notificationsDesc: 'Course alerts and weekly learning digests',
      },
      // Language Section
      languageTitle: 'Application Language',
      languageSubtitle: 'Select your preferred interface language across the platform.',
      langId: 'Bahasa Indonesia',
      langIdDesc: 'Indonesian language with natural loanwords and technical terms.',
      langEn: 'English (US)',
      langEnDesc: 'Standard international English terminology across all platform views.',
      activeBadge: 'Active',
      // Appearance Theme
      themeTitle: 'Theme & Visual Styling',
      themeSubtitle: 'Configure visual aesthetics, contrast levels, and display density.',
      themeMilkBlue: 'Milk Blue Morphism',
      themeMilkBlueDesc: 'Soft sky blues and frosted glass cards designed for daytime study.',
      themeDark: 'Midnight Slate',
      themeDarkDesc: 'Deep sapphire-slate tones engineered for late-night viewing.',
      themeSystem: 'System Default',
      themeSystemDesc: 'Matches your operating system theme preferences automatically.',
      comingSoon: 'Coming Soon',
      compactGrid: 'Compact Grid View',
      compactGridDesc: 'Reduces thumbnail padding to fit more course cards simultaneously.',
      // Account Settings
      accountInfoTitle: 'Personal Information',
      fullName: 'Full Name',
      emailAddress: 'Email Address',
      headlineBio: 'Student Headline / Role',
      updateProfile: 'Save Profile Changes',
      profileUpdatedToast: 'Student profile updated successfully!',
      studentRole: 'Student',
      // Libraries Manager
      librariesTitle: 'Course Libraries Manager',
      librariesSubtitle: 'Connect local video directories on your machine as course libraries.',
      addNewLibrary: 'Add Course Folder',
      statusActive: 'Active',
      statusMissing: 'Folder Missing',
      edit: 'Edit',
      delete: 'Delete',
      rescanNow: 'Rescan Now',
    },
    // Modals
    modals: {
      folderSettingsTitle: 'Course Folder Settings',
      folderSettingsDesc: 'Specify the local directory path where your video files are stored.',
      folderPathLabel: 'Video Folder Path',
      saveAndRescan: 'Save & Rescan',
      cancel: 'Cancel',
    },
  },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: typeof translations['id'];
  profile: UserProfile;
  updateProfile: (updated: Partial<UserProfile>) => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem('app_language') as Language;
      return saved === 'en' ? 'en' : 'id';
    } catch {
      return 'id';
    }
  });

  const [profile, setProfileState] = useState<UserProfile>(() => {
    try {
      const saved = localStorage.getItem('user_profile');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.name === 'Albert Einstein' || !parsed.name) {
          return DEFAULT_PROFILE;
        }
        return { ...DEFAULT_PROFILE, ...parsed };
      }
    } catch {}
    return DEFAULT_PROFILE;
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem('app_language', lang);
    } catch {}
  };

  const updateProfile = (updated: Partial<UserProfile>) => {
    setProfileState((prev) => {
      const next = { ...prev, ...updated };
      // derive initials if name updated
      if (updated.name) {
        const parts = updated.name.trim().split(/\s+/);
        next.initials = parts.length > 1
          ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
          : parts[0].slice(0, 2).toUpperCase();
      }
      try {
        localStorage.setItem('user_profile', JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const t = translations[language] || translations.id;

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, profile, updateProfile }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return ctx;
};
