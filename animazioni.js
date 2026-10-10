/* =========================================================
   ANIMAZIONI [A…]
   Gli stili sono nei CSS, nei blocchi [A…] (style.css, lavori.css, chi-siamo.css, footer.css).
   Qui si decide solo QUANDO partono: ogni elemento riceve la classe
   "in-vista" quando entra nello schermo (e la perde quando esce del
   tutto, così l'animazione si ripete come la scritta finale).
   Con "riduci movimento" attivo non parte niente: si vede tutto fermo.
   ========================================================= */
(() => {
  const riduci = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const html = document.documentElement;
  if (riduci) { html.classList.add("animazioni-ferme"); return; }
  html.classList.add("animazioni-attive");

  /* ---------- quando gli elementi entrano nello schermo ---------- */
  const bersagli = document.querySelectorAll(
    ".lavori__titolo, .card, .mvv__lista, .footer__colonne, .footer__fondo"
  );
  const entra = new IntersectionObserver((voci) => {
    voci.forEach((v) => {
      if (v.isIntersecting) v.target.classList.add("in-vista");
      else if (v.boundingClientRect.top > 0) v.target.classList.remove("in-vista"); // uscito dal basso: si riazzera
    });
  }, { threshold: 0.15 });
  bersagli.forEach((el) => entra.observe(el));

  /* ---------- [A6] stella del puntatore che si schiaccia al clic ---------- */
  window.addEventListener("pointerdown", (e) => { if (e.pointerType === "mouse") html.classList.add("cursore-premuto"); });
  window.addEventListener("pointerup", () => html.classList.remove("cursore-premuto"));

  /* ---------- [A7] striscia che scorre ----------
     Va da sola verso sinistra; lo scroll la accelera e, se si torna su,
     le fa cambiare verso. Il ciclo gira solo quando la striscia è nello schermo. */
  const STRISCIA = {
    velocita: 60,        // px al secondo da ferma
    spinta: 0.12,        // quanto lo scroll la accelera (computer)
    spintaTelefono: 0.025, // sul telefono lo scroll la spinge molto meno: segue lo scroll più lenta
    frenata: 0.08,       // quanto in fretta torna alla velocità normale (0-1)
  };
  const striscia = document.querySelector(".striscia");
  const binario = striscia && striscia.querySelector(".striscia__binario");
  if (!binario) return;
  const telefono = window.matchMedia("(orientation: portrait)");
  let x = 0, verso = -1, extra = 0, ultimoY = scrollY, ultimoT = 0, attiva = false, id = 0;

  function passo(t) {
    const dt = ultimoT ? Math.min(0.05, (t - ultimoT) / 1000) : 0;
    ultimoT = t;
    const dy = scrollY - ultimoY;
    ultimoY = scrollY;
    if (dy) { verso = dy > 0 ? -1 : 1; extra += Math.abs(dy) * (telefono.matches ? STRISCIA.spintaTelefono : STRISCIA.spinta) * 60; }
    extra *= 1 - STRISCIA.frenata;
    x += verso * (STRISCIA.velocita + extra) * dt;
    const meta = binario.scrollWidth / 2;            // i due pezzi sono uguali: a metà si ricomincia
    if (x <= -meta) x += meta;
    if (x > 0) x -= meta;
    binario.style.transform = `translate3d(${x.toFixed(1)}px,0,0)`;
    if (attiva) id = requestAnimationFrame(passo);
  }
  new IntersectionObserver(([v]) => {
    attiva = v.isIntersecting;
    cancelAnimationFrame(id);
    if (attiva) { ultimoT = 0; ultimoY = scrollY; id = requestAnimationFrame(passo); }
  }).observe(striscia);
})();
