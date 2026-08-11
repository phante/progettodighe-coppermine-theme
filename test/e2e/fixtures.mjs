import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { existsSync } from "node:fs";

const qui = dirname(fileURLToPath(import.meta.url));

/** Radice del repo del tema. */
export const REPO = resolve(qui, "../..");

/**
 * Il sito principale, se è clonato accanto. I test di parità si saltano quando
 * non c'è: chi clona solo il tema deve poter lanciare la suite.
 */
export const SITO = resolve(REPO, "../progettodighe");
export const SITO_PRESENTE = existsSync(resolve(SITO, "themes/progettodighe/layouts/baseof.html"));

/**
 * Le pagine su cui la scocca va verificata: indice, album, foto singola.
 *
 * Gli id sono quelli seminati da test/bin/install.sh. Contro una gallery vera
 * (dev, produzione) vanno dati quelli che esistono davvero, altrimenti Coppermine
 * risponde con la pagina di errore e i test falliscono per il motivo sbagliato:
 *
 *   PD_ALBUM=12 PD_PID=345 npm run test:e2e:dev
 */
const ALBUM = process.env.PD_ALBUM || "1";
const PID = process.env.PD_PID || "1";

export const PAGINE = [
  ["indice", "/index.php"],
  ["album", `/thumbnails.php?album=${ALBUM}`],
  ["foto", `/displayimage.php?pid=${PID}`],
];

/** Le voci di nav attese, nell'ordine del menu del sito principale. */
export const VOCI_NAV = [
  ["Le dighe", "https://www.progettodighe.it/dighe/"],
  ["Le centrali", "https://www.progettodighe.it/centrali/"],
  ["Tecnica", "https://www.progettodighe.it/tecnica/"],
  ["Reportage", "https://www.progettodighe.it/reportage/"],
  ["Biblioteca", "https://www.progettodighe.it/biblioteca/"],
  ["Noi", "https://www.progettodighe.it/noi/"],
  ["Mappa", "https://www.progettodighe.it/mappa/"],
  ["Forum", "https://www.progettodighe.it/forum/"],
  ["Gallery", "https://www.progettodighe.it/gallery/"],
];

/** I social del footer, nell'ordine di config/_default/config.yml del sito. */
export const SOCIAL = ["Telegram", "Matrix", "Facebook", "Instagram", "YouTube", "RSS"];

/** Le voci del menu footer, come le rende Hugo da .Site.Menus.footer. */
export const VOCI_FOOTER = ["Cookie", "Licenze", "Privacy"];
