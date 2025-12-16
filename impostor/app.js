// Impostor game (vanilla JS, no build step).
(() => {
  const root = document.getElementById("root");
  const resetBtn = document.getElementById("resetBtn");

  const WORDS = [
    // Animals
    "elefante","jirafa","tiburón","mariposa","cangrejo","águila","serpiente","delfín","pingüino","camaleón",
    "ardilla","ballena","leopardo","rinoceronte","murciélago","colibrí","pulpo","langosta","búho","caballo",
    // Objects
    "paraguas","teclado","reloj","mochila","lámpara","tijeras","martillo","cuchara","candado","espejo",
    "cepillo","teléfono","cámara","bicicleta","maleta","linterna","llave","botella","auriculares","manguera",
    // Plants / food-ish
    "orquídea","girasol","cactus","romero","albahaca","zanahoria","tomate","mango","piña","limón",
    "manzana","cereza","naranja","pepino","cebolla","ajo","perejil","coco","uva","papaya",
    // Verbs (infinitive)
    "correr","saltar","bailar","cantar","escribir","dibujar","cocinar","nadar","viajar","reír",
    "aprender","construir","buscar","romper","llorar","soñar","gritar","limpiar","contar","escuchar"
  ];

  const initialState = () => ({
    step: "setup", // setup | pass | afterAll | revealed
    numPlayers: 0,
    currentPlayer: 1,
    secretWord: "",
    impostorPlayer: 1,
    isWordVisible: false,
    hasSeenWord: false
  });

  let state = initialState();

  function clampInt(v, min, max) {
    const n = Number.parseInt(String(v), 10);
    if (Number.isNaN(n)) return min;
    return Math.max(min, Math.min(max, n));
  }

  function pickWord() {
    return WORDS[Math.floor(Math.random() * WORDS.length)];
  }

  function pickImpostor(numPlayers) {
    return 1 + Math.floor(Math.random() * numPlayers);
  }

  function resetToSetup() {
    state = initialState();
    render();
  }

  resetBtn.addEventListener("click", resetToSetup);

  // Service worker registration (best-effort).
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", async () => {
      try {
        await navigator.serviceWorker.register("./sw.js", { scope: "./" });
      } catch (_) {
        // Ignore (still playable online/offline depending on browser context).
      }
    });
  }

  function startGame(numPlayers) {
    const n = clampInt(numPlayers, 2, 30);
    state.numPlayers = n;
    state.secretWord = pickWord();
    state.impostorPlayer = pickImpostor(n);
    state.currentPlayer = 1;
    state.step = "pass";
    state.isWordVisible = false;
    state.hasSeenWord = false;
    render();
  }

  function revealWord() {
    state.isWordVisible = true;
    state.hasSeenWord = true;
    render();
  }

  function hideAndNext() {
    state.isWordVisible = false;

    if (state.currentPlayer < state.numPlayers) {
      state.currentPlayer += 1;
      state.hasSeenWord = false;
      render();
      return;
    }

    state.step = "afterAll";
    render();
  }

  function goRevealImpostor() {
    state.step = "revealed";
    render();
  }

  function templateSetup() {
    return `
      <h1>Juego de Impostor</h1>
      <p>Elige cuántos jugadores son. Luego pásense el celular: cada jugador verá una palabra… excepto uno que verá <strong>IMPOSTOR</strong>.</p>

      <div class="hr"></div>

      <label for="players">Cantidad de jugadores</label>
      <div class="row">
        <input id="players" type="number" min="2" max="30" inputmode="numeric" placeholder="Ej: 6" />
        <button id="startBtn" class="primary" type="button" disabled>Empezar</button>
      </div>

      <div class="spacer"></div>
      <div class="badge">Tip: para jugar sin internet, abre una vez la app y luego pon modo avión.</div>
    `;
  }

  function templatePass() {
    const i = state.currentPlayer;
    const n = state.numPlayers;
    const isImpostor = i === state.impostorPlayer;

    const wordToShow = isImpostor ? "IMPOSTOR" : state.secretWord;
    const wordClass = isImpostor ? "impostor" : "normal";
    const subtitle = `Jugador ${i} de ${n}`;

    const hiddenBlock = `
      <h2>${subtitle}</h2>
      <h1>¿Listo?</h1>
      <p><strong>Jugador ${i}</strong>, toca el botón para ver tu palabra. No dejes que otros la vean.</p>
      <div class="row">
        <button id="showBtn" class="primary" type="button">Ver palabra</button>
      </div>
      <div class="smallNote">Después de leerla, toca “Ocultar y pasar”.</div>
    `;

    const visibleBlock = `
      <h2>${subtitle}</h2>
      <h1>Tu palabra</h1>

      <div class="wordBox">
        <div class="word ${wordClass}">${wordToShow}</div>
        <div class="smallNote">${isImpostor ? "Tu misión: no te delates 😈" : "Memorízala rápido 👀"}</div>
      </div>

      <div class="spacer"></div>
      <div class="row">
        <button id="hideNextBtn" class="danger" type="button">Ocultar y pasar</button>
      </div>
    `;

    return state.isWordVisible ? visibleBlock : hiddenBlock;
  }

  function templateAfterAll() {
    return `
      <h2>Todos listos</h2>
      <h1>Ahora discutan 👀</h1>
      <p>Cuando quieran, toquen el botón para revelar quién era el impostor.</p>

      <div class="row">
        <button id="revealBtn" class="primary" type="button">Revelar impostor</button>
        <button id="newBtn" type="button">Nuevo juego</button>
      </div>
    `;
  }

  function templateRevealed() {
    return `
      <h2>Resultado</h2>
      <h1>El impostor era el Jugador ${state.impostorPlayer}</h1>
      <div class="wordBox">
        <div class="smallNote">La palabra real era</div>
        <div class="word normal">${state.secretWord}</div>
      </div>

      <div class="spacer"></div>
      <div class="row">
        <button id="againBtn" class="primary" type="button">Jugar otra vez</button>
      </div>
    `;
  }

  function wireSetup() {
    const input = document.getElementById("players");
    const btn = document.getElementById("startBtn");

    const update = () => {
      const val = Number.parseInt(input.value, 10);
      btn.disabled = !(Number.isFinite(val) && val >= 2 && val <= 30);
    };

    input.addEventListener("input", update);
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !btn.disabled) btn.click();
    });

    btn.addEventListener("click", () => startGame(input.value));
    input.focus();
  }

  function wirePass() {
    const showBtn = document.getElementById("showBtn");
    const hideNextBtn = document.getElementById("hideNextBtn");

    if (showBtn) showBtn.addEventListener("click", revealWord);
    if (hideNextBtn) hideNextBtn.addEventListener("click", hideAndNext);
  }

  function wireAfterAll() {
    const revealBtn = document.getElementById("revealBtn");
    const newBtn = document.getElementById("newBtn");

    revealBtn.addEventListener("click", goRevealImpostor);
    newBtn.addEventListener("click", resetToSetup);
  }

  function wireRevealed() {
    const againBtn = document.getElementById("againBtn");
    againBtn.addEventListener("click", resetToSetup);
  }

  function render() {
    if (state.step === "setup") {
      root.innerHTML = templateSetup();
      wireSetup();
      return;
    }

    if (state.step === "pass") {
      root.innerHTML = templatePass();
      wirePass();
      return;
    }

    if (state.step === "afterAll") {
      root.innerHTML = templateAfterAll();
      wireAfterAll();
      return;
    }

    if (state.step === "revealed") {
      root.innerHTML = templateRevealed();
      wireRevealed();
      return;
    }
  }

  render();
})();
