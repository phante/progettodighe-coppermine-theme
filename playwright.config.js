import { defineConfig, devices } from "@playwright/test";

/**
 * Un solo interruttore, come nel sito principale: PD_BASE_URL.
 *
 *   npm run test:e2e       → il container di test (CPG_PORT, default 8088)
 *   PD_BASE_URL=...        → un'istanza qualunque (dev, produzione)
 *
 * Qui non c'è un webServer: le pagine le serve podman, e l'ambiente va tirato
 * su prima con `npm run env:up`. Un webServer che facesse `podman-compose up`
 * a ogni run pagherebbe il build dell'immagine per niente.
 */
// La barra finale non è cosmetica: i path dei test sono relativi, e senza di
// essa "https://host/gallery" + "index.php" diventa "https://host/index.php",
// cioè il sito principale al posto della gallery.
const baseURL = (
  process.env.PD_BASE_URL || `http://127.0.0.1:${process.env.CPG_PORT || 8088}`
).replace(/\/*$/, "/");
const inLocale = !process.env.PD_BASE_URL;

export default defineConfig({
  testDir: "test/e2e",
  timeout: 30_000,
  // Solo un sito oltre la rete merita di essere ritentato: contro il container
  // un fallimento è deterministico e i retry triplicano solo l'attesa.
  retries: inLocale ? 0 : 2,
  forbidOnly: Boolean(process.env.CI),
  reporter: process.env.CI ? "list" : "html",
  use: {
    baseURL,
    locale: "it-IT",
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: devices["Desktop Chrome"] }],
});
