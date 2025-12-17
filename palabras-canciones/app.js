(() => {
  // words.js defines: WORDS_ALL, WORDS_FAMILY, WORDS_SLANG
  const elWord = document.getElementById("word");
  const elMeta = document.getElementById("meta");
  const elHistory = document.getElementById("history");
  const btnNew = document.getElementById("newBtn");
  const btnUndo = document.getElementById("undoBtn");
  const btnReset = document.getElementById("resetBtn");
  const btnCopy = document.getElementById("copyBtn");
  const btnClear = document.getElementById("clearHistoryBtn");
  const chkFamily = document.getElementById("familyMode");
  const chkSlang = document.getElementById("includeSlang");

  const state = {
    stack: [],
    idx: -1,
  };

  function getPool() {
    let pool = WORDS_ALL;
    const family = chkFamily.checked;
    const slang = chkSlang.checked;

    if (family) pool = WORDS_FAMILY;
    if (slang) pool = pool.concat(WORDS_SLANG);

    // Deduplicate in case of overlap
    return Array.from(new Set(pool));
  }

  function pickWord() {
    const pool = getPool();
    const w = pool[Math.floor(Math.random() * pool.length)];
    return w;
  }

  function renderHistory() {
    elHistory.innerHTML = "";
    if (state.stack.length === 0) {
      elHistory.innerHTML = '<span class="muted">Aún no hay historial.</span>';
      return;
    }

    const shown = state.stack.slice().reverse().slice(0, 30); // last 30
    for (const w of shown) {
      const pill = document.createElement("span");
      pill.className = "pill";
      pill.textContent = w;
      elHistory.appendChild(pill);
    }
  }

  function showCurrent() {
    const w = state.idx >= 0 ? state.stack[state.idx] : "—";
    elWord.textContent = w || "—";
    elMeta.textContent =
      w === "—"
        ? ""
        : `Banco actual: ${getPool().length} palabras • Historial: ${state.stack.length}`;

    btnUndo.disabled = state.idx <= 0;
    renderHistory();
  }

  function pushNew() {
    const w = pickWord();

    // If user undid and then generates a new word, truncate "future".
    if (state.idx < state.stack.length - 1) {
      state.stack = state.stack.slice(0, state.idx + 1);
    }

    state.stack.push(w);
    state.idx = state.stack.length - 1;
    showCurrent();
  }

  function undo() {
    if (state.idx > 0) state.idx -= 1;
    showCurrent();
  }

  function resetAll() {
    state.stack = [];
    state.idx = -1;
    showCurrent();
  }

  async function copyWord() {
    const w = state.idx >= 0 ? state.stack[state.idx] : "";
    if (!w) return;

    try {
      await navigator.clipboard.writeText(w);
      elMeta.textContent = `✅ Copiado: ${w}`;
      setTimeout(showCurrent, 900);
    } catch {
      elMeta.textContent = "No se pudo copiar (tu navegador lo bloqueó).";
      setTimeout(showCurrent, 1200);
    }
  }

  // Service worker registration (best-effort).
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", async () => {
      try {
        await navigator.serviceWorker.register("./sw.js", { scope: "./" });
      } catch (_) {}
    });
  }

  btnNew.addEventListener("click", pushNew);
  btnUndo.addEventListener("click", undo);
  btnReset.addEventListener("click", resetAll);
  btnCopy.addEventListener("click", copyWord);
  btnClear.addEventListener("click", resetAll);

  function onModeChange() {
    // Keep current word but update meta + pool size; if no word yet, keep dash.
    showCurrent();
  }

  chkFamily.addEventListener("change", onModeChange);
  chkSlang.addEventListener("change", onModeChange);

  // Start with a word right away
  pushNew();
})();
