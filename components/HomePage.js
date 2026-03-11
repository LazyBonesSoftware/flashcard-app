import { useState, useEffect, useRef, useCallback } from "react";
import { getDecks, saveDeck, deleteDeck, genId } from "../lib/storage";
import { generateFlashcards } from "../lib/generate";
import { DEFAULT_DECK, PROVIDERS } from "../lib/data";

export default function HomePage({ onOpenDeck }) {
  const [decks, setDecks] = useState([]);

  // AI generation state
  const [provider, setProvider] = useState("anthropic");
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [notes, setNotes] = useState("");
  const [fileName, setFileName] = useState("");
  const [cardCount, setCardCount] = useState(20);
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState("");
  const [genSuccess, setGenSuccess] = useState("");

  // Manual creation state
  const [manualFront, setManualFront] = useState("");
  const [manualBack, setManualBack] = useState("");
  const [manualModule, setManualModule] = useState("");
  const [manualDeckName, setManualDeckName] = useState("");
  const [manualCards, setManualCards] = useState([]);
  const [manualMsg, setManualMsg] = useState("");

  // Drag-over state for file upload
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef(null);

  // Load decks on mount
  useEffect(() => {
    setDecks(getDecks());
  }, []);

  const refreshDecks = useCallback(() => {
    setDecks(getDecks());
  }, []);

  // ── File Handling ────────────────────────────────────────────────────────────

  async function handleFile(file) {
    if (!file) return;
    setFileName(file.name);
    const ext = file.name.split(".").pop().toLowerCase();
    if (["txt", "md"].includes(ext)) {
      const text = await file.text();
      setNotes(text);
    } else if (ext === "pdf") {
      setNotes(`[PDF uploaded: ${file.name}]\n\nPlease paste your notes in the text area below as well, since PDF text extraction is not available in this browser tool.`);
    } else {
      setNotes("");
      setFileName("");
      setGenError("Unsupported file type. Use .txt or .md files.");
    }
  }

  function onFileInput(e) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = "";
  }

  function onDrop(e) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }

  // ── AI Generation ────────────────────────────────────────────────────────────

  async function handleGenerate() {
    setGenError("");
    setGenSuccess("");

    if (!notes.trim()) {
      setGenError("Please upload a file or paste your lecture notes.");
      return;
    }
    if (!apiKey.trim()) {
      setGenError("Please enter your API key.");
      return;
    }

    setGenerating(true);
    try {
      const result = await generateFlashcards({
        provider,
        apiKey,
        notes,
        count: cardCount,
      });

      const newDeck = {
        id: genId(),
        name: result.deckName || "Generated Deck",
        createdAt: new Date().toISOString(),
        cards: result.cards,
      };

      saveDeck(newDeck);
      refreshDecks();
      setGenSuccess(
        `✓ Created "${newDeck.name}" with ${newDeck.cards.length} cards!`
      );
      setNotes("");
      setFileName("");
    } catch (err) {
      console.error(err);
      setGenError(err.message || "Something went wrong. Check your API key and try again.");
    } finally {
      setGenerating(false);
    }
  }

  // ── Manual Creation ──────────────────────────────────────────────────────────

  function addCard() {
    if (!manualFront.trim() || !manualBack.trim()) {
      setManualMsg("Please fill in both sides of the card.");
      return;
    }
    const card = {
      id: manualCards.length + 1,
      module: manualModule.trim() || "General",
      front: manualFront.trim(),
      back: manualBack.trim(),
    };
    setManualCards((prev) => [...prev, card]);
    setManualFront("");
    setManualBack("");
    setManualMsg(`Card added. (${manualCards.length + 1} total)`);
  }

  function saveManualDeck() {
    if (manualCards.length === 0) {
      setManualMsg("Add at least one card first.");
      return;
    }
    const name = manualDeckName.trim() || "My Deck";
    const deck = {
      id: genId(),
      name,
      createdAt: new Date().toISOString(),
      cards: manualCards,
    };
    saveDeck(deck);
    refreshDecks();
    setManualCards([]);
    setManualDeckName("");
    setManualModule("");
    setManualMsg(`✓ Saved "${name}" with ${deck.cards.length} cards!`);
  }

  // ── Delete ───────────────────────────────────────────────────────────────────

  function handleDelete(id, e) {
    e.stopPropagation();
    if (confirm("Delete this deck?")) {
      deleteDeck(id);
      refreshDecks();
    }
  }

  const providerInfo = PROVIDERS.find((p) => p.id === provider);

  return (
    <div className="home-container">
      {/* Header */}
      <header className="home-header">
        <h1 className="home-logo">
          FLASH<span>CARDS</span>
        </h1>
        <p className="home-tagline">AI-powered study cards</p>
      </header>

      {/* ── SECTION 1: Decks ── */}
      <div className="section-header">
        <span className="section-num">01</span>
        <span className="section-title">Your Decks</span>
        <div className="section-line" />
      </div>

      {decks.length > 0 ? (
        <div className="deck-list">
          {decks.map((d) => (
            <div
              key={d.id}
              className="deck-item"
              onClick={() => onOpenDeck(d)}
            >
              <div className="deck-item-info">
                <div className="deck-item-name">{d.name}</div>
                <div className="deck-item-meta">
                  {d.createdAt
                    ? new Date(d.createdAt).toLocaleDateString()
                    : ""}
                </div>
              </div>
              <div className="deck-item-actions">
                <span className="deck-count">{d.cards?.length ?? 0} cards</span>
                <button
                  className="btn-delete"
                  onClick={(e) => handleDelete(d.id, e)}
                  title="Delete deck"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state" style={{ marginBottom: "32px" }}>
          <div className="empty-icon">📚</div>
          <div className="empty-text">
            No decks yet. Generate one with AI or create manually below.
          </div>
        </div>
      )}

      {/* ── SECTION 2: AI Generation ── */}
      <div className="section-header">
        <span className="section-num">02</span>
        <span className="section-title">Generate with AI</span>
        <div className="section-line" />
      </div>

      <div className="panel">
        {/* Upload Zone */}
        <label
          className={`upload-zone${dragOver ? " drag-over" : ""}`}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          htmlFor="file-upload"
        >
          <span className="upload-icon">📄</span>
          <div className="upload-title">
            {fileName ? fileName : "Drop lecture notes here"}
          </div>
          <div className="upload-sub">
            .txt or .md files · or paste below
          </div>
          <input
            id="file-upload"
            type="file"
            accept=".txt,.md"
            onChange={onFileInput}
            ref={fileRef}
          />
        </label>

        {fileName && (
          <div className="file-chip">
            📎 {fileName}
            <button
              onClick={() => { setFileName(""); setNotes(""); }}
              title="Remove file"
            >
              ✕
            </button>
          </div>
        )}

        {/* Notes textarea */}
        <textarea
          className="notes-textarea"
          style={{ marginTop: "16px" }}
          placeholder="Paste your lecture notes here…"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={6}
        />

        {/* Divider */}
        <div className="divider">
          <div className="divider-line" />
          <span className="divider-text">AI Settings</span>
          <div className="divider-line" />
        </div>

        {/* Provider + Key */}
        <div className="api-row">
          <select
            className="api-select"
            value={provider}
            onChange={(e) => setProvider(e.target.value)}
          >
            {PROVIDERS.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <div style={{ position: "relative", flex: 1, display: "flex", gap: "8px" }}>
            <input
              className="api-input"
              type={showKey ? "text" : "password"}
              placeholder={providerInfo?.placeholder || "API Key"}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              autoComplete="off"
              spellCheck={false}
            />
            <button
              onClick={() => setShowKey((s) => !s)}
              style={{
                background: "var(--bg-surface)",
                border: "1px solid var(--border)",
                borderRadius: "6px",
                color: "var(--text-muted)",
                padding: "0 12px",
                fontSize: "12px",
                whiteSpace: "nowrap",
                cursor: "pointer",
              }}
            >
              {showKey ? "Hide" : "Show"}
            </button>
          </div>
        </div>

        <p className="api-note">
          Your API key is used directly from your browser and never stored or sent to our servers. Each person must enter their own key.
        </p>

        {/* Card Count */}
        <div className="count-row">
          <span className="count-label">Number of cards:</span>
          <input
            className="count-input"
            type="number"
            min={5}
            max={80}
            value={cardCount}
            onChange={(e) => setCardCount(Math.max(5, Math.min(80, parseInt(e.target.value) || 20)))}
          />
          <span className="label" style={{ color: "var(--text-muted)" }}>
            (5 – 80)
          </span>
        </div>

        {genError && <div className="msg msg-error">{genError}</div>}
        {genSuccess && <div className="msg msg-success">{genSuccess}</div>}

        <button
          className={`btn-generate${generating ? " loading" : ""}`}
          onClick={handleGenerate}
          disabled={generating}
        >
          {generating ? "" : "⚡ Generate Flashcards"}
        </button>

        {generating && (
          <div className="generating-wrap">
            <div className="generating-dots">
              <span /><span /><span />
            </div>
            <span style={{ fontSize: "11px", letterSpacing: "2px", color: "var(--text-muted)" }}>
              GENERATING CARDS…
            </span>
          </div>
        )}
      </div>

      {/* ── SECTION 3: Manual Creation ── */}
      <div className="section-header">
        <span className="section-num">03</span>
        <span className="section-title">Create Manually</span>
        <div className="section-line" />
      </div>

      <div className="panel">
        <div className="manual-form">
          {/* Deck name */}
          <input
            className="form-input"
            placeholder="Deck name (e.g. 'Week 5 — Databases')"
            value={manualDeckName}
            onChange={(e) => setManualDeckName(e.target.value)}
          />

          {/* Module / group */}
          <input
            className="form-input"
            placeholder="Module / group (e.g. 'Chapter 3')"
            value={manualModule}
            onChange={(e) => setManualModule(e.target.value)}
          />

          {/* Front & Back */}
          <textarea
            className="form-textarea"
            placeholder="Front — question or prompt"
            value={manualFront}
            onChange={(e) => setManualFront(e.target.value)}
            rows={3}
          />
          <textarea
            className="form-textarea"
            placeholder="Back — answer"
            value={manualBack}
            onChange={(e) => setManualBack(e.target.value)}
            rows={3}
          />

          <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", flexWrap: "wrap" }}>
            <button className="btn-add-card" onClick={addCard}>
              + Add Card
            </button>
            <button
              className="btn-add-card"
              onClick={saveManualDeck}
              style={{
                borderColor: "rgba(180,79,255,0.4)",
                color: "var(--accent-purple)",
                background: "rgba(180,79,255,0.07)",
              }}
            >
              💾 Save Deck
            </button>
          </div>

          {manualCards.length > 0 && (
            <div className="msg msg-info">
              {manualCards.length} card{manualCards.length !== 1 ? "s" : ""} in queue — click "Save Deck" when done.
            </div>
          )}

          {manualMsg && (
            <div
              className={`msg ${manualMsg.startsWith("✓") ? "msg-success" : "msg-info"}`}
            >
              {manualMsg}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
