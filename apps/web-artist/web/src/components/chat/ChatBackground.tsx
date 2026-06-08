'use client';

import { Music, Camera, Film, PartyPopper, Headphones, Palette, Sparkles, Mic } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

const ICONS: LucideIcon[] = [Music, Camera, Film, PartyPopper, Headphones, Palette, Sparkles, Mic];
const CELL = 80;
const COLS = 9;
const ROWS = 14;

export function ChatBackground() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden select-none" aria-hidden="true">
      {Array.from({ length: ROWS }, (_, row) =>
        Array.from({ length: COLS }, (_, col) => {
          const Icon = ICONS[(row * COLS + col) % ICONS.length];
          const offset = row % 2 === 0 ? 0 : CELL / 2;
          return (
            <div
              key={`${row}-${col}`}
              className="absolute text-gray-500"
              style={{
                left: col * CELL + offset,
                top: row * CELL,
                opacity: 0.07,
                transform: 'rotate(-15deg)',
              }}
            >
              <Icon size={26} strokeWidth={1} />
            </div>
          );
        })
      )}
    </div>
  );
}
