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

/** Le pagine su cui la scocca va verificata: indice, album, foto singola. */
export const PAGINE = [
  ["indice", "/index.php"],
  ["album", "/thumbnails.php?album=1"],
  ["foto", "/displayimage.php?pid=1"],
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
