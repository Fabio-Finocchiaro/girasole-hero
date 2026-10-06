# WUP — hero con girasole

Prototipo della hero section del sito WUP (tavola Figma "Landing Page V3").
Hero: dall'inizio della pagina, al primo scroll in giù l'animazione parte da sola (il girasole ruota e si allontana, il motto "is gonna be real" compare parola per parola dietro al fiore) e arriva alla fine; tornando su l'animazione segue lo scroll a mano e si riavvolge.

## File
- `index.html`: struttura della pagina (versione con parallasse, quella scelta)
- `index-classica.html` + `script-classico.js`: versione precedente senza parallasse, tenuta per confronto
- `style.css`: layout e colori (misure prese da Figma, tavola 1440 × 825)
- `script.js`: animazione della hero (automatica in discesa, durata in `IMPOSTAZIONI.durata`; a mano in salita, lunghezza in `--durata-scroll` di `style.css`), parallasse e puntatore; le impostazioni sono in cima al file
- `images/frames/desktop/`: 150 fotogrammi WebP con trasparenza (1080 × 1580)
- `images/frames/mobile/`: gli stessi fotogrammi a metà risoluzione, per il telefono
- `images/*.svg`: parole del motto (originali; in pagina sono copiate dentro `index.html`) e logo
- `lavori.css` + `lavori.js`: sezione "Lavori in evidenza" a carosello: su desktop la sezione si ferma e lo scroll verticale diventa orizzontale (sticky, come la hero), poi la pagina riprende; frecce e rimbalzo del gap; le impostazioni dell'animazione sono in cima a `lavori.js`
- `mescola.js`: al passaggio del mouse le lettere dei pulsanti `.pill` (e di ogni elemento con `data-mescola`) si rimescolano e tornano al loro posto; vale anche per i pulsanti aggiunti in futuro. Funziona anche sulla scritta "is gonna be real" (SVG scritti dentro `index.html`, una lettera per tracciato), ma solo quando la scritta è ferma al suo posto. Durata e velocità in cima al file
- `chi-siamo.css` + `chi-siamo.js`: sezione "Chi siamo" (Missione / Visione / Valori, componente Figma 233:844) a fisarmonica; durante apertura e chiusura la voce resta centrata nello schermo; hover con lettere rimescolate e sottolineatura come i pulsanti. Durata in cima a `chi-siamo.js`
- `scia.js`: scia gialla→arancione che segue il mouse (forma Figma "scia", nodo 249:3630) su un livello dietro i contenuti; si vede solo sulle parti bianche e sparisce quando il mouse si ferma. Impostazioni in cima al file
- `images/lavori/carosello-*.jpg`: foto delle card del carosello (esportate da Figma a 2x)
- `lavori-cascata.html` + `lavori-cascata.css` + `lavori-cascata.js`: versione precedente della sezione (cascata con hover), tenuta per confronto

## Note per gli sviluppatori
- Tecnica: sequenza di fotogrammi disegnata su `<canvas>`, guidata dalla posizione di scroll dentro una sezione `sticky`.
  In produzione si può sostituire la logica con GSAP ScrollTrigger mantenendo gli stessi fotogrammi.
- Il font dei pulsanti nel design è Acumin VF Wide Semibold (Adobe Fonts); qui è usato Archivo come ripiego.
