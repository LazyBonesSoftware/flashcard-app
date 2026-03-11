import { useState, useCallback } from "react";
import { MODULE_COLORS } from "../lib/data";

const DEFAULT_ACCENT = "#00d4ff";

function getAccent(module) {
  return MODULE_COLORS[module]?.accent || DEFAULT_ACCENT;
}

// Get unique modules from a card list
function getModules(cards) {
  const seen = new Set();
  const mods = [];
  for (const c of cards) {
    if (!seen.has(c.module)) {
      seen.add(c.module);
      mods.push(c.module);
    }
  }
  return mods;
}

export default function FlashcardViewer({ deck, onBack }) {
  const [selectedModule, setSelectedModule] = useState("All");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [known, setKnown] = useState([]);
  const [studying, setStudying] = useState([]);
  const [finished, setFinished] = useState(false);

  const cards = deck.cards || [];
  const modules = ["All", ...getModules(cards)];

  const deckFiltered =
    selectedModule === "All"
      ? cards
      : cards.filter((c) => c.module === selectedModule);

  const remaining = deckFiltered.filter((c) => !known.includes(c.id));
  const current = remaining[currentIndex % Math.max(remaining.length, 1)];
  const accent = current ? getAccent(current.module) : DEFAULT_ACCENT;

  const handleModuleChange = useCallback((mod) => {
    setSelectedModule(mod);
    setCurrentIndex(0);
    setFlipped(false);
    setKnown([]);
    setStudying([]);
    setFinished(false);
  }, []);

  const handleGotIt = useCallback(() => {
    setKnown((prev) => [...prev, current.id]);
    setFlipped(false);
    const newRemaining = remaining.filter((c) => c.id !== current.id);
    if (newRemaining.length === 0) {
      setFinished(true);
    } else {
      setCurrentIndex((prev) => prev % Math.max(newRemaining.length, 1));
    }
  }, [current, remaining]);

  const handleStudyMore = useCallback(() => {
    setStudying((prev) => [...prev, current.id]);
    setFlipped(false);
    setCurrentIndex((prev) => (prev + 1) % remaining.length);
  }, [current, remaining]);

  const handleSkip = useCallback(() => {
    setFlipped(false);
    setCurrentIndex((prev) => (prev + 1) % remaining.length);
  }, [remaining]);

  const handleReset = useCallback(() => {
    setCurrentIndex(0);
    setFlipped(false);
    setKnown([]);
    setStudying([]);
    setFinished(false);
  }, []);

  const progressPct = (known.length / Math.max(deckFiltered.length, 1)) * 100;

  return (
    <div className="viewer-container">
      {/* Header */}
      <div className="viewer-header">
        <button className="btn-back" onClick={onBack} style={{ marginBottom: "20px" }}>
          ← Back
        </button>
        <div className="deck-title">{deck.name}</div>
        <div className="deck-subtitle label">
          {deckFiltered.length} cards
          {selectedModule !== "All" ? ` · ${selectedModule}` : ""}
        </div>
      </div>

      {/* Module Filter */}
      {modules.length > 2 && (
        <div className="module-filter">
          {modules.map((mod) => (
            <button
              key={mod}
              className={`filter-btn${selectedModule === mod ? " active" : ""}`}
              onClick={() => handleModuleChange(mod)}
              style={
                selectedModule === mod
                  ? {
                      color: getAccent(mod === "All" ? null : mod),
                      borderColor: getAccent(mod === "All" ? null : mod),
                      background: `${getAccent(mod === "All" ? null : mod)}12`,
                    }
                  : {}
              }
            >
              {mod}
            </button>
          ))}
        </div>
      )}

      {/* Progress */}
      <div className="progress-wrap">
        <div className="progress-labels">
          <span>Progress</span>
          <span style={{ color: accent }}>
            {known.length} / {deckFiltered.length} known
          </span>
        </div>
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${progressPct}%`, background: accent }}
          />
        </div>
      </div>

      {/* Card / Finished */}
      {!finished && current ? (
        <>
          <div
            className={`flashcard${flipped ? " flipped" : ""}`}
            onClick={() => setFlipped((f) => !f)}
            style={{
              background: flipped
                ? "var(--bg-surface)"
                : "var(--bg-card)",
              borderColor: flipped
                ? `${accent}35`
                : "var(--border)",
              boxShadow: flipped
                ? `0 0 40px ${accent}12`
                : "none",
            }}
          >
            <div className="card-module-tag" style={{ color: accent }}>
              {current.module}
            </div>
            <div className="card-flip-hint">
              {flipped ? "Answer" : "Tap to flip"}
            </div>
            <div className="card-counter">
              {(currentIndex % remaining.length) + 1} of {remaining.length}
            </div>

            {flipped ? (
              <div className="card-back animate-in">{current.back}</div>
            ) : (
              <div className="card-front">{current.front}</div>
            )}
          </div>

          {/* Actions */}
          <div className="card-actions">
            {flipped ? (
              <>
                <button className="btn btn-ghost" onClick={handleStudyMore}>
                  ↺ Study More
                </button>
                <button
                  className="btn btn-primary"
                  onClick={handleGotIt}
                  style={{
                    borderColor: accent,
                    color: accent,
                    background: `${accent}12`,
                  }}
                >
                  ✓ Got It
                </button>
              </>
            ) : (
              <button
                className="btn btn-reveal"
                onClick={() => setFlipped(true)}
                style={{
                  borderColor: `${accent}40`,
                  color: accent,
                  background: `${accent}06`,
                }}
              >
                Reveal Answer
              </button>
            )}
          </div>

          {remaining.length > 1 && (
            <button className="btn-skip" onClick={handleSkip}>
              skip →
            </button>
          )}
        </>
      ) : finished ? (
        <div
          className="complete-screen"
          style={{
            borderColor: `${accent}30`,
            background: `${accent}04`,
          }}
        >
          <div className="complete-emoji">🎉</div>
          <div className="complete-title" style={{ color: accent }}>
            Deck Complete
          </div>
          <div className="complete-sub">
            You knew all {deckFiltered.length} cards!
          </div>
          <button
            className="btn btn-primary"
            onClick={handleReset}
            style={{
              borderColor: accent,
              color: accent,
              background: `${accent}12`,
            }}
          >
            Restart Deck
          </button>
        </div>
      ) : null}

      {/* Stats */}
      <div className="stats-bar">
        <span>
          Total: <span style={{ color: "var(--text-secondary)" }}>{deckFiltered.length}</span>
        </span>
        <span style={{ color: "var(--accent-green)" }}>✓ Known: {known.length}</span>
        <span style={{ color: "var(--accent-orange)" }}>↺ Review: {studying.length}</span>
      </div>
    </div>
  );
}
