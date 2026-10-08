/* =========================================================
   SCIA CHE SEGUE IL MOUSE (come su lusion.co)
   Forma presa da Figma: componente "scia" (nodo 249:3630), un
   rettangolo semplice lungo 716 con sfumatura #FDD200 → #FD8700.
   Segue i movimenti del mouse curvandosi: giallo vicino al puntatore,
   arancione verso la coda; le due estremità sono tagliate dritte.
   SPESSORE = quello del puntatore a stella: ogni tratto della scia è
   spesso quanto era il puntatore in quel momento (il puntatore si
   rimpicciolisce quando ti muovi veloce e cresce da fermo).

   - sta su un livello DIETRO i contenuti: si vede sulle parti
     bianche del sito e passa sotto testi e foto; sulla hero nera
     non si vede (la hero ha il suo sfondo nero sopra);
   - è "attaccata" a quello che si vede: scorrendo, la scia scorre con i
     contenuti e si allunga anche col mouse fermo, come nel video; nelle
     sezioni che restano ferme sullo schermo (la hero, i lavori durante lo
     scroll orizzontale) non sale, e nei lavori si sposta di lato con le card;
   - quando il mouse si ferma la scia si ritira dalla coda verso la
     testa e sparisce del tutto;
   - sopra il giallo del footer diventa bianca (il bordo del giallo lo dà footer.js);
   - solo con il mouse (niente su telefono e tablet), e niente se il
     sistema chiede animazioni ridotte.
   ========================================================= */

const SCIA = {
  // ⇩ qui si fanno le prove (misure in px di Figma, tavola larga 1440)
  lunghezza: 716,      // lunghezza massima, come il rettangolo in Figma
  // lo spessore sullo schermo è quello del puntatore (vedi spessorePuntatore)
  vita: 650,           // ms: dopo quanto un tratto della scia scompare
  inseguimento: 0.1,   // quanto in fretta la scia raggiunge il mouse (1 = attaccata al puntatore, più basso = lo insegue da lontano)
  coloreTesta: [0xfd, 0xd2, 0x00],   // #FDD200
  coloreCoda: [0xfd, 0x87, 0x00],    // #FD8700
  coloreSulGiallo: "#FFFFFF",        // colore della scia sopra il giallo del footer
};

