/* =========================================================
   SCRITTA FINALE — "hai un progetto? con noi diventa REALE."
   1. ARRIVO AIUTATO: scendendo, appena la PRIMA RIGA della scritta è
      entrata nello schermo e smetti di scorrere, la pagina completa lo
      scorrimento da sola con un movimento morbido. Conta solo lo scroll
      fatto da te (rotellina, trackpad, dito, tastiera): gli scorrimenti
      automatici del sito (es. Chi siamo che centra il testo aperto) non
      lo fanno partire;
   2. COMPARSA: appena entra la prima riga, la frase compare parola per
      parola (ogni parola sale da sotto la sua "finestra", come "is gonna
      be real"); uscendo del tutto dalla sezione si riazzera.
   ========================================================= */

const SCRITTA = {
  // ⇩ qui si fanno le prove
  pausa: 250,            // ms di scroll fermo prima di completare l'arrivo
  // l'arrivo e la comparsa partono quando la prima riga è entrata nello schermo
  durata: [500, 1000],   // ms del movimento di arrivo: minimo e massimo, in base alla distanza
};

(() => {
  const sezione = document.querySelector(".scritta");
  if (!sezione) return;
  const testo = sezione.querySelector(".scritta__testo");
  const riduci = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // la prima riga è entrata nello schermo? (la sua base sopra il bordo inferiore)
  const primaRigaDentro = () => {
    const t = testo.getBoundingClientRect();
    const riga = parseFloat(getComputedStyle(testo).fontSize) * 1.11;
    return t.top + riga <= window.innerHeight;
  };

  // ---------- COMPARSA PAROLA PER PAROLA ----------
  function controllaComparsa() {
    const r = sezione.getBoundingClientRect();
    if (r.top >= window.innerHeight || r.bottom <= 0) sezione.classList.remove("visibile");   // uscita del tutto: si riazzera
    else if (primaRigaDentro()) sezione.classList.add("visibile");
  }
  window.addEventListener("scroll", controllaComparsa, { passive: true });
  window.addEventListener("resize", controllaComparsa);
  controllaComparsa();

  // ---------- ARRIVO AIUTATO ----------
  let anim = 0, automatico = false, direzione = 0, ultimoY = window.scrollY, timer = 0;
  const curva = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

  function scorriA(y) {
    cancelAnimationFrame(anim);
    if (riduci) { window.scrollTo({ top: y, behavior: "auto" }); return; }
    const da = window.scrollY, dist = y - da;
    if (Math.abs(dist) < 1) return;
    const [min, max] = SCRITTA.durata;
    const durata = Math.min(max, Math.max(min, 400 + Math.abs(dist) * 0.6));
    const t0 = performance.now();
    automatico = true;
    const passo = (ora) => {
      if (!automatico) return;
      const t = Math.min(1, (ora - t0) / durata);
      window.scrollTo({ top: da + dist * curva(t), behavior: "instant" });
      if (t < 1) anim = requestAnimationFrame(passo);
      else automatico = false;
    };
    anim = requestAnimationFrame(passo);
  }
  // se riprendi a scorrere tu, il movimento automatico si ferma subito
  const interrompi = () => { if (automatico) { automatico = false; cancelAnimationFrame(anim); } };
  ["wheel", "touchstart", "keydown"].forEach((t) => window.addEventListener(t, interrompi, { passive: true }));
  window.addEventListener("wheel", (e) => { if (e.deltaY) direzione = Math.sign(e.deltaY); }, { passive: true });
  // quando hai toccato rotellina / trackpad / schermo / tastiera l'ultima volta
  let ultimoGesto = -1e9;
  ["wheel", "touchmove", "keydown"].forEach((t) => window.addEventListener(t, () => { ultimoGesto = performance.now(); }, { passive: true }));

  window.addEventListener("scroll", () => {
    if (automatico) return;
    const y = window.scrollY;
    if (y !== ultimoY) direzione = Math.sign(y - ultimoY);
    ultimoY = y;
    clearTimeout(timer);
    timer = setTimeout(() => {
      if (direzione <= 0) return;                         // solo scendendo
      if (performance.now() - ultimoGesto > SCRITTA.pausa + 600) return;   // scorrimento non fatto da te: ignoro
      const r = sezione.getBoundingClientRect();
      const h = window.innerHeight;
      if (!primaRigaDentro() || r.top <= 1) return;       // prima riga non ancora entrata, o già arrivata
      // porto la sezione in cima allo schermo (o fin dove la pagina arriva)
      scorriA(Math.min(window.scrollY + r.top, document.documentElement.scrollHeight - h));
    }, SCRITTA.pausa);
  }, { passive: true });
})();
