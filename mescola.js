/* =========================================================
   LETTERE CHE SI RIMESCOLANO al passaggio del mouse
   (come nel video di riferimento: "Careers" → "asCerer" →
   "rasCere" → "Careers")

   Si applica DA SOLO a:
   - tutti i pulsanti .pill (Home, Portfolio, Contattaci, Su di noi
     e quelli che aggiungerai in futuro, anche creati dopo);
   - qualsiasi elemento con l'attributo data-mescola, per esempio
     <a href="#" data-mescola>Scopri di più</a>
   - le scritte disegnate in SVG (come "is gonna be real"): basta
     mettere data-mescola sull'elemento che contiene l'<svg>, con
     ogni lettera come <path> separato. L'SVG deve essere scritto
     dentro la pagina, non caricato con <img>.
   - le scritte che al passaggio del mouse DIVENTANO un'altra scritta:
     data-mescola-cambia="TESTO NUOVO". Le lettere si rimescolano e si
     trasformano nel testo nuovo; togliendo il mouse tornano indietro.
     Esempio: "Lavori in evidenza" → "Guarda i nostri lavori".
   Se un antenato ha la classe "in-transizione" l'effetto non parte:
   la hero la toglie solo quando "is gonna be real" è al suo posto.

   Le lettere si mescolano solo dentro la stessa parola, gli spazi
   restano al loro posto. Mentre si mescola la larghezza della
   scritta resta bloccata, così il resto non "balla".
   ========================================================= */

const MESCOLA = {
  // ⇩ qui si fanno le prove
  durata: 350,   // ms totali dell'effetto
  passo: 70,     // ms tra un rimescolamento e il successivo (più basso = più frenetico)
  selettore: ".pill, [data-mescola]",
  durataCambio: 450,   // ms della trasformazione in un'altra scritta (data-mescola-cambia)
};

