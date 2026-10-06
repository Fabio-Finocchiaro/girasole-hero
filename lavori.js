/* =========================================================
   LAVORI IN EVIDENZA — carosello

   SU DESKTOP, SCROLL ORIZZONTALE (stessa tecnica della hero):
   la <section class="lavori"> è più alta dello schermo e il suo
   contenuto (.lavori__sticky) resta fermo mentre la attraversi.
   In quel tratto lo scroll verticale fa scorrere le card verso
   sinistra, dal primo progetto fino a tornare al primo (le due
   copie in coda servono a chiudere il giro). Finito il tratto,
   la pagina riprende a scendere normalmente; scrollando in su
   si rifà il percorso al contrario.
   Funziona con rotellina, trackpad, barra di scorrimento e tastiera.
   - quando smetti di scrollare, la fila si aggancia al progetto più vicino;
   - mentre scorre veloce il gap tra le card si allarga (da 20 a 45 px)
     e quando si ferma torna al suo posto con un piccolo rimbalzo;
   - il nome del progetto si vede solo sulla card di sinistra;
   - le frecce (e i tasti ← →) portano al progetto precedente/successivo;
   - COMPARSA: mentre la sezione sale, il titolo sale da sotto la sua
     "finestra" e le foto arrivano dal basso, tutte insieme e allineate,
     più piccole e con la foto interna ingrandita; quando la sezione si
     ferma sono esattamente al loro posto (impostazioni in CAROSELLO.entrata).

   SU TELEFONO (schermo verticale) niente frecce: le card si
   muovono con lo scroll e il gap si allarga in base alla
   velocità, poi si richiude con un piccolo rimbalzo.
   Due versioni da confrontare:
   - "orizzontale": le card si trascinano di lato col dito
     (versione predefinita);
   - "verticale": le card sono una sotto l'altra e si muovono
     con lo scroll della pagina.
   Si sceglie con data-mobile="..." sulla <section class="lavori">,
   oppure per le prove aggiungendo all'indirizzo ?mobile=verticale
   ========================================================= */

const CAROSELLO = {
  // ⇩ qui si fanno le prove (valori presi dal prototipo Figma)
  gapRiposo: 20,                                   // px Figma
  gapRimbalzo: 45,                                 // px Figma, gap massimo mentre scorre
  swipeMinimo: 40,                                 // px sullo schermo per contare uno swipe (tablet orizzontale)

  // ⇩ DESKTOP: scroll orizzontale
  desktop: {
    lunghezza: 1,         // quanto scroll verticale serve: 1 = tanto quanto la strada fatta in orizzontale, 1.5 = più lento
    morbidezza: 0.08,     // 1 = segue lo scroll secco, 0.05 = molto fluido (più basso = le tacche della rotellina si fondono in un movimento continuo)
    aggancio: true,       // a scroll fermo si posa su un progetto (serve: il nome compare solo a fila ferma)
    pausaAggancio: 450,   // ms di scroll fermo prima di agganciarsi (non scatta nelle pause tra le tacche della rotellina)
    sogliaAggancio: 0.15, // se stavi andando avanti e hai superato un progetto di almeno il 15%, va al successivo (e viceversa)
    durataAggancio: [500, 1100],   // ms del movimento di aggancio: minimo e massimo, in base alla distanza
    velocitaPiena: 3,     // velocità (progetti al secondo) a cui il gap è tutto aperto
    rigidezza: 170,       // molla del gap: più alto = torna più in fretta
    smorzamento: 13,      // molla del gap: più basso = rimbalza di più
    dissolvenzaNome: 2.5, // quanto in fretta sparisce il nome quando la card si sposta
  },

  // ⇩ DESKTOP: comparsa delle card mentre la sezione sale (prima dello scroll orizzontale).
  // Parte quando la sezione spunta dal fondo dello schermo e finisce esattamente
  // quando la sezione si ferma: da lì in poi lo scroll orizzontale è identico a prima.
  entrata: {
    attiva: true,
    titolo: [0.12, 0.6],   // in che tratto della comparsa sale il titolo (0 = inizio, 1 = sezione ferma)
    card: [0.12, 1.0],     // in che tratto della comparsa arrivano le card (tutte insieme, allineate)
    scala: 0.86,           // grandezza di partenza delle foto (1 = finale)
    salita: 120,           // quanto più in basso partono (px Figma)
    zoomFoto: 0.22,        // la foto dentro parte ingrandita del 22%...
    spostaFoto: 8,         // ...e spostata in basso dell'8%, poi si assesta (parallasse)
  },

  // ⇩ TELEFONO: effetto elastico del gap
  mobile: {
    gapExtra: 30,        // quanto si allarga al massimo il gap (px della tavola mobile, larga 430)
    velocitaPiena: 2.5,  // velocità di scroll (px/ms) a cui il gap è tutto aperto
    rigidezza: 170,      // molla: più alto = torna più in fretta
    smorzamento: 13,     // molla: più basso = rimbalza di più
  },
};

