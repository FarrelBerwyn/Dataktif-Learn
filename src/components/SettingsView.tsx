import React, { useState } from 'react';
import {
  User,
  Palette,
  PlayCircle,
  Bell,
  HardDrive,
  ArrowLeft,
  ChevronRight,
  Shield,
  FolderTree,
} from 'lucide-react';
import { AccountSettingsTab } from './settings/AccountSettingsTab';
import { AppearanceSettingsTab } from './settings/AppearanceSettingsTab';
import { PlaybackSettingsTab } from './settings/PlaybackSettingsTab';
import { NotificationSettingsTab } from './settings/NotificationSettingsTab';
import { CourseLibrariesManager } from './settings/CourseLibrariesManager';
import { useLanguage } from '../context/LanguageContext';

export type SettingsSubTab = 'account' | 'appearance' | 'playback' | 'notifications' | 'libraries';

interface SettingsViewProps {
  initialTab?: SettingsSubTab;
  onBack: () => void;
  onCatalogUpdated?: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  initialTab = 'libraries',
  onBack,
  onCatalogUpdated,
}) => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<SettingsSubTab>(initialTab);

  const tabs: {
    id: SettingsSubTab;
    label: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string;
  }[] = [
    {
      id: 'libraries',
      label: t.settings.tabs.libraries,
      description: t.settings.tabs.librariesDesc,
      icon: HardDrive,
      badge: 'Manager',
    },
    {
      id: 'account',
      label: t.settings.tabs.account,
      description: t.settings.tabs.accountDesc,
      icon: User,
    },
    {
      id: 'appearance',
      label: t.settings.tabs.appearance,
      description: t.settings.tabs.appearanceDesc,
      icon: Palette,
    },
    {
      id: 'playback',
      label: t.settings.tabs.playback,
      description: t.settings.tabs.playbackDesc,
      icon: PlayCircle,
    },
    {
      id: 'notifications',
      label: t.settings.tabs.notifications,
      description: t.settings.tabs.notificationsDesc,
      icon: Bell,
    },
  ];

  const currentTabObj = tabs.find((t) => t.id === activeTab) || tabs[0];

  return (
    <div className="min-h-screen bg-[#F0F5FA] text-[#18324A] pb-16">
      {/* Top Breadcrumbs & Back Navigation */}
      <div className="bg-white/80 backdrop-blur-md border-b border-[rgba(80,140,190,0.18)] sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="p-2 rounded-xl text-[#4A6B88] hover:text-[#18324A] hover:bg-[#F0F7FF] transition-all cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{t.settings.backToCourses}</span>
            </button>
            <div className="h-4 w-px bg-[rgba(80,140,190,0.25)]" />
            <div className="flex items-center gap-1.5 text-xs text-[#6B8195]">
              <span className="font-semibold text-[#18324A]">{t.settings.title}</span>
              <ChevronRight className="w-3.5 h-3.5" />
              <span className="text-[#2867A8] font-bold">{currentTabObj.label}</span>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-xs text-[#6B8195]">
            <Shield className="w-3.5 h-3.5 text-emerald-600" />
            <span>{t.settings.sandboxNotice}</span>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          {/* Settings Sidebar Navigation */}
          <div className="md:col-span-4 lg:col-span-3 space-y-2">
            <div className="p-2 rounded-2xl bg-white/70 backdrop-blur-md border border-[rgba(80,140,190,0.18)] shadow-[0_4px_20px_rgba(24,50,74,0.03)]">
              <div className="px-3 py-2.5 mb-1">
                <h2 className="text-xs font-bold uppercase tracking-wider text-[#6B8195]">
                  Platform Settings
                </h2>
              </div>

              <div className="space-y-1">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;

                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full p-3 rounded-xl text-left transition-all cursor-pointer flex items-start justify-between gap-2.5 ${
                        isActive
                          ? 'bg-gradient-to-r from-[#DCEEFF] to-[#EDF6FF] text-[#18324A] shadow-xs border border-[#BFDFFF]'
                          : 'text-[#4A6B88] hover:bg-[#F8FBFF] hover:text-[#18324A]'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                            isActive
                              ? 'bg-[#2867A8] text-white shadow-xs'
                              : 'bg-[#F0F7FF] text-[#2867A8]'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold">{tab.label}</span>
                            {tab.badge && (
                              <span
                                className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold uppercase ${
                                  isActive
                                    ? 'bg-[#2867A8] text-white'
                                    : 'bg-[#DCEEFF] text-[#2867A8]'
                                }`}
                              >
                                {tab.badge}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-[#6B8195] line-clamp-1">
                            {tab.description}
                          </p>
                        </div>
                      </div>
                      <ChevronRight
                        className={`w-4 h-4 shrink-0 mt-1 transition-transform ${
                          isActive ? 'text-[#2867A8] translate-x-0.5' : 'text-slate-300'
                        }`}
                      />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quick Folder Info Widget in Sidebar */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-white to-[#F2F8FD] border border-[rgba(80,140,190,0.18)] shadow-xs space-y-2 text-xs">
              <div className="flex items-center gap-2 text-[#2867A8] font-bold">
                <FolderTree className="w-4 h-4" />
                <span>Multi-Folder Scanning</span>
              </div>
              <p className="text-[11px] text-[#6B8195] leading-relaxed">
                Connect courses from any local directory or attached drive without moving files.
              </p>
            </div>
          </div>

          {/* Settings Content Area */}
          <div className="md:col-span-8 lg:col-span-9">
            {activeTab === 'libraries' && (
              <CourseLibrariesManager onCatalogUpdated={onCatalogUpdated} />
            )}
            {activeTab === 'account' && <AccountSettingsTab />}
            {activeTab === 'appearance' && <AppearanceSettingsTab />}
            {activeTab === 'playback' && <PlaybackSettingsTab />}
            {activeTab === 'notifications' && <NotificationSettingsTab />}
          </div>
        </div>
      </div>
    </div>
  );
};
