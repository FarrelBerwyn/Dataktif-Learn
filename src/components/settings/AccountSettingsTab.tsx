import React, { useState } from 'react';
import { User, Mail, Award, CheckCircle2 } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export const AccountSettingsTab: React.FC = () => {
  const { t, profile, updateProfile } = useLanguage();
  const [name, setName] = useState(profile.name);
  const [email, setEmail] = useState(profile.email);
  const [role, setRole] = useState(profile.role);
  const [isSaved, setIsSaved] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({
      name: name.trim() || 'Farrel Berwyn',
      email: email.trim() || 'farrel.berwyn@learning.local',
      role: role.trim() || 'Student',
    });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Profile Overview Card */}
      <div className="p-6 rounded-2xl bg-white border border-[rgba(80,140,190,0.18)] shadow-[0_8px_30px_rgba(24,50,74,0.04)]">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#2867A8] to-[#5B9FE8] text-white flex items-center justify-center font-bold text-xl shadow-md border-2 border-white">
            {profile.initials}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-[#18324A]">{profile.name}</h3>
              <span className="text-[10px] px-2 py-0.5 bg-[#DCEEFF] text-[#2867A8] font-bold rounded-full border border-[#BFDFFF]">
                {profile.role}
              </span>
            </div>
            <p className="text-xs text-[#6B8195] mt-0.5">{profile.email}</p>
            <p className="text-[11px] text-[#4A6B88] mt-1 flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-[#5B9FE8]" />
              <span>{profile.role}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Account Details Form */}
      <form
        onSubmit={handleSubmit}
        className="p-6 rounded-2xl bg-white border border-[rgba(80,140,190,0.18)] shadow-[0_8px_30px_rgba(24,50,74,0.04)] space-y-4 text-xs"
      >
        <div className="flex items-center justify-between pb-3 border-b border-[rgba(80,140,190,0.1)]">
          <h4 className="text-sm font-bold text-[#18324A]">
            {t.settings.accountInfoTitle}
          </h4>
          {isSaved && (
            <span className="flex items-center gap-1.5 text-xs text-emerald-600 font-semibold animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>{t.settings.profileUpdatedToast}</span>
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block font-semibold text-[#18324A] mb-1.5">
              {t.settings.fullName}
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Farrel Berwyn"
              className="w-full px-3.5 py-2.5 bg-[#F8FBFF] border border-[rgba(80,140,190,0.2)] rounded-xl text-xs text-[#18324A] focus:outline-none focus:ring-2 focus:ring-[#5B9FE8]"
            />
          </div>
          <div>
            <label className="block font-semibold text-[#18324A] mb-1.5">
              {t.settings.emailAddress}
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="farrel.berwyn@learning.local"
              className="w-full px-3.5 py-2.5 bg-[#F8FBFF] border border-[rgba(80,140,190,0.2)] rounded-xl text-xs text-[#18324A] focus:outline-none focus:ring-2 focus:ring-[#5B9FE8]"
            />
          </div>
        </div>

        <div>
          <label className="block font-semibold text-[#18324A] mb-1.5">
            {t.settings.headlineBio}
          </label>
          <input
            type="text"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            placeholder="Student"
            className="w-full px-3.5 py-2.5 bg-[#F8FBFF] border border-[rgba(80,140,190,0.2)] rounded-xl text-xs text-[#18324A] focus:outline-none focus:ring-2 focus:ring-[#5B9FE8]"
          />
        </div>

        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            className="px-5 py-2 rounded-xl text-xs font-semibold bg-[#2867A8] hover:bg-[#1f5286] text-white transition-colors cursor-pointer shadow-sm"
          >
            {t.settings.updateProfile}
          </button>
        </div>
      </form>
    </div>
  );
};
