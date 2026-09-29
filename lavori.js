/* =========================================================
   LAVORI IN EVIDENZA — carosello
   Stessa animazione del prototipo Figma:
   1. clic su una freccia → la fila parte veloce e il gap tra
      le card si allarga (da 20 a 45 px);
   2. poi rallenta e si posa, e il gap torna a 20 px
      (il "rimbalzo" del vecchio componente Carousel);
   3. il nome del progetto che esce svanisce nella prima fase,
      quello nuovo compare durante l'assestamento;
   4. loop: dopo l'ultimo progetto torna il primo e viceversa.
      In coda ci sono le copie delle prime due card, così il
      salto dall'ultima alla prima non si vede.

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
  gapRimbalzo: 45,                                 // px Figma, durante lo scatto
  quota: 0.75,                                     // quanta strada fa la fila nella prima fase
  avvio:        { durata: 350,  curva: "cubic-bezier(.55, 0, 1, .45)" },  // parte veloce
  assestamento: { durata: 1300, curva: "cubic-bezier(.16, 1, .3, 1)" },   // si posa morbida
  swipeMinimo: 40,                                 // px sullo schermo per contare uno swipe

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
  const binario = document.getElementById("binario");
  if (!sezione || !binario) return;

  const finestra = binario.parentElement;
  const card = [...binario.querySelectorAll(".card")];
  const nomi = card.map((c) => c.querySelector(".card__nome"));
  const N = card.filter((c) => !c.hasAttribute("data-copia")).length;   // progetti veri (4)
  const LARGHEZZA = 796;                                                // card in Figma
  const riduci = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  let indice = 0;          // card che sta a sinistra (0..N; N è la copia della prima)
  let animazioni = [];

  // telefono = schermo verticale (stessa regola di style.css)
  const telefono = window.matchMedia("(orientation: portrait)");
  const versione = new URLSearchParams(location.search).get("mobile") || sezione.dataset.mobile || "orizzontale";
  sezione.dataset.mobile = versione;

  // 1 px di Figma sullo schermo (la finestra in Figma è larga 1340)
  const s = () => finestra.clientWidth / 1340;

  // ---------- STATO FERMO ----------
  function posa(i) {
    indice = i;
    binario.style.transform = `translateX(calc(var(--s) * ${-(LARGHEZZA + CAROSELLO.gapRiposo) * i}))`;
    binario.style.columnGap = "";
    card.forEach((c, k) => c.classList.toggle("attiva", k === i));
  }

  function leggiX() {
    const t = getComputedStyle(binario).transform;
    return t && t !== "none" ? new DOMMatrixReadOnly(t).m41 : 0;
  }

  // ---------- SCATTO ----------
  function vai(dir) {
    if (telefono.matches) return;
    if (riduci) { posa((indice + dir + N) % N); return; }

    // valori attuali (anche a metà di un'animazione, così non salta niente)
    let x = leggiX();
    const gap = parseFloat(getComputedStyle(binario).columnGap) || CAROSELLO.gapRiposo * s();
    const opacita = nomi.map((n) => parseFloat(getComputedStyle(n).opacity));
    animazioni.forEach((a) => a.cancel());
    animazioni = [];

    // loop: se serve, passo di nascosto dalla copia all'originale (o viceversa)
    const giro = N * (LARGHEZZA * s() + gap);
    if (dir > 0 && indice >= N) { indice -= N; x += giro; }
    if (dir < 0 && indice <= 0) { indice += N; x -= giro; }

    const da = indice;
    const a = indice + dir;
    const k = s();
    const passo = LARGHEZZA + CAROSELLO.gapRimbalzo;
    const xMezzo = (-dir * CAROSELLO.quota * (LARGHEZZA + CAROSELLO.gapRiposo) - da * passo) * k;
    const xFine = -a * (LARGHEZZA + CAROSELLO.gapRiposo) * k;
    const totale = CAROSELLO.avvio.durata + CAROSELLO.assestamento.durata;
    const o = CAROSELLO.avvio.durata / totale;
    const opz = { duration: totale, fill: "forwards" };

    const fila = binario.animate([
      { transform: `translateX(${x}px)`,     columnGap: `${gap}px`,                          easing: CAROSELLO.avvio.curva },
      { transform: `translateX(${xMezzo}px)`, columnGap: `${CAROSELLO.gapRimbalzo * k}px`, easing: CAROSELLO.assestamento.curva, offset: o },
      { transform: `translateX(${xFine}px)`,  columnGap: `${CAROSELLO.gapRiposo * k}px` },
    ], opz);
    animazioni.push(fila);

    nomi.forEach((n, i) => {
      animazioni.push(n.animate([
        { opacity: opacita[i], easing: CAROSELLO.avvio.curva },
        { opacity: 0, easing: CAROSELLO.assestamento.curva, offset: o },
        { opacity: i === a ? 1 : 0 },
      ], opz));
    });

    indice = a;
    fila.onfinish = () => {
      posa(a >= N ? a - N : a);          // arrivati sulla copia → torno all'originale, identico
      animazioni.forEach((an) => an.cancel());
      animazioni = [];
    };
  }

  // ---------- COMANDI ----------
  sezione.querySelectorAll(".freccia").forEach((b) =>
    b.addEventListener("click", () => vai(Number(b.dataset.dir))));

  sezione.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight") { e.preventDefault(); vai(1); }
    if (e.key === "ArrowLeft")  { e.preventDefault(); vai(-1); }
  });

  // swipe sul telefono
  let inizioX = null, swipato = false;
  finestra.addEventListener("pointerdown", (e) => { if (e.pointerType !== "mouse" && !telefono.matches) { inizioX = e.clientX; swipato = false; } });
  finestra.addEventListener("pointerup", (e) => {
    if (inizioX === null) return;
    const dx = e.clientX - inizioX;
    inizioX = null;
    if (Math.abs(dx) >= CAROSELLO.swipeMinimo) { swipato = true; vai(dx < 0 ? 1 : -1); }
  });
  finestra.addEventListener("pointercancel", () => { inizioX = null; });

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
    animazioni.forEach((a) => a.cancel());
    animazioni = [];
    vere.forEach((c) => { c.style.transform = ""; });
    ultimaPos = null; velScroll = 0;
    if (telefono.matches) {
      binario.style.transform = "";
      binario.style.columnGap = "";
      finestra.scrollLeft = 0;
    } else {
      posa(0);
    }
  }
  telefono.addEventListener("change", impostaModo);
  impostaModo();
})();
