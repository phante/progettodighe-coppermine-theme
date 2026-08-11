import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { SITO, SITO_PRESENTE } from "./fixtures.mjs";

// Il test che rende sostenibile l'allineamento: legge le classi Tachyons dal
// baseof.html del sito principale e verifica che la gallery renda le stesse.
// Quando il sito cambia scocca, questo diventa rosso invece di lasciare le due
// intestazioni divergere in silenzio, che è come ci siamo arrivati.
test.describe("parità con il sito principale", () => {
  test.skip(!SITO_PRESENTE, "../progettodighe non è clonato accanto");

  const baseof = readFileSync(
    resolve(SITO, "themes/progettodighe/layouts/baseof.html"),
    "utf8",
  );

  /** Le classi del primo tag `nome` che compare in baseof.html. */
  const classiDi = (nome) => {
    const m = baseof.match(new RegExp(`<${nome}[^>]*\\sclass="([^"]+)"`));
    if (!m) throw new Error(`<${nome}> senza class in baseof.html`);
    return m[1].split(/\s+/).filter(Boolean);
  };

  const casi = [
    ["header", "header", "header"],
    // In baseof.html il primo <nav> è la barra del menu; nella gallery è
    // l'unico con i bordi, gli altri due reggono i menu di Coppermine.
    ["nav del menu", "nav", "header nav.bt"],
    ["footer", "footer", "footer"],
  ];

  for (const [nome, tag, selettore] of casi) {
    test(`${nome}: stesse classi Tachyons`, async ({ page }) => {
      await page.goto("index.php");
      const rese = ((await page.locator(selettore).first().getAttribute("class")) || "")
        .split(/\s+/)
        .filter(Boolean);

      // Sottoinsieme, non uguaglianza: la gallery aggiunge le classi di
      // tracking umami--click--*, che sul sito principale non esistono.
      expect(rese, `classi rese da ${selettore}`).toEqual(
        expect.arrayContaining(classiDi(tag)),
      );
    });
  }

  test("nav: stesse classi sui link", async ({ page }) => {
    const m = baseof.match(/<a class="(f6 link[^"]+)"/);
    expect(m, "link di menu non trovato in baseof.html").not.toBeNull();
    const attese = m[1].split(/\s+/).filter(Boolean);

    await page.goto("index.php");
    const link = page.locator("header nav.bt a");
    for (let i = 0; i < (await link.count()); i++) {
      const rese = ((await link.nth(i).getAttribute("class")) || "").split(/\s+/);
      expect(rese, `classi del link ${i}`).toEqual(expect.arrayContaining(attese));
    }
  });
});
