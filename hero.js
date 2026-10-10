/* =========================================================
   Girasole — VERSIONE PARALLASSE, ANIMAZIONE AUTOMATICA
   - IN DISCESA dall'inizio della pagina: al primo gesto di scroll
     (rotellina, trackpad, dito, frecce, barra spaziatrice) la pagina
     scorre DA SOLA fino alla fine della hero in "durata" ms e
     l'animazione si esegue in modo fluido;
   - IN SALITA: l'animazione segue lo scroll a mano, come prima
     (si "riavvolge"); tornati in cima, il prossimo scroll in giù
     riparte da solo.
   Il fiore parte grande e al centro, poi si allontana (zoom out)
   e scivola al suo posto mentre ruota. La scritta si muove a
   una velocità diversa: da qui la sensazione di profondità.
   Come funziona, in breve:
   1. carica tutti i fotogrammi della sequenza;
   2. calcola quanto hai scrollato dentro la hero (da 0 a 1);
   3. disegna il fotogramma corrispondente, come lo scrubbing
      sulla timeline di After Effects.
   [P7] VERSIONE PROPOSTA: identica a script.js, ma l'animazione della
   hero e il puntatore si fermano quando non c'è niente da aggiornare
   (hero fuori dallo schermo, mouse fermo). Prima giravano 60 volte al
   secondo per sempre, anche in fondo alla pagina: ora il computer lavora
   meno e la batteria dura di più. Nessuna differenza visibile.
   ========================================================= */

// ---------- IMPOSTAZIONI (qui si fanno le prove) ----------
const IMPOSTAZIONI = {
  numeroFotogrammi: 150,     // Girasole_00000 … 00149
  // ⇩ quanto dura l'animazione AUTOMATICA (dal primo scroll in giù alla tappa finale)
  durata: 2500,              // ms
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
const loader = document.getElementById("loader");               // schermata nera di caricamento
const numeroLoader = document.getElementById("loader-numero");  // il numero da 1 a 100
const radice = document.documentElement;
const hint = document.getElementById("hint");
const parole = [...document.querySelectorAll(".word img, .word svg")];
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
  // il resto (dissolvenza della schermata nera, "Scorri ↓") lo fa il conteggio qui sotto
}

// ---------- 1b. SCHERMATA DI CARICAMENTO ----------
// Schermo nero con il numero e l'asterisco al centro (Figma: "CARICAMENTO"): conta da 1 a 100
// seguendo i fotogrammi che arrivano, ma non più veloce di "durataMinima" (altrimenti, con i
// fotogrammi già in memoria, sarebbe un lampo). A 100 resta ferma un attimo, poi si dissolve
// sul sito e compare "Scorri ↓". Mentre conta la pagina non scorre.
const CARICAMENTO = {
  durataMinima: 1800,   // ms: tempo minimo del conteggio
  pausaFinale: 350,     // ms: quanto resta il 100* prima di sparire
  ritardoScorri: 1000,  // ms: quanto aspetta "Scorri ↓" dopo la comparsa del sito
  dissolvenza: 700,     // ms: uguale alla transizione di .caricamento in style.css
};
function mostraCaricamento() {
  if (!loader || !numeroLoader) { tuttoCaricato = true; return; }
  const durata = riduciMovimento ? 0 : CARICAMENTO.durataMinima;
  radice.classList.add("caricamento-attivo");
  const t0 = performance.now();
  const passo = (ora) => {
    const reale = (caricati / IMPOSTAZIONI.numeroFotogrammi) * 100;
    const neTempo = durata ? Math.min(100, ((ora - t0) / durata) * 100) : 100;
    const valore = Math.max(1, Math.floor(Math.min(reale, neTempo)));
    numeroLoader.textContent = valore;
    if (valore >= 100) setTimeout(rivelaSito, riduciMovimento ? 0 : CARICAMENTO.pausaFinale);
    else requestAnimationFrame(passo);
  };
  requestAnimationFrame(passo);
}
function rivelaSito() {
  radice.classList.remove("caricamento-attivo");   // la pagina può scorrere
  loader.classList.add("finito");                  // la schermata nera si dissolve
  setTimeout(() => {
    tuttoCaricato = true;
    if (stato === "attesa") {
      if (richiesta) avviaAnimazione();            // aveva già provato a scorrere: parte subito
      else setTimeout(() => {                      // altrimenti, qualche istante dopo, compare "Scorri ↓"
        if (stato === "attesa" && !richiesta) hint.style.opacity = 1;
      }, riduciMovimento ? 0 : CARICAMENTO.ritardoScorri);
    }
  }, riduciMovimento ? 0 : CARICAMENTO.dissolvenza * 0.6);
  setTimeout(() => loader.remove(), CARICAMENTO.dissolvenza + 100);
}

// ---------- 2. QUANTO HO SCROLLATO NELLA HERO ----------
// l'animazione segue lo scroll (come prima): così tornando su si "riavvolge" a mano.
// Il tratto di scroll finisce esattamente all'ultima tappa: niente zone morte.
const ultimaTappa = Math.max(IMPOSTAZIONI.fineRotazione, IMPOSTAZIONI.fineZoom, ...IMPOSTAZIONI.parole.map((t) => t[1]));
const corsaHero = () => hero.offsetHeight - window.innerHeight;
function progresso() {
  const r = hero.getBoundingClientRect();
  return Math.min(1, Math.max(0, -r.top / corsaHero())) * ultimaTappa;
}

