import React from 'react';
import { Flame, Trophy } from 'lucide-react';

const HeroSection = () => {
  return (
    <section className="bg-gradient-to-br from-neutral-900 via-neutral-800 to-black text-white min-h-[600px] flex items-center">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="space-y-6">
            <h2 className="text-5xl font-bold leading-tight">Welcome back, Alex!</h2>
            <p className="text-xl text-neutral-300">
              Continue mastering discrete mathematics with our interactive step-by-step solver
            </p>

            {/* Stats */}
            <div className="flex items-center space-x-6">
              <div className="bg-neutral-800 rounded-lg p-4 flex items-center space-x-4">
                <div className="w-12 h-12 bg-neutral-700 rounded-full flex items-center justify-center">
                  <Flame className="text-orange-400 w-6 h-6" />
                </div>
                <div>
                  <p className="text-2xl font-bold">47</p>
                  <p className="text-neutral-400 text-sm">Day Streak</p>
                </div>
              </div>

              <div className="bg-neutral-800 rounded-lg p-4 flex items-center space-x-4">
                <div className="w-12 h-12 bg-neutral-700 rounded-full flex items-center justify-center">
                  <Trophy className="text-yellow-400 w-6 h-6" />
                </div>
                <div>
                  <p className="text-2xl font-bold">1,247</p>
                  <p className="text-neutral-400 text-sm">Problems Solved</p>
                </div>
              </div>
            </div>

            <button className="bg-white text-neutral-900 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-neutral-100 transition-colors">
              Start New Problem
            </button>
          </div>

          {/* Right Visualization */}
          <div className="relative">
            <div className="bg-neutral-800 rounded-2xl p-8 shadow-2xl">
              <div className="grid grid-cols-3 gap-4 mb-6">
                {[...Array(6)].map((_, i) => (
                  <div
                    key={i}
                    className="h-16 bg-neutral-700 rounded-lg flex items-center justify-center"
                  >
                    <div
                      className={`w-8 h-8 rounded-full ${
                        i % 2 === 0 ? 'bg-white' : 'bg-neutral-500'
                      }`}
                    ></div>
                  </div>
                ))}
              </div>
              <div className="text-center text-white">
                <p className="text-sm text-neutral-400">Graph Visualization</p>
                <p className="font-semibold">Minimum Spanning Tree</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
