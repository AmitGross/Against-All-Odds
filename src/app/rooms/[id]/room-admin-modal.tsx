"use client";

import { useState, useTransition } from "react";
import { setAllPeekTokens, setAllSnipeTokens, toggleRulesLock, resetAllTokenUsed } from "./actions";

interface Member {
  userId: string;
}

interface Props {
  roomId: string;
  members: Member[];          // all members, including the owner
  peeksPerPlayer: number;     // current uniform peek grant value
  snipesPerPlayer: number;    // current uniform snipe grant value
  rulesLocked: boolean;
  tournamentStarted: boolean;
}

export default function RoomAdminModal({ roomId, members, peeksPerPlayer, snipesPerPlayer, rulesLocked, tournamentStarted }: Props) {
  const [open, setOpen] = useState(false);
  const [locked, setLocked] = useState(rulesLocked);
  const [peekCount, setPeekCount] = useState(peeksPerPlayer);
  const [snipeCount, setSnipeCount] = useState(snipesPerPlayer);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [snipeSaveError, setSnipeSaveError] = useState<string | null>(null);
  const [snipeSaveSuccess, setSnipeSaveSuccess] = useState(false);
  const [lockError, setLockError] = useState<string | null>(null);
  const [saveTransition, startSave] = useTransition();
  const [snipeSaveTransition, startSnipeSave] = useTransition();
  const [lockTransition, startLock] = useTransition();
  const [resetError, setResetError] = useState<string | null>(null);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [resetTransition, startReset] = useTransition();

  const isFullyLocked = locked || tournamentStarted;

  function handleSave() {
    setSaveError(null);
    setSaveSuccess(false);
    startSave(async () => {
      const entries = members.map((m) => ({ userId: m.userId, granted: peekCount }));
      const result = await setAllPeekTokens(roomId, entries);
      if (result.error) {
        setSaveError(result.error);
      } else {
        setSaveSuccess(true);
      }
    });
  }

  function handleSnipeSave() {
    setSnipeSaveError(null);
    setSnipeSaveSuccess(false);
    startSnipeSave(async () => {
      const entries = members.map((m) => ({ userId: m.userId, granted: snipeCount }));
      const result = await setAllSnipeTokens(roomId, entries);
      if (result.error) {
        setSnipeSaveError(result.error);
      } else {
        setSnipeSaveSuccess(true);
      }
    });
  }

  function handleReset() {
    setResetError(null);
    setResetSuccess(false);
    startReset(async () => {
      const result = await resetAllTokenUsed(roomId);
      if (result.error) {
        setResetError(result.error);
      } else {
        setResetSuccess(true);
      }
    });
  }

  function handleToggleLock() {
    setLockError(null);
    startLock(async () => {
      const result = await toggleRulesLock(roomId);
      if (result.error) {
        setLockError(result.error);
      } else {
        setLocked(result.locked ?? !locked);
      }
    });
  }

  return (
    <>
      {/* Trigger button — lives in the room header */}
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 rounded-lg border border-ink/20 bg-white px-3 py-1.5 text-xs font-medium text-ink hover:bg-ink/5 transition-colors"
      >
        ⚙️ Room Admin
      </button>

      {!open ? null : (
        /* Backdrop */
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
        >
          {/* Modal panel */}
          <div className="w-full max-w-md rounded-xl border border-ink/10 bg-white shadow-xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-ink/10 px-5 py-4">
              <h2 className="text-lg font-semibold">⚙️ Room Admin</h2>
              <button
                onClick={() => setOpen(false)}
                className="text-ink/40 hover:text-ink text-xl leading-none"
                aria-label="Close"
              >
                ×
              </button>
            </div>

            {/* Body */}
            <div className="px-5 py-4 space-y-5">

              {/* Lock panel */}
              <div className="rounded-lg border border-ink/10 bg-ink/5 p-4 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium">Rules lock</p>
                    <p className="text-xs text-ink/50 mt-0.5">
                      {tournamentStarted
                        ? "🔒 Permanently locked — tournament already started."
                        : locked
                          ? "Locked manually. Unlock to make changes."
                          : "Unlocked — changes to rules allowed."}
                    </p>
                  </div>
                  {!tournamentStarted && (
                    <button
                      onClick={handleToggleLock}
                      disabled={lockTransition}
                      className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                        locked
                          ? "bg-field text-white hover:bg-field/90"
                          : "bg-clay text-white hover:bg-clay/90"
                      } disabled:opacity-50`}
                    >
                      {lockTransition ? "..." : locked ? "Unlock" : "Lock"}
                    </button>
                  )}
                </div>
                {lockError && <p className="text-xs text-red-500">{lockError}</p>}
              </div>

              {/* Peek tokens section */}
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium">👁️ Peek Tokens per player</p>
                  <p className="text-xs text-ink/50 mt-0.5">
                    Reveals ALL players&apos; predictions for one match before kick-off.
                    {isFullyLocked && " (Locked — read only.)"}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min={0}
                    value={peekCount}
                    onChange={(e) => {
                      setPeekCount(Math.max(0, parseInt(e.target.value, 10) || 0));
                      setSaveSuccess(false);
                      setSaveError(null);
                    }}
                    disabled={isFullyLocked}
                    className="w-20 rounded-lg border border-ink/20 px-3 py-2 text-center text-sm disabled:bg-ink/5 disabled:text-ink/40 focus:outline-none focus:ring-1 focus:ring-field"
                  />
                  <span className="text-xs text-ink/50">peeks per player</span>
                </div>

                {!isFullyLocked && (
                  <div className="flex items-center justify-between">
                    <div>
                      {saveError && <p className="text-xs text-red-500">{saveError}</p>}
                      {saveSuccess && <p className="text-xs text-field font-medium">Saved!</p>}
                    </div>
                    <button
                      onClick={handleSave}
                      disabled={saveTransition}
                      className="rounded-lg bg-field px-4 py-1.5 text-sm font-medium text-white hover:bg-field/90 disabled:opacity-50 transition-colors"
                    >
                      {saveTransition ? "Saving..." : "Save"}
                    </button>
                  </div>
                )}
              </div>

              {/* Snipe tokens section */}
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium">🎯 Snipe Tokens per player</p>
                  <p className="text-xs text-ink/50 mt-0.5">
                    Reveals ONE chosen player&apos;s prediction for one match before kick-off.
                    {isFullyLocked && " (Locked — read only.)"}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min={0}
                    value={snipeCount}
                    onChange={(e) => {
                      setSnipeCount(Math.max(0, parseInt(e.target.value, 10) || 0));
                      setSnipeSaveSuccess(false);
                      setSnipeSaveError(null);
                    }}
                    disabled={isFullyLocked}
                    className="w-20 rounded-lg border border-ink/20 px-3 py-2 text-center text-sm disabled:bg-ink/5 disabled:text-ink/40 focus:outline-none focus:ring-1 focus:ring-field"
                  />
                  <span className="text-xs text-ink/50">snipes per player</span>
                </div>

                {!isFullyLocked && (
                  <div className="flex items-center justify-between">
                    <div>
                      {snipeSaveError && <p className="text-xs text-red-500">{snipeSaveError}</p>}
                      {snipeSaveSuccess && <p className="text-xs text-field font-medium">Saved!</p>}
                    </div>
                    <button
                      onClick={handleSnipeSave}
                      disabled={snipeSaveTransition}
                      className="rounded-lg bg-field px-4 py-1.5 text-sm font-medium text-white hover:bg-field/90 disabled:opacity-50 transition-colors"
                    >
                      {snipeSaveTransition ? "Saving..." : "Save"}
                    </button>
                  </div>
                )}
              </div>

              {/* Reset used counts */}
              <div className="rounded-lg border border-red-200 bg-red-50 p-4 space-y-2">
                <p className="text-sm font-medium text-red-700">🔄 Reset token usage</p>
                <p className="text-xs text-red-500">Resets all peek &amp; snipe used counts to 0 for every player. Reveals already made stay visible.</p>
                <div className="flex items-center justify-between">
                  <div>
                    {resetError && <p className="text-xs text-red-500">{resetError}</p>}
                    {resetSuccess && <p className="text-xs text-green-600 font-medium">Reset done!</p>}
                  </div>
                  <button
                    onClick={handleReset}
                    disabled={resetTransition}
                    className="rounded-lg bg-red-500 px-4 py-1.5 text-sm font-medium text-white hover:bg-red-600 disabled:opacity-50 transition-colors"
                  >
                    {resetTransition ? "Resetting..." : "Reset Used"}
                  </button>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}
    </>
  );
}