(() => {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const inCorso = new WeakSet();

  // l'elemento a cui cambiare il testo: lo <span> dentro il pulsante, se c'è
  function bersaglio(el) {
    // se il testo è più in profondità (es. dentro una "finestra" animata), lo segno con data-mescola-testo
    const segnato = el.querySelector("[data-mescola-testo]");
    if (segnato) return segnato;
    const figlio = el.querySelector(":scope > span");
    return figlio && figlio.children.length === 0 ? figlio : el;
  }

  // mescola le lettere di ogni parola, provando a non ridare la parola originale
  function mescolaParola(parola) {
    if (parola.length < 2) return parola;
    const lettere = [...parola];
    for (let tentativo = 0; tentativo < 5; tentativo++) {
      for (let i = lettere.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [lettere[i], lettere[j]] = [lettere[j], lettere[i]];
      }
      if (lettere.join("") !== parola) break;
    }
    return lettere.join("");
  }
  const mescolaTesto = (t) => t.split(/(\s+)/).map((p) => (/\s/.test(p) ? p : mescolaParola(p))).join("");

  // ---------- SCRITTE DISEGNATE (SVG, es. "is gonna be real") ----------
  // Ogni lettera è un <path> separato: invece di cambiare il testo
  // sposto le lettere, rimettendole in fila in ordine casuale con gli
  // stessi spazi dell'originale. La parola resta larga uguale.
  function avviaSvg(svg) {
    if (inCorso.has(svg)) return;
    const lettere = [...svg.querySelectorAll("path")]
      .map((p) => ({ p, b: p.getBBox() }))
      .sort((a, b) => a.b.x - b.b.x);
    if (lettere.length < 2) return;
    inCorso.add(svg);

    const spazi = lettere.slice(1).map((l, i) => l.b.x - (lettere[i].b.x + lettere[i].b.width));
    const partenza = lettere[0].b.x;

    function mescolaLettere() {
      const ordine = mescolaParola(lettere.map((_, i) => String.fromCharCode(65 + i)).join(""))
        .split("").map((c) => c.charCodeAt(0) - 65);
      let x = partenza;
      ordine.forEach((i, k) => {
        const l = lettere[i];
        l.p.setAttribute("transform", `translate(${(x - l.b.x).toFixed(2)} 0)`);
        x += l.b.width + (spazi[k] || 0);
      });
    }

    const inizio = performance.now();
    let ultimo = 0;
    function fotogramma(ora) {
      if (ora - inizio >= MESCOLA.durata) {
        lettere.forEach((l) => l.p.removeAttribute("transform"));
        inCorso.delete(svg);
        return;
      }
      if (ora - ultimo >= MESCOLA.passo) { ultimo = ora; mescolaLettere(); }
      requestAnimationFrame(fotogramma);
    }
    requestAnimationFrame(fotogramma);
  }

  function avvia(el) {
    // finché la scritta si sta ancora muovendo (es. la comparsa della hero) niente effetto
    if (el.closest(".in-transizione")) return;
    const svg = el.querySelector("svg");
    if (svg && !el.textContent.trim()) { avviaSvg(svg); return; }
    const t = bersaglio(el);
    if (inCorso.has(t) || t.children.length) return;   // solo testo semplice, niente icone dentro
    const originale = t.textContent;
    if (!originale.trim()) return;
    inCorso.add(t);

    // il testo vero resta per i lettori di schermo
    if (!el.hasAttribute("aria-label")) el.setAttribute("aria-label", originale.trim());

    // blocco la larghezza per tutta la durata
    const stile = { display: t.style.display, width: t.style.width, whiteSpace: t.style.whiteSpace };
    const larghezza = t.getBoundingClientRect().width;
    if (getComputedStyle(t).display === "inline") t.style.display = "inline-block";
    t.style.width = `${larghezza}px`;
    t.style.whiteSpace = "nowrap";

    const inizio = performance.now();
    let ultimo = 0;
    function fotogramma(ora) {
      if (ora - inizio >= MESCOLA.durata) {
        t.textContent = originale;
        Object.assign(t.style, stile);
        inCorso.delete(t);
        return;
      }
      if (ora - ultimo >= MESCOLA.passo) {
        ultimo = ora;
        t.textContent = mescolaTesto(originale);
      }
      requestAnimationFrame(fotogramma);
    }
    requestAnimationFrame(fotogramma);
  }

  // ---------- SCRITTA CHE SI TRASFORMA IN UN'ALTRA (data-mescola-cambia) ----------
  // prima metà: si mescolano le lettere della scritta attuale;
  // seconda metà: si mescolano quelle della scritta di arrivo; alla fine resta quella giusta
  const animCambio = new WeakMap();
  function cambia(el, versoNuovo) {
    if (el.closest(".in-transizione")) return;
    if (!el.dataset.mescolaOriginale) el.dataset.mescolaOriginale = el.textContent;
    const da = el.textContent;
    const a = versoNuovo ? el.dataset.mescolaCambia : el.dataset.mescolaOriginale;
    cancelAnimationFrame(animCambio.get(el));
    if (da === a) return;
    el.style.whiteSpace = "nowrap";
    const inizio = performance.now();
    let ultimo = 0;
    function fotogramma(ora) {
      const t = (ora - inizio) / MESCOLA.durataCambio;
      if (t >= 1) { el.textContent = a; el.style.whiteSpace = ""; return; }
      if (ora - ultimo >= MESCOLA.passo) {
        ultimo = ora;
        el.textContent = mescolaTesto(t < 0.4 ? da : a);
      }
      animCambio.set(el, requestAnimationFrame(fotogramma));
    }
    animCambio.set(el, requestAnimationFrame(fotogramma));
  }
  // solo col mouse: sul telefono un tocco non deve cambiare la scritta
  document.addEventListener("pointerover", (e) => {
    if (e.pointerType !== "mouse") return;
    const el = e.target.closest?.("[data-mescola-cambia]");
    if (el && !(e.relatedTarget && el.contains(e.relatedTarget))) cambia(el, true);
  });
  document.addEventListener("pointerout", (e) => {
    if (e.pointerType !== "mouse") return;
    const el = e.target.closest?.("[data-mescola-cambia]");
    if (el && !(e.relatedTarget && el.contains(e.relatedTarget))) cambia(el, false);
  });
  document.addEventListener("focusin", (e) => {
    const el = e.target.closest?.("[data-mescola-cambia]");
    if (el && el.matches(":focus-visible")) cambia(el, true);
  });
  document.addEventListener("focusout", (e) => {
    const el = e.target.closest?.("[data-mescola-cambia]");
    if (el) cambia(el, false);
  });

  // un solo ascoltatore per tutta la pagina: funziona anche per i pulsanti aggiunti dopo
  document.addEventListener("pointerover", (e) => {
    const el = e.target.closest?.(MESCOLA.selettore);
    if (!el || (e.relatedTarget && el.contains(e.relatedTarget))) return;   // solo all'ingresso, non muovendosi dentro
    avvia(el);
  });
  // anche con la tastiera (tasto Tab)
  document.addEventListener("focusin", (e) => {
    const el = e.target.closest?.(MESCOLA.selettore);
    if (el && el.matches(":focus-visible")) avvia(el);
  });
})();