(() => {
  const sezione = document.getElementById("lavori");
  const sticky = document.getElementById("lavori-sticky");
  const binario = document.getElementById("binario");
  if (!sezione || !sticky || !binario) return;

  const finestra = binario.parentElement;
  const card = [...binario.querySelectorAll(".card")];
  const nomi = card.map((c) => c.querySelector(".card__nome"));
  const N = card.filter((c) => !c.hasAttribute("data-copia")).length;   // progetti veri (4)
  const LARGHEZZA = 796;                                                // card in Figma
  const riduci = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const D = CAROSELLO.desktop;

  // telefono = schermo verticale (stessa regola di style.css)
  const telefono = window.matchMedia("(orientation: portrait)");
  const versione = new URLSearchParams(location.search).get("mobile") || sezione.dataset.mobile || "orizzontale";
  sezione.dataset.mobile = versione;

  // 1 px di Figma sullo schermo (come --s in lavori.css: 100vw / 1440)
  // stessa regola di --s-lavori in style.css: larghezza o altezza, la più stretta
  const ALTEZZA_LAVORI = 805;   // px di Figma: titolo + foto + nome, che devono stare interi nello schermo
  const s = () => Math.min(window.innerWidth / 1440, window.innerHeight / ALTEZZA_LAVORI);
  const limita = (v, min, max) => Math.min(max, Math.max(min, v));

  // =========================================================
  // DESKTOP: misure del tratto "bloccato"
  // =========================================================
  let corsa = 1;        // px di scroll verticale per fare tutto il giro
  let cima = 0;         // valore di "top" dello sticky (0, o negativo se il contenuto è più alto dello schermo)

  function misuraDesktop() {
    if (telefono.matches) {
      sezione.style.height = "";
      sticky.style.top = "";
      return;
    }
    const passo = (LARGHEZZA + CAROSELLO.gapRiposo) * s();
    corsa = Math.max(1, N * passo * D.lunghezza);
    const h = sticky.offsetHeight;
    // se non ci sta tutto, sacrifico prima lo spazio bianco in fondo, non il titolo
    const spazioSotto = parseFloat(getComputedStyle(sticky).paddingBottom) || 0;
    cima = Math.min(0, window.innerHeight - (h - spazioSotto));
    sticky.style.top = `${cima}px`;
    sezione.style.height = `${h + corsa}px`;
  }

  // a che punto del tratto siamo: 0 = appena agganciata, 1 = giro finito
  function progresso() {
    const r = sezione.getBoundingClientRect();
    return limita((cima - r.top) / corsa, 0, 1);
  }

  // porta la pagina al progetto i (0..N)
  function vaiA(i) {
    if (telefono.matches) return;
    const r = sezione.getBoundingClientRect();
    const attuale = cima - r.top;                       // px già percorsi nel tratto
    const meta = (limita(i, 0, N) / N) * corsa;
    scorriA(window.scrollY + (meta - attuale));
  }

  // movimento morbido della pagina (aggancio e frecce): lento-veloce-lento, durata in base
  // alla distanza; si interrompe subito se riprendi a scorrere tu
  let animScroll = 0, scrollAuto = false, direzione = 0;
  function scorriA(y) {
    cancelAnimationFrame(animScroll);
    if (riduci) { window.scrollTo({ top: y, behavior: "auto" }); return; }
    const da = window.scrollY, dist = y - da;
    if (Math.abs(dist) < 1) return;
    const [min, max] = D.durataAggancio;
    const durata = limita(400 + Math.abs(dist) * 0.6, min, max);
    const t0 = performance.now();
    scrollAuto = true;
    const passo = (ora) => {
      if (!scrollAuto) return;
      const t = Math.min(1, (ora - t0) / durata);
      const e = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
      window.scrollTo({ top: da + dist * e, behavior: "instant" });
      if (t < 1) animScroll = requestAnimationFrame(passo);
      else scrollAuto = false;
    };
    animScroll = requestAnimationFrame(passo);
  }
  const interrompi = () => { if (scrollAuto) { scrollAuto = false; cancelAnimationFrame(animScroll); } };
  ["wheel", "touchstart"].forEach((t) => window.addEventListener(t, interrompi, { passive: true }));
  // la direzione la dice la rotellina stessa (più affidabile dello scroll)
  window.addEventListener("wheel", (e) => { if (Math.abs(e.deltaY) > 0) direzione = Math.sign(e.deltaY); }, { passive: true });
  window.addEventListener("keydown", (e) => { if (!["ArrowLeft", "ArrowRight"].includes(e.key)) interrompi(); });

  function vai(dir) {
    const qui = Math.round(progresso() * N);
    vaiA(qui + dir);
  }

  // =========================================================
  // DESKTOP: animazione a ogni fotogramma
  // =========================================================
  let mostrata = 0;     // posizione disegnata, in progetti (insegue quella dello scroll)
  let gapExtra = 0, velGap = 0, ultimoTD = 0, inCorsaD = false, vicina = false;
  let entrata = 1;      // comparsa disegnata (0 = card ancora "chiuse", 1 = al loro posto)
  const E = CAROSELLO.entrata;
  const foto = card.map((c) => c.querySelector(".card__foto"));
  const immagini = card.map((c) => c.querySelector(".card__foto img"));
  const frecce = sezione.querySelector(".carosello__frecce");
  const titoloTesto = sezione.querySelector(".lavori__titolo-testo");
  const morbido = (x) => 1 - Math.pow(1 - x, 3);   // parte veloce, si posa piano

  // a che punto è la comparsa: 0 = la sezione spunta dal fondo, 1 = la sezione si è fermata
  function entrataScroll() {
    if (!E.attiva || riduci) return 1;
    const r = sezione.getBoundingClientRect();
    const h = window.innerHeight;
    return limita((h - r.top) / Math.max(1, h - cima), 0, 1);
  }

  const tratto = (x, [a, b]) => limita((x - a) / Math.max(0.0001, b - a), 0, 1);

  function disegnaEntrata(rettangoli) {
    const vw = window.innerWidth;
    const k = s();

    // titolo: sale da sotto la sua "finestra"
    const et = morbido(tratto(entrata, E.titolo));
    titoloTesto.style.transform = et >= 1 ? "" : `translateY(${((1 - et) * 110).toFixed(2)}%)`;

    // card: stessi valori per tutte, così restano allineate
    const e = morbido(tratto(entrata, E.card));
    const q = 1 - e;   // quanto manca (1 = tutto da fare, 0 = arrivata)
    const visibili = card.map(() => e);
    card.forEach((c, i) => {
      const f = foto[i], img = immagini[i];
      if (q < 0.001) {
        f.style.transform = f.style.transformOrigin = "";
        img.style.transform = "";
        return;
      }
      // ognuna si apre verso il proprio lato partendo dal centro dello schermo
      // (origine in basso: le cime restano allineate)
      const r = rettangoli ? rettangoli[i] : c.getBoundingClientRect();
      const origineX = limita(vw / 2 - r.left, 0, r.width);
      f.style.transformOrigin = `${origineX.toFixed(1)}px 100%`;
      f.style.transform = `translateY(${(q * E.salita * k).toFixed(2)}px) scale(${(1 - q * (1 - E.scala)).toFixed(4)})`;
      img.style.transform = `translateY(${(q * E.spostaFoto).toFixed(2)}%) scale(${(1 + q * E.zoomFoto).toFixed(4)})`;
    });
    if (frecce) frecce.style.opacity = e >= 1 ? "" : (e ** 2).toFixed(3);
    return visibili;
  }

  function disegna() {
    const k = s();
    const passo = (LARGHEZZA + CAROSELLO.gapRiposo) * k;
    // posizioni lette PRIMA di cambiare gli stili (niente ricalcoli forzati del layout a ogni fotogramma)
    const rettangoli = entrata < 1 ? card.map((c) => c.getBoundingClientRect()) : null;
    binario.style.transform = `translate3d(${(-mostrata * passo).toFixed(2)}px, 0, 0)`;
    // quanto si è spostata la fila: lo usa la scia (scia.js) per muoversi insieme alle card
    (window.WUP = window.WUP || {}).spostamentoLavori = -mostrata * passo;
    const attiva = Math.round(mostrata);
    card.forEach((c, i) => {
      c.style.transform = gapExtra ? `translate3d(${((i - mostrata) * gapExtra).toFixed(2)}px, 0, 0)` : "";
      c.classList.toggle("attiva", i === attiva);
    });
    const arrivate = disegnaEntrata(rettangoli);
    nomi.forEach((n, i) => { n.style.opacity = (Math.max(0, 1 - Math.abs(i - mostrata) * D.dissolvenzaNome) * arrivate[i]).toFixed(3); });
  }

  function fotogrammaDesktop(t) {
    if (telefono.matches) { inCorsaD = false; return; }
    const dt = limita(t - ultimoTD, 1, 50);
    ultimoTD = t;

    const obiettivo = progresso() * N;
    const prima = mostrata;
    if (riduci) mostrata = obiettivo;
    else {
      mostrata += (obiettivo - mostrata) * (1 - Math.pow(1 - D.morbidezza, dt / 16.67));
      if (Math.abs(obiettivo - mostrata) < 0.0005) mostrata = obiettivo;
    }

    // gap elastico: si apre con la velocità, si richiude con la molla
    if (!riduci) {
      const vel = Math.abs(mostrata - prima) / dt * 1000;                 // progetti al secondo
      const meta = (CAROSELLO.gapRimbalzo - CAROSELLO.gapRiposo) * s() * Math.min(1, vel / D.velocitaPiena);
      const sec = dt / 1000;
      velGap += (D.rigidezza * (meta - gapExtra) - D.smorzamento * velGap) * sec;
      gapExtra += velGap * sec;
      if (Math.abs(gapExtra) < 0.05 && Math.abs(velGap) < 0.05 && meta === 0) { gapExtra = 0; velGap = 0; }
    }

    // comparsa: insegue lo scroll con la stessa morbidezza
    const metaEntrata = entrataScroll();
    if (riduci) entrata = metaEntrata;
    else {
      entrata += (metaEntrata - entrata) * (1 - Math.pow(1 - D.morbidezza, dt / 16.67));
      if (Math.abs(metaEntrata - entrata) < 0.0005) entrata = metaEntrata;
    }

    disegna();
    // mentre la fila scorre la freccia dei titoli non deve comparire (vedi lavori.css)
    sezione.classList.toggle("scorre", Math.abs(obiettivo - mostrata) > 0.002 || gapExtra > 0.5);

    const fermo = mostrata === obiettivo && gapExtra === 0 && entrata === metaEntrata;
    if (fermo && !vicina) { inCorsaD = false; return; }
    requestAnimationFrame(fotogrammaDesktop);
  }

  function avviaDesktop() {
    if (telefono.matches || inCorsaD) return;
    inCorsaD = true;
    ultimoTD = performance.now();
    requestAnimationFrame(fotogrammaDesktop);
  }

  // il ciclo gira solo quando la sezione è vicina allo schermo
  new IntersectionObserver((voci) => {
    vicina = voci.some((v) => v.isIntersecting);
    if (vicina) avviaDesktop();
  }, { rootMargin: "200px 0px" }).observe(sezione);

  // aggancio a un progetto quando lo scroll si ferma, tenendo conto della direzione:
  // se stavi andando avanti va al progetto successivo, se tornavi indietro al precedente
  let timerAggancio = 0, ultimoP = null;
  window.addEventListener("scroll", () => {
    if (telefono.matches) return;
    avviaDesktop();
    const p = progresso();
    if (!scrollAuto && ultimoP !== null && Math.abs(p - ultimoP) > 1e-5) direzione = Math.sign(p - ultimoP);
    ultimoP = p;
    if (!D.aggancio || scrollAuto) return;              // durante l'aggancio stesso non ricalcolo
    clearTimeout(timerAggancio);
    timerAggancio = setTimeout(() => {
      const q = progresso();
      if (q <= 0 || q >= 1) return;                     // fuori dal tratto: niente aggancio
      const pos = q * N, base = Math.floor(pos), resto = pos - base;
      if (resto < 0.005 || resto > 0.995) return;        // già su un progetto
      let meta;
      if (direzione > 0) meta = resto > D.sogliaAggancio ? base + 1 : base;
      else if (direzione < 0) meta = resto < 1 - D.sogliaAggancio ? base : base + 1;
      else meta = Math.round(pos);
      vaiA(meta);
    }, D.pausaAggancio);
  }, { passive: true });

  // ricalcolo misure quando cambia la finestra o l'altezza del contenuto (font caricati, ecc.)
  new ResizeObserver(() => { misuraDesktop(); avviaDesktop(); }).observe(sticky);
  window.addEventListener("resize", () => { misuraDesktop(); avviaDesktop(); });

  // ---------- COMANDI ----------
  sezione.querySelectorAll(".freccia").forEach((b) =>
    b.addEventListener("click", () => vai(Number(b.dataset.dir))));

  sezione.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight") { e.preventDefault(); vai(1); }
    if (e.key === "ArrowLeft")  { e.preventDefault(); vai(-1); }
  });

  // swipe orizzontale col dito su tablet in orizzontale
  let inizioX = null, swipato = false;
  finestra.addEventListener("pointerdown", (e) => { if (e.pointerType !== "mouse" && !telefono.matches) { inizioX = e.clientX; swipato = false; } });
  finestra.addEventListener("pointerup", (e) => {
    if (inizioX === null) return;
    const dx = e.clientX - inizioX;
    inizioX = null;
    if (Math.abs(dx) >= CAROSELLO.swipeMinimo) { swipato = true; vai(dx < 0 ? 1 : -1); }
  });
  finestra.addEventListener("pointercancel", () => { inizioX = null; });

  // il titolo è un link alla futura pagina dei lavori: finché è "#", non fa niente
  sezione.querySelector(".lavori__titolo-testo")?.addEventListener("click", (e) => {
    if (e.currentTarget.getAttribute("href") === "#") e.preventDefault();
  });

  card.forEach((c) => c.addEventListener("click", (e) => {
    if (swipato || c.getAttribute("href") === "#") e.preventDefault();   // pagine dei lavori non ancora pronte
    swipato = false;
  }));

  // le foto partono quando la sezione si avvicina, non prima (lascio la precedenza al girasole)
  new IntersectionObserver((voci, oss) => {
    if (voci.some((v) => v.isIntersecting)) {
      binario.querySelectorAll("img").forEach((img) => { img.loading = "eager"; });
      oss.disconnect();
    }
  }, { rootMargin: "800px 0px" }).observe(sezione);

  // =========================================================
  // TELEFONO: gap elastico che segue lo scroll
  // Il gap vero non cambia (farebbe saltare lo scroll): ogni card
  // viene spostata di (distanza dalla card di riferimento × extra),
  // così sembra che lo spazio tra le card si allarghi.
  // =========================================================
  const vere = card.filter((c) => !c.hasAttribute("data-copia"));
  const M = CAROSELLO.mobile;
  let extra = 0, velMolla = 0, velScroll = 0, ultimaPos = null, ultimoEventoT = 0, ultimoT = 0, inCorsa = false;
  const orizzontale = () => versione !== "verticale";
  const t430 = () => window.innerWidth / 430;
  const posizione = () => orizzontale() ? finestra.scrollLeft : window.scrollY;

  function riferimento() {
    if (orizzontale()) {
      const passo = vere[1].offsetLeft - vere[0].offsetLeft;
      return finestra.scrollLeft / passo;
    }
    const passo = vere[1].offsetTop - vere[0].offsetTop;
    const primaTop = binario.getBoundingClientRect().top + vere[0].offsetTop;
    return (window.innerHeight / 2 - primaTop - vere[0].offsetHeight / 2) / passo;
  }

  function fotogramma(t) {
    const dt = Math.min(50, Math.max(1, t - ultimoT));
    ultimoT = t;
    // se lo scroll si è fermato, la velocità si spegne piano piano
    if (performance.now() - ultimoEventoT > 60) velScroll *= Math.pow(0.8, dt / 16);

    const obiettivo = M.gapExtra * t430() * Math.min(1, velScroll / M.velocitaPiena);
    const sec = dt / 1000;
    velMolla += (M.rigidezza * (obiettivo - extra) - M.smorzamento * velMolla) * sec;
    extra += velMolla * sec;

    const rif = Math.max(0, Math.min(vere.length - 1, riferimento()));
    const asse = orizzontale() ? "X" : "Y";
    vere.forEach((c, i) => { c.style.transform = `translate${asse}(${((i - rif) * extra).toFixed(2)}px)`; });

    const fermo = velScroll < 0.01 && Math.abs(extra) < 0.1 && Math.abs(velMolla) < 0.1;
    if (fermo) {
      vere.forEach((c) => { c.style.transform = ""; });
      extra = 0; velMolla = 0; velScroll = 0; inCorsa = false;
      return;
    }
    requestAnimationFrame(fotogramma);
  }

  function avviaElastico() {
    if (!telefono.matches || riduci || inCorsa) return;
    inCorsa = true;
    ultimoT = performance.now();
    requestAnimationFrame(fotogramma);
  }
  // velocità dello scroll, misurata a ogni evento
  function misura() {
    const ora = performance.now();
    const pos = posizione();
    if (ultimaPos !== null) {
      const v = Math.min(8, Math.abs(pos - ultimaPos) / Math.max(1, ora - ultimoEventoT));
      velScroll = velScroll * 0.6 + v * 0.4;
    }
    ultimaPos = pos;
    ultimoEventoT = ora;
  }

  finestra.addEventListener("scroll", () => {
    if (!orizzontale()) return;
    misura(); avviaElastico();
  }, { passive: true });

  let sezioneVisibile = false;
  new IntersectionObserver((voci) => { sezioneVisibile = voci.some((v) => v.isIntersecting); }).observe(sezione);
  window.addEventListener("scroll", () => {
    if (orizzontale()) return;
    misura();
    if (sezioneVisibile) avviaElastico();
  }, { passive: true });

  // ---------- passaggio desktop ⇄ telefono (es. rotazione dello schermo) ----------
  function impostaModo() {
    vere.forEach((c) => { c.style.transform = ""; });
    ultimaPos = null; velScroll = 0;
    card.forEach((c) => { c.style.transform = ""; });
    nomi.forEach((n) => { n.style.opacity = ""; });
    foto.forEach((f) => { f.style.transform = f.style.transformOrigin = ""; });
    titoloTesto.style.transform = "";
    immagini.forEach((img) => { img.style.transform = ""; });
    if (frecce) frecce.style.opacity = "";
    binario.style.transform = "";
    if (telefono.matches) {
      finestra.scrollLeft = 0;
      card.forEach((c) => c.classList.remove("attiva"));
    }
    misuraDesktop();
    if (!telefono.matches) { mostrata = progresso() * N; entrata = entrataScroll(); avviaDesktop(); }
  }
  telefono.addEventListener("change", impostaModo);
  impostaModo();
})();
