/* =========================================================
   FOOTER — sfondo giallo in parallasse + cursore e scia bianchi
   1. PARALLASSE: il giallo del footer è un livello a parte, dietro
      i contenuti (#footer-giallo). Quando il footer entra nello
      schermo il giallo parte PRIMA e sale PIÙ VELOCE delle scritte
      (copre lo sfondo sopra il footer), poi rallenta: le scritte del
      footer arrivano già sul giallo e in fondo alla pagina giallo e
      footer combaciano a 0 (tutta la viewport gialla).
   2. SUL GIALLO: quando il puntatore è sopra il giallo diventa
      bianco (classe "sul-giallo" su <html>, vedi footer.css);
      la scia legge window.WUP.gialloTop e diventa bianca nei
      tratti che passano sul giallo (scia.js).
   ========================================================= */

const FOOTER = {
  // ⇩ qui si fanno le prove
  anticipo: 2.2,   // quanto il giallo va avanti rispetto alle scritte (1 = nessuna parallasse, più alto = più anticipo)
};

(() => {
  const footer = document.querySelector(".footer");
  const giallo = document.getElementById("footer-giallo");
  if (!footer || !giallo) return;

  const html = document.documentElement;
  html.classList.add("footer-parallasse");   // da qui il footer è trasparente: il giallo lo fa il livello
  const riduci = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  window.WUP = window.WUP || {};

  let mouseY = null;

  function aggiorna() {
    const vh = window.innerHeight;
    const alto = footer.getBoundingClientRect().top;     // dove si trova ora il bordo alto del footer
    const finale = vh - footer.offsetHeight;             // dove sarà quando la pagina è finita
    let top;
    if (alto >= vh) top = vh;                            // footer non ancora arrivato: giallo nascosto sotto lo schermo
    else {
      // 0 = il footer sta entrando, 1 = sei in fondo alla pagina
      const t = Math.min(1, Math.max(0, (vh - alto) / Math.max(1, vh - finale)));
      // curva sempre davanti alla linea dritta: il giallo è più in alto del bordo del footer
      const curva = riduci ? t : 1 - Math.pow(1 - t, FOOTER.anticipo);
      top = Math.min(alto, vh - (vh - finale) * curva);  // mai sotto il bordo del footer
    }
    top = Math.max(0, top);
    giallo.style.transform = `translate3d(0, ${top.toFixed(1)}px, 0)`;
    window.WUP.gialloTop = top < vh ? top : Infinity;
    html.classList.toggle("sul-giallo", mouseY !== null && mouseY >= window.WUP.gialloTop);
  }

  window.addEventListener("scroll", aggiorna, { passive: true });
  window.addEventListener("resize", aggiorna);
  window.addEventListener("pointermove", (e) => {
    if (e.pointerType !== "mouse") return;
    mouseY = e.clientY;
    html.classList.toggle("sul-giallo", mouseY >= (window.WUP.gialloTop ?? Infinity));
  }, { passive: true });
  document.addEventListener("mouseleave", () => { mouseY = null; html.classList.remove("sul-giallo"); });
  aggiorna();
})();
