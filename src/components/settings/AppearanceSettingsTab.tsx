import React, { useState } from 'react';
import { Palette, Sun, Moon, Monitor, Globe, CheckCircle2 } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export const AppearanceSettingsTab: React.FC = () => {
  const { t, language, setLanguage } = useLanguage();
  const [activeTheme, setActiveTheme] = useState<'milk-blue' | 'dark' | 'system'>('milk-blue');
  const [compactMode, setCompactMode] = useState(false);

  return (
    <div className="space-y-6">
      {/* Language Switcher Section */}
      <div className="p-6 rounded-2xl bg-white border border-[rgba(80,140,190,0.18)] shadow-[0_8px_30px_rgba(24,50,74,0.04)] space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-[#DCEEFF] text-[#2867A8]">
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#18324A]">{t.settings.languageTitle}</h3>
            <p className="text-xs text-[#6B8195] mt-0.5">
              {t.settings.languageSubtitle}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
          {/* Bahasa Indonesia */}
          <div
            onClick={() => setLanguage('id')}
            className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
              language === 'id'
                ? 'border-[#2867A8] bg-[#F2F8FD] shadow-xs'
                : 'border-[rgba(80,140,190,0.2)] bg-white hover:border-[#88B8E8]'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-xl">🇮🇩</span>
                <span className="font-bold text-xs text-[#18324A]">{t.settings.langId}</span>
              </div>
              {language === 'id' && (
                <span className="flex items-center gap-1 text-[10px] font-bold text-[#2867A8] bg-[#DCEEFF] px-2 py-0.5 rounded-full border border-[#BFDFFF]">
                  <CheckCircle2 className="w-3 h-3 text-[#2867A8]" />
                  <span>{t.settings.activeBadge}</span>
                </span>
              )}
            </div>
            <p className="text-[11px] text-[#6B8195] leading-relaxed">
              {t.settings.langIdDesc}
            </p>
          </div>

          {/* English */}
          <div
            onClick={() => setLanguage('en')}
            className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
              language === 'en'
                ? 'border-[#2867A8] bg-[#F2F8FD] shadow-xs'
                : 'border-[rgba(80,140,190,0.2)] bg-white hover:border-[#88B8E8]'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-xl">🇬🇧</span>
                <span className="font-bold text-xs text-[#18324A]">{t.settings.langEn}</span>
              </div>
              {language === 'en' && (
                <span className="flex items-center gap-1 text-[10px] font-bold text-[#2867A8] bg-[#DCEEFF] px-2 py-0.5 rounded-full border border-[#BFDFFF]">
                  <CheckCircle2 className="w-3 h-3 text-[#2867A8]" />
                  <span>{t.settings.activeBadge}</span>
                </span>
              )}
            </div>
            <p className="text-[11px] text-[#6B8195] leading-relaxed">
              {t.settings.langEnDesc}
            </p>
          </div>
        </div>
      </div>

      {/* Theme Styling Section */}
      <div className="p-6 rounded-2xl bg-white border border-[rgba(80,140,190,0.18)] shadow-[0_8px_30px_rgba(24,50,74,0.04)] space-y-4">
        <div>
          <h3 className="text-base font-bold text-[#18324A]">{t.settings.themeTitle}</h3>
          <p className="text-xs text-[#6B8195] mt-0.5">
            {t.settings.themeSubtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-2">
          {/* Milk Blue Morphism Light */}
          <div
            onClick={() => setActiveTheme('milk-blue')}
            className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
              activeTheme === 'milk-blue'
                ? 'border-[#2867A8] bg-[#F2F8FD]'
                : 'border-[rgba(80,140,190,0.2)] bg-white hover:border-[#88B8E8]'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <Sun className="w-5 h-5 text-[#2867A8]" />
              {activeTheme === 'milk-blue' && (
                <span className="text-[10px] font-bold text-[#2867A8] bg-[#DCEEFF] px-2 py-0.5 rounded-full">
                  {t.settings.activeBadge}
                </span>
              )}
            </div>
            <p className="font-bold text-xs text-[#18324A]">{t.settings.themeMilkBlue}</p>
            <p className="text-[11px] text-[#6B8195] mt-1 leading-relaxed">
              {t.settings.themeMilkBlueDesc}
            </p>
          </div>

          {/* Dark Cyan */}
          <div
            onClick={() => setActiveTheme('dark')}
            className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
              activeTheme === 'dark'
                ? 'border-[#2867A8] bg-[#F2F8FD]'
                : 'border-[rgba(80,140,190,0.2)] bg-white hover:border-[#88B8E8]'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <Moon className="w-5 h-5 text-slate-700" />
              <span className="text-[10px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                {t.settings.comingSoon}
              </span>
            </div>
            <p className="font-bold text-xs text-[#18324A]">{t.settings.themeDark}</p>
            <p className="text-[11px] text-[#6B8195] mt-1 leading-relaxed">
              {t.settings.themeDarkDesc}
            </p>
          </div>

          {/* System */}
          <div
            onClick={() => setActiveTheme('system')}
            className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
              activeTheme === 'system'
                ? 'border-[#2867A8] bg-[#F2F8FD]'
                : 'border-[rgba(80,140,190,0.2)] bg-white hover:border-[#88B8E8]'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <Monitor className="w-5 h-5 text-slate-700" />
            </div>
            <p className="font-bold text-xs text-[#18324A]">{t.settings.themeSystem}</p>
            <p className="text-[11px] text-[#6B8195] mt-1 leading-relaxed">
              {t.settings.themeSystemDesc}
            </p>
          </div>
        </div>

        {/* Compact Mode Toggle */}
        <div className="pt-4 border-t border-[rgba(80,140,190,0.12)] flex items-center justify-between">
          <div>
            <span className="font-semibold text-xs text-[#18324A]">{t.settings.compactGrid}</span>
            <p className="text-[11px] text-[#6B8195]">
              {t.settings.compactGridDesc}
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={compactMode}
              onChange={(e) => setCompactMode(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-10 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#2867A8]"></div>
          </label>
        </div>
      </div>
    </div>
  );
};
