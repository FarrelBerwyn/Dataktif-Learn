import React, { useState } from 'react';
import { Bell, Award, BookCheck, Sparkles, Mail } from 'lucide-react';

export const NotificationSettingsTab: React.FC = () => {
  const [courseCompletionAlerts, setCourseCompletionAlerts] = useState(true);
  const [weeklyDigest, setWeeklyDigest] = useState(true);
  const [newCourseIndexed, setNewCourseIndexed] = useState(true);

  return (
    <div className="space-y-6">
      <div className="p-6 rounded-2xl bg-white border border-[rgba(80,140,190,0.18)] shadow-[0_8px_30px_rgba(24,50,74,0.04)] space-y-4">
        <div>
          <h3 className="text-base font-bold text-[#18324A]">Notification Preferences</h3>
          <p className="text-xs text-[#6B8195] mt-0.5">
            Choose what alerts and learning updates you would like to receive.
          </p>
        </div>

        <div className="space-y-3.5 text-xs">
          {/* New Courses Indexed Alert */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#F8FBFF] border border-[rgba(80,140,190,0.14)]">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#DCEEFF] text-[#2867A8] flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <span className="font-semibold text-[#18324A]">New Courses Discovered</span>
                <p className="text-[11px] text-[#6B8195]">
                  Notify when a background scan detects newly added video folders or modules.
                </p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={newCourseIndexed}
                onChange={(e) => setNewCourseIndexed(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-10 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#2867A8]"></div>
            </label>
          </div>

          {/* Completion Celebration */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#F8FBFF] border border-[rgba(80,140,190,0.14)]">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#DCEEFF] text-[#2867A8] flex items-center justify-center shrink-0">
                <Award className="w-4 h-4" />
              </div>
              <div>
                <span className="font-semibold text-[#18324A]">Milestone Celebrations</span>
                <p className="text-[11px] text-[#6B8195]">
                  Display achievement banners upon 100% completion of any course.
                </p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={courseCompletionAlerts}
                onChange={(e) => setCourseCompletionAlerts(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-10 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#2867A8]"></div>
            </label>
          </div>

          {/* Weekly Summary */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#F8FBFF] border border-[rgba(80,140,190,0.14)]">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#DCEEFF] text-[#2867A8] flex items-center justify-center shrink-0">
                <Mail className="w-4 h-4" />
              </div>
              <div>
                <span className="font-semibold text-[#18324A]">Weekly Study Digest</span>
                <p className="text-[11px] text-[#6B8195]">
                  Summary of your minutes watched and topics mastered each week.
                </p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={weeklyDigest}
                onChange={(e) => setWeeklyDigest(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-10 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#2867A8]"></div>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};
