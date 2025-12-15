'use client';

/**
 * Algorithms List Page
 * Страница со списком доступных алгоритмов
 */

import { AlgorithmsItem } from '@/components/elements';
import type { IAlgorithmsItem } from '@/types';

/**
 * Страница списка алгоритмов
 */
export default function AlgorithmsPage() {
  const algorithms: IAlgorithmsItem[] = [
    {
      title: 'Алгоритм Робертса-Флореса',
      img: '',
      href: '/algorithms/roberts-flores',
    },
    {
      title: 'Алгоритм Прима',
      img: '',
      href: '/algorithms/prim',
    },
    {
      title: 'Алгоритм раскраски графа',
      img: '',
      href: '/algorithms/graph-coloring',
    },
    {
      title: 'Алгоритм Форда-Беллмана',
      img: '',
      href: '/algorithms/bellman-ford',
    },
    {
      title: 'Венгерский алгоритм',
      img: '',
      href: '/algorithms/hungarian',
    },
    {
      title: 'Алгоритм Брона-Кербоша',
      img: '',
      href: '/algorithms/bron-kerbosch',
    },
  ];

  return (
    <div className="App min-h-screen">
      <div className="container pt-6 md:pt-10 m-auto px-4 sm:px-6 lg:px-8 w-full max-w-7xl">
        <div className="w-full">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 md:gap-10 lg:gap-12 pb-16">
            {algorithms.map((algorithm, index) => (
              <AlgorithmsItem
                key={index}
                title={algorithm.title}
                img={algorithm.img}
                href={algorithm.href}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