// ---------- AUTOMATICO IN DISCESA ----------
// dall'inizio della pagina, il primo gesto verso il basso fa scorrere la pagina DA SOLA fino
// alla fine della hero in "durata" ms (l'animazione si esegue mentre scorre); intanto la pagina
// non risponde ad altri gesti. Tornando su invece si scorre a mano. Di nuovo in cima: si riparte.
let stato = "attesa";        // "attesa" (in cima) → "automatico" → "manuale"
let richiesta = false, tuttoCaricato = false, animAuto = 0;

function avviaAnimazione() {
  if (stato !== "attesa") return;
  if (!tuttoCaricato) { richiesta = true; return; }   // parte appena i fotogrammi sono pronti
  stato = "automatico";
  hint.style.opacity = 0;
  const da = window.scrollY;
  const a = hero.offsetTop + corsaHero();
  const t0 = performance.now();
  const curva = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);   // parte e arriva morbida
  const passo = (ora) => {
    const t = Math.min(1, (ora - t0) / IMPOSTAZIONI.durata);
    window.scrollTo({ top: da + (a - da) * curva(t), behavior: "instant" });
    if (t < 1) animAuto = requestAnimationFrame(passo);
    else stato = "manuale";
  };
  animAuto = requestAnimationFrame(passo);
}

const inCima = () => window.scrollY <= 2;
window.addEventListener("wheel", (e) => {
  if (stato === "automatico") { e.preventDefault(); return; }
  if (stato === "attesa" && e.deltaY > 0 && inCima()) { e.preventDefault(); avviaAnimazione(); }
}, { passive: false });
let toccoY = null;
window.addEventListener("touchstart", (e) => { toccoY = e.touches[0].clientY; }, { passive: true });
window.addEventListener("touchmove", (e) => {
  if (stato === "automatico") { e.preventDefault(); return; }
  if (stato !== "attesa" || toccoY === null || !inCima()) return;
  const su = toccoY - e.touches[0].clientY;      // > 0 = il dito va su = la pagina andrebbe giù
  if (su > 0) e.preventDefault();
  if (su > 10) avviaAnimazione();
}, { passive: false });
window.addEventListener("keydown", (e) => {
  const giu = ["ArrowDown", "PageDown", " ", "End"].includes(e.key);
  if (stato === "automatico" && (giu || ["ArrowUp", "PageUp", "Home"].includes(e.key))) { e.preventDefault(); return; }
  if (stato === "attesa" && giu && inCima()) { e.preventDefault(); avviaAnimazione(); }
});
window.addEventListener("scroll", () => {
  if (stato === "automatico") return;
  if (inCima()) stato = "attesa";            // tornati in cima: il prossimo scroll in giù riparte da solo
  else if (stato === "attesa") stato = "manuale";   // scesi in altro modo (link, barra di scorrimento…)
}, { passive: true });
if (!inCima() || riduciMovimento) stato = "manuale";

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

  // la scritta è "in transizione" finché non è arrivata al suo posto con tutte le parole:
  // in quella fase mescola.js non rimescola le lettere
  const ferma = resto === 0 && parole.every((el) => el.style.getPropertyValue("--in") === "1.000" || riduciMovimento);
  motto.classList.toggle("in-transizione", !ferma);

  if (p > 0.01) hint.style.opacity = 0;

  // [P7] continuo solo se la hero è vicina allo schermo o il fiore deve ancora arrivare al fotogramma giusto
  if (heroVicina || attuale !== obiettivo) requestAnimationFrame(aggiorna);
  else inCorsaHero = false;
}

// [P7] il ciclo della hero gira solo quando serve
let heroVicina = true, inCorsaHero = false;
function avviaHero() {
  if (inCorsaHero) return;
  inCorsaHero = true;
  requestAnimationFrame(aggiorna);
}
new IntersectionObserver((voci) => {
  heroVicina = voci.some((v) => v.isIntersecting);
  if (heroVicina) avviaHero();
}, { rootMargin: "100px 0px" }).observe(hero);

// ---------- AVVIO ----------
if (riduciMovimento) IMPOSTAZIONI.morbidezza = 1;
window.addEventListener("resize", ridimensiona);
mostraCaricamento();
caricaTutto();
avviaHero();

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

  let inCorsaCursore = false;   // [P7]
  const avviaCursore = () => {
    if (inCorsaCursore) return;
    inCorsaCursore = true;
    requestAnimationFrame(muovi);
  };

  window.addEventListener("mousemove", (e) => {
    x = e.clientX; y = e.clientY;
    document.documentElement.classList.add("cursore-attivo");
    avviaCursore();
  });
  document.addEventListener("mouseleave", () =>
    document.documentElement.classList.remove("cursore-attivo"));

  function muovi() {
    const passo = Math.hypot(x - px, y - py);
    px = x; py = y;
    velocita += (passo - velocita) * 0.2;                 // velocità "ammorbidita"
    const t = Math.min(1, velocita / CURSORE.velocitaMax); // 0 = fermo, 1 = veloce
    const obiettivo = CURSORE.piuGrande - t * (CURSORE.piuGrande - CURSORE.piuPiccolo);
    scala += (obiettivo - scala) * CURSORE.morbidezza;
    cursore.style.transform = `translate(${x}px, ${y}px) scale(${scala.toFixed(3)})`;
    // [P7] mouse fermo e stella già alla sua grandezza: mi fermo (riparte al prossimo movimento)
    if (passo === 0 && velocita < 0.01 && Math.abs(obiettivo - scala) < 0.001) { inCorsaCursore = false; return; }
    requestAnimationFrame(muovi);
  }
}
