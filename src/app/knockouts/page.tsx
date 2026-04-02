import React from "react";

const TOTAL_HEIGHT = 900;

function RoundColumn({ items }: { items: string[] }) {
  const count = items.length;
  const slotHeight = TOTAL_HEIGHT / count;

  return (
    <div style={{ height: TOTAL_HEIGHT }} className="flex flex-col w-28">
      {items.map((label, i) => (
        <div
          key={i}
          style={{ height: slotHeight }}
          className="flex items-center justify-center"
        >
          <div className="w-full h-9 bg-gray-900 border-2 border-lime-400 rounded flex items-center justify-center text-lime-300 font-semibold text-xs px-1 text-center">
            {label}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function KnockoutsPage() {
  const leftR32 = [
    "1E","3 ABCDF","1I","3 CDFGH","2A","2B","1F","2C",
    "2K","2L","1H","2J","1D","3 BEFIJ","1G","3 AEHIJ"
  ];
  const rightR32 = [
    "1C","2F","2E","2I","1A","3 CEFHI","1L","3 EHIJK",
    "1J","2H","2D","2G","1B","3 EFGIJ","1K","3 DEIJL"
  ];

  const leftRounds: string[][] = [leftR32];
  const rightRounds: string[][] = [rightR32];
  for (let r = 1; r < 5; r++) {
    leftRounds.push(Array(leftRounds[r - 1].length / 2).fill(""));
    rightRounds.push(Array(rightRounds[r - 1].length / 2).fill(""));
  }

  return (
    <div className="min-h-screen bg-black py-8 flex flex-col items-center">
      <h2 className="text-3xl font-bold text-white mb-6 tracking-widest">WORLD CHAMPIONS</h2>
      <div className="overflow-x-auto w-full">
        <div className="flex flex-row items-start min-w-max mx-auto justify-center px-4">
          {/* Left bracket: R32 → R16 → QF → SF → Final (left to right toward center) */}
          {leftRounds.map((round, r) => (
            <RoundColumn key={r} items={round} />
          ))}

          {/* Center: Trophy + Winner + Bronze */}
          <div
            style={{ height: TOTAL_HEIGHT }}
            className="flex flex-col items-center justify-center mx-6 w-44"
          >
            <img
              src="https://upload.wikimedia.org/wikipedia/commons/5/5c/FIFA_World_Cup_Trophy_2018.png"
              alt="World Cup Trophy"
              className="h-56 object-contain"
            />
            <div className="w-36 h-9 bg-lime-400 text-black font-bold flex items-center justify-center rounded mt-3">
              WINNER
            </div>
            <div className="w-36 h-9 bg-lime-200 text-black font-semibold flex items-center justify-center rounded mt-2">
              BRONZE WINNER
            </div>
            <div className="text-white text-xs font-bold mt-4 tracking-widest">
              FIFA WORLD CUP 2026
            </div>
          </div>

          {/* Right bracket: Final → SF → QF → R16 → R32 (left to right, away from center) */}
          {[...rightRounds].reverse().map((round, r) => (
            <RoundColumn key={r} items={round} />
          ))}
        </div>
      </div>
    </div>
  );
}
