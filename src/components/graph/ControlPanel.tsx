'use client';

import { Play, Pause, SkipBack, SkipForward, Rewind, FastForward } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/shared/store';
import { play, pause, nextStep, prevStep, setSpeed, setIndex } from '@/shared/store';

/**
 * Компонент панели управления воспроизведением алгоритма
 */
export function ControlPanel() {
  const dispatch = useAppDispatch();
  const { currentIndex, totalSteps, playing, speedMs } = useAppSelector(state => state.steps);

  const handlePlay = () => {
    dispatch(play());
  };

  const handlePause = () => {
    dispatch(pause());
  };

  const handleNext = () => {
    dispatch(nextStep());
  };

  const handlePrev = () => {
    dispatch(prevStep());
  };

  const handleReset = () => {
    dispatch(setIndex(-1));
    dispatch(pause());
  };

  const handleSpeedChange = (speed: number) => {
    dispatch(setSpeed(speed));
  };

  const progress = totalSteps > 0 ? ((currentIndex + 1) / totalSteps) * 100 : 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-neutral-200">Управление воспроизведением</h3>
        <span className="text-sm text-neutral-400">
          {currentIndex === -1 ? 'Начало' : `Шаг ${currentIndex + 1} / ${totalSteps}`}
        </span>
      </div>

      <div className="w-full h-2 bg-neutral-700 rounded-full overflow-hidden">
        <div
          className="h-full bg-blue-500 transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="flex items-center justify-center gap-2">
        <button
          onClick={handleReset}
          className="p-2 rounded-lg hover:bg-neutral-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="В начало"
          disabled={currentIndex === -1}
        >
          <Rewind className="w-5 h-5 text-neutral-300" />
        </button>

        <button
          onClick={handlePrev}
          className="p-2 rounded-lg hover:bg-neutral-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="Предыдущий шаг"
          disabled={currentIndex === -1}
        >
          <SkipBack className="w-5 h-5 text-neutral-300" />
        </button>

        {playing ? (
          <button
            onClick={handlePause}
            className="p-3 rounded-lg bg-blue-500 hover:bg-blue-600 transition-colors"
            title="Пауза"
          >
            <Pause className="w-6 h-6 text-white" fill="white" />
          </button>
        ) : (
          <button
            onClick={handlePlay}
            className="p-3 rounded-lg bg-blue-500 hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Воспроизвести"
            disabled={totalSteps === 0}
          >
            <Play className="w-6 h-6 text-white" fill="white" />
          </button>
        )}

        <button
          onClick={handleNext}
          className="p-2 rounded-lg hover:bg-neutral-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="Следующий шаг"
          disabled={currentIndex >= totalSteps - 1}
        >
          <SkipForward className="w-5 h-5 text-neutral-300" />
        </button>

        <button
          onClick={() => {
            dispatch(setIndex(totalSteps - 1));
          }}
          className="p-2 rounded-lg hover:bg-neutral-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="В конец"
          disabled={currentIndex >= totalSteps - 1}
        >
          <FastForward className="w-5 h-5 text-neutral-300" />
        </button>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-neutral-300">Скорость: {speedMs}ms</label>
        <div className="flex items-center gap-2">
          {[4000, 2000, 1000, 500, 250].map(speed => (
            <button
              key={speed}
              onClick={() => handleSpeedChange(speed)}
              className={`px-3 py-1 rounded text-sm transition-colors ${
                speedMs === speed
                  ? 'bg-blue-500 text-white'
                  : 'bg-neutral-700 hover:bg-neutral-600 text-neutral-300'
              }`}
            >
              {speed === 4000
                ? '0.25x'
                : speed === 2000
                  ? '0.5x'
                  : speed === 1000
                    ? '1x'
                    : speed === 500
                      ? '2x'
                      : '4x'}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
