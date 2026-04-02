import React from "react";

// Helper to render a bracket cell
function BracketCell({ label }: { label: string }) {
  return (
    <div className="w-32 h-10 bg-black/80 border-2 border-lime-400 rounded flex items-center justify-center text-lime-300 font-semibold text-xs md:text-base relative">
      {label}
    </div>
  );
}

export default function KnockoutsPage() {
  // Bracket labels for the first round (from your image)
  const leftLabels = [
    "1E", "3 ABCDF", "1I", "3 CDFGH", "2A", "2B", "1F", "2C",
    "2K", "2L", "1H", "2J", "1D", "3 BEFIJ", "1G", "3 AEHIJ"
  ];
  const rightLabels = [
    "1C", "2F", "2E", "1I", "1A", "3 CEFHI", "1L", "3 EHIJK",
    "1J", "2H", "2D", "2G", "1B", "3 EFGIJ", "1K", "3 DEIJL"
  ];

  // Number of rounds: 5 (First, 2nd, QF, SF, Final)
  // We'll use arrays of arrays for each side
  const rounds = 5;
  const leftTree = [leftLabels];
  const rightTree = [rightLabels];
  // Fill with empty placeholders for now
  for (let r = 1; r < rounds; r++) {
    leftTree.push(Array(leftTree[r - 1].length / 2).fill(""));
    rightTree.push(Array(rightTree[r - 1].length / 2).fill(""));
  }

  return (
    <div className="flex flex-col items-center py-8 min-h-screen bg-black">
      <h2 className="text-3xl font-bold mb-4 text-white tracking-wide">WORLD CHAMPIONS</h2>
      <div className="flex flex-row items-center justify-center w-full overflow-x-auto">
        {/* Left Bracket */}
        <div className="flex flex-row gap-8">
          {leftTree.map((round, r) => (
            <div key={r} className="flex flex-col gap-4 justify-center pt-8">
              {round.map((label, i) => (
                <BracketCell key={i} label={label} />
              ))}
            </div>
          ))}
        </div>
        {/* Center Trophy and Final */}
        <div className="flex flex-col items-center mx-8">
          <div className="w-40 h-64 flex items-center justify-center">
            <img src="https://upload.wikimedia.org/wikipedia/commons/5/5c/FIFA_World_Cup_Trophy_2018.png" alt="World Cup Trophy" className="h-full object-contain" />
          </div>
          <div className="w-40 h-10 bg-lime-400 text-black font-bold flex items-center justify-center rounded mt-2 text-lg">WINNER</div>
          <div className="w-40 h-10 bg-lime-200 text-black font-semibold flex items-center justify-center rounded mt-2 text-base">BRONZE WINNER</div>
        </div>
        {/* Right Bracket */}
        <div className="flex flex-row gap-8">
          {rightTree.map((round, r) => (
            <div key={r} className="flex flex-col gap-4 justify-center pt-8">
              {round.map((label, i) => (
                <BracketCell key={i} label={label} />
              ))}
            </div>
          ))}
        </div>
      </div>
      {/* Admin controls placeholder */}
      <div className="mt-8 p-4 bg-lime-100 border border-lime-400 rounded w-full max-w-2xl text-center">
        <span className="text-lime-700 font-medium">Admin interface for editing bracket coming soon...</span>
      </div>
    </div>
  );
}
