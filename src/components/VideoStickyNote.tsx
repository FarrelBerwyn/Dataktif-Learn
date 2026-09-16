import React, { useState, useEffect, useRef } from 'react';
import { X, Clock } from 'lucide-react';
import { Note } from '../types';
import stickyNotesImg from '../sticky-notes.png';
import pickedStickyNotesImg from '../picked-sticky-notes.png';

interface VideoStickyNoteProps {
  note: Note;
  onClose: () => void;
  onSeek?: (timestamp: number) => void;
  durationSeconds?: number;
  isFullscreen?: boolean;
  position?: { x: number; y: number } | null;
  onPositionChange?: (pos: { x: number; y: number }) => void;
}

export const VideoStickyNote: React.FC<VideoStickyNoteProps> = ({
  note,
  onClose,
  onSeek,
  durationSeconds = 10,
  isFullscreen = false,
  position: propPosition,
  onPositionChange,
}) => {
  const noteRef = useRef<HTMLDivElement | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isPeelingOff, setIsPeelingOff] = useState(false);
  const [internalPosition, setInternalPosition] = useState<{ x: number; y: number } | null>(propPosition || null);
  const activePosition = propPosition !== undefined ? propPosition : internalPosition;
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const dragRef = useRef<{
    startX: number;
    startY: number;
    pointerStartX: number;
    pointerStartY: number;
  }>({
    startX: 0,
    startY: 0,
    pointerStartX: 0,
    pointerStartY: 0,
  });

  // Check if actually in fullscreen via prop or document.fullscreenElement
  const inFullscreen = isFullscreen || Boolean(typeof document !== 'undefined' && document.fullscreenElement);

  const formatTime = (secs: number) => {
    if (isNaN(secs)) return '00:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Reset state when note changes
  useEffect(() => {
    setIsPeelingOff(false);
    setIsDragging(false);
  }, [note.id]);

  // Handle Drag Start
  const handlePointerDown = (clientX: number, clientY: number) => {
    if (isPeelingOff) return;

    const noteElem = noteRef.current;
    const parentElem = noteElem?.parentElement;
    if (!noteElem || !parentElem) return;

    const parentRect = parentElem.getBoundingClientRect();
    const noteRect = noteElem.getBoundingClientRect();

    const startX = activePosition ? activePosition.x : noteRect.left - parentRect.left;
    const startY = activePosition ? activePosition.y : noteRect.top - parentRect.top;

    dragRef.current = {
      startX,
      startY,
      pointerStartX: clientX,
      pointerStartY: clientY,
    };

    setIsDragging(true);
    if (!activePosition) {
      setInternalPosition({ x: startX, y: startY });
      if (onPositionChange) onPositionChange({ x: startX, y: startY });
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // only left click
    e.preventDefault();
    handlePointerDown(e.clientX, e.clientY);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      handlePointerDown(e.touches[0].clientX, e.touches[0].clientY);
    }
  };

  // Global move and release event listeners during dragging
  useEffect(() => {
    if (!isDragging) return;

    const handlePointerMove = (clientX: number, clientY: number) => {
      const noteElem = noteRef.current;
      const parentElem = noteElem?.parentElement;
      if (!noteElem || !parentElem) return;

      const parentRect = parentElem.getBoundingClientRect();
      const noteWidth = noteElem.offsetWidth || 176;
      const noteHeight = noteElem.offsetHeight || 176;

      const deltaX = clientX - dragRef.current.pointerStartX;
      const deltaY = clientY - dragRef.current.pointerStartY;

      let nextX = dragRef.current.startX + deltaX;
      let nextY = dragRef.current.startY + deltaY;

      // Allowed overhang limits: Can be positioned anywhere around the video player,
      // but cannot be dragged completely outside the video perimeter (matches screenshot)
      const maxOverhangX = inFullscreen ? 0 : 82;
      const maxOverhangY = inFullscreen ? 0 : 40;

      const minX = inFullscreen ? 16 : -maxOverhangX;
      const maxX = inFullscreen
        ? parentRect.width - noteWidth - 16
        : parentRect.width - noteWidth + maxOverhangX;

      const minY = inFullscreen ? 16 : -maxOverhangY;
      const maxY = inFullscreen
        ? parentRect.height - noteHeight - 85
        : parentRect.height - noteHeight + maxOverhangY;

      nextX = Math.max(minX, Math.min(nextX, maxX));
      nextY = Math.max(minY, Math.min(nextY, maxY));

      setInternalPosition({ x: nextX, y: nextY });
      if (onPositionChange) onPositionChange({ x: nextX, y: nextY });
    };

    const onMouseMove = (e: MouseEvent) => {
      handlePointerMove(e.clientX, e.clientY);
    };

    const onMouseUp = () => {
      setIsDragging(false);
    };

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        handlePointerMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    };

    const onTouchEnd = () => {
      setIsDragging(false);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', onTouchEnd);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, [isDragging, inFullscreen, onPositionChange]);

  // 10 seconds timer (runs in background without displaying countdown)
  // Paused while hovered or dragging
  useEffect(() => {
    if (isPeelingOff) return;

    let elapsed = 0;
    timerRef.current = setInterval(() => {
      if (!isHovered && !isDragging) {
        elapsed += 0.1;
        if (elapsed >= durationSeconds) {
          clearInterval(timerRef.current!);
          setIsPeelingOff(true);
        }
      }
    }, 100);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isHovered, isDragging, isPeelingOff, durationSeconds]);

  // Peel-off / flutter fall animation before calling onClose
  useEffect(() => {
    if (isPeelingOff) {
      const timeout = setTimeout(() => {
        onClose();
      }, 750);
      return () => clearTimeout(timeout);
    }
  }, [isPeelingOff, onClose]);

  const handleManualClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsPeelingOff(true);
  };

  return (
    <div
      ref={noteRef}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      className={`absolute z-30 select-none ${
        activePosition
          ? ''
          : inFullscreen
          ? 'bottom-24 left-6 sm:left-10'
          : 'bottom-20 sm:bottom-24 -left-[72px] sm:-left-[82px]'
      } ${isPeelingOff ? 'pointer-events-none' : 'pointer-events-auto'} ${
        isDragging ? 'cursor-grabbing' : 'cursor-grab'
      }`}
      style={{
        ...(activePosition ? { left: `${activePosition.x}px`, top: `${activePosition.y}px` } : {}),
        transform: isPeelingOff
          ? 'translateY(90px) rotate(18deg) scale(0.75)'
          : isDragging
          ? 'scale(1.06) rotate(0deg)'
          : isHovered
          ? 'rotate(0deg) scale(1.04)'
          : 'rotate(-2deg)',
        opacity: isPeelingOff ? 0 : 1,
        transition: isPeelingOff
          ? 'transform 750ms cubic-bezier(0.55, 0.085, 0.68, 0.53), opacity 700ms ease-out'
          : isDragging
          ? 'none'
          : 'transform 250ms ease-out, opacity 250ms ease-out',
        transformOrigin: 'top center',
      }}
    >
      {/* Sticky note card */}
      <div
        className={`relative ${
          inFullscreen ? 'w-48 sm:w-56' : 'w-40 sm:w-44'
        } aspect-square filter transition-all duration-150 ${
          isDragging
            ? 'drop-shadow-[0_20px_35px_rgba(0,0,0,0.85)]'
            : isHovered
            ? 'drop-shadow-[0_16px_28px_rgba(0,0,0,0.7)]'
            : 'drop-shadow-[0_12px_24px_rgba(0,0,0,0.65)]'
        }`}
      >
        {/* Base sticky note image - switches to picked-sticky-notes.png during click and drag */}
        <img
          src={isDragging ? pickedStickyNotesImg : stickyNotesImg}
          alt="Sticky Note"
          className="absolute inset-0 w-full h-full object-contain pointer-events-none select-none transition-transform duration-150"
          draggable={false}
        />

        {/* Note content overlay positioned in the writeable yellow area below the pin */}
        <div
          className={`absolute inset-0 ${
            inFullscreen ? 'pt-9 sm:pt-11 px-5 sm:px-6 pb-6 sm:pb-7' : 'pt-8 sm:pt-9 px-4 sm:px-5 pb-5 sm:pb-6'
          } flex flex-col justify-between`}
        >
          {/* Header: Timestamp badge & Close button (No timer display) */}
          <div className="flex items-center justify-between gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (onSeek) onSeek(note.timestamp);
              }}
              onMouseDown={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
              className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-[#E5CA10]/70 hover:bg-[#E5CA10] text-[9px] sm:text-[10px] font-mono font-bold text-[#3B3000] border border-[#CCAE08]/70 transition-colors cursor-pointer shadow-xs"
              title="Click to jump to this timestamp"
            >
              <Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
              <span>{formatTime(note.timestamp)}</span>
            </button>

            {/* Close button */}
            <button
              onClick={handleManualClose}
              onMouseDown={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
              className="p-0.5 sm:p-1 rounded-full text-[#6E5B00] hover:text-[#221A00] hover:bg-[#E5CA10]/80 transition-colors cursor-pointer"
              title="Tutup catatan"
            >
              <X className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            </button>
          </div>

          {/* Note text: clean, clear and concise */}
          <div className="flex-1 flex items-center pr-1 py-0.5 pointer-events-none">
            <p
              className={`${
                inFullscreen ? 'text-[11px] sm:text-xs' : 'text-[10px] sm:text-[11px]'
              } font-semibold leading-snug text-[#221A00] font-sans break-words line-clamp-3 select-none`}
            >
              {note.text}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
