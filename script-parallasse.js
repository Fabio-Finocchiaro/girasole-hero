/* =========================================================
   Girasole che ruota con lo scroll — VERSIONE PARALLASSE
   Il fiore parte grande e al centro, poi si allontana (zoom out)
   e scivola al suo posto mentre ruota. La scritta si muove a
   una velocità diversa: da qui la sensazione di profondità.
   Come funziona, in breve:
   1. carica tutti i fotogrammi della sequenza;
   2. calcola quanto hai scrollato dentro la hero (da 0 a 1);
   3. disegna il fotogramma corrispondente, come lo scrubbing
      sulla timeline di After Effects.
   ========================================================= */

// ---------- IMPOSTAZIONI (qui si fanno le prove) ----------
const IMPOSTAZIONI = {
  numeroFotogrammi: 150,     // Girasole_00000 … 00149
  // a che punto dello scroll (0 = inizio, 1 = fine) il fiore ha finito di girare
  fineRotazione: 0.85,
  // morbidezza: 1 = segue lo scroll secco, 0.1 = molto fluido
  morbidezza: 0.18,
  // quando compare ogni parola: [inizio, fine] della comparsa
  parole: [
    [0.20, 0.34],  // IS
    [0.30, 0.44],  // GONNA
    [0.42, 0.56],  // BE
    [0.52, 0.66],  // REAL
  ],
  // ---- PARALLASSE ----
  zoomIniziale: 1.4,   // quanto è ingrandito il fiore all'inizio (1 = grandezza finale)
  fineZoom: 0.70,      // a che punto dello scroll il fiore è arrivato al suo posto
  centroTesta: [0.5, 0.22], // dove sta la testa nel fotogramma (0-1 in larghezza e altezza)
  spostamentoScritta: 0.10, // la scritta arriva da destra per il 10% della larghezza
};

// sul telefono (o schermi piccoli) usa la versione leggera dei fotogrammi
const cartella = window.CARTELLA_FOTOGRAMMI || ((window.innerWidth < 768 && window.devicePixelRatio < 3)
  ? "images/frames/mobile/"
  : "images/frames/desktop/");
const percorso = (i) => `${cartella}girasole_${String(i).padStart(3, "0")}.webp`;

const hero = document.getElementById("hero");
const canvas = document.getElementById("girasole");
const ctx = canvas.getContext("2d");
const loader = document.getElementById("loader");
const hint = document.getElementById("hint");
const parole = [...document.querySelectorAll(".word img")];
const fiore = document.querySelector(".flower");
const motto = document.querySelector(".motto");
const stage = document.querySelector(".stage");
let partenza = { dx: 0, dy: 0 };
let base = "";   // quanto spostare il fiore per metterlo al centro
const riduciMovimento = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const fotogrammi = new Array(IMPOSTAZIONI.numeroFotogrammi);
let caricati = 0;
let attuale = 0;        // fotogramma mostrato (con decimali, per la morbidezza)
let obiettivo = 0;      // fotogramma richiesto dallo scroll
let ultimoDisegnato = -1;

// ---------- 1. CARICAMENTO ----------
function carica(i) {
  return new Promise((ok) => {
    const img = new Image();
    img.decoding = "async";
    img.onload = img.onerror = () => {
      fotogrammi[i] = img.naturalWidth ? img : null;
      caricati++;
      loader.textContent = Math.round((caricati / IMPOSTAZIONI.numeroFotogrammi) * 100) + "%";
      ok();
    };
    img.src = percorso(i);
  });
}

async function caricaTutto() {
  await carica(0);            // prima il fotogramma iniziale, per mostrare subito il fiore
  ridimensiona();
  // poi gli altri, 6 alla volta
  const coda = [...Array(IMPOSTAZIONI.numeroFotogrammi).keys()].slice(1);
  const lavoratori = Array.from({ length: 6 }, async () => {
    while (coda.length) await carica(coda.shift());
  });
  await Promise.all(lavoratori);
  loader.style.opacity = 0;
  if (window.scrollY < 10) hint.style.opacity = 1;
}

// ---------- 2. QUANTO HO SCROLLATO NELLA HERO ----------
function progresso() {
  const r = hero.getBoundingClientRect();
  const corsa = hero.offsetHeight - window.innerHeight;
  return Math.min(1, Math.max(0, -r.top / corsa));
}

// da un intervallo [a, b] a un valore 0→1, con partenza e arrivo morbidi
function tratto(p, a, b) {
  const t = Math.min(1, Math.max(0, (p - a) / (b - a)));
  return t * t * (3 - 2 * t);
}

