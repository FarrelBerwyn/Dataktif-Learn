import React, { useState } from 'react';
import { PlayCircle, Volume2, FastForward, SkipForward, Keyboard, Info } from 'lucide-react';

export const PlaybackSettingsTab: React.FC = () => {
  const [autoPlayNext, setAutoPlayNext] = useState(true);
  const [resumePlayback, setResumePlayback] = useState(true);
  const [defaultSpeed, setDefaultSpeed] = useState('1.0');
  const [defaultVolume, setDefaultVolume] = useState(80);

  return (
    <div className="space-y-6">
      <div className="p-6 rounded-2xl bg-white border border-[rgba(80,140,190,0.18)] shadow-[0_8px_30px_rgba(24,50,74,0.04)] space-y-5">
        <div>
          <h3 className="text-base font-bold text-[#18324A]">Player & Video Experience</h3>
          <p className="text-xs text-[#6B8195] mt-0.5">
            Configure how lesson videos behave, autoplay rules, and default playback rate.
          </p>
        </div>

        <div className="space-y-4 text-xs">
          {/* Autoplay Next Lesson */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#F8FBFF] border border-[rgba(80,140,190,0.14)]">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#DCEEFF] text-[#2867A8] flex items-center justify-center shrink-0">
                <SkipForward className="w-4 h-4" />
              </div>
              <div>
                <span className="font-semibold text-[#18324A]">Auto-advance to Next Lesson</span>
                <p className="text-[11px] text-[#6B8195]">
                  Automatically starts the next lesson when the current video reaches its end.
                </p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={autoPlayNext}
                onChange={(e) => setAutoPlayNext(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-10 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#2867A8]"></div>
            </label>
          </div>

          {/* Resume Where Left Off */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#F8FBFF] border border-[rgba(80,140,190,0.14)]">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#DCEEFF] text-[#2867A8] flex items-center justify-center shrink-0">
                <PlayCircle className="w-4 h-4" />
              </div>
              <div>
                <span className="font-semibold text-[#18324A]">Resume Exact Timestamp</span>
                <p className="text-[11px] text-[#6B8195]">
                  Restores your exact playback position upon returning to an unfinished video.
                </p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={resumePlayback}
                onChange={(e) => setResumePlayback(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-10 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#2867A8]"></div>
            </label>
          </div>

          {/* Default Playback Speed */}
          <div className="p-3.5 rounded-xl bg-[#F8FBFF] border border-[rgba(80,140,190,0.14)] space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#DCEEFF] text-[#2867A8] flex items-center justify-center shrink-0">
                  <FastForward className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-semibold text-[#18324A]">Default Playback Speed</span>
                  <p className="text-[11px] text-[#6B8195]">
                    Initial speed when opening new video lessons.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                {['0.75', '1.0', '1.25', '1.5', '2.0'].map((speed) => (
                  <button
                    key={speed}
                    type="button"
                    onClick={() => setDefaultSpeed(speed)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                      defaultSpeed === speed
                        ? 'bg-[#2867A8] text-white'
                        : 'bg-white text-[#4A6B88] border border-[rgba(80,140,190,0.2)] hover:bg-[#F0F7FF]'
                    }`}
                  >
                    {speed}x
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Keyboard shortcuts helper */}
      <div className="p-6 rounded-2xl bg-white border border-[rgba(80,140,190,0.18)] shadow-[0_8px_30px_rgba(24,50,74,0.04)] space-y-3">
        <div className="flex items-center gap-2 text-sm font-bold text-[#18324A]">
          <Keyboard className="w-4 h-4 text-[#2867A8]" />
          <span>Player Keyboard Shortcuts</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-2.5 rounded-xl bg-[#F8FBFF] border border-[rgba(80,140,190,0.14)]">
            <kbd className="px-2 py-1 bg-white border rounded shadow-xs font-mono font-bold text-[#18324A]">
              Space
            </kbd>
            <p className="text-[11px] text-[#6B8195] mt-1.5">Play / Pause</p>
          </div>
          <div className="p-2.5 rounded-xl bg-[#F8FBFF] border border-[rgba(80,140,190,0.14)]">
            <kbd className="px-2 py-1 bg-white border rounded shadow-xs font-mono font-bold text-[#18324A]">
              F
            </kbd>
            <p className="text-[11px] text-[#6B8195] mt-1.5">Full Screen</p>
          </div>
          <div className="p-2.5 rounded-xl bg-[#F8FBFF] border border-[rgba(80,140,190,0.14)]">
            <kbd className="px-2 py-1 bg-white border rounded shadow-xs font-mono font-bold text-[#18324A]">
              ← / →
            </kbd>
            <p className="text-[11px] text-[#6B8195] mt-1.5">Seek 5 seconds</p>
          </div>
          <div className="p-2.5 rounded-xl bg-[#F8FBFF] border border-[rgba(80,140,190,0.14)]">
            <kbd className="px-2 py-1 bg-white border rounded shadow-xs font-mono font-bold text-[#18324A]">
              M
            </kbd>
            <p className="text-[11px] text-[#6B8195] mt-1.5">Mute / Unmute</p>
          </div>
        </div>
      </div>
    </div>
  );
};
