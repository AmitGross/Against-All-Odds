import React from "react";

const H = 800;
const CW = 90;
const CH = 28;
const GAP = 16;

type Side = "left" | "right";

function Column({ items }: { items: string[] }) {
  const slotH = H / items.length;
  return (
    <div style={{ width: CW, height: H, flexShrink: 0 }} className="flex flex-col">
      {items.map((label, i) => (
        <div key={i} style={{ height: slotH }} className="flex items-center justify-center">
          <div
            style={{ width: CW, height: CH }}
            className="bg-gray-900 border-2 border-lime-400 rounded flex items-center justify-center text-lime-300 font-bold text-[10px] px-1 text-center"
          >
            {label}
          </div>
        </div>
      ))}
    </div>
  );
}

function Connector({ fromCount, side }: { fromCount: number; side: Side }) {
  const w = GAP + 8;
  const slotH = H / fromCount;
  const pairs = fromCount / 2;

  return (
    <svg width={w} height={H} style={{ flexShrink: 0, overflow: "visible" }}>
      {Array.from({ length: pairs }).map((_, i) => {
        const y1 = i * 2 * slotH + slotH / 2;
        const y2 = (i * 2 + 1) * slotH + slotH / 2;
        const yMid = (y1 + y2) / 2;
        const x0 = side === "left" ? 0 : w;
        const x1 = side === "left" ? w : 0;
        return (
          <g key={i} stroke="#a3e635" strokeWidth={2} fill="none">
            <line x1={x0} y1={y1} x2={x1} y2={y1} />
            <line x1={x1} y1={y1} x2={x1} y2={y2} />
            <line x1={x0} y1={y2} x2={x1} y2={y2} />
          </g>
        );
      })}
    </svg>
  );
}

export default function KnockoutsPage() {
  const leftR32 = [
    "1E","3 ABCDF","1I","3 CDFGH","2A","2B","1F","2C",
    "2K","2L","1H","2J","1D","3 BEFIJ","1G","3 AEHIJ",
  ];
  const rightR32 = [
    "1C","2F","2E","2I","1A","3 CEFHI","1L","3 EHIJK",
    "1J","2H","2D","2G","1B","3 EFGIJ","1K","3 DEIJL",
  ];

  const leftRounds: string[][] = [leftR32];
  const rightRounds: string[][] = [rightR32];
  for (let r = 1; r < 5; r++) {
    leftRounds.push(Array(leftRounds[r - 1].length / 2).fill(""));
    rightRounds.push(Array(rightRounds[r - 1].length / 2).fill(""));
  }

  return (
    <div className="min-h-screen bg-black flex flex-col items-center py-8">
      <h2 className="text-3xl font-extrabold text-white mb-6 tracking-widest">WORLD CHAMPIONS</h2>
      <div className="overflow-x-auto w-full">
        <div className="flex flex-row items-center px-4" style={{ minWidth: "max-content", margin: "0 auto" }}>

          {/* LEFT BRACKET: R32 on far left, Final closest to center */}
          {leftRounds.map((round, r) => (
            <React.Fragment key={r}>
              <Column items={round} />
              {r < leftRounds.length - 1 && (
                <Connector fromCount={round.length} side="left" />
              )}
            </React.Fragment>
          ))}

          {/* CENTER */}
          <div style={{ height: H, width: 140 }} className="flex flex-col items-center justify-center shrink-0 mx-4">
            <span className="text-6xl mb-2">🏆</span>
            <div className="text-lime-400 font-extrabold text-xs text-center mb-1 tracking-widest">FIFA WORLD CUP 2026</div>
            <div className="w-28 h-8 bg-lime-400 text-black font-bold flex items-center justify-center rounded mt-3 text-sm">
              WINNER
            </div>
            <div className="w-28 h-8 bg-lime-200 text-black font-semibold flex items-center justify-center rounded mt-2 text-xs">
              BRONZE WINNER
            </div>
          </div>

          {/* RIGHT BRACKET: Final closest to center, R32 on far right */}
          {[...rightRounds].reverse().map((round, r, arr) => (
            <React.Fragment key={r}>
              {r < arr.length - 1 && (
                <Connector fromCount={arr[r + 1].length} side="right" />
              )}
              <Column items={round} />
            </React.Fragment>
          ))}

        </div>
      </div>
    </div>
  );
}
