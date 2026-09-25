# WUP — hero con girasole

Prototipo della hero section del sito WUP (tavola Figma "Landing Page V3").
Il girasole ruota seguendo lo scroll, il motto "is gonna be real" compare parola per parola dietro al fiore.

## File
- `index.html`: struttura della pagina (versione con parallasse, quella scelta)
- `index-classica.html` + `script-classico.js`: versione precedente senza parallasse, tenuta per confronto
- `style.css`: layout e colori (misure prese da Figma, tavola 1440 × 825)
- `script.js`: collega lo scroll ai fotogrammi, gestisce parallasse e puntatore; le impostazioni sono in cima al file
- `images/frames/desktop/`: 150 fotogrammi WebP con trasparenza (1080 × 1580)
- `images/frames/mobile/`: gli stessi fotogrammi a metà risoluzione, per il telefono
- `images/*.svg`: parole del motto e logo

## Note per gli sviluppatori
- Tecnica: sequenza di fotogrammi disegnata su `<canvas>`, guidata dalla posizione di scroll dentro una sezione `sticky`.
  In produzione si può sostituire la logica con GSAP ScrollTrigger mantenendo gli stessi fotogrammi.
- Il font dei pulsanti nel design è Acumin VF Wide Semibold (Adobe Fonts); qui è usato Archivo come ripiego.