(() => {
  const conMouse = window.matchMedia("(hover: hover) and (pointer: fine)");
  const riduci = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // il livello dietro i contenuti: bianco, con sopra la scia
  const canvas = document.createElement("canvas");
  canvas.className = "scia";
  canvas.setAttribute("aria-hidden", "true");
  document.body.prepend(canvas);
  const schermo = canvas.getContext("2d");
  if (riduci) return;
  // la scia si disegna piena su un livello nascosto e poi si copia sul livello visibile
  // con la trasparenza tutta insieme: così sfumando non si vedono i pezzi sovrapposti
  const nascosto = document.createElement("canvas");
  const ctx = nascosto.getContext("2d");

  let larghezza = 0, altezza = 0, dpr = 1;
  function ridimensiona() {
    dpr = Math.min(2, window.devicePixelRatio || 1);
    larghezza = window.innerWidth; altezza = window.innerHeight;
    canvas.width = nascosto.width = Math.round(larghezza * dpr);
    canvas.height = nascosto.height = Math.round(altezza * dpr);
  }
  ridimensiona();
  window.addEventListener("resize", ridimensiona);

  const k = () => window.innerWidth / 1440;   // 1 px di Figma sullo schermo

  // SPOSTAMENTO DEI CONTENUTI SULLO SCHERMO (non quello della barra di scorrimento):
  // - in verticale tolgo lo scroll "assorbito" dalle sezioni sticky (hero e lavori restano
  //   ferme mentre si scorre), altrimenti la scia salirebbe da sola;
  // - in orizzontale aggiungo lo spostamento della fila dei lavori (lo scrive lavori.js).
  const appiccicose = [...document.querySelectorAll(".hero__sticky, .lavori__sticky")];
  function contenutoY() {
    let assorbito = 0;
    appiccicose.forEach((el) => {
      assorbito += el.getBoundingClientRect().top - el.parentElement.getBoundingClientRect().top;
    });
    return window.scrollY - assorbito;
  }
  const contenutoX = () => (window.WUP && window.WUP.spostamentoLavori) || 0;

  // spessore attuale del puntatore a stella (24 px × la sua scala del momento)
  const puntatore = document.getElementById("cursore");
  function spessorePuntatore() {
    if (!puntatore) return 24;
    const base = puntatore.offsetWidth || 24;
    const t = getComputedStyle(puntatore).transform;
    const scala = t && t !== "none" ? Math.hypot(...new DOMMatrixReadOnly(t).toFloat64Array().slice(0, 2)) : 1;
    return base * scala;
  }

  // punti della scia in coordinate della PAGINA (così scorrono con i contenuti)
  let punti = [];                // { x, y, t } dal più recente al più vecchio
  let mouseX = null, mouseY = null, testaX = 0, testaY = 0, attivo = false, inCorsa = false;

  function muovi(e) {
    if (!conMouse.matches || e.pointerType !== "mouse") return;
    mouseX = e.clientX; mouseY = e.clientY;
    if (!attivo) { testaX = mouseX - contenutoX(); testaY = mouseY + contenutoY(); attivo = true; }
    avvia();
  }
  window.addEventListener("pointermove", muovi, { passive: true });
  window.addEventListener("scroll", () => { if (mouseX !== null && conMouse.matches) avvia(); }, { passive: true });
  document.addEventListener("mouseleave", () => { mouseX = null; });

  function avvia() {
    if (inCorsa) return;
    inCorsa = true;
    requestAnimationFrame(fotogramma);
  }

  const mescolaColore = (t) => {
    const [a, b] = [SCIA.coloreTesta, SCIA.coloreCoda];
    return `rgb(${a.map((v, i) => Math.round(v + (b[i] - v) * t)).join(",")})`;
  };

  function fotogramma(ora) {
    const scala = k();
    const lunghezzaMax = SCIA.lunghezza * scala;

    // la testa insegue il mouse (in coordinate della pagina, quindi anche quando si scorre)
    if (mouseX !== null) {
      const mx = mouseX - contenutoX(), my = mouseY + contenutoY();
      testaX += (mx - testaX) * SCIA.inseguimento;
      testaY += (my - testaY) * SCIA.inseguimento;
      const ultimo = punti[0];
      const w = spessorePuntatore();
      if (!ultimo || Math.hypot(testaX - ultimo.x, testaY - ultimo.y) > 3) punti.unshift({ x: testaX, y: testaY, t: ora, w });
      else { ultimo.t = ora; ultimo.w = w; }   // fermo: la testa resta "viva", la coda si ritira
    }

    // la coda scompare col tempo; e la scia non supera la lunghezza della forma Figma
    punti = punti.filter((p) => ora - p.t < SCIA.vita);
    let s = 0;
    for (let i = 1; i < punti.length; i++) {
      s += Math.hypot(punti[i].x - punti[i - 1].x, punti[i].y - punti[i - 1].y);
      if (s > lunghezzaMax) { punti.length = i + 1; break; }
    }

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, larghezza, altezza);
    schermo.setTransform(1, 0, 0, 1, 0, 0);
    schermo.clearRect(0, 0, canvas.width, canvas.height);

    if (punti.length > 1) {
      const opacita = disegna(scala, lunghezzaMax);
      schermo.globalAlpha = opacita;
      schermo.drawImage(nascosto, 0, 0);
      schermo.globalAlpha = 1;
    }

    if (punti.length > 1 || mouseX !== null && (Math.abs(mouseX - testaX) > 0.5)) requestAnimationFrame(fotogramma);
    else { inCorsa = false; punti = []; }
  }

  function disegna(scala, lunghezzaMax) {
    const dy = -contenutoY(), dx = contenutoX();
    const P = punti.map((p) => ({ x: p.x + dx, y: p.y + dy, m: p.w / 2 }));   // m = metà spessore
    // lunghezze progressive dalla testa
    const L = [0];
    for (let i = 1; i < P.length; i++) L[i] = L[i - 1] + Math.hypot(P[i].x - P[i - 1].x, P[i].y - P[i - 1].y);
    const totale = L[L.length - 1];
    if (totale < 2) return 0;

    // RETTANGOLO che segue la scia: fasce tra un punto e l'altro, dal giallo all'arancione;
    // le estremità restano tagliate dritte (perpendicolari alla scia)
    const gialloTop = (window.WUP && window.WUP.gialloTop) ?? Infinity;
    const normali = P.map((p, i) => {
      const a = P[Math.max(0, i - 1)], b = P[Math.min(P.length - 1, i + 1)];
      const dx = b.x - a.x, dyy = b.y - a.y; const l = Math.hypot(dx, dyy) || 1;
      return { x: -dyy / l, y: dx / l };
    });
    for (let i = 0; i < P.length - 1; i++) {
      const a = P[i], na = normali[i], b = P[i + 1], nb = normali[i + 1];
      const tColore = Math.min(1, ((L[i] + L[i + 1]) / 2) / lunghezzaMax);
      // sopra il giallo del footer la scia è bianca (window.WUP.gialloTop lo scrive footer.js)
      const sulGiallo = (a.y + b.y) / 2 >= gialloTop;
      ctx.fillStyle = ctx.strokeStyle = sulGiallo ? SCIA.coloreSulGiallo : mescolaColore(tColore);
      ctx.beginPath();
      ctx.moveTo(a.x + na.x * a.m, a.y + na.y * a.m);
      ctx.lineTo(b.x + nb.x * b.m, b.y + nb.y * b.m);
      ctx.lineTo(b.x - nb.x * b.m, b.y - nb.y * b.m);
      ctx.lineTo(a.x - na.x * a.m, a.y - na.y * a.m);
      ctx.closePath();
      ctx.fill();
      ctx.lineWidth = 1;
      ctx.stroke();   // copre le sottili fessure tra una fascia e l'altra
    }

    // quando la scia è corta (sta sparendo) sfuma tutta insieme
    return Math.min(1, totale / (120 * scala));
  }


})();
