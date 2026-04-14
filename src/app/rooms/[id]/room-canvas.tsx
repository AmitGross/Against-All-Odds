"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { saveCanvas } from "./actions";

interface Props {
  roomId: string;
  initialData: string;
}

type Tool = "pen" | "eraser";

const COLORS = ["#1a1a2e", "#e63946", "#2a9d8f", "#e9c46a", "#264653", "#ffffff"];
const SIZES = [2, 5, 10, 20];

export default function RoomCanvas({ roomId, initialData }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawing = useRef(false);
  const lastPos = useRef<{ x: number; y: number } | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [tool, setTool] = useState<Tool>("pen");
  const [color, setColor] = useState("#1a1a2e");
  const [size, setSize] = useState(5);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState(false);

  // Load initial canvas data
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#f5f5f0";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    if (initialData) {
      const img = new Image();
      img.onload = () => ctx.drawImage(img, 0, 0);
      img.src = initialData;
    }
  }, [initialData]);

  function getPos(e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if ("touches" in e) {
      const t = e.touches[0];
      return { x: (t.clientX - rect.left) * scaleX, y: (t.clientY - rect.top) * scaleY };
    }
    return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY };
  }

  function startDraw(e: React.MouseEvent | React.TouchEvent) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    e.preventDefault();
    isDrawing.current = true;
    lastPos.current = getPos(e, canvas);
  }

  function draw(e: React.MouseEvent | React.TouchEvent) {
    if (!isDrawing.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    e.preventDefault();
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const pos = getPos(e, canvas);
    const from = lastPos.current ?? pos;

    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = tool === "eraser" ? "#f5f5f0" : color;
    ctx.lineWidth = tool === "eraser" ? size * 3 : size;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke();
    lastPos.current = pos;
    scheduleSave();
  }

  function stopDraw() {
    isDrawing.current = false;
    lastPos.current = null;
  }

  const scheduleSave = useCallback(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const data = canvas.toDataURL("image/png");
      setSaving(true);
      await saveCanvas(roomId, data);
      setSaving(false);
      setSavedMsg(true);
      setTimeout(() => setSavedMsg(false), 2000);
    }, 1500);
  }, [roomId]);

  function clearCanvas() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#f5f5f0";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    scheduleSave();
  }

  return (
    <div className="rounded-lg border border-ink/10 bg-white p-4 space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="text-lg font-semibold">Drawing Board</h3>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Tool toggle */}
          <div className="flex rounded border border-ink/20 overflow-hidden text-xs">
            <button
              onClick={() => setTool("pen")}
              className={`px-3 py-1 ${tool === "pen" ? "bg-ink text-white" : "text-ink/60 hover:bg-ink/5"}`}
            >✏️ Pen</button>
            <button
              onClick={() => setTool("eraser")}
              className={`px-3 py-1 ${tool === "eraser" ? "bg-ink text-white" : "text-ink/60 hover:bg-ink/5"}`}
            >⬜ Eraser</button>
          </div>

          {/* Size picker */}
          <div className="flex items-center gap-1">
            {SIZES.map(s => (
              <button
                key={s}
                onClick={() => setSize(s)}
                className={`rounded-full border-2 flex items-center justify-center transition-all ${size === s ? "border-ink" : "border-ink/20"}`}
                style={{ width: s * 2 + 12, height: s * 2 + 12 }}
              >
                <span className="rounded-full bg-ink/60 block" style={{ width: s, height: s }} />
              </button>
            ))}
          </div>

          {/* Color picker */}
          <div className="flex gap-1">
            {COLORS.map(c => (
              <button
                key={c}
                onClick={() => { setColor(c); setTool("pen"); }}
                className={`w-6 h-6 rounded-full border-2 transition-all ${color === c && tool === "pen" ? "border-ink scale-125" : "border-ink/20"}`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>

          {/* Clear */}
          <button
            onClick={clearCanvas}
            className="text-xs text-clay hover:text-clay/70 underline"
          >Clear</button>

          {/* Status */}
          <span className="text-xs text-ink/30">
            {saving ? "Saving…" : savedMsg ? "Saved ✓" : ""}
          </span>
        </div>
      </div>

      <canvas
        ref={canvasRef}
        width={1200}
        height={500}
        className="w-full rounded-lg border border-ink/10 touch-none cursor-crosshair"
        style={{ background: "#f5f5f0" }}
        onMouseDown={startDraw}
        onMouseMove={draw}
        onMouseUp={stopDraw}
        onMouseLeave={stopDraw}
        onTouchStart={startDraw}
        onTouchMove={draw}
        onTouchEnd={stopDraw}
      />
    </div>
  );
}
