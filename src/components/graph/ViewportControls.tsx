'use client';

import { ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';

interface ViewportControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFit: () => void;
}

/**
 * Компонент кнопок управления viewport (зум, вписать в экран)
 */
export function ViewportControls({ onZoomIn, onZoomOut, onFit }: ViewportControlsProps) {
  return (
    <div className="absolute top-4 right-4 flex flex-col gap-2 z-10">
      <button
        onClick={onZoomIn}
        className="p-2 bg-neutral-700/90 hover:bg-neutral-600 backdrop-blur-sm rounded-lg shadow-lg transition-colors border border-neutral-600"
        title="Приблизить"
      >
        <ZoomIn className="w-5 h-5 text-neutral-200" />
      </button>
      
      <button
        onClick={onZoomOut}
        className="p-2 bg-neutral-700/90 hover:bg-neutral-600 backdrop-blur-sm rounded-lg shadow-lg transition-colors border border-neutral-600"
        title="Отдалить"
      >
        <ZoomOut className="w-5 h-5 text-neutral-200" />
      </button>
      
      <button
        onClick={onFit}
        className="p-2 bg-neutral-700/90 hover:bg-neutral-600 backdrop-blur-sm rounded-lg shadow-lg transition-colors border border-neutral-600"
        title="Вписать в экран"
      >
        <Maximize2 className="w-5 h-5 text-neutral-200" />
      </button>
    </div>
  );
}

