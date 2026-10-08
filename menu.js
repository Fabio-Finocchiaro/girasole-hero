/* =========================================================
   MENU DEL TELEFONO
   Sul telefono HOME / PORTFOLIO / CONTATTACI stanno in un menu:
   il pulsante con le due linee lo apre a tutto schermo (sfondo
   nero, voci centrate). Si chiude con la X, toccando una voce,
   col tasto Esc, o se lo schermo torna orizzontale.
   Mentre è aperto la pagina sotto non scorre.
   ========================================================= */
(() => {
  const html = document.documentElement;
  const apri = document.querySelector(".nav__menu");
  const menu = document.getElementById("menu-mobile");
  if (!apri || !menu) return;
  const chiudi = menu.querySelector(".menu-mobile__chiudi");

  function imposta(aperto) {
    html.classList.toggle("menu-aperto", aperto);
    apri.setAttribute("aria-expanded", String(aperto));
    menu.inert = !aperto;
    if (aperto) chiudi.focus({ preventScroll: true });
    else if (menu.contains(document.activeElement)) apri.focus({ preventScroll: true });
  }

  apri.addEventListener("click", () => imposta(true));
  chiudi.addEventListener("click", () => imposta(false));
  menu.querySelectorAll("a").forEach((a) => a.addEventListener("click", (e) => {
    imposta(false);
    if (a.getAttribute("href") === "#") { e.preventDefault(); window.scrollTo({ top: 0, behavior: "smooth" }); }
  }));
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && html.classList.contains("menu-aperto")) imposta(false);
  });
  // se il telefono viene girato in orizzontale il menu non serve più
  window.matchMedia("(orientation: portrait)").addEventListener("change", (e) => { if (!e.matches) imposta(false); });
})();