// ---------- 3. DISEGNO ----------
// misura dove si trova la testa del fiore e dove sta il centro della tavola
function misuraParallasse() {
  // sul telefono il fiore è centrato con translateX(-50%)
  const verticale = window.matchMedia("(orientation: portrait)").matches;
  base = verticale ? "translateX(-50%)" : "";
  const f = fiore.offsetLeft - (verticale ? fiore.offsetWidth / 2 : 0);
  const t = fiore.offsetTop;   // posizione finale (senza trasformazioni)
  const [cx, cy] = IMPOSTAZIONI.centroTesta;
  const testaX = f + fiore.offsetWidth * cx;
  const testaY = t + fiore.offsetHeight * cy;
  partenza.dx = stage.offsetWidth / 2 - testaX;
  partenza.dy = stage.offsetHeight / 2 - testaY;
  fiore.style.transformOrigin = `${cx * 100}% ${cy * 100}%`;
}

function ridimensiona() {
  misuraParallasse();
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.round(canvas.clientWidth * dpr);
  canvas.height = Math.round(canvas.clientHeight * dpr);
  ultimoDisegnato = -1;
  disegna(Math.round(attuale));
}

function disegna(i) {
  // se il fotogramma non è ancora arrivato, usa il più vicino già caricato
  let img = fotogrammi[i];
  for (let d = 1; !img && d < IMPOSTAZIONI.numeroFotogrammi; d++) {
    img = fotogrammi[i - d] || fotogrammi[i + d];
  }
  if (!img || i === ultimoDisegnato) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  ultimoDisegnato = fotogrammi[i] ? i : -1;
}

function aggiorna() {
  const p = progresso();

  // girasole
  const ultimo = IMPOSTAZIONI.numeroFotogrammi - 1;
  obiettivo = tratto(p, 0, IMPOSTAZIONI.fineRotazione) * ultimo;
  attuale += (obiettivo - attuale) * IMPOSTAZIONI.morbidezza;
  if (Math.abs(obiettivo - attuale) < 0.05) attuale = obiettivo;
  disegna(Math.round(attuale));

  // PARALLASSE: il fiore parte grande e centrato, poi si allontana e va al suo posto
  const z = riduciMovimento ? 1 : tratto(p, 0, IMPOSTAZIONI.fineZoom);   // 0 → 1
  const resto = 1 - z;
  const scala = 1 + (IMPOSTAZIONI.zoomIniziale - 1) * resto;
  fiore.style.transform = `${base} translate(${partenza.dx * resto}px, ${partenza.dy * resto}px) scale(${scala})`;

  // la scritta arriva da destra più lentamente del fiore (livello più lontano)
  const sx = stage.offsetWidth * IMPOSTAZIONI.spostamentoScritta * resto;
  motto.style.transform = `translate(${sx}px, ${sx * 0.25}px)`;

  // scritta: ogni parola sale dal basso nel suo tratto di scroll
  parole.forEach((el, k) => {
    const [a, b] = IMPOSTAZIONI.parole[k];
    el.style.setProperty("--in", riduciMovimento ? 1 : tratto(p, a, b).toFixed(3));
  });

  if (p > 0.01) hint.style.opacity = 0;
  requestAnimationFrame(aggiorna);
}

// ---------- AVVIO ----------
if (riduciMovimento) IMPOSTAZIONI.morbidezza = 1;
window.addEventListener("resize", ridimensiona);
caricaTutto();
requestAnimationFrame(aggiorna);

/* =========================================================
   PUNTATORE: stella gialla che segue il mouse.
   In movimento si rimpicciolisce (fino a -50%),
   da fermo cresce (fino a +50%).
   ========================================================= */
const CURSORE = {
  piuPiccolo: 0.5,     // scala quando ti muovi veloce (-50%)
  piuGrande: 1.5,      // scala quando sei fermo (+50%)
  velocitaMax: 30,     // pixel per fotogramma oltre i quali è al minimo
  morbidezza: 0.12,    // quanto velocemente cambia grandezza
};

const cursore = document.getElementById("cursore");
const mouseVero = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

if (cursore && mouseVero && !riduciMovimento) {
  let x = -100, y = -100, px = x, py = y;
  let velocita = 0, scala = CURSORE.piuGrande;

  window.addEventListener("mousemove", (e) => {
    x = e.clientX; y = e.clientY;
    document.documentElement.classList.add("cursore-attivo");
  });
  document.addEventListener("mouseleave", () =>
    document.documentElement.classList.remove("cursore-attivo"));

  (function muovi() {
    const passo = Math.hypot(x - px, y - py);
    px = x; py = y;
    velocita += (passo - velocita) * 0.2;                 // velocità "ammorbidita"
    const t = Math.min(1, velocita / CURSORE.velocitaMax); // 0 = fermo, 1 = veloce
    const obiettivo = CURSORE.piuGrande - t * (CURSORE.piuGrande - CURSORE.piuPiccolo);
    scala += (obiettivo - scala) * CURSORE.morbidezza;
    cursore.style.transform = `translate(${x}px, ${y}px) scale(${scala.toFixed(3)})`;
    requestAnimationFrame(muovi);
  })();
}
