/* =========================================================
   BARRA IN ALTO — colori del logo e del menu in base a cosa c'è sotto
   [D1] LOGO: sulla hero nera (e nel menu del telefono) resta com'è,
        con la scritta WUP bianca; sopra le sezioni bianche e il giallo
        del footer compare la versione con la scritta nera
        (images/logo-scuro.svg), che prima spariva.
   [D2] MENU SUL GIALLO: HOME / PORTFOLIO / CONTATTACI sono in
        "differenza" (bianchi sul nero, neri sul bianco), ma sul giallo
        diventavano blu. Quando il giallo del footer arriva sotto la
        barra, diventano neri come il resto del footer.
   ========================================================= */
(() => {
  const html = document.documentElement;
  const hero = document.getElementById("hero");
  const nav = document.querySelector(".nav");
  if (!nav) return;
  let chiesto = false;

  function aggiorna() {
    chiesto = false;
    const meta = nav.offsetHeight / 2;                         // la linea dei pulsanti
    const passataLaHero = !hero || hero.getBoundingClientRect().bottom < meta;
    html.classList.toggle("logo-scuro", passataLaHero && !html.classList.contains("menu-aperto"));
    const giallo = (window.WUP && window.WUP.gialloTop) ?? Infinity;   // lo scrive footer.js
    // [A7] anche la striscia gialla dopo la hero (animazioni.js)
    const striscia = document.querySelector(".striscia");
    const r = striscia && striscia.getBoundingClientRect();
    const sullaStriscia = !!r && r.top <= meta && r.bottom >= meta;
    html.classList.toggle("nav-sul-giallo", giallo <= meta || sullaStriscia);
  }
  const chiedi = () => { if (!chiesto) { chiesto = true; requestAnimationFrame(aggiorna); } };

  window.addEventListener("scroll", chiedi, { passive: true });
  window.addEventListener("resize", chiedi);
  // apertura / chiusura del menu del telefono (menu.js cambia la classe di <html>)
  new MutationObserver(chiedi).observe(html, { attributes: true, attributeFilter: ["class"] });
  aggiorna();
})();
