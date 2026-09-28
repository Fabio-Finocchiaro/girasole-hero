/* =========================================================
   LAVORI IN EVIDENZA
   1. Comparsa: quando il mouse entra nella sezione, le card
      compaiono una alla volta in ordine CASUALE (rimescolato
      a ogni caricamento della pagina).
      Su telefono e tablet (niente mouse) partono quando la
      sezione entra nello schermo.
   2. Hover: la card passa in primo piano e cresce del 10%,
      compaiono il suo titolo e la sua descrizione.
   ========================================================= */

const LAVORI = {
  ritardo: 70,          // millisecondi tra una card e la successiva
};

(() => {
  const sezione = document.getElementById("lavori");
  if (!sezione) return;

  const card = [...sezione.querySelectorAll(".lavoro")];
  const conMouse = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const riduci = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ---------- 1. COMPARSA IN ORDINE CASUALE ----------
  let partita = false;
  function mostraTutte() {
    if (partita) return;
    partita = true;
    // mescola l'ordine (algoritmo di Fisher–Yates)
    const ordine = [...card];
    for (let i = ordine.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [ordine[i], ordine[j]] = [ordine[j], ordine[i]];
    }
    ordine.forEach((el, k) => {
      setTimeout(() => el.classList.add("visibile"), riduci ? 0 : k * LAVORI.ritardo);
    });
  }

  if (conMouse) {
    sezione.addEventListener("pointerenter", mostraTutte);
    // se la pagina si apre con il mouse già dentro la sezione
    sezione.addEventListener("pointermove", mostraTutte, { once: true });
  } else {
    new IntersectionObserver((voci, oss) => {
      if (voci.some((v) => v.isIntersecting)) { mostraTutte(); oss.disconnect(); }
    }, { threshold: 0.25 }).observe(sezione);
  }

  // ---------- 2. HOVER: CARD IN PRIMO PIANO + TITOLO + DESCRIZIONE ----------
  let attivo = null;
  function attiva(nome) {
    if (attivo === nome) return;
    attivo = nome;
    sezione.querySelectorAll("[data-lavoro]").forEach((el) =>
      el.classList.toggle("attivo", el.dataset.lavoro === nome));
  }

  card.forEach((el) => {
    el.addEventListener("pointerenter", (e) => { if (e.pointerType === "mouse") attiva(el.dataset.lavoro); });
    el.addEventListener("pointerleave", (e) => { if (e.pointerType === "mouse" && attivo === el.dataset.lavoro) attiva(null); });
    // da tastiera
    el.addEventListener("focus", () => attiva(el.dataset.lavoro));
    el.addEventListener("blur", () => attiva(null));
    // sul telefono: primo tocco mostra le informazioni, secondo tocco apre il lavoro
    el.addEventListener("click", (e) => {
      if (!conMouse && attivo !== el.dataset.lavoro) { e.preventDefault(); attiva(el.dataset.lavoro); }
      else if (el.getAttribute("href") === "#") e.preventDefault();   // pagine dei lavori non ancora pronte
    });
  });
})();
