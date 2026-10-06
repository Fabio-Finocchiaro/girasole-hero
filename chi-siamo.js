/* =========================================================
   CHI SIAMO — Missione / Visione / Valori (fisarmonica)
   - passando col mouse su una voce si apre il suo testo; le altre
     si chiudono (come nelle varianti Figma: una sola voce aperta);
     uscendo dalla sezione si richiude tutto;
   - si apre solo se il mouse si MUOVE davvero: mentre la pagina
     scorre per centrare la voce, le altre voci che passano sotto il
     puntatore fermo non si aprono (niente aperture a catena);
   - sul telefono (niente hover) si apre e chiude col tocco;
   - DURANTE l'apertura/chiusura la pagina scorre insieme al
     movimento, così parola + testo restano sempre centrati nello
     schermo (se partono fuori centro, ci arrivano dolcemente);
   - COMPARSA: ogni parola sale da sotto la sua "finestra" mentre entra
     nello schermo, legata allo scroll come il titolo "Lavori in evidenza";
     sale una volta sola: arrivata al suo posto ci resta, anche tornando su;
   - al passaggio del mouse le lettere si rimescolano e la parola
     si sottolinea: è lo stesso effetto dei pulsanti (mescola.js,
     grazie all'attributo data-mescola) + la linea in chi-siamo.css.
   ========================================================= */

const MVV = {
  // ⇩ qui si fanno le prove
  durata: 800,   // ms dell'apertura / chiusura
  attesa: 120,   // ms che il mouse deve restare su una voce prima che si apra
  // comparsa delle parole: parte quando la parola è a questa altezza dello schermo
  // (1 = bordo in basso) e finisce dopo questo tratto di scroll (in altezze di schermo)
  comparsaInizio: 0.95,
  comparsaTratto: 0.45,
  morbidezza: 0.12,  // come in lavori.js: 1 = segue lo scroll secco, 0.05 = molto fluido
};

