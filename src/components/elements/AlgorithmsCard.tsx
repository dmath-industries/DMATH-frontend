import Link from 'next/link';
import Image from 'next/image';
import { IAlgorithmsItem } from '@/types';

const AlgorithmsItem = ({ title, img, href }: IAlgorithmsItem) => {
  return (
    <Link
      href={href || '#'}
      className={`
        group relative w-full rounded-3xl overflow-hidden min-h-[380px]
        cursor-pointer backdrop-blur-sm no-underline
        bg-gradient-to-br from-[#2a2a2a] via-[#1f1f1f] to-[#151515]
        border-2 border-[#3a3a3a]
        shadow-[0_4px_20px_rgba(0,0,0,0.3)]
        px-8 py-10
        flex flex-col items-center justify-between
        transition-all duration-500 ease-out
        hover:scale-[1.05]
        hover:shadow-[0_20px_60px_rgba(0,0,0,0.6),0_0_30px_rgba(139,92,246,0.3)]
        hover:border-[#6b46c1]
        hover:bg-gradient-to-br hover:from-[#2d1b4e] hover:via-[#1f1f1f] hover:to-[#151515]
      `}
    >
      {/* Animated background gradient */}
      <div
        className={`
          absolute inset-0 rounded-3xl
          bg-gradient-to-br from-purple-600/0 via-blue-600/0 to-cyan-600/0
          group-hover:from-purple-600/20 group-hover:via-blue-600/15 group-hover:to-cyan-600/20
          transition-all duration-500 pointer-events-none
        `}
      />

      {/* Corner glow effect */}
      <div
        className={`
          absolute top-0 right-0 w-32 h-32
          bg-purple-500/0 group-hover:bg-purple-500/10
          rounded-full blur-3xl
          transition-all duration-500 pointer-events-none
        `}
      />
      <div
        className={`
          absolute bottom-0 left-0 w-32 h-32
          bg-blue-500/0 group-hover:bg-blue-500/10
          rounded-full blur-3xl
          transition-all duration-500 pointer-events-none
        `}
      />

      {/* Shine sweep effect */}
      <div
        className={`
          absolute inset-0
          opacity-0 group-hover:opacity-100
          transition-opacity duration-500 pointer-events-none
        `}
      >
        <div
          className={`
            absolute inset-0 rounded-3xl
            bg-gradient-to-r from-transparent via-white/10 to-transparent
            -translate-x-full group-hover:translate-x-full
            transition-transform duration-1000 ease-in-out
          `}
        />
      </div>

      {/* Image container */}
      <div
        className={`
          relative z-10
          flex justify-center items-center
          w-full h-48 rounded-2xl p-6 shadow-inner
          bg-gradient-to-br from-[#2a2a2a] to-[#1a1a1a]
          border border-[#3a3a3a]/50
          group-hover:border-[#6b46c1]/50
          group-hover:bg-gradient-to-br group-hover:from-[#2d1b4e] group-hover:to-[#1a1a1a]
          transition-all duration-500
        `}
      >
        <div
          className={`
            absolute inset-0 rounded-2xl
            bg-gradient-to-br from-purple-500/0 to-blue-500/0
            group-hover:from-purple-500/5 group-hover:to-blue-500/5
            transition-all duration-500
          `}
        />
        <Image
          src={img || '/images/svg/Rectangle.svg'}
          alt={title}
          width={200}
          height={200}
          className={`
            relative z-10 object-contain
            transition-all duration-500
            group-hover:scale-110 group-hover:brightness-110
            drop-shadow-lg
          `}
        />
      </div>

      {/* Title */}
      <div className="relative z-10 w-full mt-8">
        <h2
          className={`
            text-lg md:text-xl lg:text-2xl
            text-center font-bold text-white
            line-clamp-3 leading-tight
            group-hover:text-transparent group-hover:bg-clip-text
            group-hover:bg-gradient-to-r group-hover:from-purple-400 group-hover:via-blue-400 group-hover:to-cyan-400
            transition-all duration-500 drop-shadow-md
          `}
        >
          {title}
        </h2>
      </div>

      {/* Bottom accent bar */}
      <div
        className={`
          absolute bottom-0 left-0 right-0 h-1.5 rounded-b-3xl
          bg-gradient-to-r from-purple-500/30 via-blue-500/30 to-cyan-500/30
          group-hover:from-purple-500 group-hover:via-blue-500 group-hover:to-cyan-500
          transition-all duration-500
        `}
      />

      {/* Top corner accent */}
      <div
        className={`
          absolute top-4 right-4 w-2 h-2 rounded-full
          bg-purple-500/0 group-hover:bg-purple-500
          transition-all duration-500
          shadow-[0_0_10px_rgba(139,92,246,0)]
          group-hover:shadow-[0_0_15px_rgba(139,92,246,0.8)]
        `}
      />
    </Link>
  );
};

export default AlgorithmsItem;

