# progettodighe-coppermine-theme

Tema [Coppermine](https://coppermine-gallery.com/) della gallery di ProgettoDighe.
Deriva dal tema `curve` di Coppermine, con header e footer allineati a quelli del
sito principale ([`../progettodighe`](https://github.com/phante/progettodighe), Hugo + Tachyons).

In produzione gira su **Coppermine 1.6.19 / PHP 8.3**.

## Struttura

| Percorso | Cosa |
|---|---|
| `template.html` | la scocca: `<head>`, header, nav, footer. È qui che vive l'allineamento al sito |
| `theme.php` | override dei menu e di `starttable()`, derivato da `themes/curve/theme.php` |
| `style.css` | stili di Coppermine (tabelle, miniature, dropmenu) |
| `asset/` | copia di `tachyons.css` e del logo presi dal sito principale |
| `images/` | asset raster del vecchio tema `curve` |
| `test/` | ambiente podman e suite di test |

### Gli asset sono copie, e devono restarlo

`asset/css/tachyons.css` e `asset/brand/PDLogo.svg` sono copie byte-identiche dei
file del sito principale. Non si può puntare al sito a runtime perché Hugo
fingerprinta il CSS (`/asset/css/main.min.<sha256>.css`), quindi l'URL cambia a
ogni build; e la gallery deve restare in piedi anche se il sito non risponde.

`npm test` verifica che le copie non siano divergenti. Quando lo diventano si
ricopiano dal sito:

```sh
cp ../progettodighe/themes/progettodighe/assets/asset/css/tachyons.css asset/css/
cp ../progettodighe/themes/progettodighe/static/asset/brand/PDLogo.svg asset/brand/
```

## Ambiente di test locale

Serve [podman](https://podman.io/) con `podman-compose`, e Node 22+.

```sh
npm install
npm run env:up      # scarica Coppermine, avvia mariadb + apache, installa e semina
npm run test:e2e    # la suite contro http://127.0.0.1:8088
npm run env:down
```

`env:up` monta il tema in bind-mount read-only dentro il container: si modifica
`template.html` e si ricarica il browser, senza rebuild.

L'installazione **non** passa da `install.php`. Il tarball di Coppermine porta già
`sql/schema.sql` e `sql/basic.sql`: `test/bin/install.sh` li carica direttamente,
scrive `include/config.inc.php` e semina una categoria, un album e tre foto.
È deterministico, dura pochi secondi e soprattutto non dipende dai campi form
dell'installer, che cambiano tra le versioni — cioè proprio la variabile che la
matrice deve poter muovere.

### Cosa coprono i test

- `test/asset-parity.test.js` (`npm test`) — le copie degli asset sono ancora allineate al sito
- `test/e2e/chrome.spec.mjs` — logo, le 9 voci di nav in ordine, footer (mail, 6 social, `Cookie | Licenze | Privacy`, licenza CC), nessun segnaposto residuo, una sola `<h1>`
- `test/e2e/no-404.spec.mjs` — nessuna sottorisorsa in errore
- `test/e2e/chrome-parity.spec.mjs` — le classi Tachyons di header/nav/footer combaciano con quelle di `baseof.html` del sito principale

I due test di parità (`asset-parity`, `chrome-parity`) si saltano da soli se
`../progettodighe` non è clonato accanto.

### Cambiare versione di Coppermine

```sh
CPG_VERSION=1.6.29 npm run env:up
```

`npm run test:matrix` fa il giro completo su ogni riga di `test/versions.txt`
(versione Coppermine + tag dell'immagine PHP), lanciando la suite su ciascuna e
stampando un riepilogo. Serve a vedere cosa si rompe *prima* di aggiornare il
server. Una riga che fallisce non ferma le altre.

Prima di pubblicare su `dev.progettodighe.it`: `npm test`, `npm run test:e2e` e
`npm run test:matrix` verdi.

## Pubblicazione

Pubblica Ansible, dal repo `progettodighe-server`, insieme al resto della
gallery: il tema è uno dei passi dell'aggiornamento di Coppermine, non un
meccanismo a parte che potrebbe scavalcarlo.

Un solo branch, `main`. A distinguere gli ambienti è una variabile:

| Ambiente | `..._gallery_theme_version` | Destinazione |
|---|---|---|
| dev | `main` | `https://dev.progettodighe.it/gallery/` |
| produzione | un tag, es. `26.08` | `https://www.progettodighe.it/gallery/` |

Il tema è statico, quindi non c'è niente da costruire: Ansible clona il repo in
una directory temporanea, ne fa `rsync` nella webroot escludendo quello elencato
in `.deployignore`, e poi la butta via. Così la `.git` non entra mai nella
directory servita da nginx.

I tag sono annotati e dicono con quali versioni di Coppermine il commit è stato
provato:

```sh
git tag -a 26.08 -m "Testato con Coppermine 1.6.19 e 1.6.29 su PHP 8.3"
git tag -n99
```

Non è una dichiarazione di intenti: è il riepilogo di `npm run test:matrix` su
`test/versions.txt`, che in quel commit dice le stesse versioni.

Dopo aver pubblicato su dev, i test contro il sito vero:

```sh
npm run test:e2e:dev
PD_ALBUM=12 PD_PID=345 npm run test:e2e:prod
```

`PD_ALBUM` e `PD_PID` servono perché gli id predefiniti sono quelli seminati
nell'ambiente locale: su una gallery vera vanno indicati un album e una foto che
esistono davvero.

Il clone di dev da produzione (`clone_dev_gallery` negli Ansible) esclude
`themes/progettodighe/`, altrimenti riporterebbe su dev il tema di produzione.
