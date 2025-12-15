'use client';

import Link from 'next/link';
import { AnalyticsEvents } from '@/shared/lib';

export default function Home() {
  return (
    <div className="App min-h-screen">
      <div className="min-h-screen flex items-center justify-center py-8">
        <div className="container flex flex-col gap-4 sm:gap-6 px-4 sm:px-6 md:px-[10%]">
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-[400] mb-4 sm:mb-6 text-center sm:text-left leading-tight">
            Добро пожаловать в интерактивный учебный инструмент для изучения ключевых алгоритмов
            дискретной математики и сетей
          </h1>

          <div className="space-y-3 sm:space-y-4">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold text-center sm:text-left">
              Здесь вы можете:
            </h2>
            <ul className="list-disc pl-6 sm:pl-10 flex flex-col gap-2 sm:gap-3 text-base sm:text-lg md:text-xl">
              <li className="leading-relaxed">Запускать алгоритмы шаг за шагом</li>
              <li className="leading-relaxed">Видеть, как они работают — визуально и понятно</li>
              <li className="leading-relaxed">Анализировать каждый этап решения</li>
            </ul>
          </div>

          <div className="space-y-3 sm:space-y-4">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold text-center sm:text-left">
              Что можно изучать:
            </h2>
            <ul className="list-disc pl-6 sm:pl-10 flex flex-col gap-2 sm:gap-3 text-base sm:text-lg md:text-xl">
              <li className="leading-relaxed">
                <span className="font-medium">Графы:</span> обход в ширину (BFS), в глубину (DFS),
                алгоритм Дейкстры, минимальное остовное дерево
              </li>
              <li className="leading-relaxed">
                <span className="font-medium">Транспортные задачи:</span> метод минимальной
                стоимости, распределение ресурсов
              </li>
              <li className="leading-relaxed">
                <span className="font-medium">Нейросети:</span> распространение сигнала в простой
                нейронной сети (MLP) — без формул, но с пониманием процесса
              </li>
            </ul>
          </div>

          <div className="mt-6 sm:mt-8 flex justify-center sm:justify-start">
            <Link
              href="/algorithms"
              className="btn-primary-lg"
              onClick={() => AnalyticsEvents.navigateToAlgorithms()}
            >
              Перейти к алгоритмам
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
