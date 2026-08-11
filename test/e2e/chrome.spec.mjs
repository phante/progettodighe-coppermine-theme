import { test, expect } from "@playwright/test";
import { PAGINE, VOCI_NAV, SOCIAL, VOCI_FOOTER } from "./fixtures.mjs";

// La scocca (header + footer) è identica su ogni pagina della gallery perché
// viene da template.html: se si rompe, si rompe ovunque. Girare le stesse
// asserzioni su indice, album e foto costa poco e copre i tre modi in cui
// Coppermine rende la pagina.
for (const [nome, url] of PAGINE) {
  test.describe(`scocca — ${nome}`, () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(url);
    });

    test("il logo porta al sito principale", async ({ page }) => {
      const logo = page.locator("header a[href='https://www.progettodighe.it/'] img");
      await expect(logo.first()).toBeVisible();
      await expect(logo.first()).toHaveAttribute("src", /PDLogo\.svg$/);
    });

    test("la nav ha le voci del sito principale, in ordine", async ({ page }) => {
      const link = page.locator("header nav.bt.bb a");
      await expect(link).toHaveCount(VOCI_NAV.length);
      for (const [i, [titolo, href]] of VOCI_NAV.entries()) {
        await expect(link.nth(i)).toHaveText(titolo);
        await expect(link.nth(i)).toHaveAttribute("href", href);
      }
    });

    test("non restano segnaposto né link vuoti", async ({ page }) => {
      // #URL_SITE_SPIP era un segnaposto mai sostituito, residuo del vecchio
      // sito SPIP; la voce Gallery aveva href="".
      await expect(page.locator("[href*='URL_SITE_SPIP']")).toHaveCount(0);
      await expect(page.locator("header a[href=''], footer a[href='']")).toHaveCount(0);
    });

    test("una sola h1 per pagina", async ({ page }) => {
      // La riga 'Mantenuto e gestito…' del footer era una <h1>: due h1 per
      // pagina, ogni pagina.
      expect(await page.locator("h1").count()).toBeLessThanOrEqual(1);
    });

    test("il footer ha mail, social, menu e licenza", async ({ page }) => {
      const footer = page.locator("footer");
      await expect(footer.locator("address a")).toHaveAttribute(
        "href",
        "mailto:info@progettodighe.it",
      );

      for (const rete of SOCIAL) {
        await expect(footer.locator(`a[aria-label='${rete}']`)).toHaveCount(1);
      }

      for (const voce of VOCI_FOOTER) {
        await expect(footer.getByRole("link", { name: voce, exact: true })).toHaveCount(1);
      }

      await expect(
        footer.locator("a[href='https://creativecommons.org/licenses/by-sa/4.0']"),
      ).toHaveCount(1);
    });
  });
}
