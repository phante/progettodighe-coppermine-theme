import { test, expect } from "@playwright/test";
import { PAGINE } from "./fixtures.mjs";

// Rete di sicurezza per gli asset: il tema caricava tre CSS di Font Awesome che
// puntavano a una cartella asset/webfonts/ inesistente, quindi ogni pagina
// tirava giù una manciata di 404 che nessuno vedeva. Questo test li fa vedere.
for (const [nome, url] of PAGINE) {
  test(`nessuna sottorisorsa in errore — ${nome}`, async ({ page, baseURL }) => {
    const rotte = [];

    // Solo same-origin. I badge Creative Commons stanno su un dominio di terze
    // parti: se cade non è una regressione del tema, e in un ambiente senza
    // rete farebbe fallire la suite per il motivo sbagliato.
    const nostra = (u) => u.startsWith(baseURL);

    page.on("response", (res) => {
      // Il documento stesso è escluso: le pagine di errore di Coppermine sono
      // legittime altrove, qui interessano CSS, immagini, font e script.
      if (res.request().resourceType() === "document") return;
      if (nostra(res.url()) && res.status() >= 400) rotte.push(`${res.status()} ${res.url()}`);
    });
    page.on("requestfailed", (req) => {
      if (nostra(req.url())) rotte.push(`FAILED ${req.url()} (${req.failure()?.errorText})`);
    });

    await page.goto(url, { waitUntil: "networkidle" });

    expect(rotte, `sottorisorse in errore su ${nome}`).toEqual([]);
  });
}

// Il test qui sopra vede solo ciò che il browser scarica davvero, e il
// <link rel="manifest"> non è fra quelle cose: ha continuato a puntare a un
// manifest.json che il sito non genera più, con la correzione fatta a mano
// nella sola produzione. Qui i link dell'head si chiedono uno per uno.
//
// Solo contro un'istanza vera: puntano al sito principale, quindi in un
// ambiente senza rete fallirebbero per il motivo sbagliato.
test("i link dell'head rispondono", async ({ page, request }) => {
  test.skip(!process.env.PD_BASE_URL, "serve un'istanza raggiungibile");

  await page.goto("index.php");
  const href = await page
    .locator("head link[href]")
    .evaluateAll((link) => link.map((l) => l.href));

  const rotte = [];
  for (const url of href) {
    const res = await request.get(url);
    if (!res.ok()) rotte.push(`${res.status()} ${url}`);
  }

  expect(rotte, "link dell'head in errore").toEqual([]);
});