(() => {
  const sezione = document.getElementById("chi-siamo");
  if (!sezione) return;
  const voci = [...sezione.querySelectorAll(".mvv__voce")].map((voce) => ({
    voce,
    bottone: voce.querySelector(".mvv__titolo"),
    pannello: voce.querySelector(".mvv__pannello"),
    testo: voce.querySelector(".mvv__testo"),
  }));
  const riduci = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const curva = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);   // lenta-veloce-lenta
  let animazione = 0, inMovimento = false, centra = true;

  // centro verticale della voce (parola + testo), in coordinate della pagina
  const centroVoce = (v) => {
    const r = v.voce.getBoundingClientRect();
    return window.scrollY + r.top + r.height / 2;
  };
  // scroll che metterebbe quella voce al centro dello schermo
  const scrollCentrato = (v) => centroVoce(v) - window.innerHeight / 2;

  function imposta(v, aperta) {
    v.bottone.setAttribute("aria-expanded", String(aperta));
    v.pannello.setAttribute("aria-hidden", String(!aperta));
  }

  const aperta = () => voci.find((v) => v.bottone.getAttribute("aria-expanded") === "true") || null;

  // scelta = voce da aprire, oppure null per chiudere tutto (senza spostare la pagina)
  function apri(scelta) {
    cancelAnimationFrame(animazione);
    const giaAperta = scelta ? scelta === aperta() : false;

    // da dove parte e dove arriva ogni pannello (anche a metà di un'altra animazione)
    const piani = voci.map((v) => {
      const da = v.pannello.getBoundingClientRect().height;
      const aperta = v === scelta && !giaAperta;
      v.pannello.removeAttribute("data-aperto");
      v.pannello.style.height = `${da}px`;
      const a = aperta ? v.pannello.scrollHeight : 0;
      imposta(v, aperta);
      return { v, da, a, aperta };
    });

    if (riduci) {
      piani.forEach(fine);
      if (scelta) window.scrollTo({ top: scrollCentrato(scelta), behavior: "auto" });
      return;
    }

    // di quanto la voce è fuori centro all'inizio: questo scarto si annulla piano piano
    centra = !!scelta;
    const scarto = scelta ? window.scrollY - scrollCentrato(scelta) : 0;
    const inizio = performance.now();
    inMovimento = true;

    function fotogramma(ora) {
      const t = Math.min(1, (ora - inizio) / MVV.durata);
      const e = curva(t);
      piani.forEach((p) => {
        const h = p.da + (p.a - p.da) * e;
        p.v.pannello.style.height = `${h}px`;
        const max = Math.max(p.da, p.a) || 1;
        p.v.testo.style.opacity = (h / max).toFixed(3);
      });
      // la voce scelta resta al centro mentre cambia altezza
      // (se intanto scrolli tu con la rotellina, smetto di centrare)
      if (centra) window.scrollTo({ top: scrollCentrato(scelta) + scarto * (1 - e), behavior: "instant" });

      if (t < 1) animazione = requestAnimationFrame(fotogramma);
      else { piani.forEach(fine); inMovimento = false; }
    }
    animazione = requestAnimationFrame(fotogramma);
  }

  function fine(p) {
    p.v.testo.style.opacity = "";
    p.v.pannello.style.height = "";
    p.v.pannello.toggleAttribute("data-aperto", p.aperta);
  }

  voci.forEach((v) => imposta(v, false));

  // ---------- COMPARSA DELLE PAROLE (legata allo scroll) ----------
  const parole = voci.map((v) => v.bottone.querySelector(".mvv__parola"));
  const morbido = (x) => 1 - Math.pow(1 - x, 3);   // stessa curva del titolo dei lavori
  const mostrate = parole.map(() => -1);           // -1 = non ancora calcolata
  const raggiunte = parole.map(() => 0);           // il punto più alto raggiunto: non si torna indietro
  let inCorsaComparsa = false, ultimoTC = 0;

  function metaComparsa(el) {
    if (riduci) return 1;
    // uso la finestra (non la parola, che si sta muovendo) per sapere dov'è
    const r = el.parentElement.getBoundingClientRect();
    const h = window.innerHeight;
    return Math.min(1, Math.max(0, (h * MVV.comparsaInizio - r.top) / (h * MVV.comparsaTratto)));
  }

  function fotogrammaComparsa(t) {
    const dt = Math.min(50, Math.max(1, t - ultimoTC));
    ultimoTC = t;
    let fermo = true;
    parole.forEach((el, i) => {
      const meta = raggiunte[i] = Math.max(raggiunte[i], metaComparsa(el));
      if (mostrate[i] < 0) mostrate[i] = meta;     // al caricamento: subito al punto giusto
      else mostrate[i] += (meta - mostrate[i]) * (1 - Math.pow(1 - MVV.morbidezza, dt / 16.67));
      if (Math.abs(meta - mostrate[i]) < 0.0005) mostrate[i] = meta;
      else fermo = false;
      const e = morbido(mostrate[i]);
      el.style.transform = e >= 1 ? "" : `translateY(${((1 - e) * 110).toFixed(2)}%)`;
    });
    if (fermo) { inCorsaComparsa = false; return; }
    requestAnimationFrame(fotogrammaComparsa);
  }
  function avviaComparsa() {
    if (inCorsaComparsa) return;
    inCorsaComparsa = true;
    ultimoTC = performance.now();
    requestAnimationFrame(fotogrammaComparsa);
  }
  window.addEventListener("scroll", avviaComparsa, { passive: true });
  window.addEventListener("resize", avviaComparsa);
  avviaComparsa();

  // ---------- MOUSE: apertura con l'hover ----------
  const conHover = window.matchMedia("(hover: hover) and (pointer: fine)");
  let ultimoX = null, ultimoY = null, timer = 0, candidata = null;

  document.addEventListener("pointermove", (e) => {
    if (!conHover.matches || e.pointerType !== "mouse") return;
    // conta solo un movimento vero del mouse, non il contenuto che scorre sotto il puntatore
    if (e.clientX === ultimoX && e.clientY === ultimoY) return;
    ultimoX = e.clientX; ultimoY = e.clientY;

    const sopra = e.target.closest?.(".mvv__voce");
    const v = sopra ? voci.find((x) => x.voce === sopra) : null;
    if (v === candidata) return;
    candidata = v;
    clearTimeout(timer);
    if (v && v === aperta()) return;
    if (!v && !aperta()) return;
    // dentro la sezione: apro la voce sotto il mouse; fuori: chiudo tutto
    timer = setTimeout(() => apri(v), v ? MVV.attesa : MVV.attesa * 2);
  }, { passive: true });

  // se scrolli tu durante l'animazione, la pagina non viene più trascinata al centro
  ["wheel", "touchmove", "keydown"].forEach((tipo) =>
    window.addEventListener(tipo, () => { if (inMovimento) centra = false; }, { passive: true }));

  // ---------- TELEFONO / TASTIERA: apertura col tocco o con Invio ----------
  voci.forEach((v) => v.bottone.addEventListener("click", (e) => {
    if (conHover.matches && e.detail > 0) return;   // col mouse ci pensa già l'hover
    apri(v);
  }));
})();
