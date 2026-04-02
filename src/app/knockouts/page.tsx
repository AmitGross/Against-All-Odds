import React from "react";

export default function KnockoutsPage() {
  // Bracket labels from the provided image
  const leftLabels = [
    "1E", "3 ABCDF", "1I", "3 CDFGH", "2A", "2B", "1F", "2C",
    "2K", "2L", "1H", "2J", "1D", "3 BEFIJ", "1G", "3 AEHIJ"
  ];
  const rightLabels = [
    "1C", "2F", "2E", "1I", "1A", "3 CEFHI", "1L", "3 EHIJK",
    "1J", "2H", "2D", "2G", "1B", "3 EFGIJ", "1K", "3 DEIJL"
  ];

  return (
    <div className="flex flex-col items-center py-8">
      <h2 className="text-3xl font-bold mb-8">Knockout Stage Bracket</h2>
      <div className="overflow-x-auto">
        <div className="flex flex-row gap-8">
          {/* Left side of bracket */}
          <div className="flex flex-col gap-2 justify-center">
            {leftLabels.map((label, i) => (
              <div key={i} className="w-40 h-10 bg-black/80 border-2 border-lime-400 rounded flex items-center justify-center text-lime-300 font-semibold text-base">
                {label}
              </div>
            ))}
          </div>
          {/* Center trophy and rounds */}
          <div className="flex flex-col items-center justify-center mx-4">
            <span className="text-4xl font-extrabold text-white mb-2">WORLD CHAMPIONS</span>
            <div className="w-40 h-64 flex items-center justify-center">
              <img src="https://upload.wikimedia.org/wikipedia/commons/5/5c/FIFA_World_Cup_Trophy_2018.png" alt="World Cup Trophy" className="h-full object-contain" />
            </div>
            <span className="text-lg font-bold text-lime-400 mt-2">BRONZE WINNER</span>
            <div className="mt-4 text-white text-2xl font-extrabold">2026</div>
            <span className="text-lime-400 text-sm">FIFA WORLD CUP 2026</span>
          </div>
          {/* Right side of bracket */}
          <div className="flex flex-col gap-2 justify-center">
            {rightLabels.map((label, i) => (
              <div key={i} className="w-40 h-10 bg-black/80 border-2 border-lime-400 rounded flex items-center justify-center text-lime-300 font-semibold text-base">
                {label}
              </div>
            ))}
          </div>
        </div>
      </div>
      {/* Admin controls placeholder */}
      <div className="mt-8 p-4 bg-lime-100 border border-lime-400 rounded w-full max-w-2xl text-center">
        <span className="text-lime-700 font-medium">Admin interface for editing bracket coming soon...</span>
      </div>
    </div>
  );
}
